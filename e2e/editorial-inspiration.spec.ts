import { expect, test, type Page } from '@playwright/test';

const now = new Date().toISOString();

const discountedProducts = [
  {
    id: 'gm-014-discount-veil',
    code: 'GM-014-V01',
    name: 'تور عروس شکوفه',
    category: 'تور عروس',
    parentCategory: 'اکسسوری عروس',
    parentCategorySlug: 'bridal-accessories',
    categorySlug: 'bridal-veils',
    stock: 1,
    price: 12_000_000,
    originalPrice: 12_000_000,
    salePrice: 9_600_000,
    discountPercent: 20,
    status: 'published',
    photos: [{ url: '/assets/images/product-placeholder.webp' }],
    updatedAt: now,
    publishedAt: now,
    variations: [],
  },
  {
    id: 'gm-014-discount-tiara',
    code: 'GM-014-T01',
    name: 'تاج عروس مهتاب',
    category: 'تاج عروس',
    parentCategory: 'اکسسوری مو عروس',
    parentCategorySlug: 'bridal-hair-accessories',
    categorySlug: 'bridal-tiaras',
    stock: 1,
    price: 8_000_000,
    originalPrice: 8_000_000,
    salePrice: 6_800_000,
    discountPercent: 15,
    status: 'published',
    photos: [{ url: '/assets/images/product-placeholder.webp' }],
    updatedAt: now,
    publishedAt: now,
    variations: [],
  },
];

const editorialLook = {
  id: 'gm-014-look',
  slug: 'editorial-bride',
  name: 'عروس باغ ایرانی',
  subtitle: 'ترکیبی آرام برای مراسم عصر',
  story: 'روایتی روشن از تور، تاج و جزئیات دست‌دوز برای یک انتخاب هماهنگ.',
  style: 'EDITORIAL BRIDAL',
  mood: 'لطیف و شاعرانه',
  ceremony: 'عقد و عروسی',
  coverImageUrl: '/assets/images/home-hero-bride.webp',
  images: ['/assets/images/home-hero-bride.webp'],
  hotspots: [{ imageIndex: 0, productCode: 'GM-014-V01', x: 50, y: 42, label: 'تور عروس شکوفه' }],
  productCodes: ['GM-014-V01'],
  products: [{
    id: 'gm-014-discount-veil',
    code: 'GM-014-V01',
    name: 'تور عروس شکوفه',
    category: 'تور عروس',
    price: 9_600_000,
    photos: [{ url: '/assets/images/product-placeholder.webp' }],
  }],
  displayPriority: 1,
};

async function stubPublicData(page: Page): Promise<void> {
  await page.route('**/api/ops/web-vitals', route => route.fulfill({ status: 204, body: '' }));
  await page.route('**/api/discounts/products*', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(discountedProducts) }),
  );
  await page.route(/\/api\/platform\/public\/looks\/[^/?]+(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(editorialLook) }),
  );
  await page.route(/\/api\/platform\/public\/looks(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([editorialLook]) }),
  );
}

async function expectStablePage(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    pageWidth: document.documentElement.scrollWidth,
    headingVisibility: getComputedStyle(document.querySelector('h1') as HTMLElement).visibility,
  }));
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
  expect(layout.headingVisibility).toBe('visible');
}

test.describe('GM-014 editorial inspiration', () => {
  test.beforeEach(async ({ page }) => stubPublicData(page));

  test('keeps discounts visible and filters without changing product routes', async ({ page }) => {
    await page.goto('/discounts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'محصولات دارای تخفیف' })).toBeVisible();
    await expect(page.locator('.product')).toHaveCount(2);

    const filter = page.getByRole('button', { name: 'اکسسوری مو عروس' });
    expect(await filter.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await filter.click();
    await expect(page.locator('.product')).toHaveCount(1);
    await expect(page.locator('.product')).toHaveAttribute('href', '/product/gm-014-discount-tiara');
    await expectStablePage(page);
  });

  test('presents the lookbook as visible editorial chapters', async ({ page }) => {
    await page.goto('/looks', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'استایل‌های کامل عروس' })).toBeVisible();
    await expect(page.locator('.styles-grid > a').first()).toHaveAttribute('href', '/look/editorial-bride');
    await expect(page.getByText('عروس باغ ایرانی')).toBeVisible();
    await expectStablePage(page);
  });

  test('keeps gallery, hotspot and product discovery usable', async ({ page }) => {
    await page.goto('/look/editorial-bride', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'عروس باغ ایرانی' })).toBeVisible();

    const thumbnail = page.locator('.thumbs button');
    const hotspot = page.getByRole('button', { name: 'تور عروس شکوفه' });
    expect(await thumbnail.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    expect(await hotspot.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await hotspot.click();
    await expect(hotspot).toHaveClass(/open/);
    await expect(page.locator('.product-grid a')).toHaveAttribute('href', '/product/GM-014-V01');
    await expectStablePage(page);
  });

  test('removes decorative image transitions for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/looks', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const duration = await page.locator('.styles-grid img').first().evaluate(element =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
    expect(duration).toBeLessThanOrEqual(0.00001);
  });
});
