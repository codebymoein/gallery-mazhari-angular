import { generateProductSeo, slugifyProduct } from './seo-engine';

describe('seo-engine', () => {
  it('builds slug from code + bridal keywords', () => {
    const slug = slugifyProduct({
      code: '13700189',
      name: 'لباس عروس اروپایی',
      category: 'لباس عروس',
      color: 'Ivory',
    });
    expect(slug).toContain('13700189');
    expect(slug).toContain('bridal-dress');
    expect(slug).toContain('european');
  });

  it('generates meta, canonical, OG and JSON-LD without fake reviews', () => {
    const seo = generateProductSeo({
      code: '13700189',
      name: 'لباس عروس اروپایی آیوری',
      category: 'لباس عروس',
      price: 50_000_000,
      stock: 2,
      primaryImageUrl: 'https://example.com/a.jpg',
    });
    expect(seo.metaTitle.length).toBeLessThanOrEqual(60);
    expect(seo.metaDescription.length).toBeLessThanOrEqual(160);
    expect(seo.canonical).toContain('/product/13700189');
    expect(seo.openGraph.type).toBe('product');
    expect(seo.jsonLd['@type']).toBe('Product');
    expect(seo.jsonLd['aggregateRating']).toBeUndefined();
    expect(
      (seo.jsonLd['offers'] as { availability: string }).availability,
    ).toContain('InStock');
    expect(seo.altTexts.primary).toContain('گالری مظهری');
  });

  it('marks out of stock in Offer availability', () => {
    const seo = generateProductSeo({
      code: '1',
      name: 'Test',
      price: 1000,
      stock: 0,
    });
    expect(
      (seo.jsonLd['offers'] as { availability: string }).availability,
    ).toContain('OutOfStock');
  });
});
