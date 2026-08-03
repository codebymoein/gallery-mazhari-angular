/**
 * موتور تگ‌گذاری اکسل انبار گالری مظهری (منطق عملیاتی — نه فقط نمایش UI)
 *
 * قوانین کدشده:
 * 1) فقط stock > 0 وارد صف انتشار می‌شود
 * 2) stock <= 0 → حذف کامل از چرخه
 * 3) ستون طبقه باید با زیردسته/دسته سایت مپ شود؛ نامعتبر رد می‌شود
 * 4) کد جدید نسبت به فایل قبلی → «محصول جدید وارد شده»
 * 5) internal=بله → منتشر نمی‌شود
 */

import { CATALOG_CATEGORIES } from '@shared/data/catalog-categories';

export interface ExcelCategoryTag {
  parentCategory: string;
  parentCategorySlug: string;
  category: string;
  categorySlug: string;
  isNewImport: boolean;
  matched: boolean;
}

export interface ParsedExcelRow {
  code: string;
  /** شناسه پایدار ردیف در نرم‌افزار انبار */
  inventoryId?: string;
  /** بارکد کالا؛ برای تطبیق فایل‌های متوالی استفاده می‌شود */
  barcode?: string;
  name: string;
  category: string;
  stock: number;
  /** قیمت قطعی فروش به ریال؛ مرجع آن فایل انبار است. */
  price?: number;
  internal: boolean;
  /** سایز از ستون اکسل (برای کفش/کتونی و متغیرها) */
  size?: string;
  /** رنگ متغیر */
  color?: string;
  /** جنس رویه / متریال */
  material?: string;
  /** ارتفاع پاشنه — مخصوص کفش */
  heelHeight?: string;
  /** ارتفاع لژ — مخصوص کتونی */
  platformHeight?: string;
}

export const EXCEL_COLUMN_SCHEMA = [
  { key: 'code', title: 'کد کالا', required: true, example: 'GM-2401' },
  { key: 'name', title: 'نام کالا', required: true, example: 'تاج کریستال سلطنتی' },
  { key: 'category', title: 'طبقه / زیردسته', required: true, example: 'تاج عروس' },
  { key: 'stock', title: 'موجودی', required: true, example: '5' },
  { key: 'price', title: 'قیمت فروش (ریال)', required: true, example: '25000000' },
  { key: 'size', title: 'سایز', required: false, example: '38' },
  { key: 'material', title: 'جنس رویه', required: false, example: 'ساتن' },
  { key: 'heelHeight', title: 'ارتفاع پاشنه', required: false, example: '۸ سانتی' },
  { key: 'platformHeight', title: 'ارتفاع لژ', required: false, example: '۴ سانتی' },
  { key: 'internal', title: 'داخلی (بله/خیر)', required: false, example: 'خیر' }
] as const;

/** نام‌های جایگزین رایج در فایل انبار → اسلاگ زیردسته سایت */
const EXCEL_ALIAS_MAP: Record<string, string> = {
  تاج: 'bridal-tiaras',
  'تور عروس': 'european-bridal-veils',
  'تور سر': 'european-bridal-veils',
  تورسر: 'european-bridal-veils',
  تور: 'european-bridal-veils',
  کفش: 'bridal-shoes',
  'کفش عروس': 'bridal-shoes',
  کتونی: 'bridal-sneakers',
  'کتونی عروس': 'bridal-sneakers',
  کیف: 'bridal-bags',
  جوراب: 'bridal-socks',
  'جوراب عروس': 'bridal-socks',
  زیورآلات: 'earrings',
  'لباس عروس': 'european-bridal-dresses',
  'لباس اروپایی': 'european-bridal-dresses',
  'لباس عربی': 'arabic-bridal-dresses',
  'لباس ماهی': 'mermaid-bridal-dresses',
  'لباس نامزدی': 'engagement-dresses',
  'کت شلوار عقد': 'ceremony-suits',
  'کت‌وشلوار عقد': 'ceremony-suits',
  'اکسسوری مو': 'bridal-tiaras',
  'دسته‌گل': 'bridal-bouquets',
  'دسته گل': 'bridal-bouquets',
  اکسسوری: 'special-bridal-accessories',
  'اکسسوری خاص': 'special-bridal-accessories',
  حجاب: 'bridal-chador',
  'عقد و بله‌برون': 'engagement-items',
  بله‌برون: 'baleh-boron-set'
};

function normalizeKey(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200f\u202a-\u202e]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s*\/\s*/g, '/');
}

function isTruthyInternal(value: string): boolean {
  const v = normalizeKey(value);
  return v === 'بله' || v === '1' || v === 'true' || v === 'yes' || v === 'internal';
}

type TagIndex = Map<string, Omit<ExcelCategoryTag, 'isNewImport' | 'matched'>>;

/** ایندکس از دسته‌بندی اصلی سایت — منبع حقیقت تگ‌ها */
function buildCatalogTagIndex(): TagIndex {
  const index: TagIndex = new Map();

  for (const cat of CATALOG_CATEGORIES) {
    for (const sub of cat.subcategories) {
      const tag = {
        parentCategory: cat.title,
        parentCategorySlug: cat.slug,
        category: sub.label,
        categorySlug: sub.slug
      };
      index.set(normalizeKey(sub.label), tag);
      index.set(normalizeKey(sub.slug), tag);
    }
    const first = cat.subcategories[0];
    if (first) {
      index.set(normalizeKey(cat.title), {
        parentCategory: cat.title,
        parentCategorySlug: cat.slug,
        category: first.label,
        categorySlug: first.slug
      });
      index.set(normalizeKey(cat.slug), {
        parentCategory: cat.title,
        parentCategorySlug: cat.slug,
        category: first.label,
        categorySlug: first.slug
      });
    } else {
      const tag = {
        parentCategory: cat.title,
        parentCategorySlug: cat.slug,
        category: cat.title,
        categorySlug: cat.slug
      };
      index.set(normalizeKey(cat.title), tag);
      index.set(normalizeKey(cat.slug), tag);
    }
  }

  for (const [alias, slug] of Object.entries(EXCEL_ALIAS_MAP)) {
    for (const cat of CATALOG_CATEGORIES) {
      const sub = cat.subcategories.find((s) => s.slug === slug);
      if (sub) {
        index.set(normalizeKey(alias), {
          parentCategory: cat.title,
          parentCategorySlug: cat.slug,
          category: sub.label,
          categorySlug: sub.slug
        });
        break;
      }
    }
  }

  return index;
}

const TAG_INDEX = buildCatalogTagIndex();

function tagBySlug(slug: string): Omit<ExcelCategoryTag, 'isNewImport' | 'matched'> | undefined {
  for (const cat of CATALOG_CATEGORIES) {
    if (cat.slug === slug) {
      return {
        parentCategory: cat.title,
        parentCategorySlug: cat.slug,
        category: cat.title,
        categorySlug: cat.slug
      };
    }
    const sub = cat.subcategories.find(item => item.slug === slug);
    if (sub) {
      return {
        parentCategory: cat.title,
        parentCategorySlug: cat.slug,
        category: sub.label,
        categorySlug: sub.slug
      };
    }
  }
  return undefined;
}

/** نگاشت مسیرهای واقعی ستون «طبقه کالا» در خروجی نرم‌افزار انبار. */
function matchInventoryCategory(rawCategory: string) {
  const value = normalizeKey(rawCategory);
  const rules: Array<[RegExp, string]> = [
    [/زنانه\/بدلیجات\/دستبند/, 'bracelets'],
    [/زنانه\/بدلیجات\/انگشتر/, 'rings'],
    [/زنانه\/بدلیجات\/گوشواره/, 'earrings'],
    [/زنانه\/بدلیجات\/پابند/, 'anklets'],
    [/زنانه\/بدلیجات\/سنجاق سینه/, 'brooches'],
    [/زنانه\/بدلیجات\/نیم ست/, 'half-set'],
    [/زنانه\/بدلیجات\/سرویس/, 'full-jewelry-set'],
    [/زنانه\/بدلیجات/, 'full-jewelry-set'],
    [/زنانه\/مو\/تل/, 'bridal-headbands'],
    [/زنانه\/جوراب|عروس\/جوراب/, 'bridal-socks'],
    [/زنانه\/کفش.*کتونی/, 'bridal-sneakers'],
    [/زنانه\/کفش/, 'bridal-shoes'],
    [/زنانه\/کیف/, 'bridal-bags'],
    [/عروس\/تاج/, 'bridal-tiaras'],
    [/عروس\/ریسه/, 'imported-hairpiece'],
    [/عروس\/تور سر/, 'european-bridal-veils'],
    [/عروس\/اکسسوری\/دستکش/, 'bridal-gloves'],
    [/عروس\/اکسسوری\/کلاه/, 'bridal-hat'],
    [/عروس\/اکسسوری/, 'special-bridal-accessories'],
    [/عروس\/بله برون|حاج بهروز\/ست بله برون/, 'baleh-boron-set'],
    [/عروس\/دسته گل/, 'bridal-bouquets'],
    [/عروس\/شنل|عروس\/کت/, 'bridal-capes'],
    [/عروس\/پوشاک.*کت وشلوار/, 'ceremony-suits'],
    [/عروس\/پوشاک.*فرمالیته/, 'engagement-dresses'],
    [/عروس\/پوشاک/, 'european-bridal-dresses'],
    [/متفرقه\/روبدوشام/, 'bridal-robes'],
    [/متفرقه\/لباس زیر/, 'bridal-lingerie'],
    [/حاج بهروز\/سبد/, 'three-size-basket'],
    [/حاج بهروز\/سفره عقد|عروس\/خنچه/, 'engagement-items'],
    [/حاج بهروز/, 'engagement-items']
  ];
  const hit = rules.find(([pattern]) => pattern.test(value));
  return hit ? tagBySlug(hit[1]) : undefined;
}

export function listExcelTagOptions(): Array<{
  parent: string;
  label: string;
  slug: string;
}> {
  const rows: Array<{ parent: string; label: string; slug: string }> = [];
  for (const cat of CATALOG_CATEGORIES) {
    for (const sub of cat.subcategories) {
      rows.push({ parent: cat.title, label: sub.label, slug: sub.slug });
    }
  }
  return rows;
}

/**
 * نگاشت طبقه اکسل به دسته/زیردسته سایت.
 * محصول جدید (isNewImport) دسته واقعی خود را حفظ می‌کند و برچسب
 * «محصول جدید وارد شده» به‌عنوان نشان (badge) روی آن می‌نشیند تا در
 * صفحه دسته‌بندی سایت هم قابل نمایش باشد.
 */
export function tagExcelCategory(
  rawCategory: string,
  isNewImport: boolean
): ExcelCategoryTag {
  const hit = TAG_INDEX.get(normalizeKey(rawCategory)) || matchInventoryCategory(rawCategory);
  if (hit) {
    return { ...hit, isNewImport, matched: true };
  }

  // طبقه‌های ناشناخته حذف نمی‌شوند؛ در سبد مشخص خودشان می‌مانند.
  return {
    parentCategory: 'طبقات نامتعارف',
    parentCategorySlug: 'unconventional',
    category: (rawCategory || '').trim() || 'بدون طبقه',
    categorySlug: 'unconventional',
    isNewImport,
    matched: true
  };
}

/** پارس یک خط CSV با پشتیبانی کوتیشن */
export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function headerKey(cell: string): string {
  const n = normalizeKey(cell).replace(/^\ufeff/, '');
  if (n.includes('شناسه')) return 'inventoryId';
  if (n.includes('بارکد')) return 'barcode';
  if (n.includes('کد') || n === 'code') return 'code';
  if (n.includes('نام') || n === 'name') return 'name';
  if (n.includes('طبقه') || n.includes('زیردسته') || n.includes('دسته') || n === 'category') {
    return 'category';
  }
  if (n.includes('موجودی') || n === 'stock') return 'stock';
  if (n.includes('قیمت') || n === 'price') return 'price';
  if (n.includes('داخلی') || n === 'internal') return 'internal';
  if (n.includes('سایز') || n === 'size' || n.includes('اندازه')) return 'size';
  if (n.includes('رنگ') || n === 'color') return 'color';
  if (n.includes('ارتفاع پاشنه') || n.includes('پاشنه')) return 'heelHeight';
  if (n.includes('ارتفاع لژ') || n.includes('لژ')) return 'platformHeight';
  if (n.includes('جنس رویه') || n.includes('رویه') || n.includes('جنس') || n.includes('متریال') || n === 'material' || n.includes('پارچه')) {
    return 'material';
  }
  return n;
}

/**
 * تبدیل ماتریس سلول‌ها (سطر اول = هدر) به ردیف‌های استاندارد انبار.
 * هم CSV و هم شیت اکسل (SheetJS) از همین مسیر عبور می‌کنند.
 */
export function parseInventoryMatrix(matrix: string[][]): ParsedExcelRow[] {
  const nonEmpty = matrix.filter((row) => row.some((cell) => cell.trim().length > 0));
  if (nonEmpty.length < 2) return [];

  const headers = nonEmpty[0].map(headerKey);
  const hasStandardColumns =
    headers.includes('code') || headers.includes('name') || headers.includes('stock');
  if (!hasStandardColumns) return [];

  const rows: ParsedExcelRow[] = [];

  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = nonEmpty[i];
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (cells[idx] || '').trim() : '';
    };
    const stockRaw = normalizeDigits(get('stock')).replace(/,/g, '');
    const stock = Number(stockRaw);
    const priceRaw = normalizeDigits(get('price')).replace(/[,٬]/g, '');
    const price = Number(priceRaw);
    rows.push({
      code: get('code'),
      inventoryId: get('inventoryId') || undefined,
      barcode: get('barcode') || undefined,
      name: get('name'),
      category: get('category'),
      stock: Number.isFinite(stock) && stockRaw !== '' ? stock : NaN,
      price: Number.isFinite(price) && priceRaw !== '' && price >= 0 ? price : undefined,
      internal: isTruthyInternal(get('internal')),
      size: get('size') || undefined,
      color: get('color') || undefined,
      material: get('material') || undefined,
      heelHeight: get('heelHeight') || undefined,
      platformHeight: get('platformHeight') || undefined
    });
  }

  return rows;
}

/** تبدیل ارقام فارسی/عربی به لاتین برای ستون موجودی */
function normalizeDigits(value: string): string {
  return (value || '').replace(/[۰-۹٠-٩]/g, (d) => {
    const fa = '۰۱۲۳۴۵۶۷۸۹'.indexOf(d);
    if (fa >= 0) return String(fa);
    const ar = '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
    return ar >= 0 ? String(ar) : d;
  });
}

/** تبدیل متن CSV به ردیف‌های استاندارد انبار */
export function parseInventoryCsv(text: string): ParsedExcelRow[] {
  const cleaned = text.replace(/^\ufeff/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  return parseInventoryMatrix(lines.map((line) => parseCsvLine(line)));
}

export function buildExcelTemplateCsv(): string {
  const header = EXCEL_COLUMN_SCHEMA.map((c) => c.title).join(',');
  const samples = [
    'GM-2501,تاج کریستال سلطنتی,تاج عروس,4,2500000,,,,,خیر',
    'GM-2502,تور ابریشمی دانتل,تور تزئینی,2,1800000,,,,,خیر',
    'GM-SH-38,کفش ساتن عروس,کفش عروس,3,3200000,38,ساتن,۸ سانتی,,خیر',
    'GM-SH-39,کفش ساتن عروس,کفش عروس,2,3200000,39,ساتن,۸ سانتی,,خیر',
    'GM-SN-37,کتونی عروس مروارید,کتونی عروس,4,2900000,37,چرم مصنوعی,,۴ سانتی,خیر',
    'GM-SN-38,کتونی عروس مروارید,کتونی عروس,5,2900000,38,چرم مصنوعی,,۴ سانتی,خیر',
    'GM-2505,لباس عروس اروپایی کلاسیک,لباس عروس اروپایی,1,,,,,,خیر',
    'GM-2506,ریسه وارداتی کریستال,ریسه وارداتی,3,2100000,,,,,خیر',
    'INT-01,نمونه ویترین,تاج عروس,1,1000000,,,,,بله'
  ];
  return [header, ...samples].join('\n');
}

export function excelTaggerRulesFa(): string[] {
  return [
    'فقط کالاهای با موجودی بزرگ‌تر از صفر وارد صف انتشار می‌شوند.',
    'کالاهای با موجودی صفر / ناموجود از کل چرخه عملیاتی حذف می‌شوند.',
    'ستون «طبقه» باید با زیردسته‌های سایت هم‌خوان باشد؛ در غیر این صورت رد می‌شود.',
    'برای کفش و کتونی ستون‌های سایز، جنس رویه، ارتفاع پاشنه / ارتفاع لژ خوانده می‌شوند.',
    'ردیف‌های هم‌نام با سایزهای مختلف به‌عنوان متغیر یک مدل گروه‌بندی می‌شوند.',
    'هر کدی که در فایل قبلی نبود، در دسته «محصول جدید وارد شده» قرار می‌گیرد.',
    'کالاهای داخلی (internal=بله) منتشر نمی‌شوند.'
  ];
}
