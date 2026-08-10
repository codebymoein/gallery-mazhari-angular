import { expect, test } from '@playwright/test';

async function stubStorefrontShell(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/api/ops/web-vitals', route =>
    route.fulfill({ status: 204, body: '' }),
  );
  await page.route('**/api/appearance', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        categoryImages: {
          'bridal-clothing': '/assets/images/does-not-exist.webp',
        },
        subcategoryImages: {},
        categoryOrder: [],
        subcategoryOrder: {},
      }),
    }),
  );
}

test.describe('GM-011 editorial Home and Footer', () => {
  test.beforeEach(async ({ page }) => {
    await stubStorefrontShell(page);
  });

  test('keeps the editorial journey visible, usable and free of horizontal overflow', async ({ page }) => {
    const appearanceLoaded = page.waitForResponse(response => response.url().endsWith('/api/appearance'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await appearanceLoaded;

    const hero = page.locator('.editorial-hero');
    const heroCopy = page.locator('.editorial-hero__copy');
    await expect(hero).toBeVisible();
    await expect(page.locator('#home-hero-title')).toBeVisible();
    await expect(heroCopy).toHaveCSS('animation-name', 'none');
    await expect(page.getByRole('link', { name: /مشاهده کالکشن/ })).toHaveAttribute('href', '/catalog');
    await expect(page.getByRole('link', { name: 'رزرو مشاوره', exact: true })).toHaveAttribute('href', '/consultation');

    await page.evaluate(() => document.querySelector('.cat-showcase')?.scrollIntoView());
    const categoryImage = page.locator('.cat-story__img:visible, .cat-card__img:visible').first();
    await expect(categoryImage).toHaveAttribute('src', /assets\/images\/cat-bridal-clothing\.webp/);
    await expect
      .poll(() => categoryImage.evaluate(image => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    const footer = page.locator('.luxury-footer');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(footer).toHaveCSS('background-color', 'rgb(249, 240, 229)');

    const quickLinks = footer.getByRole('button', { name: 'دسترسی سریع' });
    const accessoryLink = footer.getByRole('link', { name: 'فروشگاه اکسسوری' });
    if (!(await accessoryLink.isVisible())) await quickLinks.click();
    await expect(accessoryLink).toBeVisible();
    await expect(footer.getByRole('link', { name: 'ارتباط با ما' })).toHaveAttribute('href', '/contact');

    const width = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  });

  test('honors reduced motion without hiding core Home or Footer content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#home-hero-title')).toBeVisible();
    await page.locator('.luxury-footer').scrollIntoViewIfNeeded();
    await expect(page.locator('.luxury-footer__brand-name h2')).toBeVisible();
    const transitionSeconds = await page.locator('.luxury-footer__top').evaluate(element =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
    expect(transitionSeconds).toBeLessThanOrEqual(0.00001);
  });
});
