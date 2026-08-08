import { expect, test } from '@playwright/test';

const directRoutes = [
  '/',
  '/catalog',
  '/discounts',
  '/accessories',
  '/looks',
  '/consultation',
  '/contact',
  '/dream-canvas',
  '/catalog-builder',
  '/account',
  '/orders',
];

test.describe('direct routing and metadata', () => {
  for (const route of directRoutes) {
    test(`${route} supports direct navigation`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('app-root')).toBeVisible();
      await expect(page).toHaveTitle(/\S+/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        /\S+/,
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        /^https?:\/\//,
      );
    });
  }

  test('browser back and forward preserve public navigation', async ({
    page,
  }) => {
    await page.goto('/');
    await page.goto('/catalog');
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/catalog(?:[?#]|$)/);
  });

  test('invalid dynamic identifiers fail safely', async ({ page }) => {
    for (const route of [
      '/product/not-a-real-product',
      '/look/not-a-real-look',
      '/collections/not-a-real-collection',
    ]) {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('app-root')).toBeVisible();
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('dynamic category metadata is entity-derived and canonical ignores query/hash', async ({ page }) => {
    const response = await page.goto('/shop/bridal-clothing?utm_source=e2e#collection');
    expect(response?.ok()).toBeTruthy();

    await expect(page).toHaveTitle(/پوشاک عروس/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /پوشاک عروس/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://gallery-mazhari.ir/shop/bridal-clothing',
    );

    const jsonLd = page.locator('#mazhari-route-jsonld');
    await expect(jsonLd).toHaveCount(1);
    const structuredData = JSON.parse((await jsonLd.textContent()) || '{}') as Record<string, unknown>;
    expect(structuredData['@type']).toBe('CollectionPage');
    expect(structuredData['url']).toBe('https://gallery-mazhari.ir/shop/bridal-clothing');
  });

  test('route JSON-LD is replaced and cleared across navigation', async ({ page }) => {
    const productResponse = await page.goto('/product/d-01');
    expect(productResponse?.ok()).toBeTruthy();

    const productJsonLd = page.locator('#mazhari-route-jsonld');
    await expect(productJsonLd).toHaveCount(1);
    const productData = JSON.parse((await productJsonLd.textContent()) || '{}') as Record<string, unknown>;
    expect(productData['@type']).toBe('Product');

    await page.goto('/shop/bridal-clothing');
    const collectionJsonLd = page.locator('#mazhari-route-jsonld');
    await expect(collectionJsonLd).toHaveCount(1);
    const collectionData = JSON.parse((await collectionJsonLd.textContent()) || '{}') as Record<string, unknown>;
    expect(collectionData['@type']).toBe('CollectionPage');

    await page.goto('/contact');
    await expect(page.locator('#mazhari-route-jsonld')).toHaveCount(0);
    await expect(page.locator('#mazhari-product-jsonld')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://gallery-mazhari.ir/contact',
    );
  });

  test('sitemap index exposes only canonical public partitions', async ({ request }) => {
    const indexResponse = await request.get('/sitemap.xml');
    expect(indexResponse.ok()).toBeTruthy();
    const indexXml = await indexResponse.text();

    expect(indexXml).toContain('<sitemapindex');
    expect(indexXml).toContain('https://gallery-mazhari.ir/sitemap-pages.xml');
    expect(indexXml).toContain('https://gallery-mazhari.ir/sitemap-catalog.xml');

    for (const child of ['/sitemap-pages.xml', '/sitemap-catalog.xml']) {
      const childResponse = await request.get(child);
      expect(childResponse.ok()).toBeTruthy();
      const xml = await childResponse.text();
      expect(xml).toContain('<urlset');
      expect(xml).not.toMatch(/[?#][^<]*<\/loc>/);
      expect(xml).not.toMatch(/<loc>https:\/\/gallery-mazhari\.ir\/(?:account|admin|cart|checkout|orders|dream-canvas|catalog-builder)(?:\/|<)/);
    }
  });
});
