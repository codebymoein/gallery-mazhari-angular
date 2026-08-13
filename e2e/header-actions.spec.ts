import { expect, test } from '@playwright/test';

async function actionGeometry(page: import('@playwright/test').Page, selector: string) {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const icon = element.querySelector('app-line-icon');
      const iconRect = icon?.getBoundingClientRect();
      return {
        width: style.width,
        height: style.height,
        backgroundColor: style.backgroundColor,
        borderTopWidth: style.borderTopWidth,
        iconWidth: icon ? getComputedStyle(icon).width : '',
        iconTop: iconRect?.top ?? 0,
      };
    }),
  );
}

test.describe('header action alignment', () => {
  test('mobile menu, search and cart icons share one row and frameless geometry', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const selector = '.luxury-nav__menu-toggle, .luxury-nav__search-toggle, .luxury-nav__cart';
    const controls = page.locator(selector);
    await expect(controls).toHaveCount(3);

    const styles = await actionGeometry(page, selector);
    expect(new Set(styles.map(({ width }) => width)).size).toBe(1);
    expect(new Set(styles.map(({ height }) => height)).size).toBe(1);
    expect(new Set(styles.map(({ iconWidth }) => iconWidth)).size).toBe(1);
    expect(Math.max(...styles.map(({ iconTop }) => iconTop)) - Math.min(...styles.map(({ iconTop }) => iconTop))).toBeLessThanOrEqual(1);
    for (const style of styles) {
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
    }
  });

  test('cart count is centered below the bag icon', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const cart = page.locator('.luxury-nav__cart');
    await cart.evaluate((element) => {
      const count = document.createElement('span');
      count.className = 'luxury-nav__cart-count';
      count.textContent = '2';
      for (const attribute of element.getAttributeNames()) {
        if (attribute.startsWith('_ngcontent-')) count.setAttribute(attribute, '');
      }
      element.append(count);
    });

    const iconBox = await cart.locator('app-line-icon').boundingBox();
    const countBox = await cart.locator('.luxury-nav__cart-count').boundingBox();
    expect(iconBox).not.toBeNull();
    expect(countBox).not.toBeNull();
    if (iconBox && countBox) {
      expect(countBox.y).toBeGreaterThanOrEqual(iconBox.y + iconBox.height - 2);
      expect(Math.abs((countBox.x + countBox.width / 2) - (iconBox.x + iconBox.width / 2))).toBeLessThanOrEqual(1);
    }
  });

  test('desktop search, account and cart icons share one frameless contract', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const selector = '.luxury-nav__search-toggle, .luxury-nav__account, .luxury-nav__cart';
    const controls = page.locator(selector);
    await expect(controls).toHaveCount(3);

    const styles = await actionGeometry(page, selector);
    expect(new Set(styles.map(({ width }) => width)).size).toBe(1);
    expect(new Set(styles.map(({ height }) => height)).size).toBe(1);
    expect(new Set(styles.map(({ iconWidth }) => iconWidth)).size).toBe(1);
    expect(Math.max(...styles.map(({ iconTop }) => iconTop)) - Math.min(...styles.map(({ iconTop }) => iconTop))).toBeLessThanOrEqual(1);
    for (const style of styles) {
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.borderTopWidth).toBe('0px');
    }
  });
});
