import { expect, test } from '@playwright/test';

test.describe('header cart and reduced motion', () => {
  test('narrow header has usable touch targets, no overflow, and an accessible search toggle', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setViewportSize({ width: 380, height: 812 });
    await page.goto('/');

    const controls = page.locator(
      '.luxury-nav__menu-toggle, .luxury-nav__search-toggle, .luxury-nav__cart',
    );
    await expect(controls).toHaveCount(3);
    for (const control of await controls.all()) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const searchToggle = page.locator('.luxury-nav__search-toggle');
    await expect(searchToggle).toHaveAttribute('aria-expanded', 'false');
    await searchToggle.click();
    await expect(searchToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#nav-search-input')).toBeFocused();
    const searchPresentation = await page.locator('.luxury-nav__search-field').evaluate((field) => {
      const fieldStyle = getComputedStyle(field);
      const buttonStyle = getComputedStyle(field.querySelector('button')!);
      return {
        borderWidth: fieldStyle.borderTopWidth,
        borderColor: fieldStyle.borderTopColor,
        fieldBackground: fieldStyle.backgroundColor,
        buttonBackground: buttonStyle.backgroundColor,
        inputFontSize: getComputedStyle(field.querySelector('input')!).fontSize,
      };
    });
    expect(searchPresentation.borderWidth).toBe('1px');
    expect(searchPresentation.borderColor).not.toBe('rgb(0, 0, 0)');
    expect(searchPresentation.fieldBackground).not.toBe('rgb(0, 0, 0)');
    expect(searchPresentation.buttonBackground).not.toBe('rgb(0, 0, 0)');
    expect(Number.parseFloat(searchPresentation.inputFontSize)).toBeGreaterThanOrEqual(16);
    await page.keyboard.press('Escape');
    await expect(searchToggle).toHaveAttribute('aria-expanded', 'false');
    expect(pageErrors).toEqual([]);
  });

  test('desktop header keeps navigation, wordmark, and actions optically balanced', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const header = page.locator('.luxury-nav__bar');
    const layout = await header.evaluate((bar) => {
      const rect = bar.getBoundingClientRect();
      const box = (selector: string) => bar.querySelector(selector)?.getBoundingClientRect();
      const nav = box('.luxury-nav__desktop-nav');
      const brand = box('.luxury-nav__brand');
      const actions = box('.luxury-nav__actions');
      return {
        center: rect.x + rect.width / 2,
        nav: nav ? { left: nav.left, right: nav.right } : null,
        brand: brand ? { left: brand.left, right: brand.right } : null,
        actions: actions ? { left: actions.left, right: actions.right } : null,
      };
    });

    expect(layout.nav).not.toBeNull();
    expect(layout.brand).not.toBeNull();
    expect(layout.actions).not.toBeNull();
    if (layout.nav && layout.brand && layout.actions) {
      expect(Math.abs((layout.brand.left + layout.brand.right) / 2 - layout.center)).toBeLessThanOrEqual(1);
      expect(layout.nav.left).toBeGreaterThan(layout.brand.right);
      expect(layout.actions.right).toBeLessThan(layout.brand.left);
    }
  });

  test('desktop mega-menu supports keyboard use and escape dismissal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const summary = page.locator('.luxury-nav__menu-group > summary').first();
    const group = page.locator('.luxury-nav__menu-group').first();
    await summary.focus();
    await expect(summary).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(group).toHaveAttribute('open', '');
    await expect(group.locator('.luxury-nav__mega-menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(group).not.toHaveAttribute('open', '');
  });

  test('crossing the desktop breakpoint clears responsive menu state', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.locator('.luxury-nav__menu-toggle').click();
    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toBeVisible();
    await drawer.locator('.luxury-nav__drawer-group > summary').first().click();
    await expect(drawer.locator('details[open]')).toHaveCount(1);

    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(drawer).toBeHidden();
    await expect(drawer.locator('details[open]')).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

    const desktopGroup = page.locator('.luxury-nav__menu-group').first();
    await desktopGroup.locator('summary').click();
    await expect(desktopGroup).toHaveAttribute('open', '');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(desktopGroup).not.toHaveAttribute('open', '');
  });

  test('mobile controls keep menu on the right and search/cart on the left', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const positions = await page.locator('.luxury-nav__bar').evaluate((bar) => {
      const box = (selector: string) => {
        const rect = bar.querySelector(selector)?.getBoundingClientRect();
        return rect ? { left: rect.left, right: rect.right } : null;
      };
      return {
        menu: box('.luxury-nav__menu-toggle'),
        brand: box('.luxury-nav__brand'),
        search: box('.luxury-nav__search-toggle'),
        cart: box('.luxury-nav__cart'),
      };
    });

    expect(positions.menu).not.toBeNull();
    expect(positions.brand).not.toBeNull();
    expect(positions.search).not.toBeNull();
    expect(positions.cart).not.toBeNull();
    if (positions.menu && positions.brand && positions.search && positions.cart) {
      expect(positions.menu.left).toBeGreaterThan(positions.brand.right);
      expect(positions.search.right).toBeLessThan(positions.brand.left);
      expect(positions.cart.right).toBeLessThan(positions.brand.left);
    }
  });

  test('drawer close clears WebKit interaction layers and resets disclosures on reopen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    const drawer = page.locator('#storefront-drawer');
    const backdrop = page.locator('.luxury-nav__drawer-backdrop');

    await menuToggle.click();
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.luxury-nav__drawer-brand img')).toHaveAttribute(
      'src',
      'assets/images/gallery-mazhari-wordmark.png',
    );
    await expect.poll(() => drawer.evaluate((element) => {
      const drawerBox = element.getBoundingClientRect();
      const brandBox = element
        .querySelector('.luxury-nav__drawer-brand')
        ?.getBoundingClientRect();
      return brandBox
        ? Math.abs(brandBox.x + brandBox.width / 2 - (drawerBox.x + drawerBox.width / 2))
        : Number.POSITIVE_INFINITY;
    })).toBeLessThanOrEqual(1);
    await drawer.locator('.luxury-nav__drawer-group > summary').first().click();
    await expect(drawer.locator('.luxury-nav__drawer-group').first()).toHaveAttribute('open', '');
    const bridalAll = drawer.getByRole('link', { name: 'مشاهده همه پوشاک عروس' });
    await expect(bridalAll).toHaveClass(/luxury-nav__drawer-submenu-link/);
    await expect(bridalAll).not.toHaveClass(/luxury-nav__drawer-feature/);

    const drawerSearchButton = drawer.locator('.luxury-nav__drawer-search button');
    await expect(drawerSearchButton).not.toHaveCSS('background-color', 'rgb(0, 0, 0)');

    await drawer.getByRole('button', { name: 'بستن منو' }).click();
    await expect(drawer).toBeHidden();
    await expect(drawer).toHaveCSS('pointer-events', 'none');
    await expect(backdrop).toHaveCSS('pointer-events', 'none');
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');

    await menuToggle.click();
    await expect(drawer).toBeVisible();
    await expect(drawer.locator('.luxury-nav__drawer-group').first()).not.toHaveAttribute('open', '');
  });

  test('orientation change closes the drawer and restores the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
    const drawer = page.getByRole('dialog', { name: 'منوی گالری' });
    await menuToggle.click();
    await expect(drawer).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('orientationchange')));
    await expect(drawer).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
  });

  test('cart count is integrated within the bag control', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mazhari_cart', JSON.stringify({
        items: [
          { product_id: 4100, quantity: 2, price: 1, added_at: new Date().toISOString() },
        ],
        expiresAt: Date.now() + 60 * 60 * 1000,
      }));
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const cart = page.locator('.luxury-nav__cart');
    await expect(cart.locator('.luxury-nav__cart-count')).toHaveText('2');
    const cartBox = await cart.boundingBox();
    const icon = await cart.locator('app-line-icon').boundingBox();
    const count = await cart.locator('.luxury-nav__cart-count').boundingBox();
    expect(cartBox).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(count).not.toBeNull();
    if (cartBox && icon && count) {
      expect(count.x).toBeGreaterThanOrEqual(cartBox.x);
      expect(count.x + count.width).toBeLessThanOrEqual(cartBox.x + cartBox.width);
      expect(count.y).toBeLessThan(icon.y + icon.height);
    }
  });

  test('cart count restores quantities and updates reactively', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mazhari_cart', JSON.stringify({
        items: [
          { product_id: 4101, quantity: 3, price: 1, added_at: new Date().toISOString() },
          { product_id: 4102, quantity: 4, price: 1, added_at: new Date().toISOString() },
        ],
        expiresAt: Date.now() + 60 * 60 * 1000,
      }));
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/cart');

    const badge = page.locator('.luxury-nav__cart-count');
    await expect(badge).toHaveText('7');
    await page.locator('.cart__qty-btn').nth(1).click();
    await expect(badge).toHaveText('8');
  });

  test('cart badge caps large quantities', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('mazhari_cart', JSON.stringify({
        items: [
          { product_id: 4199, quantity: 120, price: 1, added_at: new Date().toISOString() },
        ],
        expiresAt: Date.now() + 60 * 60 * 1000,
      }));
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.luxury-nav__cart-count')).toHaveText('99+');
  });

  test('cart badge is absent at zero', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('mazhari_cart'));
    await page.reload();
    await expect(page.locator('.luxury-nav__cart-count')).toHaveCount(0);
  });

  test('reduced motion disables decorative menu animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'باز کردن منوی اصلی' }).click();
    const drawer = page.locator('#storefront-drawer');
    await expect(drawer).toBeVisible();
    const duration = await drawer.evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(duration)).toBe(0);
  });

  test('scroll direction hides and reveals the header without overriding active UI', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const header = page.locator('.luxury-nav');
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(header).toHaveClass(/luxury-nav--hidden/);

    await page.evaluate(() => window.scrollBy(0, -120));
    await expect(header).not.toHaveClass(/luxury-nav--hidden/);

    await page.locator('.luxury-nav__menu-toggle').click();
    await expect(page.locator('#storefront-drawer')).toBeVisible();
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    await expect(header).not.toHaveClass(/luxury-nav--hidden/);
    await page.keyboard.press('Escape');

    await page.locator('.luxury-nav__search-toggle').click();
    await expect(page.locator('#nav-search-input')).toBeFocused();
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    await expect(header).not.toHaveClass(/luxury-nav--hidden/);
  });

  test('brand returns to the true top of Home from Home and another route', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.evaluate(() => window.scrollBy(0, -120));
    await page.getByLabel('صفحه اصلی گالری مزهری').click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/catalog#stale-fragment');
    await page.getByLabel('صفحه اصلی گالری مزهری').click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => window.location.hash)).toBe('');
  });

  test('reduced motion keeps the scroll-aware header visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(page.locator('.luxury-nav')).toHaveCSS('transform', 'none');
  });
});
