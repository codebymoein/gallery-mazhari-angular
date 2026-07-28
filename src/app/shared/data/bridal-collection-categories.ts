/**
 * Bridal & accessory product catalog — mock data for every category/subcategory.
 * Existing bridal dress samples are preserved; all other taxonomy slugs get generated luxury placeholders.
 */

import { CATALOG_CATEGORIES } from './catalog-categories';
import {
  getPublishedProductById,
  getPublishedProducts,
  publishedProductsForSlug
} from './published-products';

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
  gallery?: string[];
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
  for (let i = 1; i <= count; i++) {
    const prefix = NAME_PREFIXES[(i + subSlug.length) % NAME_PREFIXES.length];
    const suffix = NAME_SUFFIXES[(i * 3 + subSlug.length) % NAME_SUFFIXES.length];
    const img =
      i === 1
        ? preferredImage
        : PLACEHOLDER_IMAGES[(i + subSlug.charCodeAt(0)) % PLACEHOLDER_IMAGES.length];

    products.push({
      id: `${subSlug}-p${i}`,
      name: `${subLabel} ${prefix} ${suffix}`,
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
      if (existing.length >= 4) {
        continue;
      }
      const needed = 4 - existing.length;
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
export const BRIDAL_SAMPLE_PRODUCTS: BridalSampleProduct[] = buildAllProducts();

/** همه محصولات قابل نمایش سایت — منتشرشده‌های واقعی اول، سپس نمونه‌ها. */
export function getAllCatalogProducts(): BridalSampleProduct[] {
  return [...getPublishedProducts(), ...BRIDAL_SAMPLE_PRODUCTS];
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
    const dresses = BRIDAL_SAMPLE_PRODUCTS.filter(p => dressSlugs.has(p.categorySlug));
    const mock = dresses.length
      ? dresses
      : BRIDAL_SAMPLE_PRODUCTS.filter(p => p.categorySlug === slug);
    return [...published, ...mock];
  }
  return [
    ...publishedProductsForSlug(slug),
    ...BRIDAL_SAMPLE_PRODUCTS.filter(p => p.categorySlug === slug)
  ];
}

export function getBridalProductById(id: string): BridalSampleProduct | undefined {
  return getPublishedProductById(id) ?? BRIDAL_SAMPLE_PRODUCTS.find(p => p.id === id);
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
