import { classifyProductCategory } from './category-classifier';

describe('category classifier', () => {
  it('prefers a category inferred from product name', () => {
    expect(classifyProductCategory('کفش سوفیا', 'متفرقه').categorySlug).toBe(
      'bridal-shoes',
    );
  });

  it('falls back to the Excel category path', () => {
    expect(
      classifyProductCategory('مدل ۱۲۳', 'زنانه/بدلیجات/گوشواره').categorySlug,
    ).toBe('earrings');
  });

  it('keeps unmatched products in unconventional', () => {
    const result = classifyProductCategory('مدل XZ', 'متفرقه');
    expect(result.matched).toBe(false);
    expect(result.categorySlug).toBe('unconventional');
  });
});
