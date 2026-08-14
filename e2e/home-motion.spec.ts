import { expect, test } from '@playwright/test';

test.describe('GM-006 / GM-039 Home opening', () => {
  test('renders the image-led opening and preserves the LCP image contract', async ({ page }) => {
    await page.goto('/');

    const heroImage = page.locator('.editorial-hero__media');
    const bridalEntry = page.getByRole('link', { name: 'پوشاک عروس', exact: true });
    const accessoryEntry = page.getByRole('link', { name: 'فروشگاه اکسسوری', exact: true });

    await expect(heroImage).toBeVisible();
    await expect(heroImage).toHaveAttribute('loading', 'eager');
    await expect(heroImage).toHaveAttribute('fetchpriority', 'high');
    await expect(bridalEntry).toBeVisible();
    await expect(accessoryEntry).toBeVisible();
    await expect(bridalEntry).toHaveAttribute('href', '/catalog');
    await expect(accessoryEntry).toHaveAttribute('href', '/accessories');

    await expect(page.locator('.editorial-hero__copy')).toHaveCount(0);
    await expect(page.locator('.editorial-hero__chapter')).toHaveCount(0);
    await expect(page.locator('.editorial-hero__veil')).toHaveCount(0);
    await expect(page.locator('h1.sr-only')).toContainText('گالری مظهری');

    const motion = await page.evaluate(() => {
      const read = (selector: string) => getComputedStyle(document.querySelector(selector)!);
      return {
        imageAnimation: read('.editorial-hero__media').animationName,
        entryAnimation: read('.editorial-entry-action').animationName,
      };
    });

    expect(motion.imageAnimation).toContain('gm-hero-image-settle');
    expect(motion.entryAnimation).toContain('gm-editorial-rise');
  });

  test('keeps both store entries side by side on narrow mobile and desktop', async ({ page }) => {
    for (const viewport of [
      { width: 320, height: 700 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const bridalEntry = page.getByRole('link', { name: 'پوشاک عروس', exact: true });
      const accessoryEntry = page.getByRole('link', { name: 'فروشگاه اکسسوری', exact: true });
      const bridalBox = await bridalEntry.boundingBox();
      const accessoryBox = await accessoryEntry.boundingBox();

      expect(bridalBox).not.toBeNull();
      expect(accessoryBox).not.toBeNull();

      if (bridalBox && accessoryBox) {
        expect(Math.abs(bridalBox.y - accessoryBox.y)).toBeLessThanOrEqual(1);
        expect(bridalBox.width).toBeGreaterThan(0);
        expect(accessoryBox.width).toBeGreaterThan(0);
        expect(bridalBox.height).toBeGreaterThanOrEqual(44);
        expect(accessoryBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('disables decorative opening motion when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const motion = await page.evaluate(() => {
      const read = (selector: string) => getComputedStyle(document.querySelector(selector)!);
      return {
        imageAnimation: read('.editorial-hero__media').animationName,
        entryAnimation: read('.editorial-entry-action').animationName,
      };
    });

    expect(motion).toEqual({
      imageAnimation: 'none',
      entryAnimation: 'none',
    });
    await expect(page.locator('h1.sr-only')).toContainText('گالری مظهری');
  });
});
