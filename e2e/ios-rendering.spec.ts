import { expect, test, type Page } from '@playwright/test';

const IOS_PRODUCT = {
  id: 'ios-scroll-test',
  code: 'IOS-SCROLL-001',
  name: 'محصول تست نمایش آیفون',
  category: 'اکسسوری ویژه عروس',
  parentCategory: 'اکسسوری عروس',
  parentCategorySlug: 'bridal-accessories',
  categorySlug: 'special-bridal-accessories',
  stock: 4,
  price: 28_000_000,
  isNewImport: false,
  status: 'published',
  enrichment: {
    additionalDescription:
      'این توضیح بلند برای کنترل نمایش کامل صفحه محصول هنگام پیمایش در WebKit استفاده می‌شود.',
  },
  photos: [
    {
      url: 'assets/images/cat-special.webp',
      fileName: 'cat-special.webp',
      addedAt: '2026-08-05T00:00:00.000Z',
    },
  ],
  importedAt: '2026-08-05T00:00:00.000Z',
  publishedAt: '2026-08-05T00:00:00.000Z',
};

async function assertDocumentScroller(page: Page): Promise<void> {
  const state = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    return {
      rootOverflowY: rootStyle.overflowY,
      bodyOverflowY: bodyStyle.overflowY,
      rootHeight: document.documentElement.scrollHeight,
      bodyHeight: document.body.scrollHeight,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  expect(state.rootOverflowY).not.toBe('hidden');
  expect(state.bodyOverflowY).not.toBe('hidden');
  expect(state.bodyOverflowY).not.toBe('auto');
  expect(state.scrollWidth).toBeLessThanOrEqual(state.viewportWidth + 1);
  expect(state.rootHeight).toBeGreaterThanOrEqual(state.bodyHeight - 1);
}

async function scrollThroughAndPaint(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    viewport: window.innerHeight,
  }));
  const lastTop = Math.max(0, metrics.height - metrics.viewport);
  const naturalSteps = Math.max(1, Math.ceil(lastTop / Math.max(240, metrics.viewport * 0.72)));
  const checkpoints = Math.min(10, naturalSteps);

  for (let index = 0; index < checkpoints; index += 1) {
    const top = Math.round((lastTop * index) / checkpoints);
    await page.evaluate((nextTop) => window.scrollTo(0, nextTop), top);
    await page.evaluate(
      () => new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
    );
    const frame = await page.screenshot();
    expect(frame.byteLength).toBeGreaterThan(4_000);
  }

  await page.evaluate((top) => window.scrollTo(0, top), lastTop);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
}

async function assertPortraitDomeCards(page: Page, selector: string): Promise<void> {
  const cards = page.locator(selector);
  await expect(cards.first()).toBeVisible();
  const geometry = await cards.evaluateAll((elements) =>
    elements.slice(0, 8).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        width: rect.width,
        height: rect.height,
        topRadius: parseFloat(style.borderTopLeftRadius),
        bottomRadius: parseFloat(style.borderBottomLeftRadius),
      };
    }),
  );

  expect(geometry.length).toBeGreaterThan(1);
  expect(geometry.every((card) => card.height > card.width)).toBe(true);
  expect(new Set(geometry.map((card) => Math.round(card.height))).size).toBeGreaterThan(1);
  expect(geometry[0].topRadius).toBeGreaterThan(geometry[0].bottomRadius);
  expect(geometry[1].bottomRadius).toBeGreaterThan(geometry[1].topRadius);
}

test.describe('iPhone WebKit rendering regressions', () => {
  test('long product page remains painted through the final sections', async ({
    page,
  }) => {
    await page.context().addInitScript((product) => {
      localStorage.setItem('mazhariPublishedProductsV1', JSON.stringify([product]));
    }, IOS_PRODUCT);
    await page.route('**/api/products/published', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([IOS_PRODUCT]) }),
    );

    await page.goto('/product/ios-scroll-test');
    await expect(page.locator('.bridal-product__hero')).toBeVisible();
    await expect(page.locator('.bridal-product__additional').last()).toBeVisible();
    await expect(page.locator('.bridal-product__description-more')).toHaveCount(0);
    const descriptionToggle = page.locator('.bridal-product__description-toggle');
    await expect(descriptionToggle).toHaveAttribute('aria-expanded', 'false');
    await descriptionToggle.click();
    await expect(page.locator('.bridal-product__description-more')).toBeVisible();
    await expect(descriptionToggle).toHaveAttribute('aria-expanded', 'true');

    await assertDocumentScroller(page);
    await scrollThroughAndPaint(page);

    await page.locator('.bridal-product__additional').last().scrollIntoViewIfNeeded();
    await expect(page.locator('.bridal-product__additional').last()).toBeInViewport();
    await expect(page.locator('app-footer')).toBeVisible();
  });

  test('public routes keep the document as the single scroller', async ({ page }) => {
    test.setTimeout(90_000);
    for (const route of ['/', '/catalog', '/contact', '/consultation', '/cart']) {
      await page.goto(route);
      await expect(page.locator('app-root')).toBeVisible();
      await assertDocumentScroller(page);
      await scrollThroughAndPaint(page);
    }
  });

  test('category imagery follows the portrait alternating-dome UI law', async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto('/');
    await assertPortraitDomeCards(page, '.cat-story');
    await assertPortraitDomeCards(page, '.discover-card__media');

    await page.goto('/shop/bridal-clothing');
    await assertPortraitDomeCards(page, '.cat-hub__card');

    await page.goto('/accessories');
    await assertPortraitDomeCards(page, '.accessory-store__card');

    await page.goto('/catalog');
    await assertPortraitDomeCards(page, '.bridal-catalog__chip');

    await page.evaluate(() => document.fonts.ready);
    const yekan = await page.evaluate(() => ({
      bodyFamily: getComputedStyle(document.body).fontFamily,
      loadedFaces: Array.from(document.fonts)
        .filter((face) => face.status === 'loaded')
        .map((face) => face.family),
    }));
    expect(yekan.bodyFamily).toContain('Mazhari Yekan');
    expect(yekan.loadedFaces.some((family) => family.includes('Mazhari Yekan'))).toBe(true);
  });

  test('enterprise login and console retain their visual system on iPhone', async ({
    page,
  }) => {
    await page.goto('/admin/login');
    const loginCard = page.locator('.login__card');
    await expect(loginCard).toBeVisible();
    await expect(loginCard).toHaveCSS('display', 'block');

    const loginVisual = await loginCard.evaluate((element) => {
      const style = getComputedStyle(element);
      const input = getComputedStyle(element.querySelector('.adm-input')!);
      const button = getComputedStyle(element.querySelector('.adm-btn--gold')!);
      return {
        background: style.backgroundImage,
        radius: parseFloat(style.borderRadius),
        shadow: style.boxShadow,
        inputRadius: parseFloat(input.borderRadius),
        buttonBackground: button.backgroundImage,
      };
    });
    expect(loginVisual.background).not.toBe('none');
    expect(loginVisual.radius).toBeGreaterThan(10);
    expect(loginVisual.shadow).not.toBe('none');
    expect(loginVisual.inputRadius).toBeGreaterThan(6);
    expect(loginVisual.buttonBackground).not.toBe('none');
    await assertDocumentScroller(page);

    await page.context().addInitScript(() => {
      sessionStorage.setItem('mazhari_admin_session', JSON.stringify({
        username: 'ios-test@example.com',
        displayName: 'مدیر تست آیفون',
        role: 'manager',
        permissions: [],
      }));
    });
    await page.goto('/admin/dashboard');
    await expect(page.locator('.shell')).toBeVisible();
    await expect(page.locator('.adm-page')).toBeVisible();
    await expect(page.locator('.adm-card').first()).toBeVisible();

    const consoleVisual = await page.locator('.adm-card').first().evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundImage,
        radius: parseFloat(style.borderRadius),
        shadow: style.boxShadow,
      };
    });
    expect(consoleVisual.background).not.toBe('none');
    expect(consoleVisual.radius).toBeGreaterThan(8);
    expect(consoleVisual.shadow).not.toBe('none');
    await assertDocumentScroller(page);
  });
});
