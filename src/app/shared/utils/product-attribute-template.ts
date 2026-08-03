export interface ProductAttributeTemplate {
  primary: string;
  secondary: string;
}

const DRESS_SLUGS = new Set([
  'bridal-clothing', 'european-bridal-dresses', 'arabic-bridal-dresses',
  'mermaid-bridal-dresses', 'engagement-dresses', 'ceremony-suits',
  'bridal-robes', 'bridal-capes', 'bridal-lingerie'
]);

const HAIR_SLUGS = new Set([
  'bridal-hair-accessories', 'bridal-tiaras', 'bridal-headbands',
  'imported-hairpiece', 'persian-hairpiece', 'chignon-pins', 'flower-rings'
]);

const JEWELRY_SLUGS = new Set([
  'bridal-jewelry', 'full-jewelry-set', 'half-set', 'earrings', 'rings',
  'anklets', 'bracelets', 'brooches'
]);

const VEIL_SLUGS = new Set(['bridal-veils', 'arabic-bridal-veils', 'european-bridal-veils']);
const HEADWEAR_SLUGS = new Set(['bridal-headwear', 'bridal-hat', 'bridal-chador', 'turban', 'headscarf']);
const CEREMONY_SLUGS = new Set(['engagement-ceremony-essentials', 'baleh-boron-set', 'three-size-basket', 'engagement-items']);

/** The two specification labels shown for each catalog category. */
export function productAttributeTemplate(categorySlug: string): ProductAttributeTemplate {
  if (categorySlug === 'bridal-shoes') return { primary: 'ارتفاع پاشنه', secondary: 'جنس رویه' };
  if (categorySlug === 'bridal-sneakers') return { primary: 'ارتفاع لژ', secondary: 'جنس رویه' };
  if (categorySlug === 'bridal-bags') return { primary: 'جنس بدنه', secondary: 'نوع بسته‌شدن' };
  if (categorySlug === 'bridal-footwear-accessories') return { primary: 'نوع اکسسوری', secondary: 'جنس' };
  if (categorySlug === 'bridal-shoes-bags') return { primary: 'نوع محصول', secondary: 'جنس' };
  if (categorySlug === 'bridal-gloves') return { primary: 'قد دستکش', secondary: 'جنس دستکش' };
  if (DRESS_SLUGS.has(categorySlug)) return { primary: 'استایل لباس', secondary: 'نوع پارچه' };
  if (VEIL_SLUGS.has(categorySlug)) return { primary: 'طول', secondary: 'عرض' };
  if (HAIR_SLUGS.has(categorySlug)) return { primary: 'نوع نگین', secondary: 'کشور سازنده' };
  if (JEWELRY_SLUGS.has(categorySlug)) return { primary: 'جنس نگین', secondary: 'کیفیت آبکاری' };
  if (HEADWEAR_SLUGS.has(categorySlug)) return { primary: 'مدل پوشش', secondary: 'جنس و تزئینات' };
  if (categorySlug === 'bridal-bouquets') return { primary: 'نوع گل', secondary: 'ترکیب رنگ' };
  if (categorySlug === 'special-bridal-accessories') return { primary: 'نوع اکسسوری', secondary: 'جنس و تزئینات' };
  if (CEREMONY_SLUGS.has(categorySlug)) return { primary: 'نوع محصول', secondary: 'جنس و تزئینات' };
  return { primary: 'نوع محصول', secondary: 'جنس و ویژگی‌ها' };
}
