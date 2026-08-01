/**
 * Bridal & accessory product catalog — mock data for every category/subcategory.
 * Existing bridal dress samples are preserved; all other taxonomy slugs get generated luxury placeholders.
 */

import { CATALOG_CATEGORIES } from './catalog-categories';
import {
  getPublishedProductById,
  getStagedProductById,
  getPublishedProducts,
  publishedProductsForSlug
} from './published-products';
import { assetUrl } from '@shared/utils/asset-url';

export const BRIDAL_COLLECTION_CATEGORIES: BridalCollectionCategory[] = [
  {
    id: 'all-dresses',
    title: 'همه لباس‌ها',
    subtitle: 'ALL DRESSES',
    slug: 'bridal-clothing',
    image: 'assets/images/cat-bridal-clothing.webp',
    featured: true
  },
  {
    id: 'arabic',
    title: 'کالکشن عربی',
    subtitle: 'ARABIC COLLECTION',
    slug: 'arabic-bridal-dresses',
    image: 'assets/images/home-hero-bride.webp'
  },
  {
    id: 'european',
    title: 'کالکشن اروپایی',
    subtitle: 'EUROPEAN COLLECTION',
    slug: 'european-bridal-dresses',
    image: 'assets/images/cat-bridal-clothing.webp'
  },
  {
    id: 'mermaid',
    title: 'کالکشن ماهی',
    subtitle: 'MERMAID COLLECTION',
    slug: 'mermaid-bridal-dresses',
    image: 'assets/images/home-hero-bride.webp'
  },
  {
    id: 'engagement',
    title: 'کالکشن لباس نامزدی',
    subtitle: 'ENGAGEMENT COLLECTION',
    slug: 'engagement-dresses',
    image: 'assets/images/cat-engagement.webp'
  }
];

export interface BridalCollectionCategory {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image: string;
  featured?: boolean;
}

export interface BridalSampleProduct {
  id: string;
  name: string;
  categorySlug: string;
  image: string;
  tag: string;
  description: string;
  silhouette: string;
  fabric: string;
  highlights: string[];
  primaryAttributeLabel?: string;
  primaryAttributeValue?: string;
  secondaryAttributeLabel?: string;
  secondaryAttributeValue?: string;
  additionalDescription?: string;
  collectionSlugs?: string[];
  gallery?: string[];
  /** سایز فعلی این ردیف / SKU */
  size?: string;
  color?: string;
  /** موجودی از اکسل */
  stock?: number;
  /** قیمت واقعی فایل انبار، به ریال */
  price?: number;
  /** جنس رویه (کفش/کتونی) */
  material?: string;
  /** ارتفاع پاشنه (کفش) */
  heelHeight?: string;
  /** ارتفاع لژ (کتونی) */
  platformHeight?: string;
  /** گروه‌بندی متغیرهای سایز */
  variantKey?: string;
  /** واریانت‌های واقعی خوانده‌شده از فایل موجودی */
  variations?: Array<{
    id?: string;
    sku: string;
    barcode: string;
    size?: string;
    color?: string;
    material?: string;
    price?: number;
    stock: number;
    available: boolean;
  }>;
}

export interface ProductSizeOption {
  size: string;
  stock: number;
  productId: string;
  available: boolean;
}

export interface ProductVariationOption {
  label: string;
  stock: number;
  productId: string;
  available: boolean;
}

/** دسته‌هایی که درخواست مشاوره دارند */
export const CONSULTATION_CATEGORY_SLUGS = new Set([
  'european-bridal-dresses',
  'arabic-bridal-dresses',
  'mermaid-bridal-dresses',
  'engagement-dresses',
  'ceremony-suits',
  'bridal-clothing'
]);

export const SHOE_CATEGORY_SLUG = 'bridal-shoes';
export const SNEAKER_CATEGORY_SLUG = 'bridal-sneakers';

export function isConsultationCategory(slug: string): boolean {
  return CONSULTATION_CATEGORY_SLUGS.has(slug);
}

export function isFootwearCategory(slug: string): boolean {
  return slug === SHOE_CATEGORY_SLUG || slug === SNEAKER_CATEGORY_SLUG;
}

const PLACEHOLDER_IMAGES = [
  'assets/images/cat-bridal-clothing.webp',
  'assets/images/home-hero-bride.webp',
  'assets/images/cat-hair-accessories.webp',
  'assets/images/cat-jewelry.webp',
  'assets/images/cat-shoes.webp',
  'assets/images/cat-veil.webp',
  'assets/images/cat-headwear.webp',
  'assets/images/cat-bouquet.webp',
  'assets/images/cat-special.webp',
  'assets/images/cat-engagement.webp',
  'assets/images/bridal-hair-accessories.webp',
  'assets/images/home-complete-selection.webp'
];

const NAME_PREFIXES = [
  'رویای',
  'شکوه',
  'زرافشان',
  'مروارید',
  'نورا',
  'الماس',
  'سفیدبرفی',
  'طلایی'
];

const NAME_SUFFIXES = [
  'سلطنتی',
  'کلاسیک',
  'مدرن',
  'لوکس',
  'خاص',
  'شیک',
  'انحصاری',
  'ویژه'
];

/** Hand-crafted bridal dress samples (preserved). */
const HANDCRAFTED_BRIDAL: BridalSampleProduct[] = [
  {
    id: 'd-01',
    name: 'مدل رویای عاجی',
    categorySlug: 'european-bridal-dresses',
    image: 'assets/images/cat-bridal-clothing.webp',
    tag: 'اروپایی',
    description:
      'لباسی با خطوط نرم اروپایی و جزئیات ظریف دانتل که برای مراسم شامگاهی و فضای کلاسیک طراحی شده است.',
    silhouette: 'A-line نرم',
    fabric: 'ساتن عاجی و دانتل فرانسوی',
    highlights: ['یقه قایقی ظریف', 'دامن پرچین کنترل‌شده', 'بندهای جداشدنی']
  },
  {
    id: 'd-02',
    name: 'مدل نور پاریس',
    categorySlug: 'european-bridal-dresses',
    image: 'assets/images/home-hero-bride.webp',
    tag: 'اروپایی',
    description:
      'ترکیبی از سادگی پاریسی و درخشش ملایم مروارید. مناسب عروسی‌هایی با نور طبیعی و فضای روشن.',
    silhouette: 'Fitted waist با دامن روان',
    fabric: 'کرپ سبک و تور شفاف',
    highlights: ['کمر مشخص', 'پشت دکمه‌ای', 'درخشش مروارید نقطه‌ای']
  },
  {
    id: 'd-03',
    name: 'مدل شکوه عربی',
    categorySlug: 'arabic-bridal-dresses',
    image: 'assets/images/home-hero-bride.webp',
    tag: 'عربی',
    description:
      'طراحی با حجم باشکوه و جزئیات طلایی برای مراسم‌هایی که حضور پررنگ و جلوه‌ای مجلل می‌خواهند.',
    silhouette: 'بالونی سلطنتی',
    fabric: 'تور سنگین با گلدوزی طلایی',
    highlights: ['گلدوزی دستی', 'آستین بلند حجیم', 'دامن چندلایه']
  },
  {
    id: 'd-04',
    name: 'مدل دربار طلایی',
    categorySlug: 'arabic-bridal-dresses',
    image: 'assets/images/cat-bridal-clothing.webp',
    tag: 'عربی',
    description:
      'الهام‌گرفته از لباس‌های درباری با تمرکز روی یقه بسته و نقش‌مایه‌های طلایی.',
    silhouette: 'بالاتنه بسته، دامن پف‌دار',
    fabric: 'مخمل سبک و تور طلایی',
    highlights: ['یقه ایستاده', 'کمربند جداشونده', 'درخشش گرم طلایی']
  },
  {
    id: 'd-05',
    name: 'مدل نجوای مروارید',
    categorySlug: 'mermaid-bridal-dresses',
    image: 'assets/images/home-hero-bride.webp',
    tag: 'ماهی',
    description:
      'فرم ماهی با تأکید بر خط بدن و بازشدگی ملایم از زانو. جزئیات مروارید در حرکت بازی نور ایجاد می‌کنند.',
    silhouette: 'Mermaid کلاسیک',
    fabric: 'کرپ کشی و تور مرواریددوزی',
    highlights: ['فرم بدن‌نما', 'دم ماهی روان', 'مرواریدکاری پراکنده']
  },
  {
    id: 'd-06',
    name: 'مدل موج نقره‌ای',
    categorySlug: 'mermaid-bridal-dresses',
    image: 'assets/images/cat-bridal-clothing.webp',
    tag: 'ماهی',
    description:
      'سایه‌روشن نقره‌ای روی پارچه باعث می‌شود لباس در نور سالن بدرخشد بدون اینکه سنگین به نظر برسد.',
    silhouette: 'Mermaid نرم',
    fabric: 'ساتن براق و لایه تور نقره‌ای',
    highlights: ['براقیت کنترل‌شده', 'زیپ مخفی پشت', 'دم لباس سبک']
  },
  {
    id: 'd-07',
    name: 'مدل بانوی نامزدی',
    categorySlug: 'engagement-dresses',
    image: 'assets/images/cat-engagement.webp',
    tag: 'نامزدی',
    description:
      'لباسی سبک‌تر از لباس عروس اصلی، مناسب بله‌برون و نامزدی با جزئیات گل‌دوزی ظریف.',
    silhouette: 'Midi A-line',
    fabric: 'توری لطیف و آستر ابریشمی',
    highlights: ['قد میدی', 'گل‌دوزی ظریف', 'آستین کوتاه']
  },
  {
    id: 'd-08',
    name: 'مدل شکوفه بهاری',
    categorySlug: 'engagement-dresses',
    image: 'assets/images/cat-engagement.webp',
    tag: 'نامزدی',
    description:
      'با الهام از شکوفه‌های بهاری، این مدل حس شاد و سبک دارد. مناسب مهمانی‌های روز و فضای باز.',
    silhouette: 'Flowy tea-length',
    fabric: 'شیفون سبک و دانتل گل‌دار',
    highlights: ['دامن روان', 'رنگ عاجی روشن', 'کمربند پارچه‌ای']
  }
];

function generateProductsForSub(
  subSlug: string,
  subLabel: string,
  parentTitle: string,
  preferredImage: string,
  count: number
): BridalSampleProduct[] {
  const products: BridalSampleProduct[] = [];
  const isShoes = subSlug === SHOE_CATEGORY_SLUG;
  const isSneakers = subSlug === SNEAKER_CATEGORY_SLUG;
  const footwearSizes = ['36', '37', '38', '39', '40', '41', '42'];

  for (let i = 1; i <= count; i++) {
    const prefix = NAME_PREFIXES[(i + subSlug.length) % NAME_PREFIXES.length];
    const suffix = NAME_SUFFIXES[(i * 3 + subSlug.length) % NAME_SUFFIXES.length];
    const img =
      i === 1
        ? preferredImage
        : PLACEHOLDER_IMAGES[(i + subSlug.charCodeAt(0)) % PLACEHOLDER_IMAGES.length];
    const baseName = `${subLabel} ${prefix} ${suffix}`;
    const variantKey = `${subSlug}::${baseName}`;

    if (isShoes || isSneakers) {
      // هر مدل کفش/کتونی چند سایز با موجودی جدا دارد
      for (let s = 0; s < footwearSizes.length; s++) {
        const size = footwearSizes[s];
        const stock = ((i + s) % 4) + 1;
        products.push({
          id: `${subSlug}-p${i}-s${size}`,
          name: baseName,
          categorySlug: subSlug,
          image: img,
          tag: parentTitle,
          description: `${subLabel} از مجموعه لوکس گالری مظهری — انتخاب سایز و موجودی بر اساس انبار.`,
          silhouette: isShoes ? '۸ سانتی' : '۴ سانتی',
          fabric: isShoes ? 'ساتن براق' : 'چرم مصنوعی',
          material: isShoes ? 'ساتن براق' : 'چرم مصنوعی',
          heelHeight: isShoes ? '۸ سانتی' : undefined,
          platformHeight: isSneakers ? '۴ سانتی' : undefined,
          size,
          stock,
          variantKey,
          highlights: [
            `سایز ${size}`,
            isShoes ? 'ارتفاع پاشنه: ۸ سانتی' : 'ارتفاع لژ: ۴ سانتی',
            'موجودی از انبار گالری مظهری'
          ],
          gallery: [img, PLACEHOLDER_IMAGES[(i + 2) % PLACEHOLDER_IMAGES.length]]
        });
      }
      continue;
    }

    products.push({
      id: `${subSlug}-p${i}`,
      name: baseName,
      categorySlug: subSlug,
      image: img,
      tag: parentTitle,
      description: `${subLabel} از مجموعه لوکس گالری مظهری — طراحی‌شده برای هماهنگی کامل با استایل عروس و جزئیات مراسم شما.`,
      silhouette: 'طراحی اختصاصی',
      fabric: 'متریال لوکس منتخب',
      highlights: ['کیفیت گالری مظهری', 'جزئیات دستی', 'مناسب مراسم خاص'],
      gallery: [img, PLACEHOLDER_IMAGES[(i + 2) % PLACEHOLDER_IMAGES.length]]
    });
  }
  return products;
}

function buildAllProducts(): BridalSampleProduct[] {
  const bySlug = new Map<string, BridalSampleProduct[]>();

  // Seed handcrafted bridal dresses
  for (const p of HANDCRAFTED_BRIDAL) {
    const list = bySlug.get(p.categorySlug) ?? [];
    list.push(p);
    bySlug.set(p.categorySlug, list);
  }

  // Ensure every taxonomy subcategory has at least 4 products
  for (const cat of CATALOG_CATEGORIES) {
    for (const sub of cat.subcategories) {
      const existing = bySlug.get(sub.slug) ?? [];
      const uniqueCount = new Set(
        existing.map(p => p.variantKey || p.id)
      ).size;
      if (uniqueCount >= 4) {
        continue;
      }
      const needed = 4 - uniqueCount;
      const generated = generateProductsForSub(
        sub.slug,
        sub.label,
        cat.title,
        sub.image || cat.image,
        needed
      );
      bySlug.set(sub.slug, [...existing, ...generated]);
    }
  }

  // Also ensure parent category slugs (when browsed as category filter) have products
  for (const cat of CATALOG_CATEGORIES) {
    if (!bySlug.has(cat.slug) || (bySlug.get(cat.slug)?.length ?? 0) === 0) {
      const childProducts = cat.subcategories.flatMap(
        sub => bySlug.get(sub.slug) ?? []
      );
      if (childProducts.length) {
        bySlug.set(cat.slug, childProducts.slice(0, 12));
      } else {
        bySlug.set(
          cat.slug,
          generateProductsForSub(cat.slug, cat.title, cat.title, cat.image, 4)
        );
      }
    }
  }

  return Array.from(bySlug.values()).flat();
}

/** Full mock catalog — every category & subcategory has products. */
/** Legacy fixture export kept for type compatibility; test products are disabled. */
export const BRIDAL_SAMPLE_PRODUCTS: BridalSampleProduct[] =
  environmentForFixturesOnly() ? buildAllProducts() : [];

function environmentForFixturesOnly(): boolean {
  return false;
}

/** Runtime catalog: server-backed published products only. */
export function getAllCatalogProducts(): BridalSampleProduct[] {
  return applyCatalogEdits(getPublishedProducts());
}

export function productsForCategory(slug: string): BridalSampleProduct[] {
  if (slug === 'bridal-clothing') {
    // All bridal dress products across dress subcategories
    const dressSlugs = new Set(
      (CATALOG_CATEGORIES.find(c => c.slug === 'bridal-clothing')?.subcategories ?? []).map(
        s => s.slug
      )
    );
    const published = getPublishedProducts().filter(
      p => dressSlugs.has(p.categorySlug) || p.parentCategorySlug === slug
    );
    return applyCatalogEdits(dedupeVariantProducts(published));
  }
  return applyCatalogEdits(dedupeVariantProducts([
    ...publishedProductsForSlug(slug)
  ]));
}

/** Category relationships used to complete a bridal look. */
const COMPLEMENTARY_CATEGORY_RELATIONS: Record<string, string[]> = {
  'bridal-shoes': ['bridal-footwear-accessories', 'bridal-bags', 'anklets'],
  'bridal-sneakers': ['bridal-footwear-accessories', 'bridal-bags', 'anklets'],
  'bridal-bags': ['bridal-shoes', 'bridal-sneakers', 'bridal-footwear-accessories'],
  'bridal-footwear-accessories': ['bridal-shoes', 'bridal-sneakers', 'bridal-bags'],
  'bridal-tiaras': ['earrings', 'european-bridal-veils', 'bridal-headbands'],
  'bridal-headbands': ['earrings', 'arabic-bridal-veils', 'bridal-tiaras'],
  'imported-hairpiece': ['earrings', 'european-bridal-veils', 'bridal-tiaras'],
  'persian-hairpiece': ['earrings', 'arabic-bridal-veils', 'bridal-tiaras'],
  'chignon-pins': ['earrings', 'european-bridal-veils', 'bridal-tiaras'],
  'arabic-bridal-veils': ['bridal-gloves', 'bridal-tiaras', 'chignon-pins'],
  'european-bridal-veils': ['bridal-gloves', 'bridal-tiaras', 'earrings'],
  'full-jewelry-set': ['bridal-tiaras', 'bridal-headbands', 'bridal-bags'],
  'half-set': ['bridal-tiaras', 'bridal-headbands', 'bracelets'],
  'earrings': ['bridal-tiaras', 'bridal-headbands', 'chignon-pins'],
  'rings': ['bracelets', 'half-set', 'bridal-bags'],
  'bracelets': ['rings', 'earrings', 'half-set'],
  'anklets': ['bridal-shoes', 'bridal-sneakers', 'bracelets'],
  'brooches': ['bridal-bouquets', 'bridal-capes', 'bridal-bags'],
  'bridal-gloves': ['arabic-bridal-veils', 'european-bridal-veils', 'bridal-tiaras'],
  'bridal-robes': ['bridal-shoes', 'bridal-gloves', 'bridal-hair-accessories'],
  'bridal-capes': ['bridal-gloves', 'european-bridal-veils', 'brooches'],
  'ceremony-suits': ['bridal-shoes', 'bridal-bags', 'earrings']
};

const PARENT_COMPLEMENTS: Record<string, string[]> = {
  'bridal-clothing': ['bridal-veils', 'bridal-shoes', 'bridal-hair-accessories', 'bridal-jewelry'],
  'bridal-hair-accessories': ['earrings', 'bridal-veils', 'bridal-clothing'],
  'bridal-jewelry': ['bridal-tiaras', 'bridal-bags', 'bridal-clothing'],
  'bridal-shoes-bags': ['bridal-footwear-accessories', 'bridal-jewelry', 'bridal-clothing'],
  'bridal-veils': ['bridal-gloves', 'bridal-tiaras', 'bridal-clothing'],
  'bridal-headwear': ['brooches', 'earrings', 'bridal-clothing'],
  'bridal-bouquets': ['brooches', 'bridal-gloves', 'bridal-bags'],
  'special-bridal-accessories': ['bridal-bags', 'bridal-jewelry', 'bridal-bouquets'],
  'engagement-ceremony-essentials': ['bridal-jewelry', 'bridal-bouquets', 'special-bridal-accessories']
};

export function complementaryProductsFor(
  product: BridalSampleProduct,
  limit = 8
): BridalSampleProduct[] {
  const parent = CATALOG_CATEGORIES.find(category =>
    category.slug === product.categorySlug ||
    category.subcategories.some(sub => sub.slug === product.categorySlug)
  );
  const targetSlugs =
    COMPLEMENTARY_CATEGORY_RELATIONS[product.categorySlug] ||
    (parent ? PARENT_COMPLEMENTS[parent.slug] : undefined) ||
    ['bridal-jewelry', 'bridal-shoes-bags', 'bridal-hair-accessories'];

  return dedupeVariantProducts(targetSlugs.flatMap(slug => productsForCategory(slug)))
    .filter(item => item.id !== product.id)
    .slice(0, limit);
}

/** در لیست فروشگاه فقط یک کارت برای هر مدل (نه هر سایز) نشان بده. */
function dedupeVariantProducts(products: BridalSampleProduct[]): BridalSampleProduct[] {
  const seen = new Set<string>();
  const result: BridalSampleProduct[] = [];
  for (const product of products) {
    const key = product.variantKey || product.id;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(product);
  }
  return result;
}

/** سایزهای موجود یک مدل از اکسل / کاتالوگ */
export function getSizeOptionsForProduct(product: BridalSampleProduct): ProductSizeOption[] {
  if (!isFootwearCategory(product.categorySlug)) {
    return [];
  }

  const key = product.variantKey || `${product.categorySlug}::${product.name}`;
  const siblings = getAllCatalogProducts().filter(
    p =>
      p.categorySlug === product.categorySlug &&
      (p.variantKey === key || (!p.variantKey && p.name === product.name))
  );

  const bySize = new Map<string, ProductSizeOption>();
  for (const variation of product.variations ?? []) {
    const size = (variation.size || '').trim();
    if (!size) continue;
    bySize.set(size, {
      size,
      stock: variation.stock,
      productId: variation.id || product.id,
      available: variation.available && variation.stock > 0
    });
  }
  for (const sibling of siblings) {
    const size = (sibling.size || '').trim();
    if (!size) {
      continue;
    }
    const stock = sibling.stock ?? 1;
    const prev = bySize.get(size);
    if (!prev || stock > prev.stock) {
      bySize.set(size, {
        size,
        stock,
        productId: sibling.id,
        available: stock > 0
      });
    }
  }

  return Array.from(bySize.values()).sort((a, b) =>
    a.size.localeCompare(b.size, 'fa', { numeric: true })
  );
}

/** متغیرهای غیرکفش (رنگ، سپس سایز یا جنس) برای منوی انتخاب صفحه محصول. */
export function getVariationOptionsForProduct(
  product: BridalSampleProduct
): ProductVariationOption[] {
  if (isFootwearCategory(product.categorySlug) || !product.variantKey) return [];
  const siblings = getAllCatalogProducts().filter(
    item => item.categorySlug === product.categorySlug && item.variantKey === product.variantKey
  );
  if (siblings.length < 2) return [];
  const options = siblings
    .map(item => ({
      label: (item.color || item.size || item.material || '').trim(),
      stock: item.stock ?? 0,
      productId: item.id,
      available: (item.stock ?? 0) > 0
    }))
    .filter(option => option.label);
  return [...new Map(options.map(option => [option.label, option])).values()];
}

export function getBridalProductById(id: string): BridalSampleProduct | undefined {
  const product = getPublishedProductById(id);
  return product ? applyCatalogEdit(product) : undefined;
}

export function getBridalPreviewProductById(id: string): BridalSampleProduct | undefined {
  const product = getStagedProductById(id) ?? getBridalProductById(id);
  return product ? applyCatalogEdit(product) : undefined;
}

export interface CatalogProductEdit {
  name?: string;
  description?: string;
  additionalDescription?: string;
  primaryAttributeLabel?: string;
  primaryAttributeValue?: string;
  secondaryAttributeLabel?: string;
  secondaryAttributeValue?: string;
  highlights?: string[];
  gallery?: string[];
  image?: string;
  collectionSlugs?: string[];
}

export const CATALOG_PRODUCT_EDITS_KEY = 'mazhari_catalog_product_edits_v1';

export function loadCatalogProductEdits(): Record<string, CatalogProductEdit> {
  try {
    const value = JSON.parse(localStorage.getItem(CATALOG_PRODUCT_EDITS_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

export function saveCatalogProductEdit(id: string, edit: CatalogProductEdit): void {
  const edits = loadCatalogProductEdits();
  edits[id] = edit;
  localStorage.setItem(CATALOG_PRODUCT_EDITS_KEY, JSON.stringify(edits));
}

function applyCatalogEdit(product: BridalSampleProduct): BridalSampleProduct {
  const edit = loadCatalogProductEdits()[product.id];
  if (!edit) {
    return {
      ...product,
      image: assetUrl(product.image),
      gallery: product.gallery?.map(assetUrl)
    };
  }
  const gallery = edit.gallery?.filter(Boolean);
  return {
    ...product,
    ...edit,
    gallery: (gallery?.length ? gallery : product.gallery)?.map(assetUrl),
    image: assetUrl(gallery?.[0] || edit.image || product.image)
  };
}

function applyCatalogEdits(products: BridalSampleProduct[]): BridalSampleProduct[] {
  return products.map(applyCatalogEdit);
}

export function getBridalCategoryBySlug(slug: string): BridalCollectionCategory | undefined {
  return BRIDAL_COLLECTION_CATEGORIES.find(c => c.slug === slug);
}

/** Resolve parent catalog category title for a product's subcategory slug. */
export function getParentCategoryForProductSlug(subSlug: string): string | undefined {
  for (const cat of CATALOG_CATEGORIES) {
    if (cat.slug === subSlug) return cat.title;
    if (cat.subcategories.some(s => s.slug === subSlug)) return cat.title;
  }
  return undefined;
}
