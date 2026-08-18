import { expect, test } from '@playwright/test';

test.describe('GM-042 Step 5 Home composition', () => {
  test('keeps the approved current sections in a coherent order', async ({ page }) => {
    await page.goto('/');

    const order = await page.locator('[data-home-section]').evaluateAll((sections) =>
      sections.map((section) => section.getAttribute('data-home-section')),
    );

    expect(order).toEqual([
      'trust',
      'categories',
      'offers',
      'discovery',
      'appointment',
      'lookbook',
      'real-brides',
      'heritage',
      'guide-faq',
    ]);
  });

  test('places Heritage near the end and avoids horizontal overflow on phones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const heritage = page.locator('[data-home-section="heritage"]');
    await expect(heritage).toBeVisible();
    await expect(heritage).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(false);
  });
});
