import { expect, test } from '@playwright/test';

test.describe('GM-006 home motion foundation', () => {
  test('keeps core content visible while applying finite editorial motion', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('.editorial-hero__title');
    const heroImage = page.locator('.editorial-hero__media');
    const chapter = page.locator('.editorial-hero__chapter');

    await expect(title).toBeVisible();
    await expect(chapter).toBeVisible();

    const motion = await page.evaluate(() => {
      const read = (selector: string) => getComputedStyle(document.querySelector(selector)!);
      return {
        titleAnimation: read('.editorial-hero__title').animationName,
        imageAnimation: read('.editorial-hero__media').animationName,
        chapterAnimation: read('.editorial-hero__chapter').animationName,
      };
    });

    expect(motion.titleAnimation).toContain('gm-editorial-rise');
    expect(motion.imageAnimation).toContain('gm-hero-image-settle');
    expect(motion.chapterAnimation).toContain('gm-chapter-arrive');
    await expect(heroImage).toBeVisible();
  });

  test('disables decorative motion when reduced motion is requested', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const motion = await page.evaluate(() => {
      const read = (selector: string) => getComputedStyle(document.querySelector(selector)!);
      return {
        titleAnimation: read('.editorial-hero__title').animationName,
        imageAnimation: read('.editorial-hero__media').animationName,
        chapterAnimation: read('.editorial-hero__chapter').animationName,
      };
    });

    expect(motion).toEqual({
      titleAnimation: 'none',
      imageAnimation: 'none',
      chapterAnimation: 'none',
    });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('داستان شما');
  });
});
