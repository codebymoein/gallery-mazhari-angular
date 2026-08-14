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

  test('unknown route renders the not-found page with a true 404', async ({ page }) => {
    const response = await page.goto('/route-that-does-not-exist');

    expect(response?.status()).toBe(404);
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
    await expect(page.locator('body')).not.toBeEmpty();

    await page.goto('/checkout');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('page does not overflow its viewport', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });

  test('mobile header keeps a frameless wordmark and animated navigation contract', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const header = page.locator('.luxury-nav');
    const wordmark = header.locator('.luxury-nav__brand-mobile-wordmark');
    await expect(wordmark).toBeVisible();
    await expect(wordmark).toHaveText('Gallery Mazhari');
    await expect(wordmark).toHaveAttribute('lang', 'en');
    await expect(wordmark).toHaveAttribute('dir', 'ltr');
    await expect(header.locator('.luxury-nav__brand-logo')).toBeHidden();

    const controls = header.locator(
      '.luxury-nav__menu-toggle, .luxury-nav__search-toggle, .luxury-nav__cart',
    );
    await expect(controls).toHaveCount(3);
    const controlStyles = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        const icon = element.querySelector('app-line-icon');
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          width: style.width,
          height: style.height,
          iconWidth: icon ? getComputedStyle(icon).width : '',
        };
      }),
    );
    expect(new Set(controlStyles.map(({ width }) => width)).size).toBe(1);
    expect(new Set(controlStyles.map(({ height }) => height)).size).toBe(1);
    expect(new Set(controlStyles.map(({ iconWidth }) => iconWidth)).size).toBe(1);
    for (const style of controlStyles) {
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
    }

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(drawer).toBeVisible();

    const transitionProperty = await drawer.evaluate(
      (element) => getComputedStyle(element).transitionProperty,
    );
    expect(transitionProperty).toContain('transform');

    const bridalGroup = drawer.locator('.luxury-nav__drawer-group').first();
    await bridalGroup.locator(':scope > summary').click();
    const bridalSubmenu = bridalGroup.locator('.luxury-nav__drawer-submenu');
    await expect(bridalSubmenu).toBeVisible();
    expect(await bridalSubmenu.evaluate((element) => getComputedStyle(element).transitionProperty)).toContain(
      'max-height',
    );

    const accessoryGroup = drawer.locator('.luxury-nav__drawer-group').nth(1);
    await accessoryGroup.locator(':scope > summary').click();
    const nestedGroup = accessoryGroup.locator('.luxury-nav__drawer-nested').first();
    await nestedGroup.locator(':scope > summary').click();
    const nestedLinks = nestedGroup.locator('.luxury-nav__drawer-submenu-links');
    await expect(nestedLinks).toBeVisible();
    expect(await nestedLinks.evaluate((element) => getComputedStyle(element).transitionProperty)).toContain(
      'max-height',
    );

    await drawer.getByRole('button', { name: 'بستن منو' }).click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });
});
