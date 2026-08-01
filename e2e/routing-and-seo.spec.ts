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
});
