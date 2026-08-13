import { expect, test } from '@playwright/test';

test.describe('header cart and reduced motion', () => {
  test('cart count sits below and centered on the bag icon', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const cart = page.locator('.luxury-nav__cart');
    await cart.evaluate((element) => {
      const count = document.createElement('span');
      count.className = 'luxury-nav__cart-count';
      count.textContent = '2';
      element.append(count);
    });
    const icon = await cart.locator('app-line-icon').boundingBox();
    const count = await cart.locator('.luxury-nav__cart-count').boundingBox();
    expect(icon).not.toBeNull();
    expect(count).not.toBeNull();
    if (icon && count) {
      expect(count.y).toBeGreaterThanOrEqual(icon.y + icon.height - 2);
      expect(Math.abs(count.x + count.width / 2 - (icon.x + icon.width / 2))).toBeLessThanOrEqual(1);
    }
  });

  test('reduced motion disables decorative menu animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'باز کردن منوی اصلی' }).click();
    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toBeVisible();
    const duration = await drawer.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  });
});
