/**
 * پل بین صف انتشار ادمین و ویترین سایت.
 * محصولاتی که مدیر منتشر می‌کند (status = published) از localStorage خوانده
 * و به شکل محصول قابل نمایش در کاتالوگ عمومی تبدیل می‌شوند.
 */

import { environment } from '@env/environment';
import type { StagingProduct } from '@shared/models/staging-product.model';
import type { BridalSampleProduct } from './bridal-collection-categories';

export interface PublishedCatalogProduct extends BridalSampleProduct {
  code: string;
  stock: number;
  parentCategorySlug: string;
  isNewImport?: boolean;
}

const FALLBACK_IMAGE = 'assets/images/cat-special.webp';

let cacheRaw: string | null = null;
let cacheProducts: PublishedCatalogProduct[] = [];

/**
 * محصولات منتشرشده و موجود (stock > 0).
 * منبع اصلی: کش سرور (PublishedCatalogSyncService آن را از API پر می‌کند)؛
 * صف انتشار محلی هم برای حالت آفلاین/فروش‌گاه تک‌دستگاهی ادغام می‌شود.
 * کش سبک روی محتوای localStorage تا فراخوانی‌های پیاپی هزینه‌ای نداشته باشند.
 */
export function getPublishedProducts(): PublishedCatalogProduct[] {
  try {
    const serverRaw = localStorage.getItem(environment.storageKeys.publishedProducts);
    const localRaw = localStorage.getItem(environment.storageKeys.stagingQueue);
    const combinedRaw = `${serverRaw ?? ''}|${localRaw ?? ''}`;

    if (combinedRaw === cacheRaw) {
      return cacheProducts;
    }

    const isLive = (item: StagingProduct) =>
      item.status === 'published' && (item.stock ?? 0) > 0;

    const serverItems = parseItems(serverRaw).filter(isLive);
    const seenCodes = new Set(serverItems.map((i) => i.code.toUpperCase()));
    const localOnly = parseItems(localRaw).filter(
      (i) => isLive(i) && !seenCodes.has(i.code.toUpperCase())
    );

    cacheProducts = [...serverItems, ...localOnly].map(toCatalogProduct);
    cacheRaw = combinedRaw;
    return cacheProducts;
  } catch {
    return [];
  }
}

function parseItems(raw: string | null): StagingProduct[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StagingProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getPublishedProductById(
  id: string
): PublishedCatalogProduct | undefined {
  return getPublishedProducts().find((p) => p.id === id);
}

/** محصولات منتشرشده مربوط به یک اسلاگ دسته یا زیردسته سایت */
export function publishedProductsForSlug(slug: string): PublishedCatalogProduct[] {
  return getPublishedProducts().filter(
    (p) => p.categorySlug === slug || p.parentCategorySlug === slug
  );
}

function toCatalogProduct(item: StagingProduct): PublishedCatalogProduct {
  const photos = (item.photos || [])
    .map((p) => p.url)
    .filter((url): url is string => !!url);
  const image = photos[0] || item.photoUrl || FALLBACK_IMAGE;

  return {
    id: item.id,
    code: item.code,
    stock: item.stock,
    name: item.name,
    categorySlug: item.categorySlug || item.parentCategorySlug || 'uncategorized',
    parentCategorySlug: item.parentCategorySlug || '',
    isNewImport: item.isNewImport,
    image,
    tag: item.isNewImport ? 'محصول جدید وارد شده' : item.parentCategory || item.category,
    description: `${item.name} — کد کالا ${item.code}، از موجودی واقعی فروشگاه گالری مظهری.`,
    silhouette: item.category,
    fabric: 'جزئیات تکمیلی در فروشگاه',
    highlights: [
      `کد کالا: ${item.code}`,
      `دسته: ${item.category}`,
      item.isNewImport ? 'محصول جدید وارد شده' : 'موجود در فروشگاه'
    ],
    gallery: photos.length ? photos : [image]
  };
}
