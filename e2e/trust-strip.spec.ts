import { expect, test } from '@playwright/test';

const approvedItems = [
  'از سال ۱۳۳۷',
  'مشاوره تخصصی عروس',
  'خرید حضوری و آنلاین',
  'ارسال سریع و مطمئن سراسر ایران',
];

test.describe('GM-042 Step 4 Trust Strip', () => {
  test('follows Hero with a welcome heading and only the four approved claims', async ({ page }) => {
    await page.goto('/');

    const hero = page.locator('.home-hero');
    const strip = page.locator('.trust-strip');
    await expect(strip).toBeVisible();
    await expect(hero).toBeAttached();
    await expect(strip.locator('.trust-strip__title')).toContainText('گالری مظهری');
    const connectorHeight = await strip.locator('.trust-strip__header').evaluate((element) =>
      parseFloat(getComputedStyle(element, '::before').height),
    );
    expect(connectorHeight).toBeGreaterThan(30);
    await expect(strip.locator('.trust-strip__item')).toHaveCount(4);

    for (const label of approvedItems) {
      await expect(strip.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(strip).not.toContainText('گارانتی استرس صفر');
    await expect(strip.locator('.trust-strip__sprite')).toHaveCount(4);
    await expect(strip.locator('svg, .trust-strip__vine, .trust-strip__leaf')).toHaveCount(0);
  });

  test('keeps a compact stable layout without overflow at narrow, mobile and desktop widths', async ({ page }) => {
    test.setTimeout(60_000);
    for (const viewport of [
      { width: 320, height: 700 },
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const items = page.locator('.trust-strip__item');
      await expect(items).toHaveCount(4);

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
      for (const item of await items.all()) await expect(item).toBeVisible();
    }
  });

  test('remains complete and static with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const items = page.locator('.trust-strip__item');
    await expect(items).toHaveCount(4);
    await expect(items.first()).toHaveCSS('animation-name', 'none');
  });
});
