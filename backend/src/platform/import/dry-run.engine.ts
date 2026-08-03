import { sha256 } from '../common/hash';
import { normalizeProductCode, normalizeText } from '../common/text-normalize';
import {
  ColumnMapping,
  applyMapping,
  parseNumberLoose,
  suggestColumnMapping,
} from './column-mapper';
import {
  DetectedGroup,
  RawVariationRow,
  detectVariationGroups,
} from './variation-detector';

export interface ExistingProductSnapshot {
  code: string;
  barcode?: string | null;
  name: string;
  stock: number;
  price?: number | null;
  category?: string | null;
  updatedAt?: string | null;
  inventoryUpdatedAt?: string | null;
  status?: string | null;
}

export interface DryRunRowIssue {
  rowIndex: number;
  code: string;
  severity: 'error' | 'warning' | 'review';
  codeKey: string;
  message: string;
}

export interface DryRunReport {
  fingerprint: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newProducts: number;
  updatedProducts: number;
  unchangedProducts: number;
  excludedOutOfStockRows: number;
  inStockProductCodes: string[];
  suppressedProductCodes: string[];
  parentProducts: number;
  variations: number;
  duplicateProductCodes: string[];
  duplicateBarcodes: string[];
  missingProductCodes: number;
  missingPrices: number;
  missingCategories: number;
  missingImages: number;
  unknownAttributes: string[];
  conflictingInventory: DryRunRowIssue[];
  rowsRequiringReview: DryRunRowIssue[];
  issues: DryRunRowIssue[];
  groups: DetectedGroup[];
  mapping: ColumnMapping;
  mappingConfidence: number;
  mappingUncertainFields: string[];
  /** Rows ready for commit (validated) */
  commitRows: CommitRow[];
  /** Hard errors that block confirm */
  blockingErrorCount: number;
  /** Soft reviews that do not block (operator may still confirm) */
  reviewCount: number;
  /** True only when no blocking errors — required before confirm */
  canCommit: boolean;
}

export interface CommitRow {
  rowIndex: number;
  code: string;
  parentCode: string | null;
  barcode: string | null;
  name: string;
  category: string;
  subcategory: string;
  price: number | null;
  salePrice: number | null;
  stock: number;
  size: string | null;
  color: string | null;
  material: string | null;
  brand: string | null;
  description: string | null;
  imageUrls: string[];
  branch: string | null;
  collection: string | null;
  internal: boolean;
  changeType: 'new' | 'updated' | 'unchanged';
}

export interface DryRunInput {
  headers: string[];
  /** matrix rows as objects keyed by header */
  rows: Record<string, unknown>[];
  mapping?: ColumnMapping;
  confirmUncertainMapping?: boolean;
  existing: ExistingProductSnapshot[];
  knownCategories?: Set<string>;
  /** ISO timestamp of this import file (for inventory conflict) */
  sourceTimestamp?: string | null;
  fileBufferHash?: string;
  /** Product/model codes present in the last successfully committed file. */
  previousInStockProductCodes?: string[] | null;
  /** Legacy catalog enrichment: warehouse inventory remains authoritative. */
  preserveInventory?: boolean;
}

function isTruthyInternal(value: string): boolean {
  const v = normalizeText(value);
  return (
    v === 'بله' || v === '1' || v === 'true' || v === 'yes' || v === 'internal'
  );
}

function parseImageUrls(value: string): string[] {
  if (!value?.trim()) return [];
  const urls: string[] = [];
  for (const candidate of value.split(/[,\n\r]+/)) {
    const raw = candidate.trim();
    if (!raw) continue;
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue;
      const normalized = parsed.toString();
      if (!urls.includes(normalized)) urls.push(normalized);
    } catch {
      // Invalid legacy media references are ignored instead of breaking import.
    }
    if (urls.length >= 5) break;
  }
  return urls;
}

/**
 * Full validation Dry Run — commits nothing.
 */
export function runExcelDryRun(input: DryRunInput): DryRunReport {
  const suggested = suggestColumnMapping(input.headers);
  const mapping = input.mapping ?? suggested.mapping;

  if (
    suggested.uncertainFields.length &&
    !input.mapping &&
    !input.confirmUncertainMapping &&
    suggested.confidence < 0.85
  ) {
    // Still produce report but mark mapping uncertain
  }

  const existingByCode = new Map(
    input.existing.map((e) => [normalizeProductCode(e.code), e]),
  );
  const existingNameBuckets = new Map<string, ExistingProductSnapshot[]>();
  for (const product of input.existing) {
    const key = normalizeText(product.name);
    if (!key) continue;
    const bucket = existingNameBuckets.get(key) ?? [];
    bucket.push(product);
    existingNameBuckets.set(key, bucket);
  }
  const existingByBarcode = new Map<string, ExistingProductSnapshot>();
  for (const e of input.existing) {
    if (e.barcode) existingByBarcode.set(normalizeProductCode(e.barcode), e);
  }

  const issues: DryRunRowIssue[] = [];
  const codeCounts = new Map<string, number[]>();
  const barcodeCounts = new Map<string, number[]>();
  const commitRows: CommitRow[] = [];
  const rawForGroups: RawVariationRow[] = [];
  const unknownAttributes = new Set<string>();

  let missingProductCodes = 0;
  const missingPrices = 0;
  let missingCategories = 0;
  let validRows = 0;
  let excludedOutOfStockRows = 0;

  input.rows.forEach((row, idx) => {
    const rowIndex = idx + 2; // 1-based + header
    const mapped = applyMapping(row, mapping);
    const code = normalizeProductCode(mapped.productCode);
    const barcode = mapped.barcode
      ? normalizeProductCode(mapped.barcode)
      : null;
    const name = mapped.productName.trim();
    const sourceStock = parseNumberLoose(mapped.inventory);
    const sourcePrice = parseNumberLoose(mapped.price);
    const sourceSalePrice = parseNumberLoose(mapped.salePrice);
    const category = (mapped.subcategory || mapped.category).trim();
    const nameMatches = existingNameBuckets.get(normalizeText(name)) ?? [];
    const existing = existingByCode.get(code) ||
      (input.preserveInventory && nameMatches.length === 1 ? nameMatches[0] : undefined);
    const stock = input.preserveInventory
      ? existing?.stock ?? 0
      : sourceStock;
    const price = input.preserveInventory
      ? existing?.price ?? sourcePrice
      : sourcePrice;
    const salePrice = input.preserveInventory ? null : sourceSalePrice;

    if (!code) {
      missingProductCodes += 1;
      issues.push({
        rowIndex,
        code: '—',
        severity: 'error',
        codeKey: 'missing_product_code',
        message: 'کد کالا خالی است',
      });
      return;
    }

    if (!name) {
      issues.push({
        rowIndex,
        code,
        severity: 'error',
        codeKey: 'missing_name',
        message: 'نام کالا خالی است',
      });
      return;
    }

    if (stock == null || !Number.isFinite(stock)) {
      issues.push({
        rowIndex,
        code,
        severity: 'error',
        codeKey: 'invalid_inventory',
        message: 'موجودی نامعتبر است',
      });
      return;
    }

    // Inventory files are authoritative snapshots. Zero/negative rows are
    // intentionally excluded from the publication pipeline, not imported as
    // products and not treated as validation failures.
    if (stock <= 0) {
      excludedOutOfStockRows += 1;
      return;
    }

    const list = codeCounts.get(code) ?? [];
    list.push(rowIndex);
    codeCounts.set(code, list);

    if (barcode) {
      const bl = barcodeCounts.get(barcode) ?? [];
      bl.push(rowIndex);
      barcodeCounts.set(barcode, bl);
    }

    if (price == null || !Number.isSafeInteger(price) || price <= 0) {
      issues.push({
        rowIndex,
        code,
        severity: 'error',
        codeKey: 'invalid_price',
        message: mapped.price
          ? 'قیمت باید مبلغ صحیح، مثبت و دقیق به ریال باشد'
          : 'قیمت ریالی کالا در فایل انبار الزامی است',
      });
      return;
    }

    if (
      salePrice != null &&
      (!Number.isSafeInteger(salePrice) || salePrice <= 0 || salePrice >= price)
    ) {
      issues.push({
        rowIndex,
        code,
        severity: 'error',
        codeKey: 'invalid_sale_price',
        message: 'قیمت تخفیف باید مبلغ صحیح ریالی و کمتر از قیمت اصلی باشد',
      });
      return;
    }

    if (!category) {
      missingCategories += 1;
      issues.push({
        rowIndex,
        code,
        severity: 'warning',
        codeKey: 'missing_category',
        message: 'دسته/زیردسته خالی است',
      });
    } else if (
      input.knownCategories &&
      input.knownCategories.size &&
      !input.knownCategories.has(normalizeText(category))
    ) {
      issues.push({
        rowIndex,
        code,
        severity: 'review',
        codeKey: 'unknown_category',
        message: `دسته ناشناخته «${category}»`,
      });
      unknownAttributes.add(`category:${category}`);
    }

    if (
      barcode &&
      existingByBarcode.has(barcode) &&
      normalizeProductCode(existingByBarcode.get(barcode)!.code) !== code
    ) {
      issues.push({
        rowIndex,
        code,
        severity: 'error',
        codeKey: 'barcode_conflict',
        message: `بارکد ${barcode} متعلق به محصول دیگری است`,
      });
      return;
    }

    // Inventory conflict: older import must not overwrite newer stock silently
    if (
      existing?.inventoryUpdatedAt &&
      input.sourceTimestamp &&
      new Date(input.sourceTimestamp) < new Date(existing.inventoryUpdatedAt)
    ) {
      issues.push({
        rowIndex,
        code,
        severity: 'review',
        codeKey: 'stale_inventory',
        message: 'فایل قدیمی‌تر از آخرین به‌روزرسانی موجودی است',
      });
    }

    let changeType: CommitRow['changeType'] = 'new';
    if (existing) {
      const same =
        existing.name === name &&
        existing.stock === stock &&
        (existing.price ?? null) === (price ?? null) &&
        normalizeText(existing.category || '') === normalizeText(category);
      changeType = same ? 'unchanged' : 'updated';
    }

    validRows += 1;
    const commit: CommitRow = {
      rowIndex,
      code,
      parentCode: mapped.parentCode
        ? normalizeProductCode(mapped.parentCode)
        : null,
      barcode,
      name,
      category,
      subcategory: mapped.subcategory || category,
      price,
      salePrice,
      stock,
      size: mapped.size || null,
      color: mapped.color || null,
      material: mapped.material || null,
      brand: mapped.brand || null,
      description: mapped.description || null,
      imageUrls: parseImageUrls(mapped.images),
      branch: mapped.branch || null,
      collection: mapped.collection || null,
      internal: isTruthyInternal(mapped.internal),
      changeType,
    };
    commitRows.push(commit);
  });

  // Repeated model identifiers with distinct barcodes are variations. The
  // model identifier becomes the parent code and each barcode becomes the
  // purchasable variation SKU. This matches accounting exports where one
  // product identifier is repeated for its sizes/colors.
  const inferredVariationParents = new Set<string>();
  for (const [code, idxs] of codeCounts) {
    if (idxs.length < 2) continue;
    const siblings = commitRows.filter((row) => row.code === code);
    const siblingBarcodes = siblings.map((row) => row.barcode).filter(Boolean);
    const names = new Set(siblings.map((row) => normalizeText(row.name)));
    if (
      siblings.length === idxs.length &&
      siblingBarcodes.length === siblings.length &&
      new Set(siblingBarcodes).size === siblings.length &&
      names.size === 1
    ) {
      inferredVariationParents.add(code);
      for (const row of siblings) {
        row.parentCode = code;
        row.code = row.barcode!;
      }
    }
  }

  const duplicateProductCodes = [...codeCounts.entries()]
    .filter(
      ([code, idxs]) => idxs.length > 1 && !inferredVariationParents.has(code),
    )
    .map(([c]) => c);

  const duplicateBarcodes = [...barcodeCounts.entries()]
    .filter(([, idxs]) => idxs.length > 1)
    .map(([c]) => c);

  for (const code of duplicateProductCodes) {
    issues.push({
      rowIndex: codeCounts.get(code)![0],
      code,
      severity: 'error',
      codeKey: 'duplicate_product_code',
      message: `کد کالا تکراری در فایل (${codeCounts.get(code)!.length} ردیف)`,
    });
  }
  for (const bc of duplicateBarcodes) {
    issues.push({
      rowIndex: barcodeCounts.get(bc)![0],
      code: bc,
      severity: 'error',
      codeKey: 'duplicate_barcode',
      message: `بارکد تکراری در فایل`,
    });
  }

  for (const commit of commitRows) {
    rawForGroups.push({
      code: commit.code,
      parentCode: commit.parentCode,
      barcode: commit.barcode,
      name: commit.name,
      size: commit.size,
      color: commit.color,
      material: commit.material,
      stock: commit.stock,
      price: commit.price,
      category: commit.category,
      rowIndex: commit.rowIndex,
    });
  }

  if (input.previousInStockProductCodes) {
    const previousCodes = new Set(
      input.previousInStockProductCodes.map(normalizeProductCode),
    );
    for (const row of commitRows) {
      const modelCode = normalizeProductCode(row.parentCode || row.code);
      if (!previousCodes.has(modelCode)) {
        row.changeType = 'new';
      } else if (row.changeType === 'new') {
        row.changeType = 'updated';
      }
    }
  }

  const groups = detectVariationGroups(rawForGroups);
  for (const g of groups) {
    if (g.requiresReview) {
      issues.push({
        rowIndex: g.children[0]?.rowIndex ?? 0,
        code: g.parentCode,
        severity: 'review',
        codeKey: 'variation_uncertain',
        message: `گروه‌بندی نامطمئن (${g.kind}) — ${g.evidence.join(', ')}`,
      });
    }
  }

  const explicitParentCodes = new Set(
    commitRows
      .filter((row) => !row.parentCode)
      .map((row) => normalizeProductCode(row.code)),
  );
  const productRows = commitRows.filter((row, index, all) => {
    if (!row.parentCode) return true;
    const parentCode = normalizeProductCode(row.parentCode);
    // When the workbook already has a parent row, its children are variations,
    // not additional products. Only synthesize one parent from the first child
    // when an explicit parent row is genuinely absent.
    if (explicitParentCodes.has(parentCode)) return false;
    return (
      all.findIndex(
        (candidate) =>
          normalizeProductCode(candidate.parentCode || '') === parentCode,
      ) === index
    );
  });
  const rejectedCodes = new Set(
    input.existing
      .filter((product) => product.status === 'rejected')
      .map((product) => normalizeProductCode(product.code)),
  );
  const suppressedProductCodes = [
    ...new Set(
      productRows
        .map((row) => normalizeProductCode(row.parentCode || row.code))
        .filter((code) => rejectedCodes.has(code)),
    ),
  ];
  const operationalProductRows = productRows.filter(
    (row) =>
      !rejectedCodes.has(normalizeProductCode(row.parentCode || row.code)),
  );
  const newProducts = operationalProductRows.filter(
    (r) => r.changeType === 'new',
  ).length;
  const updatedProducts = operationalProductRows.filter(
    (r) => r.changeType === 'updated',
  ).length;
  const unchangedProducts = operationalProductRows.filter(
    (r) => r.changeType === 'unchanged',
  ).length;

  const parentProducts = groups.filter((g) => g.kind !== 'simple').length;
  const variations = groups
    .filter((g) => g.kind !== 'simple')
    .reduce((n, g) => n + g.children.length, 0);

  const fingerprint = sha256(
    input.fileBufferHash ||
      JSON.stringify({
        headers: input.headers,
        rows: input.rows.length,
        mapping,
      }),
  );

  const rowsRequiringReview = issues.filter((i) => i.severity === 'review');
  const conflictingInventory = issues.filter(
    (i) => i.codeKey === 'stale_inventory',
  );
  const invalidRows = input.rows.length - validRows - excludedOutOfStockRows;
  const blockingErrorCount = issues.filter(
    (i) => i.severity === 'error',
  ).length;
  const reviewCount = rowsRequiringReview.length;
  const mappingBlocks =
    suggested.uncertainFields.length > 0 &&
    !input.mapping &&
    !input.confirmUncertainMapping &&
    suggested.confidence < 0.85;
  const canCommit = blockingErrorCount === 0 && !mappingBlocks && validRows > 0;

  return {
    fingerprint,
    totalRows: input.rows.length,
    validRows,
    invalidRows,
    newProducts,
    updatedProducts,
    unchangedProducts,
    excludedOutOfStockRows,
    inStockProductCodes: [
      ...new Set(commitRows.map((row) => row.parentCode || row.code)),
    ],
    suppressedProductCodes,
    parentProducts,
    variations,
    duplicateProductCodes,
    duplicateBarcodes,
    missingProductCodes,
    missingPrices,
    missingCategories,
    missingImages: commitRows.filter((row) => row.imageUrls.length === 0).length,
    unknownAttributes: [...unknownAttributes],
    conflictingInventory,
    rowsRequiringReview,
    issues,
    groups,
    mapping,
    mappingConfidence: suggested.confidence,
    mappingUncertainFields: suggested.uncertainFields,
    commitRows,
    blockingErrorCount,
    reviewCount,
    canCommit,
  };
}
