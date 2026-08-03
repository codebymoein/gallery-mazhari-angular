import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('../node_modules/xlsx');
const sharp = require('../backend/node_modules/sharp');

const migrationRoot = path.resolve(process.argv[2] || '../gallery-mazhari-migration');
const sourceCsv = path.join(migrationRoot, 'exports', 'products.csv');
const mediaRoot = path.join(migrationRoot, 'media-originals');
const outputRoot = path.join(migrationRoot, 'prepared-2026-08-01-v4');
const outputMedia = path.join(outputRoot, 'product-media');

if (!fs.existsSync(sourceCsv)) throw new Error(`Missing CSV: ${sourceCsv}`);
if (!fs.existsSync(mediaRoot)) throw new Error(`Missing media: ${mediaRoot}`);
if (fs.existsSync(outputRoot)) throw new Error(`Output already exists: ${outputRoot}`);
fs.mkdirSync(outputMedia, { recursive: true });

const workbook = XLSX.read(fs.readFileSync(sourceCsv), { type: 'buffer', raw: false });
const sourceRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
  defval: '', raw: false
});

const normalize = value => String(value ?? '')
  .trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک')
  .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ').replace(/\s+/g, ' ');
const number = value => {
  const clean = String(value ?? '').replace(/[٬,\s]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : 0;
};
const code = value => String(value ?? '').trim().replace(/\.0$/, '');
const stripHtml = value => String(value ?? '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
  .replace(/&#8211;|&#8212;/g, '–').replace(/&#8230;/g, '…')
  .replace(/\s+/g, ' ').trim();

const categoryRules = [
  [/تاج عروس/, ['اکسسوری مو', 'تاج عروس', 'bridal-tiaras']],
  [/تل(?: عروس)?$/, ['اکسسوری مو', 'تل عروس', 'bridal-headbands']],
  [/ریسه وارداتی/, ['اکسسوری مو', 'ریسه وارداتی', 'imported-hairpiece']],
  [/ریسه ایرانی/, ['اکسسوری مو', 'ریسه ایرانی', 'persian-hairpiece']],
  [/سنجاق شینیون/, ['اکسسوری مو', 'سنجاق شینیون', 'chignon-pins']],
  [/حلقه گل/, ['اکسسوری مو', 'حلقه گل', 'flower-rings']],
  [/اکسسوری کفش/, ['کفش، کتونی و کیف', 'اکسسوری کفش و کتونی', 'bridal-footwear-accessories']],
  [/کتونی/, ['کفش، کتونی و کیف', 'کتونی عروس', 'bridal-sneakers']],
  [/کفش/, ['کفش، کتونی و کیف', 'کفش عروس', 'bridal-shoes']],
  [/کیف|کيف/, ['کفش، کتونی و کیف', 'کیف عروس', 'bridal-bags']],
  [/گوشواره/, ['زیورآلات', 'گوشواره', 'earrings']],
  [/نیم ست|نیم‌ست/, ['زیورآلات', 'نیم‌ست', 'half-set']],
  [/سرویس/, ['زیورآلات', 'سرویس کامل', 'full-jewelry-set']],
  [/دستبند/, ['زیورآلات', 'دستبند', 'bracelets']],
  [/انگشتر/, ['زیورآلات', 'انگشتر', 'rings']],
  [/پابند/, ['زیورآلات', 'پابند', 'anklets']],
  [/سنجاق سینه/, ['زیورآلات', 'سنجاق سینه', 'brooches']],
  [/کت و شلوار/, ['پوشاک عروس', 'کت‌وشلوار عقد', 'ceremony-suits']],
  [/دستکش/, ['پوشاک عروس', 'دستکش عروس', 'bridal-gloves']],
  [/شنل/, ['پوشاک عروس', 'شنل عروس', 'bridal-capes']],
  [/روب|دوشامبر/, ['پوشاک عروس', 'روبدوشامبر عروس', 'bridal-robes']],
  [/لباس زیر/, ['پوشاک عروس', 'لباس زیر', 'bridal-lingerie']],
  [/لباس نامزدی/, ['پوشاک عروس', 'لباس نامزدی', 'engagement-dresses']],
  [/لباس.*عرب/, ['پوشاک عروس', 'لباس عروس عربی', 'arabic-bridal-dresses']],
  [/لباس.*ماهی/, ['پوشاک عروس', 'لباس عروس مدل ماهی', 'mermaid-bridal-dresses']],
  [/پوشاک عروس/, ['پوشاک عروس', 'لباس عروس اروپایی', 'european-bridal-dresses']],
  [/کلاه/, ['حجاب مو', 'کلاه و کاپ‌کلاه', 'bridal-hat']],
  [/چادر/, ['حجاب مو', 'چادر عروس', 'bridal-chador']],
  [/توربان/, ['حجاب مو', 'توربان', 'turban']],
  [/هدشال/, ['حجاب مو', 'هدشال', 'headscarf']],
  [/تورسر.*عرب/, ['تورسر', 'تورسر عربی', 'arabic-bridal-veils']],
  [/تورسر/, ['تورسر', 'تورسر اروپایی', 'european-bridal-veils']],
  [/دسته گل/, ['دسته‌گل مصنوعی', 'دسته‌گل مصنوعی', 'bridal-bouquets']],
  [/باد بزن|اکسسوری خاص|سایر محصولات/, ['اکسسوری خاص عروس', 'اکسسوری خاص عروس', 'special-bridal-accessories']],
  [/ست بله|بله برون/, ['ملزومات عقد و بله‌برون', 'ست بله‌برون', 'baleh-boron-set']],
  [/سبد/, ['ملزومات عقد و بله‌برون', 'سبد سه‌سایز', 'three-size-basket']],
  [/ملزومات عقد/, ['ملزومات عقد و بله‌برون', 'ملزومات عقد', 'engagement-items']]
];

function mapCategory(raw, productName = '') {
  const leafPath = String(raw || '').split(',').map(x => x.trim()).filter(Boolean)
    .sort((a, b) => b.split('>').length - a.split('>').length)[0] || '';
  const leaf = leafPath.split('>').at(-1)?.trim() || leafPath;
  let value = normalize(leaf);
  const normalizedName = normalize(productName);
  if (value === 'کفش و کتونی و کیف عروس') {
    value = /کیف|کيف/.test(normalizedName) ? 'کیف' : /کتونی/.test(normalizedName) ? 'کتونی' : 'کفش';
  } else if (value === 'حجاب مو') {
    value = /چادر/.test(normalizedName) ? 'چادر' : /توربان/.test(normalizedName) ? 'توربان' : /شال/.test(normalizedName) ? 'هدشال' : 'کلاه';
  } else if (value === 'اکسسوری مو') {
    value = /تل/.test(normalizedName) ? 'تل' : /ریسه/.test(normalizedName) ? 'ریسه وارداتی' : /سنجاق/.test(normalizedName) ? 'سنجاق شینیون' : 'تاج عروس';
  } else if (value === 'زیورالات' || value === 'زیورآلات') {
    value = /گوشواره/.test(normalizedName) ? 'گوشواره' : /دستبند/.test(normalizedName) ? 'دستبند' : /نیم/.test(normalizedName) ? 'نیم ست' : 'سرویس';
  }
  for (const [pattern, mapped] of categoryRules) {
    if (pattern.test(value)) return { raw: leafPath, parent: mapped[0], label: mapped[1], slug: mapped[2], matched: true };
  }
  return { raw: leafPath, parent: 'طبقات نامتعارف', label: leaf || 'بدون دسته', slug: 'unconventional', matched: false };
}

function attributes(row) {
  const result = { size: '', color: '', material: '' };
  for (let index = 1; index <= 2; index++) {
    const name = normalize(row[`نام ویژگی ${index}`]);
    const value = String(row[`مقدار ویژگی ${index}`] || '').trim();
    if (!value) continue;
    if (/size|سایز|اندازه/.test(name)) result.size = value;
    else if (/color|رنگ/.test(name)) result.color = value;
    else if (/material|جنس/.test(name)) result.material = value;
  }
  if (!result.size && row['نوع'] === 'variation') {
    const match = String(row['نام']).match(/(?:,|،)\s*(\d{2,3})\s*$/);
    if (match) result.size = match[1];
  }
  return result;
}

const rowsByCode = new Map(sourceRows.map(row => [code(row['شناسه محصول']), row]));
const childrenByParent = new Map();
for (const row of sourceRows.filter(row => row['نوع'] === 'variation')) {
  const parent = code(row['مادر']);
  if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
  childrenByParent.get(parent).push(row);
}

const imageIndex = new Map();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) continue;
      const key = entry.name.toLowerCase();
      if (!imageIndex.has(key)) imageIndex.set(key, []);
      imageIndex.get(key).push(full);
    }
  }
}
walk(mediaRoot);

function findLocalImage(url) {
  let relative = '';
  try { relative = decodeURIComponent(new URL(url).pathname.split('/uploads/')[1] || ''); } catch { return null; }
  if (!relative) return null;
  const direct = path.join(mediaRoot, ...relative.split('/'));
  if (fs.existsSync(direct) && fs.statSync(direct).size > 0) return direct;
  const candidates = imageIndex.get(path.basename(relative).toLowerCase()) || [];
  return candidates.filter(file => fs.statSync(file).size > 0).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0] || null;
}

const outputRows = [];
const imageManifest = [];
const issues = [];
const categoryStats = new Map();
const hashes = new Map();

for (const row of sourceRows) {
  const productCode = code(row['شناسه محصول']);
  if (!productCode) { issues.push({ code: '', type: 'missing_code', detail: String(row['نام'] || '') }); continue; }
  const type = String(row['نوع']);
  const parentCode = type === 'variation' ? code(row['مادر']) : '';
  const parentRow = parentCode ? rowsByCode.get(parentCode) : null;
  const category = mapCategory(parentRow?.['دسته‌ها'] || row['دسته‌ها'], parentRow?.['نام'] || row['نام']);
  categoryStats.set(category.slug, (categoryStats.get(category.slug) || 0) + 1);
  if (!category.matched) issues.push({ code: productCode, type: 'unmapped_category', detail: category.raw });
  const attr = attributes(row);
  const children = type === 'variable' ? (childrenByParent.get(productCode) || []) : [];
  const childPrices = children.map(child => number(child['قیمت اصلی'])).filter(value => value > 0);
  const price = number(row['قیمت اصلی']) || (childPrices.length ? Math.min(...childPrices) : 0);
  const childStock = children.reduce((sum, child) => sum + Math.max(0, number(child['انبار'])), 0);
  const stock = type === 'variable' ? childStock : Math.max(0, number(row['انبار']));
  const rawSale = number(row['قیمت فروش فوق‌العاده']);
  const salePrice = rawSale > 0 && rawSale < price ? rawSale : '';
  if (!price) issues.push({ code: productCode, type: 'missing_price', detail: type });

  outputRows.push({
    'کد کالا': productCode,
    'کد مادر': parentCode,
    'بارکد': String(row['GTIN UPC، EAN یا ISBN'] || '').trim(),
    'نام کالا': String(row['نام'] || '').trim(),
    'طبقه': category.parent,
    'طبقه / زیردسته': category.label,
    'اسلاگ دسته جدید': category.slug,
    'قیمت': price || '',
    'قیمت با تخفیف': salePrice,
    'موجودی': stock,
    'سایز': attr.size,
    'رنگ': attr.color,
    'جنس رویه': attr.material,
    'توضیحات': stripHtml(row['توضیحات'] || row['توضیح کوتاه']),
    'وضعیت منبع': String(row['منتشر شده']) === '1' ? 'published' : 'draft',
    'نوع منبع': type,
    'شناسه WooCommerce': code(row['شناسه'])
  });
}

const parentRows = sourceRows.filter(row => row['نوع'] !== 'variation');
for (let productIndex = 0; productIndex < parentRows.length; productIndex++) {
  const row = parentRows[productIndex];
  const productCode = code(row['شناسه محصول']);
  const urls = String(row['تصاویر'] || '').split(',').map(value => value.trim()).filter(Boolean);
  let references = urls.map(url => ({ url, source: findLocalImage(url) }));
  if (!references.length) {
    const fallbackPattern = new RegExp(`^${productCode}(?:[-_]\\d+)?\\.(?:jpe?g|png|webp|avif)$`, 'i');
    references = [...imageIndex.entries()]
      .filter(([name]) => fallbackPattern.test(name))
      .flatMap(([, files]) => files)
      .filter(file => fs.statSync(file).size > 0)
      .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)
      .map(source => ({ url: '', source }));
    if (references.length) issues.push({ code: productCode, type: 'recovered_image_without_url', detail: path.relative(mediaRoot, references[0].source) });
  }
  if (!references.length) { issues.push({ code: productCode, type: 'no_image_url', detail: '' }); continue; }
  let written = 0;
  for (let imageIndexNumber = 0; imageIndexNumber < references.length; imageIndexNumber++) {
    const { source, url } = references[imageIndexNumber];
    if (!source) { issues.push({ code: productCode, type: 'missing_local_image', detail: url }); continue; }
    try {
      const input = fs.readFileSync(source);
      const hash = crypto.createHash('sha256').update(input).digest('hex');
      const duplicateOf = hashes.get(hash) || '';
      if (!duplicateOf) hashes.set(hash, productCode);
      const suffix = written === 0 ? '' : `-${written + 1}`;
      const outputName = `${productCode}${suffix}.webp`;
      const outputPath = path.join(outputMedia, outputName);
      await sharp(input).rotate().resize({ width: 1800, height: 2200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84, effort: 4 }).toFile(outputPath);
      const metadata = await sharp(outputPath).metadata();
      imageManifest.push({ code: productCode, order: written + 1, output: outputName,
        source: path.relative(mediaRoot, source), sourceUrl: url,
        width: metadata.width || '', height: metadata.height || '', bytes: fs.statSync(outputPath).size,
        duplicateOf });
      written += 1;
    } catch (error) {
      issues.push({ code: productCode, type: 'image_processing_error', detail: `${source}: ${error.message}` });
    }
  }
  if (!written) issues.push({ code: productCode, type: 'no_usable_image', detail: '' });
  if ((productIndex + 1) % 50 === 0) console.log(`Processed media for ${productIndex + 1}/${parentRows.length} products`);
}

function writeWorkbook(file, sheets) {
  const book = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
  }
  XLSX.writeFile(book, file);
}

const categoryReport = [...categoryStats.entries()].map(([slug, count]) => ({ slug, count }))
  .sort((a, b) => b.count - a.count);
writeWorkbook(path.join(outputRoot, 'gallery-mazhari-import.xlsx'), {
  Products: outputRows,
  Categories: categoryReport,
  Issues: issues
});
fs.writeFileSync(path.join(outputRoot, 'image-manifest.csv'), XLSX.write({
  SheetNames: ['Media'], Sheets: { Media: XLSX.utils.json_to_sheet(imageManifest) }
}, { type: 'string', bookType: 'csv' }), 'utf8');
fs.writeFileSync(path.join(outputRoot, 'migration-report.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), sourceRows: sourceRows.length, outputRows: outputRows.length,
  parentProducts: parentRows.length, variations: sourceRows.length - parentRows.length,
  processedImages: imageManifest.length, uniqueImageHashes: hashes.size,
  duplicateImages: imageManifest.filter(row => row.duplicateOf).length,
  issuesByType: Object.fromEntries(Object.entries(Object.groupBy(issues, issue => issue.type)).map(([key, value]) => [key, value.length])),
  categoryReport
}, null, 2), 'utf8');

console.log(JSON.stringify({ outputRoot, rows: outputRows.length, images: imageManifest.length, issues: issues.length }, null, 2));
