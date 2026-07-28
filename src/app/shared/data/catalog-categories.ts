/**
 * Canonical catalog taxonomy — 9 main categories + subcategories.
 * Shared by mobile menu, desktop mega-menu, and homepage showcase.
 */

export interface CatalogSubcategory {
  label: string;
  slug: string;
  icon?: string;
  image?: string;
}

const SUBCATEGORY_IMAGE_POOL = [
  '/assets/images/cat-bridal-clothing.webp',
  '/assets/images/home-hero-bride.webp',
  '/assets/images/cat-hair-accessories.webp',
  '/assets/images/cat-jewelry.webp',
  '/assets/images/cat-shoes.webp',
  '/assets/images/cat-veil.webp',
  '/assets/images/cat-headwear.webp',
  '/assets/images/cat-bouquet.webp',
  '/assets/images/cat-special.webp',
  '/assets/images/cat-engagement.webp',
  '/assets/images/bridal-hair-accessories.webp',
  '/assets/images/home-complete-selection.webp'
] as const;

function assignSubcategoryImages(categories: CatalogCategory[]): void {
  let index = 0;
  for (const category of categories) {
    for (const sub of category.subcategories) {
      sub.image = SUBCATEGORY_IMAGE_POOL[index % SUBCATEGORY_IMAGE_POOL.length];
      index += 1;
    }
  }
}

export interface CatalogCategory {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  image: string;
  span: 'large' | 'medium' | 'small';
  subcategories: CatalogSubcategory[];
}

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: 'bridal-clothing',
    title: 'پوشاک عروس',
    subtitle: 'THE BRIDAL COLLECTION',
    slug: 'bridal-clothing',
    image: '/assets/images/cat-bridal-clothing.webp',
    span: 'large',
    subcategories: [
      { label: 'لباس عروس اروپایی', slug: 'european-bridal-dresses', icon: '👗' },
      { label: 'لباس عروس عربی', slug: 'arabic-bridal-dresses', icon: '✨' },
      { label: 'لباس عروس مدل ماهی', slug: 'mermaid-bridal-dresses', icon: '🐚' },
      { label: 'لباس نامزدی', slug: 'engagement-dresses', icon: '💐' },
      { label: 'کت‌وشلوار عقد', slug: 'ceremony-suits', icon: '🎩' },
      { label: 'روبدوشامبر عروس', slug: 'bridal-robes', icon: '🛁' },
      { label: 'شنل عروس', slug: 'bridal-capes', icon: '🌸' },
      { label: 'دستکش عروس', slug: 'bridal-gloves', icon: '💎' },
    ]
  },
  {
    id: 'hair-accessories',
    title: 'اکسسوری مو',
    subtitle: 'HAIR & CROWN',
    slug: 'bridal-hair-accessories',
    image: '/assets/images/cat-hair-accessories.webp',
    span: 'large',
    subcategories: [
      { label: 'تاج عروس', slug: 'bridal-tiaras', icon: '👑' },
      { label: 'تل عروس', slug: 'bridal-headbands', icon: '💍' },
      { label: 'ریسه وارداتی', slug: 'imported-hairpiece', icon: '🌟' },
      { label: 'ریسه ایرانی', slug: 'persian-hairpiece', icon: '🌺' },
      { label: 'سنجاق شینیون', slug: 'chignon-pins', icon: '📌' },
      { label: 'حلقه گل', slug: 'flower-rings', icon: '🌸' },
    ]
  },
  {
    id: 'jewelry',
    title: 'زیورآلات',
    subtitle: 'FINE JEWELLERY',
    slug: 'bridal-jewelry',
    image: '/assets/images/cat-jewelry.webp',
    span: 'medium',
    subcategories: [
      { label: 'سرویس کامل', slug: 'full-jewelry-set', icon: '💍' },
      { label: 'نیم‌ست', slug: 'half-set', icon: '✨' },
      { label: 'گوشواره', slug: 'earrings', icon: '💎' },
      { label: 'انگشتر', slug: 'rings', icon: '💫' },
      { label: 'پابند', slug: 'anklets', icon: '🦋' },
      { label: 'دستبند', slug: 'bracelets', icon: '⭐' },
      { label: 'سنجاق سینه', slug: 'brooches', icon: '🌹' },
    ]
  },
  {
    id: 'shoes-bags',
    title: 'کفش، کتونی و کیف',
    subtitle: 'SHOES & BAGS',
    slug: 'bridal-shoes-bags',
    image: '/assets/images/cat-shoes.webp',
    span: 'medium',
    subcategories: [
      { label: 'کفش عروس', slug: 'bridal-shoes', icon: '👠' },
      { label: 'کتونی عروس', slug: 'bridal-sneakers', icon: '👟' },
      { label: 'کیف عروس', slug: 'bridal-bags', icon: '👜' },
    ]
  },
  {
    id: 'veil',
    title: 'تور سر',
    subtitle: 'BRIDAL VEIL',
    slug: 'bridal-veils',
    image: '/assets/images/cat-veil.webp',
    span: 'small',
    subcategories: [
      { label: 'تور ساده', slug: 'simple-veil', icon: '🤍' },
      { label: 'تور تزئینی', slug: 'decorated-veil', icon: '✨' },
      { label: 'تور بلند', slug: 'long-veil', icon: '🌊' },
      { label: 'تور کوتاه', slug: 'short-veil', icon: '🕊️' },
    ]
  },
  {
    id: 'headwear',
    title: 'حجاب مو',
    subtitle: 'HEADWEAR',
    slug: 'bridal-headwear',
    image: '/assets/images/cat-headwear.webp',
    span: 'small',
    subcategories: [
      { label: 'کلاه و کاپ‌کلاه', slug: 'bridal-hat', icon: '🎩' },
      { label: 'چادر عروس', slug: 'bridal-chador', icon: '🤍' },
      { label: 'توربان', slug: 'turban', icon: '🌸' },
      { label: 'هدشال', slug: 'headscarf', icon: '✨' },
    ]
  },
  {
    id: 'bouquet',
    title: 'دسته‌گل مصنوعی',
    subtitle: 'BRIDAL BOUQUETS',
    slug: 'bridal-bouquets',
    image: '/assets/images/cat-bouquet.webp',
    span: 'small',
    subcategories: [
      { label: 'دسته‌گل رز', slug: 'rose-bouquet', icon: '🌹' },
      { label: 'دسته‌گل مختلط', slug: 'mixed-bouquet', icon: '💐' },
      { label: 'دسته‌گل ارکیده', slug: 'orchid-bouquet', icon: '🌺' },
      { label: 'دسته‌گل سفید', slug: 'white-bouquet', icon: '🤍' },
    ]
  },
  {
    id: 'special',
    title: 'اکسسوری خاص عروس',
    subtitle: 'SPECIAL ACCESSORIES',
    slug: 'special-bridal-accessories',
    image: '/assets/images/cat-special.webp',
    span: 'small',
    subcategories: [
      { label: 'باکس گل', slug: 'bridal-flower-boxes', icon: '🎁' },
      { label: 'بادبزن عروس', slug: 'bridal-fans', icon: '🌬️' },
      { label: 'عینک عروس', slug: 'bridal-glasses', icon: '🕶️' },
      { label: 'چتر عروس', slug: 'bridal-umbrella', icon: '☂️' },
    ]
  },
  {
    id: 'engagement',
    title: 'ملزومات عقد و بله‌برون',
    subtitle: 'CEREMONY ESSENTIALS',
    slug: 'engagement-ceremony-essentials',
    image: '/assets/images/cat-engagement.webp',
    span: 'medium',
    subcategories: [
      { label: 'ست بله‌برون', slug: 'baleh-boron-set', icon: '🎀' },
      { label: 'سبد سه‌سایز', slug: 'three-size-basket', icon: '🧺' },
      { label: 'ملزومات عقد', slug: 'engagement-items', icon: '💍' },
    ]
  }
];

assignSubcategoryImages(CATALOG_CATEGORIES);

/** Bridal clothing (first main category). */
export const BRIDAL_CLOTHING_CATEGORY = CATALOG_CATEGORIES[0];

/** Accessory store categories (the other 8). */
export const ACCESSORY_STORE_CATEGORIES = CATALOG_CATEGORIES.slice(1);

export function getCatalogCategoryBySlug(slug: string): CatalogCategory | undefined {
  return CATALOG_CATEGORIES.find(category => category.slug === slug);
}

export function getSubcategory(
  parentSlug: string,
  subSlug: string
): CatalogSubcategory | undefined {
  const category = getCatalogCategoryBySlug(parentSlug);
  return category?.subcategories.find(sub => sub.slug === subSlug);
}

export function findCategoryForSubSlug(
  subSlug: string
): { category: CatalogCategory; sub: CatalogSubcategory } | undefined {
  for (const category of CATALOG_CATEGORIES) {
    const sub = category.subcategories.find(item => item.slug === subSlug);
    if (sub) {
      return { category, sub };
    }
  }
  return undefined;
}
