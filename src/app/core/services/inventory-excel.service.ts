import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { environment } from '@env/environment';
import {
  ExcelImportResult,
  StagingProduct
} from '@shared/models/staging-product.model';
import {
  ParsedExcelRow,
  buildExcelTemplateCsv,
  parseInventoryCsv,
  parseInventoryMatrix,
  tagExcelCategory
} from '@shared/utils/excel-category-tagger';

/**
 * سرویس عملیاتی بارگذاری و تگ‌گذاری فایل اکسل/CSV انبار.
 * قوانین در processRows کد شده‌اند و روی هر فایل اعمال می‌شوند.
 */
@Injectable({ providedIn: 'root' })
export class InventoryExcelService {
  private static readonly ACCEPTED_EXT = /\.(xlsx|xls|csv)$/i;
  private readonly snapshotKey = environment.storageKeys.excelInventorySnapshot;

  isAcceptedFile(file: File): boolean {
    return InventoryExcelService.ACCEPTED_EXT.test(file.name);
  }

  downloadTemplate(): void {
    const csv = '\uFEFF' + buildExcelTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mazhari-inventory-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  parseInventoryFile(file: File, knownProductCodes: string[] = []): Observable<ExcelImportResult> {
    if (!this.isAcceptedFile(file)) {
      throw new Error('فقط فایل‌های اکسل/CSV با پسوند .xls / .xlsx / .csv پذیرفته می‌شوند.');
    }

    const isCsv = /\.csv$/i.test(file.name);

    const rows$: Observable<ParsedExcelRow[]> = isCsv
      ? from(file.text()).pipe(switchMap((text) => of(parseInventoryCsv(text))))
      : from(file.arrayBuffer()).pipe(
          switchMap((buffer) => of(this.parseExcelWorkbook(buffer)))
        );

    return rows$.pipe(
      switchMap((rows) => {
        if (!rows.length) {
          return throwError(
            () =>
              new Error(
                'فایل خالی است یا ستون‌های استاندارد (کد کالا، نام، طبقه، موجودی) یافت نشد.'
              )
          );
        }
        return of(this.processRows(rows, file.name, knownProductCodes));
      }),
      catchError((err: unknown) =>
        throwError(() => (err instanceof Error ? err : new Error('خطا در خواندن فایل')))
      )
    );
  }

  /** پارس واقعی فایل‌های باینری اکسل (.xls / .xlsx) با SheetJS */
  private parseExcelWorkbook(buffer: ArrayBuffer): ParsedExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: ''
    });

    const cells = matrix.map((row) =>
      (Array.isArray(row) ? row : []).map((cell) => String(cell ?? '').trim())
    );

    return parseInventoryMatrix(cells);
  }

  /**
   * هسته عملیاتی تگ‌گذاری — همه قوانین اینجا اجرا می‌شوند.
   */
  processRows(
    rawRows: ParsedExcelRow[],
    fileName: string,
    knownProductCodes: string[] = []
  ): ExcelImportResult {
    const importedAt = new Date().toISOString();
    const previousCodes = this.readSnapshot();
    for (const code of knownProductCodes) {
      previousCodes.add(`CODE:${normalizeIdentifier(code)}`);
      // سازگاری با snapshot نسخه قبلی که فقط خود کد را ذخیره می‌کرد.
      previousCodes.add(normalizeIdentifier(code));
    }
    const filtered: ExcelImportResult['filtered'] = [];
    const accepted: StagingProduct[] = [];
    const removedOutOfStock: string[] = [];
    const currentFileIdentities: string[] = [];

    for (const row of rawRows) {
      currentFileIdentities.push(...rowIdentities(row));

      if (row.internal) {
        filtered.push({
          code: row.code || '—',
          name: row.name || 'بدون نام',
          reason: 'کالای داخلی — غیرقابل انتشار'
        });
        continue;
      }

      if (!row.code?.trim() || !row.name?.trim()) {
        filtered.push({
          code: row.code || '—',
          name: row.name || 'بدون نام',
          reason: 'ردیف نامعتبر (کد یا نام خالی)'
        });
        continue;
      }

      const code = row.code.trim().toUpperCase();
      const identities = rowIdentities(row);

      if (!Number.isFinite(row.stock) || row.stock <= 0) {
        filtered.push({
          code,
          name: row.name.trim(),
          reason: 'عدم موجودی — حذف از چرخه عملیاتی'
        });
        removedOutOfStock.push(code);
        continue;
      }

      if (!Number.isSafeInteger(row.price) || Number(row.price) <= 0) {
        filtered.push({
          code,
          name: row.name.trim(),
          reason: 'قیمت ریالی معتبر در فایل انبار ثبت نشده است'
        });
        continue;
      }

      const isNewImport =
        previousCodes.size > 0 &&
        !identities.some(identity => previousCodes.has(identity)) &&
        !previousCodes.has(normalizeIdentifier(code));
      const tag = tagExcelCategory(row.category, isNewImport);

      if (!tag.matched) {
        filtered.push({
          code,
          name: row.name.trim(),
          reason: `طبقه نامعتبر «${row.category || '—'}» — زیردسته سایت یافت نشد`
        });
        continue;
      }

      accepted.push({
        id: `stg-${code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        code,
        name: row.name.trim(),
        category: tag.category,
        parentCategory: tag.parentCategory,
        parentCategorySlug: tag.parentCategorySlug,
        categorySlug: tag.categorySlug,
        stock: row.stock,
        price: row.price,
        size: row.size?.trim() || undefined,
        material: row.material?.trim() || undefined,
        heelHeight: row.heelHeight?.trim() || undefined,
        platformHeight: row.platformHeight?.trim() || undefined,
        variantKey: buildVariantKey(row.name.trim(), tag.categorySlug, row.size),
        isNewImport: tag.isNewImport,
        status: shouldRouteToTrash(row.category) ? 'rejected' : 'waiting_photo',
        photos: [],
        importedAt
      });
    }

    // مرجع «جدید بودن» کل فایل قبلی است، نه فقط کالاهای موجودی‌دار آن.
    // بنابراین کالایی که قبلاً صفر بوده و امروز موجود شده، محصول جدید محسوب نمی‌شود.
    this.writeSnapshot(currentFileIdentities);

    const consolidated = consolidateVariableProducts(accepted, rawRows);

    return {
      fileName,
      totalRows: rawRows.length,
      accepted: consolidated,
      filtered,
      removedOutOfStock,
      newProductCount: consolidated.filter(item => item.isNewImport).length,
      importedAt
    };
  }

  private readSnapshot(): Set<string> {
    try {
      const raw = localStorage.getItem(this.snapshotKey);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as string[];
      return new Set(Array.isArray(parsed) ? parsed.map((c) => String(c).toUpperCase()) : []);
    } catch {
      return new Set();
    }
  }

  private writeSnapshot(codes: string[]): void {
    try {
      localStorage.setItem(
        this.snapshotKey,
        JSON.stringify([...new Set(codes.map((c) => c.toUpperCase()))])
      );
    } catch {
      // ignore
    }
  }
}

function consolidateVariableProducts(
  products: StagingProduct[],
  rawRows: ParsedExcelRow[]
): StagingProduct[] {
  const byCode = new Map<string, StagingProduct[]>();
  const rowsByCode = new Map<string, ParsedExcelRow[]>();
  for (const row of rawRows) {
    if (row.internal || !row.name?.trim()) continue;
    const key = normalizeIdentifier(row.code);
    if (!key) continue;
    const rows = rowsByCode.get(key) || [];
    rows.push(row);
    rowsByCode.set(key, rows);
  }
  for (const product of products) {
    const key = normalizeIdentifier(product.code);
    const group = byCode.get(key) || [];
    group.push(product);
    byCode.set(key, group);
  }

  return [...byCode.entries()].map(([code, group]) => {
    const parent = group[0];
    const rows = rowsByCode.get(code) || [];
    const distinctBarcodes = new Set(
      rows.map(row => normalizeIdentifier(row.barcode || '')).filter(Boolean)
    );
    const isFootwear =
      parent.categorySlug === 'bridal-shoes' ||
      parent.categorySlug === 'bridal-sneakers';
    const hasFootwearSize = isFootwear && rows.some(row => !!cleanVariantValue(row.size));
    if (!hasFootwearSize && (rows.length < 2 || distinctBarcodes.size < 2)) {
      return { ...parent, stock: Math.max(...group.map(item => item.stock)) };
    }

    const variations = rows.map((row, index) => {
      const barcode = normalizeIdentifier(row.barcode || '');
      const sku = barcode || `${parent.code}-${index + 1}`;
      return {
        sku,
        barcode: barcode || sku,
        size: cleanVariantValue(row.size),
        color: cleanVariantValue(row.color),
        material: cleanVariantValue(row.material),
        price: row.price,
        stock: Number.isFinite(row.stock) ? Math.max(0, row.stock) : 0,
        available: Number.isFinite(row.stock) && row.stock > 0
      };
    });

    return {
      ...parent,
      stock: variations.reduce((sum, variation) => sum + variation.stock, 0),
      size: undefined,
      color: undefined,
      variantKey: `inventory::${parent.code}`,
      variations
    };
  });
}

function shouldRouteToTrash(category: string): boolean {
  const normalized = (category || '')
    .trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s*\/\s*/g, '/');
  return normalized === 'تولیدی' ||
    normalized.startsWith('تولیدی/') ||
    normalized === 'خدمات' ||
    normalized.startsWith('خدمات/');
}

function cleanVariantValue(value?: string): string | undefined {
  const cleaned = (value || '').trim();
  return cleaned && cleaned !== '-' ? cleaned : undefined;
}

function normalizeIdentifier(value: string): string {
  return (value || '')
    .trim()
    .replace(/[۰-۹٠-٩]/g, digit => {
      const fa = '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit);
      if (fa >= 0) return String(fa);
      const ar = '٠١٢٣٤٥٦٧٨٩'.indexOf(digit);
      return ar >= 0 ? String(ar) : digit;
    })
    .replace(/[,\s]/g, '')
    .toUpperCase();
}

function rowIdentities(row: ParsedExcelRow): string[] {
  const identities = [
    row.code ? `CODE:${normalizeIdentifier(row.code)}` : '',
    row.inventoryId ? `ID:${normalizeIdentifier(row.inventoryId)}` : '',
    row.barcode ? `BAR:${normalizeIdentifier(row.barcode)}` : ''
  ].filter(Boolean);
  return [...new Set(identities)];
}

/** کلید مشترک برای ردیف‌های هم‌نام با سایزهای مختلف. */
function buildVariantKey(name: string, categorySlug: string, size?: string): string {
  const normalizedName = name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .toLowerCase();
  // اگر سایز داخل نام آمده باشد، برای هم‌گروهی حذف می‌شود
  const withoutSize = size
    ? normalizedName.replace(new RegExp(`\\b${escapeRegExp(size.trim())}\\b`, 'gi'), '').replace(/\s+/g, ' ').trim()
    : normalizedName;
  return `${categorySlug}::${withoutSize || normalizedName}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
