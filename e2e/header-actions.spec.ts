import { expect, test } from '@playwright/test';

test.describe('header cart and reference-led mobile drawer', () => {
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

  test('drawer follows the approved left-edge minimal composition and preserves destinations', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    await menuToggle.click();

    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toBeVisible();
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThanOrEqual(390 * 0.9);
      expect(box.width).toBeLessThanOrEqual(390 * 0.94);
      expect(390 - (box.x + box.width)).toBeGreaterThanOrEqual(20);
    }

    const wordmark = drawer.locator('.luxury-nav__drawer-wordmark');
    await expect(wordmark).toHaveText('Gallery Mazhari');
    await expect(wordmark).toHaveAttribute('lang', 'en');
    await expect(wordmark).toHaveAttribute('dir', 'ltr');
    await expect(drawer.locator('#drawer-search')).toHaveCount(0);
    await expect(drawer.locator('.luxury-nav__drawer-feature')).toHaveCount(0);

    const topLevelRow = drawer.locator('.luxury-nav__drawer-group > summary').first();
    await expect(topLevelRow).toHaveCSS('border-bottom-width', '1px');

    const bridalGroup = drawer.locator('.luxury-nav__drawer-group').first();
    await bridalGroup.locator(':scope > summary').click();
    await expect(
      bridalGroup.getByRole('link', { name: 'مشاهده همه پوشاک عروس', exact: true }),
    ).toHaveAttribute('href', '/shop/bridal-clothing');

    const accessoryGroup = drawer.locator('.luxury-nav__drawer-group').nth(1);
    await accessoryGroup.locator(':scope > summary').click();
    await expect(
      accessoryGroup.getByRole('link', { name: 'مشاهده همه اکسسوری‌ها', exact: true }),
    ).toHaveAttribute('href', '/accessories');

    await expect(drawer.getByRole('link', { name: 'ارتباط با ما', exact: true })).toHaveAttribute('href', '/contact');
    await expect(drawer.getByRole('link', { name: 'حساب کاربری من', exact: true })).toHaveAttribute('href', '/account');
    await expect(drawer.getByRole('link', { name: 'پیگیری سفارش‌ها', exact: true })).toHaveAttribute('href', '/orders');
    await expect(drawer.getByRole('link', { name: 'رزرو مشاوره اختصاصی', exact: true })).toHaveAttribute('href', '#appointment');

    const cta = drawer.locator('.luxury-nav__drawer-cta');
    await expect(cta).toHaveCSS('border-radius', '0px');
    await expect(cta).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('drawer focus, escape restoration and 320px overflow remain safe', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    await menuToggle.click();
    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'بستن منو' })).toBeFocused();

    const width = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);

    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(menuToggle).toBeFocused();
  });

  test('reduced motion disables decorative drawer and accordion animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'باز کردن منوی اصلی' }).click();

    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toBeVisible();
    const drawerDuration = await drawer.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(drawerDuration)).toBeLessThanOrEqual(0.001);

    const bridalGroup = drawer.locator('.luxury-nav__drawer-group').first();
    await bridalGroup.locator(':scope > summary').click();
    const submenu = bridalGroup.locator('.luxury-nav__drawer-submenu');
    await expect(submenu).toBeVisible();
    const submenuDuration = await submenu.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(submenuDuration)).toBeLessThanOrEqual(0.001);
  });
});
