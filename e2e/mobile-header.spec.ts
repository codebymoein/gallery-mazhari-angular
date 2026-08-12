import { expect, test } from '@playwright/test';

test.describe('GM-031 mobile header polish', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('uses the Latin wordmark and frameless unified mobile controls', async ({ page }) => {
    await page.goto('/');

    const header = page.locator('.luxury-nav');
    const wordmark = header.locator('.luxury-nav__brand-mobile-wordmark');
    await expect(wordmark).toBeVisible();
    await expect(wordmark).toHaveText('Gallery Mazhari');
    await expect(wordmark).toHaveAttribute('lang', 'en');
    await expect(wordmark).toHaveAttribute('dir', 'ltr');
    await expect(header.locator('.luxury-nav__brand-logo')).toBeHidden();

    const controls = header.locator(
      '.luxury-nav__menu-toggle, .luxury-nav__search-toggle, .luxury-nav__cart'
    );
    await expect(controls).toHaveCount(3);

    const controlStyles = await controls.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        const icon = element.querySelector('app-line-icon');
        const iconStyle = icon ? getComputedStyle(icon) : null;
        return {
          backgroundColor: style.backgroundColor,
          borderTopWidth: style.borderTopWidth,
          width: style.width,
          height: style.height,
          iconWidth: iconStyle?.width ?? '',
        };
      })
    );

    expect(new Set(controlStyles.map(({ width }) => width)).size).toBe(1);
    expect(new Set(controlStyles.map(({ height }) => height)).size).toBe(1);
    expect(new Set(controlStyles.map(({ iconWidth }) => iconWidth)).size).toBe(1);
    for (const style of controlStyles) {
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
    }
  });

  test('animates drawer and category reveals while preserving dialog semantics', async ({ page }) => {
    await page.goto('/');

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');

    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(drawer).toBeVisible();

    const drawerMotion = await drawer.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        transitionProperty: style.transitionProperty,
        transitionTimingFunction: style.transitionTimingFunction,
      };
    });
    expect(drawerMotion.transitionProperty).toContain('transform');
    expect(drawerMotion.transitionTimingFunction).toContain('cubic-bezier');

    const groups = drawer.locator('.luxury-nav__drawer-group');
    const bridalGroup = groups.nth(0);
    await bridalGroup.locator('summary').click();
    const bridalSubmenu = bridalGroup.locator('.luxury-nav__drawer-submenu');
    await expect(bridalSubmenu).toBeVisible();
    await expect
      .poll(() => bridalSubmenu.evaluate((element) => getComputedStyle(element).animationName))
      .toContain('luxury-nav-submenu-reveal');

    const accessoryGroup = groups.nth(1);
    await accessoryGroup.locator('summary').click();
    const nestedGroup = accessoryGroup.locator('.luxury-nav__drawer-nested').first();
    await nestedGroup.locator('summary').click();
    const nestedLinks = nestedGroup.locator('.luxury-nav__drawer-submenu-links');
    await expect(nestedLinks).toBeVisible();
    await expect
      .poll(() => nestedLinks.evaluate((element) => getComputedStyle(element).animationName))
      .toContain('luxury-nav-submenu-reveal');

    await drawer.getByRole('button', { name: 'بستن منو' }).click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  test('keeps the existing image brand presentation at tablet and desktop widths', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/');

    const header = page.locator('.luxury-nav');
    await expect(header.locator('.luxury-nav__brand-logo')).toBeVisible();
    await expect(header.locator('.luxury-nav__brand-caption')).toBeVisible();
    await expect(header.locator('.luxury-nav__brand-mobile-wordmark')).toBeHidden();
  });
});
