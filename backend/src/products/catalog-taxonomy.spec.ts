import { BadRequestException } from '@nestjs/common';
import { assertCanonicalCatalogClassification } from './catalog-taxonomy';

describe('canonical catalog taxonomy', () => {
  it('accepts a canonical parent/subcategory pair', () => {
    expect(() =>
      assertCanonicalCatalogClassification({
        category: 'کفش عروس',
        categorySlug: 'bridal-shoes',
        parentCategory: 'کفش، کتونی و کیف',
        parentCategorySlug: 'bridal-shoes-bags',
      }),
    ).not.toThrow();
  });

  it('accepts selecting a main category directly', () => {
    expect(() =>
      assertCanonicalCatalogClassification({
        category: 'دسته‌گل مصنوعی',
        categorySlug: 'bridal-bouquets',
        parentCategory: 'دسته‌گل مصنوعی',
        parentCategorySlug: 'bridal-bouquets',
      }),
    ).not.toThrow();
  });

  it('rejects unknown or mismatched category relationships', () => {
    expect(() =>
      assertCanonicalCatalogClassification({
        category: 'کفش عروس',
        categorySlug: 'bridal-shoes',
        parentCategory: 'پوشاک عروس',
        parentCategorySlug: 'bridal-clothing',
      }),
    ).toThrow(BadRequestException);
  });
});
