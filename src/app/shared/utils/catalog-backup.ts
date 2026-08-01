import { environment } from '@env/environment';
import {
  CATALOG_PRODUCT_EDITS_KEY,
  BridalSampleProduct,
  CatalogProductEdit,
  getAllCatalogProducts
} from '@shared/data/bridal-collection-categories';
import { StagingProduct } from '@shared/models/staging-product.model';
import * as XLSX from 'xlsx';

export interface CatalogBackupV1 {
  format: 'gallery-mazhari-catalog-backup';
  version: 1;
  exportedAt: string;
  queue: StagingProduct[];
  published: StagingProduct[];
  catalogProducts: BridalSampleProduct[];
  productEdits: Record<string, CatalogProductEdit>;
}

function readArray(key: string): StagingProduct[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readEdits(): Record<string, CatalogProductEdit> {
  try {
    const value = JSON.parse(localStorage.getItem(CATALOG_PRODUCT_EDITS_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function createCatalogBackup(): CatalogBackupV1 {
  return {
    format: 'gallery-mazhari-catalog-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    queue: readArray(environment.storageKeys.stagingQueue),
    published: readArray(environment.storageKeys.publishedProducts),
    catalogProducts: getAllCatalogProducts(),
    productEdits: readEdits()
  };
}

export function downloadCatalogBackup(): void {
  const backup = createCatalogBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gallery-mazhari-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCatalogExcel(): void {
  const backup = createCatalogBackup();
  const workbook = XLSX.utils.book_new();
  const catalogRows = backup.catalogProducts.map(product => ({
    'شناسه': product.id,
    'نام محصول': product.name,
    'دسته': product.categorySlug,
    'کالکشن‌ها': (product.collectionSlugs || []).join(' | '),
    'برچسب نمایشی': product.tag,
    'توضیح کوتاه': product.description,
    'توضیحات تکمیلی': product.additionalDescription || '',
    'عنوان ویژگی اول': product.primaryAttributeLabel || '',
    'مقدار ویژگی اول': product.primaryAttributeValue || product.heelHeight || product.platformHeight || product.silhouette || '',
    'عنوان ویژگی دوم': product.secondaryAttributeLabel || '',
    'مقدار ویژگی دوم': product.secondaryAttributeValue || product.material || product.fabric || '',
    'سایز': product.size || '',
    'رنگ': product.color || '',
    'موجودی': product.stock ?? '',
    'کلید متغیر': product.variantKey || '',
    'جزئیات': product.highlights.join(' | '),
    'تصویر اصلی': product.image,
    'همه تصاویر': (product.gallery || []).join(' | ')
  }));
  const queueRows = backup.queue.map(item => ({
    'شناسه': item.id,
    'کد کالا': item.code,
    'نام': item.name,
    'دسته اصلی': item.parentCategory,
    'اسلاگ دسته اصلی': item.parentCategorySlug,
    'زیر دسته': item.category,
    'اسلاگ زیر دسته': item.categorySlug,
    'موجودی': item.stock,
    'سایز': item.size || '',
    'جنس': item.material || '',
    'ارتفاع پاشنه': item.heelHeight || '',
    'ارتفاع لژ': item.platformHeight || '',
    'کلید متغیر': item.variantKey || '',
    'تگ‌های داخلی': (item.hiddenTags || []).join(' | '),
    'وضعیت': item.status,
    'محصول جدید': item.isNewImport ? 'بله' : 'خیر',
    'یادداشت': item.notes || '',
    'تاریخ ورود': item.importedAt,
    'تاریخ پردازش': item.processedAt || '',
    'پردازش توسط': item.processedBy || '',
    'تاریخ انتشار': item.publishedAt || '',
    'انتشار توسط': item.publishedBy || '',
    'تصاویر': (item.photos || []).map(photo => photo.url).join(' | '),
    'نام فایل تصاویر': (item.photos || []).map(photo => photo.fileName).join(' | ')
  }));
  const publishedRows = backup.published.map(item => ({
    'شناسه': item.id,
    'کد کالا': item.code,
    'نام': item.name,
    'دسته اصلی': item.parentCategory,
    'زیر دسته': item.category,
    'موجودی': item.stock,
    'سایز': item.size || '',
    'تگ‌های داخلی': (item.hiddenTags || []).join(' | '),
    'وضعیت': item.status,
    'تصاویر': (item.photos || []).map(photo => photo.url).join(' | ')
  }));
  const editRows = Object.entries(backup.productEdits).map(([id, edit]) => ({
    'شناسه': id,
    'نام ویرایش‌شده': edit.name || '',
    'توضیح کوتاه': edit.description || '',
    'توضیحات تکمیلی': edit.additionalDescription || '',
    'عنوان ویژگی اول': edit.primaryAttributeLabel || '',
    'مقدار ویژگی اول': edit.primaryAttributeValue || '',
    'عنوان ویژگی دوم': edit.secondaryAttributeLabel || '',
    'مقدار ویژگی دوم': edit.secondaryAttributeValue || '',
    'جزئیات': (edit.highlights || []).join(' | '),
    'کالکشن‌ها': (edit.collectionSlugs || []).join(' | '),
    'تصاویر': (edit.gallery || []).join(' | ')
  }));
  const imageRows = backup.queue.flatMap(item =>
    (item.photos || []).map((photo, index) => ({
      'شناسه محصول': item.id,
      'کد کالا': item.code,
      'ترتیب': index + 1,
      'نام فایل': photo.fileName,
      'آدرس/داده تصویر': photo.url,
      'تاریخ افزودن': photo.addedAt
    }))
  );
  const append = (name: string, rows: Record<string, unknown>[]) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'اطلاعات': 'بدون داده' }]);
    sheet['!cols'] = Object.keys(rows[0] || { اطلاعات: '' }).map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };
  append('تمام محصولات', catalogRows);
  append('صف انتشار', queueRows);
  append('منتشر شده', publishedRows);
  append('تنظیمات ویرایشی', editRows);
  append('تصاویر', imageRows);
  append('راهنما', [{
    'فرمت': backup.format,
    'نسخه': backup.version,
    'تاریخ خروجی': backup.exportedAt,
    'توضیح': 'ستون‌های چندمقداری با علامت | جدا شده‌اند. برای بازیابی خودکار از فایل JSON پشتیبان استفاده کنید.'
  }]);
  XLSX.writeFile(workbook, `gallery-mazhari-products-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function readCatalogBackup(file: File): Promise<CatalogBackupV1> {
  if (!file.name.toLowerCase().endsWith('.json') || file.size > 100 * 1024 * 1024) {
    throw new Error('invalid_backup_file');
  }
  const parsed: unknown = JSON.parse(await file.text());
  if (!parsed || typeof parsed !== 'object') throw new Error('invalid_backup');
  const value = parsed as Partial<CatalogBackupV1>;
  if (
    value.format !== 'gallery-mazhari-catalog-backup' ||
    value.version !== 1 ||
    !Array.isArray(value.queue) ||
    !Array.isArray(value.published) ||
    !Array.isArray(value.catalogProducts)
  ) {
    throw new Error('unsupported_backup');
  }
  for (const item of [...value.queue, ...value.published]) {
    if (!item || typeof item.id !== 'string' || typeof item.code !== 'string' || typeof item.name !== 'string') {
      throw new Error('corrupt_product');
    }
  }
  return value as CatalogBackupV1;
}

export function applyCatalogBackupLocally(backup: CatalogBackupV1): void {
  const edits: Record<string, CatalogProductEdit> = { ...(backup.productEdits || {}) };
  for (const product of backup.catalogProducts) {
    if (!product?.id) continue;
    edits[product.id] = {
      name: product.name,
      description: product.description,
      additionalDescription: product.additionalDescription,
      primaryAttributeLabel: product.primaryAttributeLabel,
      primaryAttributeValue: product.primaryAttributeValue,
      secondaryAttributeLabel: product.secondaryAttributeLabel,
      secondaryAttributeValue: product.secondaryAttributeValue,
      highlights: product.highlights,
      gallery: product.gallery,
      image: product.image,
      collectionSlugs: product.collectionSlugs
    };
  }
  localStorage.setItem(environment.storageKeys.stagingQueue, JSON.stringify(backup.queue));
  localStorage.setItem(environment.storageKeys.publishedProducts, JSON.stringify(backup.published));
  localStorage.setItem(CATALOG_PRODUCT_EDITS_KEY, JSON.stringify(edits));
}
