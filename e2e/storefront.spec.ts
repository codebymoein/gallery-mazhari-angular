import { expect, test } from '@playwright/test';

test.describe('storefront smoke tests', () => {
  for (const route of ['/', '/catalog', '/contact']) {
    test(`${route} renders a stable public page`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('app-root')).toBeVisible();
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page).toHaveTitle(/\S+/);
    });
  }

  test('unknown route renders the not-found page', async ({ page }) => {
    const response = await page.goto('/route-that-does-not-exist');

    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('.not-found')).toBeVisible();
    await expect(page.locator('#not-found-title')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/i,
    );
  });

  test('unauthenticated admin route is protected', async ({ page }) => {
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin\/login(?:[?#]|$)/);
    await expect(page.locator('#login-title')).toBeVisible();
    await expect(page.locator('form.login__form')).toBeVisible();
  });

  test('empty cart and checkout have safe empty states', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('#cart-title')).toBeVisible();
    await expect(page.locator('.cart__empty')).toBeVisible();

    await page.goto('/checkout');
    await expect(page.locator('#checkout-title')).toBeVisible();
    await expect(page.locator('.checkout__empty')).toBeVisible();
    await expect(page.locator('.checkout__btn--pay')).toHaveCount(0);
  });

  test('page does not overflow its viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();

    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
      )
      .toBe(true);
  });
});
