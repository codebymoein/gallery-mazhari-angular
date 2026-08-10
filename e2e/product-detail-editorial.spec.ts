import { expect, test } from '@playwright/test';

function publishedProductFixture() {
  const now = new Date().toISOString();
  return {
    revision: 'gm-010-editorial-product-detail',
    generatedAt: now,
    ttlSeconds: 600,
    products: [
      {
        id: 'gm-010-pdp',
        code: 'GM-010-PDP',
        name: 'تاج عروس ادیتوری مظهری',
        category: 'تاج عروس',
        parentCategory: 'اکسسوری مو عروس',
        parentCategorySlug: 'bridal-hair-accessories',
        categorySlug: 'bridal-tiaras',
        stock: 3,
        price: 18_000_000,
        isNewImport: false,
        status: 'published',
        photos: [],
        updatedAt: now,
        publishedAt: now,
        variations: [],
      },
      {
        id: 'd-01',
        code: 'GM-010-DRESS',
        name: 'مدل رویای عاجی',
        category: 'لباس عروس اروپایی',
        parentCategory: 'پوشاک عروس',
        parentCategorySlug: 'bridal-clothing',
        categorySlug: 'european-bridal-dresses',
        stock: 1,
        price: 0,
        isNewImport: false,
        status: 'published',
        photos: [],
        updatedAt: now,
        publishedAt: now,
        variations: [],
      },
    ],
  };
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/ops/web-vitals', request => request.fulfill({ status: 204, body: '' }));
  await page.route('**/api/products/published', request =>
    request.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(publishedProductFixture()),
    }),
  );
});

test('editorial PDP keeps core commerce content visible and within the viewport', async ({ page }) => {
  await page.goto('/product/gm-010-pdp', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: 'تاج عروس ادیتوری مظهری' })).toBeVisible();
  await expect(page.locator('.bridal-product__hero')).toBeVisible();
  await expect(page.locator('.bridal-product__info')).toBeVisible();
  await expect(page.getByRole('button', { name: /افزودن به سبد خرید/ })).toBeVisible();
  await expect(page.locator('.bridal-product__assurances')).toBeVisible();

  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    heroContentVisibility: getComputedStyle(
      document.querySelector('.bridal-product__hero') as HTMLElement,
    ).contentVisibility,
    infoContentVisibility: getComputedStyle(
      document.querySelector('.bridal-product__info') as HTMLElement,
    ).contentVisibility,
    cartTarget: document.querySelector('.bridal-product__cart-btn')?.getBoundingClientRect().height ?? 0,
  }));

  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.heroContentVisibility).toBe('visible');
  expect(layout.infoContentVisibility).toBe('visible');
  expect(layout.cartTarget).toBeGreaterThanOrEqual(44);
});

test('consultation PDP preserves its non-commerce primary path', async ({ page }) => {
  await page.goto('/product/d-01', { waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { level: 1, name: 'مدل رویای عاجی' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'درخواست مشاوره حرفه‌ای' })).toHaveAttribute(
    'href',
    /\/consultation/,
  );
  await expect(page.getByRole('button', { name: /افزودن به سبد خرید/ })).toHaveCount(0);
});
