import { expect, test } from '@playwright/test';

function publishedSnapshot(
  productCount = 24,
  categorySlug = 'european-bridal-dresses',
  parentCategorySlug = 'bridal-clothing',
) {
  const now = new Date().toISOString();
  return {
    revision: 'gm-007-webkit-refresh',
    generatedAt: now,
    ttlSeconds: 600,
    products: Array.from({ length: productCount }, (_, index) => ({
      id: `gm-007-${index}`,
      code: `GM-007-${index}`,
      name: `WebKit catalog fixture ${index + 1}`,
      category: 'لباس عروس اروپایی',
      parentCategory: 'لباس عروس',
      parentCategorySlug,
      categorySlug,
      stock: 1,
      price: 10_000_000 + index,
      isNewImport: false,
      status: 'published',
      photos: [],
      updatedAt: now,
      publishedAt: now,
      variations: [],
    })),
  };
}

test(
  'storefront remains usable across the RM-13 browser matrix',
  async ({ page, context, browserName }, testInfo) => {
    const pageErrors: string[] = [];
    const telemetry: Array<Record<string, unknown>> = [];
    const isConstrained =
      testInfo.project.name === 'chromium-constrained' &&
      browserName === 'chromium';

    page.on('pageerror', error => pageErrors.push(error.message));

    await page.route('**/api/ops/web-vitals', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        telemetry.push(request.postDataJSON() as Record<string, unknown>);
      }
      await route.fulfill({ status: 204, body: '' });
    });

    if (isConstrained) {
      const session = await context.newCDPSession(page);
      await session.send('Network.enable');
      await session.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1_600 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        connectionType: 'cellular3g',
      });
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }

    await page.goto('/?utm_source=rm13', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await expect.poll(() => telemetry.length).toBeGreaterThan(0);

    for (const metric of telemetry) {
      expect(['CLS', 'INP', 'LCP', 'TTFB']).toContain(metric['name']);
      expect(metric['route']).toBe('/');
      expect(String(metric['route'])).not.toContain('?');
      expect(Number.isFinite(metric['value'])).toBe(true);
    }

    if (isConstrained) {
      await expect(page.locator('.home-hero')).toBeVisible();
      await expect(page.locator('#home-hero-title')).toBeVisible();
    } else {
      await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
    }

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
    expect(pageErrors).toEqual([]);
  },
);

test('WebKit renders a delayed catalog snapshot without a reload and reaches every product', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'webkit', 'This regression targets the iPhone/WebKit rendering path.');

  const pageErrors: string[] = [];
  const snapshot = publishedSnapshot();
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route('**/api/ops/web-vitals', route =>
    route.fulfill({ status: 204, body: '' }),
  );
  await page.route('**/api/products/published', async route => {
    await new Promise(resolve => setTimeout(resolve, 1_200));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(snapshot),
    });
  });

  await page.goto('/collections/bridal-clothing', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.collection-page__card')).toHaveCount(20, { timeout: 10_000 });

  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('mazhariPublishedProductsV1') || 'null')?.products?.length ?? 0,
      ),
    )
    .toBe(24);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    if ((await page.locator('.collection-page__card').count()) === 24) break;
    await page.waitForTimeout(100);
  }

  await expect(page.locator('.collection-page__card')).toHaveCount(24);
  await expect(page.locator('.collection-page__card').last()).toBeVisible();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect(page.locator('footer')).toBeVisible();

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    cardContainment: getComputedStyle(
      document.querySelector('.collection-page__card') as HTMLElement,
    ).contentVisibility,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.cardContainment).toBe('visible');
  expect(pageErrors).toEqual([]);
});

test('WebKit drawer lock preserves the page scroll position', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'This regression targets iOS-style body scroll locking.');

  await page.route('**/api/ops/web-vitals', route =>
    route.fulfill({ status: 204, body: '' }),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(600);
  const before = await page.evaluate(() => window.scrollY);

  const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
  await menuToggle.click();
  const drawer = page.getByRole('dialog', { name: 'منوی گالری' });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'بستن منو' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(drawer.getByRole('link', { name: /رزرو مشاوره/ }).last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(drawer.getByRole('button', { name: 'بستن منو' })).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('position', 'fixed');

  await drawer.getByRole('button', { name: 'بستن منو' }).click();
  await expect(drawer).toBeHidden();
  await expect(menuToggle).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  await expect(page.locator('body')).not.toHaveCSS('position', 'fixed');
});

test('storefront navigation stays visible and exposes the complete mobile hierarchy', async ({ page }) => {
  await page.route('**/api/ops/web-vitals', route =>
    route.fulfill({ status: 204, body: '' }),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  const header = page.locator('.luxury-nav');
  const menuToggle = page.getByRole('button', { name: 'باز کردن منوی اصلی' });
  await expect(header).toBeVisible();
  await expect(page.getByLabel('صفحه اصلی گالری مزهری')).toBeVisible();

  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const desktopNav = page.getByRole('navigation', { name: 'منوی اصلی' });
    await expect(desktopNav).toBeVisible();
    await desktopNav.locator('.luxury-nav__menu-group > summary').filter({ hasText: 'پوشاک عروس' }).click();
    await expect(desktopNav.getByText('برای روزی که فقط یک‌بار روایت می‌شود')).toBeVisible();
  } else {
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    const drawer = page.getByRole('dialog', { name: 'منوی گالری' });
    await expect(drawer).toBeVisible();
    await drawer.getByText('پوشاک عروس', { exact: true }).click();
    await expect(drawer.getByText('مشاهده همه پوشاک عروس')).toBeVisible();
    await drawer.getByText('اکسسوری عروس', { exact: true }).click();
    await expect(drawer.locator('.luxury-nav__drawer-nested')).toHaveCount(8);
  }

  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
    menuTarget: document.querySelector('.luxury-nav__menu-toggle')?.getBoundingClientRect().height ?? 0,
    drawerTarget: document.querySelector('.luxury-nav__drawer-group > summary')?.getBoundingClientRect().height ?? 0,
  }));
  expect(metrics.page).toBeLessThanOrEqual(metrics.viewport + 1);
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    expect(metrics.menuTarget).toBeGreaterThanOrEqual(44);
    expect(metrics.drawerTarget).toBeGreaterThanOrEqual(44);
  }
});

for (const target of [
  {
    name: 'category page',
    path: '/shop/bridal-hair-accessories/bridal-tiaras',
    card: '.cat-products__card',
  },
  {
    name: 'catalog page',
    path: '/catalog?category=bridal-tiaras',
    card: '.generic-catalog__card',
  },
]) {
  test(`WebKit refreshes the delayed ${target.name} projection without reload`, async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'webkit', 'This regression targets the iPhone/WebKit rendering path.');

    await page.route('**/api/ops/web-vitals', route =>
      route.fulfill({ status: 204, body: '' }),
    );
    await page.route('**/api/products/published', async route => {
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(publishedSnapshot(3, 'bridal-tiaras', 'bridal-hair-accessories')),
      });
    });

    await page.goto(target.path, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator(target.card)).toHaveCount(3, { timeout: 10_000 });
  });
}
