import { expect, test } from '@playwright/test';

const retiredPreferenceKey = 'gallerymazhari:heritage-intro:v1';

test.describe('direct storefront entry', () => {
  test('opens Home immediately without the retired heritage experience', async ({ page }) => {
    await page.addInitScript(key => localStorage.setItem(key, 'seen'), retiredPreferenceKey);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.home-hero')).toBeVisible();
    await expect(page.locator('#home-hero-title')).toBeVisible();
    await expect(page.locator('app-heritage-book')).toHaveCount(0);
    await expect(page.locator('.heritage-book-overlay')).toHaveCount(0);
    await expect(page.locator('.heritage-book-replay')).toHaveCount(0);

    expect(await page.evaluate(key => localStorage.getItem(key), retiredPreferenceKey)).toBe('seen');
  });
});
