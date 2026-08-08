import { expect, test } from '@playwright/test';

test.describe('RM-13 storefront performance hints', () => {
  test('prioritizes only the home LCP image and removes its preload off-route', async ({ page }) => {
    await page.goto('/');

    const preload = page.locator('#mazhari-route-lcp-preload');
    await expect(preload).toHaveAttribute('rel', 'preload');
    await expect(preload).toHaveAttribute('as', 'image');
    await expect(preload).toHaveAttribute('href', /assets\/images\/home-hero-bride\.webp$/);
    await expect(preload).toHaveAttribute('fetchpriority', 'high');

    const bridal = page.locator('.split-hero__panel--bridal .split-hero__media');
    await expect(bridal).toHaveAttribute('loading', 'eager');
    await expect(bridal).toHaveAttribute('fetchpriority', 'high');
    await expect(bridal).toHaveAttribute('width', '1003');
    await expect(bridal).toHaveAttribute('height', '1568');

    const accessories = page.locator('.split-hero__panel--accessories .split-hero__media');
    await expect(accessories).toHaveAttribute('loading', 'lazy');
    await expect(accessories).toHaveAttribute('fetchpriority', 'low');
    await expect(accessories).toHaveAttribute('width', '1000');
    await expect(accessories).toHaveAttribute('height', '1250');

    await page.goto('/catalog');
    await expect(page.locator('#mazhari-route-lcp-preload')).toHaveCount(0);
  });

  test('defers below-fold home category media', async ({ page }) => {
    await page.goto('/');

    const categoryImages = page.locator('.cat-story__img');
    await expect(categoryImages.first()).toHaveAttribute('loading', 'lazy');
    await expect(categoryImages.first()).toHaveAttribute('fetchpriority', 'low');

    const discoveryImages = page.locator('.discover-card__media img');
    await expect(discoveryImages.first()).toHaveAttribute('loading', 'lazy');
    await expect(discoveryImages.first()).toHaveAttribute('fetchpriority', 'low');
  });
});
