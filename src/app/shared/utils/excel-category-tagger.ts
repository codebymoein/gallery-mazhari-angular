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
import {
  NEW_PRODUCT_CATEGORY_LABEL,
  NEW_PRODUCT_CATEGORY_SLUG
} from '@shared/models/staging-product.model';

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
  name: string;
  category: string;
  stock: number;
  internal: boolean;
}

export const EXCEL_COLUMN_SCHEMA = [
  { key: 'code', title: 'کد کالا', required: true, example: 'GM-2401' },
  { key: 'name', title: 'نام کالا', required: true, example: 'تاج کریستال سلطنتی' },
  { key: 'category', title: 'طبقه / زیردسته', required: true, example: 'تاج عروس' },
  { key: 'stock', title: 'موجودی', required: true, example: '5' },
  { key: 'internal', title: 'داخلی (بله/خیر)', required: false, example: 'خیر' }
] as const;

/** نام‌های جایگزین رایج در فایل انبار → اسلاگ زیردسته سایت */
const EXCEL_ALIAS_MAP: Record<string, string> = {
  تاج: 'bridal-tiaras',
  'تور عروس': 'decorated-veil',
  'تور سر': 'simple-veil',
  تور: 'simple-veil',
  کفش: 'bridal-shoes',
  کیف: 'bridal-bags',
  زیورآلات: 'earrings',
  'لباس عروس': 'european-bridal-dresses',
  'لباس اروپایی': 'european-bridal-dresses',
  'لباس عربی': 'arabic-bridal-dresses',
  'لباس ماهی': 'mermaid-bridal-dresses',
  'اکسسوری مو': 'bridal-tiaras',
  'دسته‌گل': 'rose-bouquet',
  'دسته گل': 'rose-bouquet',
  اکسسوری: 'bridal-fans',
  'اکسسوری خاص': 'bridal-fans',
  حجاب: 'bridal-chador',
  'عقد و بله‌برون': 'engagement-items',
  بله‌برون: 'baleh-boron-set'
};

function normalizeKey(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک');
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
  const hit = TAG_INDEX.get(normalizeKey(rawCategory));
  if (hit) {
    return { ...hit, isNewImport, matched: true };
  }

  // طبقه نامعتبر ولی کد جدید — در سبد «محصول جدید وارد شده» نگه داشته می‌شود
  // تا ادمین دسته درست را بعداً تعیین کند (به‌جای حذف کامل از چرخه).
  if (isNewImport) {
    return {
      parentCategory: NEW_PRODUCT_CATEGORY_LABEL,
      parentCategorySlug: NEW_PRODUCT_CATEGORY_SLUG,
      category: NEW_PRODUCT_CATEGORY_LABEL,
      categorySlug: NEW_PRODUCT_CATEGORY_SLUG,
      isNewImport: true,
      matched: true
    };
  }

  return {
    parentCategory: '',
    parentCategorySlug: '',
    category: (rawCategory || '').trim(),
    categorySlug: '',
    isNewImport: false,
    matched: false
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
  if (n.includes('کد') || n === 'code') return 'code';
  if (n.includes('نام') || n === 'name') return 'name';
  if (n.includes('طبقه') || n.includes('زیردسته') || n.includes('دسته') || n === 'category') {
    return 'category';
  }
  if (n.includes('موجودی') || n === 'stock') return 'stock';
  if (n.includes('داخلی') || n === 'internal') return 'internal';
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
    rows.push({
      code: get('code'),
      name: get('name'),
      category: get('category'),
      stock: Number.isFinite(stock) && stockRaw !== '' ? stock : NaN,
      internal: isTruthyInternal(get('internal'))
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
    'GM-2501,تاج کریستال سلطنتی,تاج عروس,4,خیر',
    'GM-2502,تور ابریشمی دانتل,تور تزئینی,2,خیر',
    'GM-2503,کفش ساتن عروس,کفش عروس,0,خیر',
    'GM-2504,گوشواره مروارید,گوشواره,6,خیر',
    'GM-2505,لباس عروس اروپایی کلاسیک,لباس عروس اروپایی,1,خیر',
    'GM-2506,ریسه وارداتی کریستال,ریسه وارداتی,3,خیر',
    'GM-2507,دستبند طلایی ظریف,دستبند,5,خیر',
    'GM-2508,کیف مرواریددار,کیف عروس,2,خیر',
    'INT-01,نمونه ویترین,تاج عروس,1,بله'
  ];
  return [header, ...samples].join('\n');
}

export function excelTaggerRulesFa(): string[] {
  return [
    'فقط کالاهای با موجودی بزرگ‌تر از صفر وارد صف انتشار می‌شوند.',
    'کالاهای با موجودی صفر / ناموجود از کل چرخه عملیاتی حذف می‌شوند.',
    'ستون «طبقه» باید با زیردسته‌های سایت هم‌خوان باشد؛ در غیر این صورت رد می‌شود.',
    'هر کدی که در فایل قبلی نبود، در دسته «محصول جدید وارد شده» قرار می‌گیرد.',
    'کالاهای داخلی (internal=بله) منتشر نمی‌شوند.'
  ];
}
