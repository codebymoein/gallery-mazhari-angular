import { expect, test, type Page } from '@playwright/test';

async function stubShell(page: Page): Promise<void> {
  await page.route('**/api/ops/web-vitals', route => route.fulfill({ status: 204, body: '' }));
  await page.route('**/api/consultations', route =>
    route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'gm-015-lead' }) }),
  );
}

async function expectStableLayout(page: Page): Promise<void> {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    headingVisibility: getComputedStyle(document.querySelector('h1') as HTMLElement).visibility,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(layout.headingVisibility).toBe('visible');
}

test.describe('GM-015 editorial personal tools', () => {
  test.beforeEach(async ({ page }) => stubShell(page));

  test('keeps Dream Profile usable and preserves the consultation payload', async ({ page }) => {
    let submitted: Record<string, unknown> | undefined;
    await page.route('**/api/consultations', async route => {
      submitted = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ id: 'gm-015-lead' }) });
    });

    await page.goto('/dream-canvas', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'استایل شخصی شما' })).toBeVisible();

    const styleChoice = page.getByRole('button', { name: 'رمانتیک' });
    expect(await styleChoice.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await styleChoice.click();
    await expect(styleChoice).toHaveAttribute('aria-pressed', 'true');

    await page.getByLabel('نام خانوادگی').fill('مظهری');
    await page.getByLabel('شماره موبایل').fill('09121234567');
    await page.getByRole('button', { name: 'ثبت و دریافت پیشنهاد هوشمند' }).click();
    await expect(page.getByText('اطلاعات ثبت شد و پیشنهادهای متناسب در اولویت قرار گرفتند.')).toBeVisible();
    expect(submitted?.['source']).toBe('dream-profile');
    expect((submitted?.['desiredTags'] as string[])).toContain('رمانتیک');
    await expectStableLayout(page);
  });

  test('keeps catalog curation and share feedback available', async ({ page }) => {
    await page.goto('/catalog-builder', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'سازنده کاتالوگ اختصاصی' })).toBeVisible();

    const name = page.getByRole('textbox', { name: 'کاتالوگ اختصاصی' });
    await name.fill('سارا');
    await expect(page.getByText('کاتالوگ اختصاصی سارا', { exact: true })).toBeVisible();

    const remove = page.getByRole('button', { name: /حذف لباس عروس مدل ماهی/ });
    expect(await remove.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    await remove.click();
    await expect(page.getByText('لباس رویایی خود را انتخاب کنید')).toBeVisible();

    await page.getByRole('button', { name: 'ساخت PDF و اشتراک‌گذاری' }).click();
    await expect(page.getByText('کاتالوگ آماده اشتراک‌گذاری است')).toBeVisible();
    await expectStableLayout(page);
  });

  test('removes decorative transitions for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/catalog-builder', { waitUntil: 'domcontentloaded' });
    const duration = await page.locator('.catalog-builder__media > img').first().evaluate(element =>
      Number.parseFloat(getComputedStyle(element).transitionDuration),
    );
    expect(duration).toBeLessThanOrEqual(0.00001);
  });
});
