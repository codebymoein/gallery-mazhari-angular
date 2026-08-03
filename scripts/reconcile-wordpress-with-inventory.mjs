import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('../node_modules/xlsx');

const migrationRoot = path.resolve(process.argv[2] || '../gallery-mazhari-migration');
const inventoryFile = path.resolve(process.argv[3] || 'C:/Users/sama laptop/Downloads/4.28 t.xls');
const sourceRoot = path.join(migrationRoot, 'prepared-2026-08-01-v4');
const outputRoot = path.join(migrationRoot, 'prepared-2026-08-01-v5-final');
const outputMedia = path.join(outputRoot, 'product-media');

if (fs.existsSync(outputRoot)) throw new Error(`Output already exists: ${outputRoot}`);
fs.mkdirSync(outputMedia, { recursive: true });

const cleanCode = (value) => String(value ?? '').trim().replace(/\.0$/, '').toUpperCase();
const numeric = (value) => {
  const parsed = Number(String(value ?? '').replace(/[,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const sourceBook = XLSX.readFile(path.join(sourceRoot, 'gallery-mazhari-import.xlsx'));
const sourceMatrix = XLSX.utils.sheet_to_json(sourceBook.Sheets[sourceBook.SheetNames[0]], {
  header: 1,
  defval: '',
  raw: false,
});
const [headers, ...sourceRows] = sourceMatrix;

const inventoryBook = XLSX.readFile(inventoryFile);
const inventoryMatrix = XLSX.utils.sheet_to_json(
  inventoryBook.Sheets[inventoryBook.SheetNames[0]],
  { header: 1, defval: '', raw: false },
);
const inventoryRows = inventoryMatrix.slice(1);
const inventoryByBarcode = new Map();
const inventoryByCode = new Map();
for (const row of inventoryRows) {
  const productCode = cleanCode(row[1]);
  const barcode = cleanCode(row[8]);
  if (!productCode) continue;
  if (barcode) inventoryByBarcode.set(barcode, row);
  const list = inventoryByCode.get(productCode) || [];
  list.push(row);
  inventoryByCode.set(productCode, list);
}

const parentRows = sourceRows.filter((row) => row[15] !== 'variation');
const variationRows = sourceRows.filter((row) => row[15] === 'variation');
const variationsByOriginalParent = new Map();
for (const row of variationRows) {
  const key = cleanCode(row[1]);
  const list = variationsByOriginalParent.get(key) || [];
  list.push(row);
  variationsByOriginalParent.set(key, list);
}

const outputRows = [];
const mappingRows = [];
const unmatchedRows = [];
const parentCodeMap = new Map();

for (const parent of parentRows) {
  const originalCode = cleanCode(parent[0]);
  const barcodeMatch = inventoryByBarcode.get(originalCode);
  const canonicalCode = barcodeMatch
    ? cleanCode(barcodeMatch[1])
    : inventoryByCode.has(originalCode)
      ? originalCode
      : '';

  if (!canonicalCode) {
    unmatchedRows.push({
      originalCode,
      name: parent[3],
      sourceType: parent[15],
      reason: 'No exact inventory product-code or barcode match',
    });
    continue;
  }

  parentCodeMap.set(originalCode, canonicalCode);
  const stockRows = inventoryByCode.get(canonicalCode) || [];
  const stock = stockRows.reduce((sum, row) => sum + Math.max(0, numeric(row[9])), 0);
  const prices = stockRows.map((row) => numeric(row[10])).filter((value) => value > 0);
  const price = prices.length ? Math.max(...prices) : numeric(parent[7]);
  const canonicalParent = [...parent];
  canonicalParent[0] = canonicalCode;
  canonicalParent[1] = '';
  canonicalParent[2] = barcodeMatch ? originalCode : cleanCode(parent[2]);
  canonicalParent[7] = price;
  canonicalParent[9] = stock;
  outputRows.push(canonicalParent);

  let matchedVariations = 0;
  for (const child of variationsByOriginalParent.get(originalCode) || []) {
    const childBarcode = cleanCode(child[0]);
    const inventoryChild = inventoryByBarcode.get(childBarcode);
    if (!inventoryChild || cleanCode(inventoryChild[1]) !== canonicalCode) continue;
    const canonicalChild = [...child];
    canonicalChild[0] = childBarcode;
    canonicalChild[1] = canonicalCode;
    canonicalChild[2] = childBarcode;
    canonicalChild[7] = numeric(inventoryChild[10]) || price;
    canonicalChild[9] = Math.max(0, numeric(inventoryChild[9]));
    canonicalChild[10] = inventoryChild[7] === '-' ? canonicalChild[10] : inventoryChild[7];
    canonicalChild[11] = inventoryChild[6] === '-' ? canonicalChild[11] : inventoryChild[6];
    canonicalChild[12] = inventoryChild[5] === '-' ? canonicalChild[12] : inventoryChild[5];
    outputRows.push(canonicalChild);
    matchedVariations += 1;
  }

  mappingRows.push({
    originalCode,
    canonicalCode,
    matchType: barcodeMatch ? 'barcode' : 'product_code',
    name: parent[3],
    stock,
    matchedVariations,
  });
}

const outputBook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  outputBook,
  XLSX.utils.aoa_to_sheet([headers, ...outputRows]),
  'Products',
);
XLSX.utils.book_append_sheet(
  outputBook,
  XLSX.utils.json_to_sheet(mappingRows),
  'Reconciliation',
);
XLSX.utils.book_append_sheet(
  outputBook,
  XLSX.utils.json_to_sheet(unmatchedRows),
  'Excluded-Unmatched',
);
XLSX.writeFile(outputBook, path.join(outputRoot, 'gallery-mazhari-import-reconciled.xlsx'));

let images = 0;
for (const [originalCode, canonicalCode] of parentCodeMap) {
  const candidates = fs.readdirSync(path.join(sourceRoot, 'product-media'))
    .filter((name) => name === `${originalCode}.webp` || name.startsWith(`${originalCode}-`))
    .sort();
  for (let index = 0; index < candidates.length; index += 1) {
    const sourceName = candidates[index];
    const suffix = index === 0 ? '' : `-${index + 1}`;
    fs.copyFileSync(
      path.join(sourceRoot, 'product-media', sourceName),
      path.join(outputMedia, `${canonicalCode}${suffix}.webp`),
    );
    images += 1;
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceParents: parentRows.length,
  matchedExistingProducts: mappingRows.length,
  excludedUnmatchedParents: unmatchedRows.length,
  outputRows: outputRows.length,
  matchedVariations: mappingRows.reduce((sum, row) => sum + row.matchedVariations, 0),
  images,
  inventoryFile,
};
fs.writeFileSync(
  path.join(outputRoot, 'reconciliation-report.json'),
  JSON.stringify(report, null, 2),
  'utf8',
);
console.log(JSON.stringify({ outputRoot, ...report }, null, 2));
