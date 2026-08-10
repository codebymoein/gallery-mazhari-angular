import { expect, test } from '@playwright/test';

const routes = [
  {
    name: 'collection',
    path: '/collections/bridal-clothing',
    hero: '.collection-page__chapter-hero',
    card: null,
  },
  {
    name: 'category products',
    path: '/shop/bridal-hair-accessories/bridal-tiaras',
    hero: '.cat-products__chapter-hero',
    card: '.cat-products__card',
  },
  {
    name: 'category hub',
    path: '/shop/bridal-hair-accessories',
    hero: '.cat-hub__chapter-hero',
    card: '.cat-hub__card',
  },
] as const;

for (const route of routes) {
  test(`${route.name} keeps its editorial chapter and core content visible`, async ({ page }) => {
    await page.route('**/api/ops/web-vitals', request => request.fulfill({ status: 204, body: '' }));
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator(route.hero)).toBeVisible();
    if (route.card) {
      await expect(page.locator(route.card).first()).toBeVisible();
    }

    const layout = await page.evaluate(({ hero, card }) => {
      const heroElement = document.querySelector(hero) as HTMLElement | null;
      const cardElement = card ? document.querySelector(card) as HTMLElement | null : null;
      return {
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        heroVisibility: heroElement ? getComputedStyle(heroElement).visibility : null,
        cardContentVisibility: cardElement ? getComputedStyle(cardElement).contentVisibility : null,
      };
    }, route);

    expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.heroVisibility).toBe('visible');
    if (route.card) {
      expect(layout.cardContentVisibility).toBe('visible');
    }
  });
}

test('shared product cards expose product links and touch-sized collection tabs', async ({ page }) => {
  await page.route('**/api/ops/web-vitals', request => request.fulfill({ status: 204, body: '' }));
  await page.goto('/shop/bridal-hair-accessories/bridal-tiaras', { waitUntil: 'domcontentloaded' });

  const card = page.locator('app-storefront-product-card').first();
  await expect(card.getByRole('link')).toHaveAttribute('href', /\/product\//);
  await expect(card.locator('.product-card__name')).not.toBeEmpty();

  await page.goto('/collections/bridal-clothing', { waitUntil: 'domcontentloaded' });
  const minimumTabHeight = await page.locator('.collection-page__tab').first().evaluate(element =>
    element.getBoundingClientRect().height,
  );
  expect(minimumTabHeight).toBeGreaterThanOrEqual(44);
});
