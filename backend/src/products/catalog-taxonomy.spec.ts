import { BadRequestException } from '@nestjs/common';
import { CATALOG_CATEGORIES } from '../../../src/app/shared/data/catalog-categories';
import {
  assertCanonicalCatalogClassification,
  CANONICAL_CATALOG_TAXONOMY,
} from './catalog-taxonomy';

describe('canonical catalog taxonomy', () => {
  it('stays synchronized with the Angular catalog projection', () => {
    const frontendContract = CATALOG_CATEGORIES.map((category) => ({
      title: category.title,
      slug: category.slug,
      subcategories: category.subcategories.map((subcategory) => ({
        label: subcategory.label,
        slug: subcategory.slug,
      })),
    }));
    expect(CANONICAL_CATALOG_TAXONOMY).toEqual(frontendContract);
  });

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
