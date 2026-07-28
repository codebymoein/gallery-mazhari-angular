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

  parseInventoryFile(file: File): Observable<ExcelImportResult> {
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
        return of(this.processRows(rows, file.name));
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
  processRows(rawRows: ParsedExcelRow[], fileName: string): ExcelImportResult {
    const importedAt = new Date().toISOString();
    const previousCodes = this.readSnapshot();
    const filtered: ExcelImportResult['filtered'] = [];
    const accepted: StagingProduct[] = [];
    const removedOutOfStock: string[] = [];
    const inStockCodes: string[] = [];
    let newProductCount = 0;

    for (const row of rawRows) {
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

      if (!Number.isFinite(row.stock) || row.stock <= 0) {
        filtered.push({
          code,
          name: row.name.trim(),
          reason: 'عدم موجودی — حذف از چرخه عملیاتی'
        });
        removedOutOfStock.push(code);
        continue;
      }

      const isNewImport = previousCodes.size > 0 && !previousCodes.has(code);
      const tag = tagExcelCategory(row.category, isNewImport);

      if (!tag.matched) {
        filtered.push({
          code,
          name: row.name.trim(),
          reason: `طبقه نامعتبر «${row.category || '—'}» — زیردسته سایت یافت نشد`
        });
        continue;
      }

      inStockCodes.push(code);
      if (isNewImport) newProductCount += 1;

      accepted.push({
        id: `stg-${code}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        code,
        name: row.name.trim(),
        category: tag.category,
        parentCategory: tag.parentCategory,
        parentCategorySlug: tag.parentCategorySlug,
        categorySlug: tag.categorySlug,
        stock: row.stock,
        isNewImport: tag.isNewImport,
        status: 'waiting_photo',
        photos: [],
        importedAt
      });
    }

    this.writeSnapshot(inStockCodes);

    return {
      fileName,
      totalRows: rawRows.length,
      accepted,
      filtered,
      removedOutOfStock,
      newProductCount,
      importedAt
    };
  }

  private readSnapshot(): Set<string> {
    try {
      const raw = localStorage.getItem(this.snapshotKey);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as string[];
      return new Set(Array.isArray(parsed) ? parsed.map((c) => c.toUpperCase()) : []);
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
