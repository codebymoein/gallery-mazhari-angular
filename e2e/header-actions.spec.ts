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
    await expect(drawer).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 9000 });
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
      expect(box.width).toBeGreaterThanOrEqual(390 * 0.9);
      expect(box.width).toBeLessThanOrEqual(390 * 0.94);
      expect(390 - (box.x + box.width)).toBeGreaterThanOrEqual(20);
    }

    const brand = drawer.locator('.luxury-nav__drawer-brand');
    const brandLogo = brand.locator('.luxury-nav__drawer-brand-logo');
    await expect(brand).toHaveAttribute('href', '/');
    await expect(brandLogo).toHaveAttribute('src', 'assets/images/gallery-mazhari-drawer-logo.png');
    await expect(brandLogo).toHaveCSS('display', 'none');
    await expect(drawer.locator('.luxury-nav__drawer-wordmark')).toHaveCount(0);
    const brandBox = await brand.boundingBox();
    if (box && brandBox) {
      expect(Math.abs(brandBox.x + brandBox.width / 2 - (box.x + box.width / 2))).toBeLessThanOrEqual(1);
      expect(brandBox.width).toBeLessThanOrEqual(130);
    }
    const brandVisual = await brand.evaluate((element) => {
      const styles = getComputedStyle(element, '::before');
      return {
        backgroundColor: styles.backgroundColor,
        maskImage: styles.getPropertyValue('mask-image') || styles.getPropertyValue('-webkit-mask-image'),
      };
    });
    expect(brandVisual.maskImage).toContain('gallery-mazhari-drawer-logo.png');
    expect(brandVisual.backgroundColor).not.toBe('rgb(0, 0, 0)');

    await expect(drawer.locator('#drawer-search')).toHaveCount(0);
    await expect(drawer.locator('.luxury-nav__drawer-feature')).toHaveCount(0);

    const topLevelRow = drawer.locator('.luxury-nav__drawer-group > summary').first();
    await expect(topLevelRow).toHaveCSS('border-bottom-width', '1px');

    const bridalGroup = drawer.locator('.luxury-nav__drawer-group').first();
    await bridalGroup.locator(':scope > summary').click();
    await expect(
      bridalGroup.getByRole('link', { name: 'مشاهده همه پوشاک عروس', exact: true }),
    ).toHaveCount(0);

    const bridalDressGroup = bridalGroup.locator('.luxury-nav__drawer-nested--bridal-dresses');
    await expect(bridalDressGroup).toHaveCSS('border-top-width', '0px');
    await expect(bridalDressGroup.locator(':scope > summary')).toContainText('لباس عروس');
    const nestedChevron = bridalDressGroup.locator(':scope > summary app-line-icon');
    await expect(nestedChevron).toHaveCSS('border-top-width', '1px');
    await expect(nestedChevron).not.toHaveCSS('border-radius', '0px');

    await bridalDressGroup.locator(':scope > summary').click();
    await expect(
      bridalDressGroup.getByRole('link', { name: 'لباس عروس اروپایی', exact: true }),
    ).toHaveAttribute('href', '/collections/european-bridal-dresses');
    await expect(
      bridalDressGroup.getByRole('link', { name: 'لباس عروس عربی', exact: true }),
    ).toHaveAttribute('href', '/collections/arabic-bridal-dresses');
    await expect(
      bridalDressGroup.getByRole('link', { name: 'لباس عروس مدل ماهی', exact: true }),
    ).toHaveAttribute('href', '/collections/mermaid-bridal-dresses');
    await expect(
      bridalGroup.getByRole('link', { name: 'لباس نامزدی', exact: true }),
    ).toHaveAttribute('href', '/collections/engagement-dresses');
    await expect(
      bridalGroup.getByRole('link', { name: 'کت‌وشلوار عقد', exact: true }),
    ).toHaveAttribute('href', '/shop/bridal-clothing/ceremony-suits');

    const accessoryGroup = drawer.locator('.luxury-nav__drawer-group').nth(1);
    await accessoryGroup.locator(':scope > summary').click();
    await expect(
      accessoryGroup.getByRole('link', { name: 'مشاهده همه اکسسوری‌ها', exact: true }),
    ).toHaveAttribute('href', '/accessories');
    const accessoryNestedChevron = accessoryGroup.locator('.luxury-nav__drawer-nested > summary app-line-icon').first();
    await expect(accessoryNestedChevron).toHaveCSS('border-top-width', '1px');

    await expect(drawer.getByRole('link', { name: 'ارتباط با ما', exact: true })).toHaveAttribute('href', '/contact');
    await expect(drawer.getByRole('link', { name: 'حساب کاربری من', exact: true })).toHaveAttribute('href', '/account');
    await expect(drawer.getByRole('link', { name: 'پیگیری سفارش‌ها', exact: true })).toHaveAttribute('href', '/orders');
    await expect(drawer.getByRole('link', { name: 'رزرو مشاوره اختصاصی', exact: true })).toHaveAttribute('href', '#appointment');

    const cta = drawer.locator('.luxury-nav__drawer-cta');
    await expect(cta).toHaveCSS('border-radius', '0px');
    await expect(cta).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('drawer and accordion motion use the requested tenfold component scale', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'باز کردن منوی اصلی' }).click();

    const drawer = page.locator('#storefront-drawer');
    const drawerDuration = await drawer.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(drawerDuration)).toBeGreaterThanOrEqual(3.9);

    await page.waitForTimeout(500);
    const earlyTransform = await drawer.evaluate((element) => getComputedStyle(element).transform);
    expect(earlyTransform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');

    await expect(drawer).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)', { timeout: 9000 });
    const bridalGroup = drawer.locator('.luxury-nav__drawer-group').first();
    await bridalGroup.locator(':scope > summary').click();
    const submenu = bridalGroup.locator('.luxury-nav__drawer-submenu');
    const submenuDuration = await submenu.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(submenuDuration)).toBeGreaterThanOrEqual(3.9);
  });

  test('drawer reopens from the collapsed initial hierarchy and top scroll position', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('/');

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    await menuToggle.click();
    const drawer = page.locator('#storefront-drawer');
    const bridalGroup = drawer.locator('.luxury-nav__drawer-group').first();
    const bridalDressGroup = bridalGroup.locator('.luxury-nav__drawer-nested--bridal-dresses');

    await bridalGroup.locator(':scope > summary').click();
    await bridalDressGroup.locator(':scope > summary').click();
    await expect(bridalGroup).toHaveAttribute('open', '');
    await expect(bridalDressGroup).toHaveAttribute('open', '');

    const drawerNav = drawer.locator('.luxury-nav__drawer-nav');
    await drawerNav.evaluate((element) => element.scrollTo({ top: 120, behavior: 'auto' }));
    await drawer.getByRole('button', { name: 'بستن منو' }).click();
    await menuToggle.click();

    await expect(bridalGroup).not.toHaveAttribute('open', '');
    await expect(bridalDressGroup).not.toHaveAttribute('open', '');
    await expect.poll(() => drawerNav.evaluate((element) => element.scrollTop)).toBe(0);
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
