import { BadRequestException } from '@nestjs/common';

interface CanonicalSubcategory {
  label: string;
  slug: string;
}

interface CanonicalCategory {
  title: string;
  slug: string;
  subcategories: readonly CanonicalSubcategory[];
}

export const CANONICAL_CATALOG_TAXONOMY: readonly CanonicalCategory[] = [
  {
    title: 'پوشاک عروس',
    slug: 'bridal-clothing',
    subcategories: [
      { label: 'لباس عروس اروپایی', slug: 'european-bridal-dresses' },
      { label: 'لباس عروس عربی', slug: 'arabic-bridal-dresses' },
      { label: 'لباس عروس مدل ماهی', slug: 'mermaid-bridal-dresses' },
      { label: 'لباس نامزدی', slug: 'engagement-dresses' },
      { label: 'کت‌وشلوار عقد', slug: 'ceremony-suits' },
      { label: 'روبدوشامبر عروس', slug: 'bridal-robes' },
      { label: 'شنل عروس', slug: 'bridal-capes' },
      { label: 'دستکش عروس', slug: 'bridal-gloves' },
      { label: 'لباس زیر', slug: 'bridal-lingerie' },
    ],
  },
  {
    title: 'اکسسوری مو',
    slug: 'bridal-hair-accessories',
    subcategories: [
      { label: 'تاج عروس', slug: 'bridal-tiaras' },
      { label: 'تل عروس', slug: 'bridal-headbands' },
      { label: 'ریسه وارداتی', slug: 'imported-hairpiece' },
      { label: 'ریسه ایرانی', slug: 'persian-hairpiece' },
      { label: 'سنجاق شینیون', slug: 'chignon-pins' },
      { label: 'حلقه گل', slug: 'flower-rings' },
    ],
  },
  {
    title: 'زیورآلات',
    slug: 'bridal-jewelry',
    subcategories: [
      { label: 'سرویس کامل', slug: 'full-jewelry-set' },
      { label: 'نیم‌ست', slug: 'half-set' },
      { label: 'گوشواره', slug: 'earrings' },
      { label: 'انگشتر', slug: 'rings' },
      { label: 'پابند', slug: 'anklets' },
      { label: 'دستبند', slug: 'bracelets' },
      { label: 'سنجاق سینه', slug: 'brooches' },
    ],
  },
  {
    title: 'کفش، کتونی و کیف',
    slug: 'bridal-shoes-bags',
    subcategories: [
      { label: 'کفش عروس', slug: 'bridal-shoes' },
      { label: 'کتونی عروس', slug: 'bridal-sneakers' },
      { label: 'کیف عروس', slug: 'bridal-bags' },
      { label: 'جوراب عروس', slug: 'bridal-socks' },
      { label: 'اکسسوری کفش و کتونی', slug: 'bridal-footwear-accessories' },
    ],
  },
  {
    title: 'تورسر',
    slug: 'bridal-veils',
    subcategories: [
      { label: 'تورسر عربی', slug: 'arabic-bridal-veils' },
      { label: 'تورسر اروپایی', slug: 'european-bridal-veils' },
    ],
  },
  {
    title: 'حجاب مو',
    slug: 'bridal-headwear',
    subcategories: [
      { label: 'کلاه و کاپ‌کلاه', slug: 'bridal-hat' },
      { label: 'چادر عروس', slug: 'bridal-chador' },
      { label: 'توربان', slug: 'turban' },
      { label: 'هدشال', slug: 'headscarf' },
    ],
  },
  { title: 'دسته‌گل مصنوعی', slug: 'bridal-bouquets', subcategories: [] },
  {
    title: 'اکسسوری خاص عروس',
    slug: 'special-bridal-accessories',
    subcategories: [],
  },
  {
    title: 'ملزومات عقد و بله‌برون',
    slug: 'engagement-ceremony-essentials',
    subcategories: [
      { label: 'ست بله‌برون', slug: 'baleh-boron-set' },
      { label: 'سبد سه‌سایز', slug: 'three-size-basket' },
      { label: 'ملزومات عقد', slug: 'engagement-items' },
    ],
  },
] as const;

export interface CatalogClassification {
  category: string;
  categorySlug: string;
  parentCategory: string;
  parentCategorySlug: string;
}

export function assertCanonicalCatalogClassification(
  input: CatalogClassification,
): void {
  const parentSlug = input.parentCategorySlug.trim();
  const categorySlug = input.categorySlug.trim();
  const parent = CANONICAL_CATALOG_TAXONOMY.find(
    (candidate) => candidate.slug === parentSlug,
  );
  if (!parent || parent.title !== input.parentCategory.trim()) {
    throw new BadRequestException('catalog_parent_category_invalid');
  }

  if (categorySlug === parent.slug) {
    if (input.category.trim() !== parent.title) {
      throw new BadRequestException('catalog_category_invalid');
    }
    return;
  }

  const child = parent.subcategories.find(
    (candidate) => candidate.slug === categorySlug,
  );
  if (!child || child.label !== input.category.trim()) {
    throw new BadRequestException('catalog_category_invalid');
  }
}
