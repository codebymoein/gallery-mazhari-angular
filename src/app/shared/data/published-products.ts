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
  originalPrice?: number;
  salePrice?: number;
  discountPercent?: number;
  discountTitle?: string;
  discountBadge?: string;
}

const FALLBACK_IMAGE = 'assets/images/cat-special.webp';

const LEGACY_CATEGORY_SLUGS: Record<string, string> = {
  'simple-veil': 'european-bridal-veils',
  'short-veil': 'european-bridal-veils',
  'decorated-veil': 'arabic-bridal-veils',
  'long-veil': 'arabic-bridal-veils',
  'rose-bouquet': 'bridal-bouquets',
  'mixed-bouquet': 'bridal-bouquets',
  'orchid-bouquet': 'bridal-bouquets',
  'white-bouquet': 'bridal-bouquets',
  'bridal-flower-boxes': 'special-bridal-accessories',
  'bridal-fans': 'special-bridal-accessories',
  'bridal-glasses': 'special-bridal-accessories',
  'bridal-umbrella': 'special-bridal-accessories'
};

function currentCategorySlug(slug: string | undefined): string {
  if (!slug) return 'uncategorized';
  return LEGACY_CATEGORY_SLUGS[slug] || slug;
}

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

    cacheProducts = [...serverItems, ...localOnly]
      .flatMap(expandStagingVariations)
      .map(toCatalogProduct);
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
  const key = id.trim().toUpperCase();
  return getPublishedProducts().find(
    (p) => p.id === id || p.code.trim().toUpperCase() === key
  );
}

function expandStagingVariations(item: StagingProduct): StagingProduct[] {
  // A variable product has one catalog identity. Its sizes/colors remain
  // selectable variations inside the product page, never separate cards.
  return [item];
}

export function getStagedProductById(id: string): PublishedCatalogProduct | undefined {
  try {
    const serverRaw = localStorage.getItem(environment.storageKeys.publishedProducts);
    const localRaw = localStorage.getItem(environment.storageKeys.stagingQueue);
    const item = [...parseItems(serverRaw), ...parseItems(localRaw)].find(row => row.id === id);
    return item ? toCatalogProduct(item) : undefined;
  } catch {
    return undefined;
  }
}

/** محصولات منتشرشده مربوط به یک اسلاگ دسته یا زیردسته سایت */
export function publishedProductsForSlug(slug: string): PublishedCatalogProduct[] {
  return getPublishedProducts().filter(
    (p) => p.categorySlug === slug || p.parentCategorySlug === slug
  );
}

export function toCatalogProduct(item: StagingProduct): PublishedCatalogProduct {
  const photos = (item.photos || [])
    .map((p) => p.url)
    .filter((url): url is string => !!url);
  const image = photos[0] || item.photoUrl || FALLBACK_IMAGE;
  const isShoes = item.categorySlug === 'bridal-shoes';
  const isSneakers = item.categorySlug === 'bridal-sneakers';
  const material = item.material || undefined;
  const categorySlug = currentCategorySlug(item.categorySlug || item.parentCategorySlug);
  const inferredHeight = inferFootwearHeight(item.name);
  const heelHeight = item.heelHeight || (categorySlug === 'bridal-shoes' ? inferredHeight : undefined);
  const platformHeight = item.platformHeight || (categorySlug === 'bridal-sneakers' ? inferredHeight : undefined);

  const silhouette = isShoes
    ? heelHeight || '—'
    : isSneakers
      ? platformHeight || '—'
      : item.category;
  const fabric = isShoes || isSneakers
    ? material || '—'
    : 'جزئیات تکمیلی در فروشگاه';

  const highlights = [
    `کد کالا: ${item.code}`,
    `دسته: ${item.category}`,
    item.size ? `سایز: ${item.size}` : '',
    item.isNewImport ? 'محصول جدید وارد شده' : 'موجود در فروشگاه'
  ].filter(Boolean);

  return {
    id: item.id,
    code: item.code,
    stock: item.stock,
    price: item.price,
    originalPrice: item.originalPrice,
    salePrice: item.salePrice,
    discountPercent: item.discountPercent,
    discountTitle: item.discountTitle,
    discountBadge: item.discountBadge,
    name: item.name,
    categorySlug,
    parentCategorySlug: item.parentCategorySlug || '',
    isNewImport: item.isNewImport,
    image,
    tag: item.isNewImport ? 'محصول جدید وارد شده' : item.parentCategory || item.category,
    description: `${item.name} — کد کالا ${item.code}، از موجودی واقعی فروشگاه گالری مظهری.`,
    silhouette,
    fabric,
    size: item.size,
    color: item.color,
    material,
    heelHeight,
    platformHeight,
    variations: item.variations?.map(variation => ({ ...variation })),
    variantKey:
      item.variantKey ||
      `${categorySlug}::${item.name.trim().toLowerCase()}`,
    highlights,
    gallery: photos.length ? photos : [image]
  };
}

function inferFootwearHeight(name: string): string | undefined {
  const model = name.trim().split(/\s+/)[0] || '';
  const match = /-(\d+(?:[.,]\d+)?)$/.exec(model);
  return match ? `${match[1].replace(',', '.')} سانتی‌متر` : undefined;
}
