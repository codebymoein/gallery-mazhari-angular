import { normalizeText } from '../common/text-normalize';

export interface ClassifiedCategory {
  category: string;
  categorySlug: string;
  parentCategory: string;
  parentCategorySlug: string;
  matched: boolean;
  evidence: string;
}

const RULES: Array<{
  pattern: RegExp;
  category: string;
  categorySlug: string;
  parentCategory: string;
  parentCategorySlug: string;
}> = [
  {
    pattern: /کتونی/,
    category: 'کتونی عروس',
    categorySlug: 'bridal-sneakers',
    parentCategory: 'کفش، کتونی و کیف',
    parentCategorySlug: 'bridal-shoes-bags',
  },
  {
    pattern: /کفش/,
    category: 'کفش عروس',
    categorySlug: 'bridal-shoes',
    parentCategory: 'کفش، کتونی و کیف',
    parentCategorySlug: 'bridal-shoes-bags',
  },
  {
    pattern: /کیف/,
    category: 'کیف عروس',
    categorySlug: 'bridal-bags',
    parentCategory: 'کفش، کتونی و کیف',
    parentCategorySlug: 'bridal-shoes-bags',
  },
  {
    pattern: /تاج/,
    category: 'تاج عروس',
    categorySlug: 'bridal-tiaras',
    parentCategory: 'اکسسوری مو',
    parentCategorySlug: 'bridal-hair-accessories',
  },
  {
    pattern: /ریسه/,
    category: 'ریسه مو',
    categorySlug: 'imported-hairpiece',
    parentCategory: 'اکسسوری مو',
    parentCategorySlug: 'bridal-hair-accessories',
  },
  {
    pattern: /گوشواره/,
    category: 'گوشواره',
    categorySlug: 'earrings',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /انگشتر/,
    category: 'انگشتر',
    categorySlug: 'rings',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /دستبند/,
    category: 'دستبند',
    categorySlug: 'bracelets',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /سنجاق\s*سینه/,
    category: 'سنجاق سینه',
    categorySlug: 'brooches',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /نیم\s*ست/,
    category: 'نیم‌ست',
    categorySlug: 'half-set',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /سرویس/,
    category: 'سرویس کامل',
    categorySlug: 'full-jewelry-set',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /تور\s*سر|تورسَر|تورسر/,
    category: 'تورسر عروس',
    categorySlug: 'european-bridal-veils',
    parentCategory: 'تورسر',
    parentCategorySlug: 'bridal-veils',
  },
  {
    pattern: /کلاه/,
    category: 'کلاه و کاپ‌کلاه',
    categorySlug: 'bridal-hat',
    parentCategory: 'حجاب مو',
    parentCategorySlug: 'bridal-headwear',
  },
  {
    pattern: /دسته\s*گل/,
    category: 'دسته‌گل مصنوعی',
    categorySlug: 'bridal-bouquets',
    parentCategory: 'دسته‌گل مصنوعی',
    parentCategorySlug: 'bridal-bouquets',
  },
  {
    pattern: /دستکش/,
    category: 'دستکش عروس',
    categorySlug: 'bridal-gloves',
    parentCategory: 'پوشاک عروس',
    parentCategorySlug: 'bridal-clothing',
  },
  {
    pattern: /خنچه|سفره\s*عقد|قندساب|بله\s*برون/,
    category: 'ملزومات عقد و بله‌برون',
    categorySlug: 'engagement-ceremony-essentials',
    parentCategory: 'ملزومات عقد و بله‌برون',
    parentCategorySlug: 'engagement-ceremony-essentials',
  },
  {
    pattern: /تابلو|خودکار|استند|اکسسوری/,
    category: 'اکسسوری خاص عروس',
    categorySlug: 'special-bridal-accessories',
    parentCategory: 'اکسسوری خاص عروس',
    parentCategorySlug: 'special-bridal-accessories',
  },
  {
    pattern: /بدلیجات|زیورآلات/,
    category: 'زیورآلات',
    categorySlug: 'bridal-jewelry',
    parentCategory: 'زیورآلات',
    parentCategorySlug: 'bridal-jewelry',
  },
  {
    pattern: /لباس|پوشاک|کت\s*و?\s*شلوار/,
    category: 'پوشاک عروس',
    categorySlug: 'bridal-clothing',
    parentCategory: 'پوشاک عروس',
    parentCategorySlug: 'bridal-clothing',
  },
];

export function classifyProductCategory(
  name: string,
  excelCategory: string,
): ClassifiedCategory {
  const normalizedName = normalizeText(name);
  const normalizedExcelCategory = normalizeText(excelCategory);

  for (const source of [
    { value: normalizedName, evidence: 'product_name' },
    { value: normalizedExcelCategory, evidence: 'excel_category' },
  ]) {
    const rule = RULES.find((candidate) =>
      candidate.pattern.test(source.value),
    );
    if (rule) {
      return { ...rule, matched: true, evidence: source.evidence };
    }
  }

  return {
    category: 'طبقات نامتعارف',
    categorySlug: 'unconventional',
    parentCategory: 'طبقات نامتعارف',
    parentCategorySlug: 'unconventional',
    matched: false,
    evidence: 'no_name_or_category_rule',
  };
}
