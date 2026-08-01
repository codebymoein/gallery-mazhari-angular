import { normalizeProductCode, normalizeText } from '../common/text-normalize';

/** Internal field keys supported by column mapping */
export const MAPPABLE_FIELDS = [
  'productCode',
  'parentCode',
  'barcode',
  'productName',
  'category',
  'subcategory',
  'price',
  'salePrice',
  'inventory',
  'size',
  'color',
  'material',
  'brand',
  'description',
  'status',
  'branch',
  'collection',
  'internal',
] as const;

export type MappableField = (typeof MAPPABLE_FIELDS)[number];

export type ColumnMapping = Partial<Record<MappableField, string>>;

export interface MappingTemplate {
  id?: string;
  name: string;
  mapping: ColumnMapping;
  headerFingerprint: string;
  createdAt?: string;
}

/** Known header aliases (Persian + English) → internal field */
const HEADER_ALIASES: Record<MappableField, string[]> = {
  productCode: [
    'شناسه کالا',
    'شناسه محصول',
    'product id',
    'کد کالا',
    'کدکالا',
    'کد محصول',
    'product code',
    'sku',
    'code',
    'کد',
  ],
  parentCode: [
    'کد مادر',
    'کد والد',
    'parent code',
    'mother code',
    'parent',
    'کد اصلی',
  ],
  barcode: ['بارکد', 'barcode', 'ean', 'upc'],
  productName: ['نام کالا', 'نام محصول', 'name', 'product name', 'عنوان'],
  category: ['طبقه کالا', 'طبقه', 'دسته', 'category', 'گروه'],
  subcategory: ['زیردسته', 'طبقه / زیردسته', 'subcategory', 'زیر طبقه'],
  price: ['قیمت', 'قیمت ریال', 'قیمت (ریال)', 'مبلغ ریالی', 'price', 'مبلغ'],
  salePrice: [
    'قیمت با تخفیف',
    'قیمت تخفیف',
    'قیمت تخفیف ریال',
    'sale price',
    'special price',
  ],
  inventory: ['موجودی', 'inventory', 'stock', 'تعداد'],
  size: ['سایز', 'size', 'اندازه'],
  color: ['رنگ', 'color', 'colour'],
  material: ['جنس', 'متریال', 'material', 'پارچه'],
  brand: ['برند', 'brand', 'مارک'],
  description: ['توضیحات', 'description', 'شرح'],
  status: ['وضعیت', 'status'],
  branch: ['شعبه', 'branch', 'انبار'],
  collection: ['کالکشن', 'collection', 'مجموعه'],
  internal: ['داخلی', 'internal', 'داخلی (بله/خیر)'],
};

export function fingerprintHeaders(headers: string[]): string {
  return headers
    .map((h) => normalizeText(h))
    .filter(Boolean)
    .sort()
    .join('|');
}

export interface SuggestedMapping {
  mapping: ColumnMapping;
  confidence: number;
  uncertainFields: MappableField[];
  evidence: Record<string, string>;
}

/**
 * Suggest column mapping from headers.
 * Uncertain mappings are flagged — never silently accepted.
 */
export function suggestColumnMapping(headers: string[]): SuggestedMapping {
  const mapping: ColumnMapping = {};
  const evidence: Record<string, string> = {};
  const uncertainFields: MappableField[] = [];
  let matched = 0;
  let requiredHits = 0;

  const normalizedHeaders = headers.map((h) => ({
    raw: h,
    key: normalizeText(h),
  }));
  const usedHeaders = new Set<string>();

  for (const field of MAPPABLE_FIELDS) {
    const aliases = HEADER_ALIASES[field].map((a) => normalizeText(a));
    let best: { raw: string; score: number } | null = null;

    for (const h of normalizedHeaders) {
      if (!h.key) continue;
      if (usedHeaders.has(h.raw)) continue;
      // exact alias
      if (aliases.includes(h.key)) {
        best = { raw: h.raw, score: 1 };
        break;
      }
      // contains alias
      for (const a of aliases) {
        if (a.length >= 2 && (h.key.includes(a) || a.includes(h.key))) {
          const score = 0.7;
          if (!best || score > best.score) best = { raw: h.raw, score };
        }
      }
    }

    if (best) {
      mapping[field] = best.raw;
      usedHeaders.add(best.raw);
      evidence[field] = `header="${best.raw}" score=${best.score}`;
      matched += 1;
      if (best.score < 0.9) uncertainFields.push(field);
      if (
        field === 'productCode' ||
        field === 'productName' ||
        field === 'inventory'
      ) {
        requiredHits += best.score >= 0.9 ? 1 : 0;
      }
    }
  }

  // subcategory often carries combined "طبقه / زیردسته"
  if (!mapping.category && mapping.subcategory) {
    mapping.category = mapping.subcategory;
    evidence.category = 'mirrored_from_subcategory';
  }

  const confidence =
    matched === 0
      ? 0
      : Math.min(
          1,
          (matched / 8) * 0.5 +
            (requiredHits / 3) * 0.5 +
            (uncertainFields.length ? -0.1 : 0.1),
        );

  if (!mapping.productCode) uncertainFields.push('productCode');
  if (!mapping.productName) uncertainFields.push('productName');

  return {
    mapping,
    confidence: Math.max(0, Number(confidence.toFixed(2))),
    uncertainFields: [...new Set(uncertainFields)],
    evidence,
  };
}

export function applyMapping(
  row: Record<string, unknown>,
  mapping: ColumnMapping,
): Record<MappableField, string> {
  const out = {} as Record<MappableField, string>;
  for (const field of MAPPABLE_FIELDS) {
    const col = mapping[field];
    if (!col) {
      out[field] = '';
      continue;
    }
    const val = row[col];
    out[field] = val == null ? '' : String(val).trim();
  }
  return out;
}

export function parseNumberLoose(value: string): number | null {
  if (!value?.trim()) return null;
  const cleaned = normalizeText(value)
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export { normalizeProductCode };
