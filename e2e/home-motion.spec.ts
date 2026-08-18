import { expect, test } from '@playwright/test';

test.describe('GM-042 Home Hero', () => {
  test('renders a deterministic first slide with one priority image', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.home-hero');
    const image = hero.locator('.home-hero__media');

    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1 })).toContainText('گالری مظهری');
    await expect(hero.getByRole('heading', { level: 2 })).toHaveText('لباس عروس');
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('src', /home-hero-bride\.webp/);
    await expect(image).toHaveAttribute('loading', 'eager');
    await expect(image).toHaveAttribute('fetchpriority', 'high');
    await expect(hero.getByRole('link', { name: 'مشاهده لباس‌ها' })).toHaveAttribute('href', '/shop/bridal-clothing');
  });

  test('supports one-slide-per-gesture swipe and the personalized-products CTA', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('.home-hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('.home-hero__arrow')).toHaveCount(2);
    await expect(hero.locator('.home-hero__progress, .home-hero__autoplay')).toHaveCount(0);
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      for (const expectedTitle of ['اکسسوری عروس', 'کفش، کتونی و کیف عروس', 'محصولات شخصی‌سازی‌شده']) {
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
        await page.mouse.up();
        await expect(hero.getByRole('heading', { level: 2 })).toHaveText(expectedTitle);
      }
    }
    await expect(hero.getByRole('link', { name: 'ثبت سفارش' })).toHaveAttribute('href', '/personalized-products');
    await expect(hero.locator('.home-hero__media')).toHaveAttribute('loading', 'lazy');
    await expect(hero.locator('.home-hero__media')).toHaveAttribute('fetchpriority', 'low');
  });

  test('disables autoplay and decorative motion for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(3300);
    await expect(page.locator('.home-hero h2')).toHaveText('لباس عروس');
    await expect(page.locator('.home-hero__media')).toHaveCSS('animation-name', 'none');
  });

  test('pauses autoplay while the Hero is focused', async ({ page }) => {
    await page.goto('/');
    await page.locator('.home-hero__cta').focus();
    await page.waitForTimeout(3300);
    await expect(page.locator('.home-hero h2')).toHaveText('لباس عروس');
  });
});

test.describe('personalized products landing', () => {
  test('links only truthful existing request workflows', async ({ page }) => {
    await page.goto('/personalized-products');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('محصولات شخصی‌سازی‌شده');
    await expect(page.locator('.personalized__card')).toHaveCount(6);
    await expect(page.locator('.personalized__card a')).toHaveCount(3);
    await expect(page.locator('.personalized__status')).toHaveCount(3);
    await expect(page.getByRole('link', { name: 'ثبت درخواست' }).nth(0)).toHaveAttribute('href', '/custom-request/dress');
    await expect(page.getByRole('link', { name: 'ثبت درخواست' }).nth(1)).toHaveAttribute('href', '/custom-request/dress');
    await expect(page.getByRole('link', { name: 'ثبت درخواست' }).nth(2)).toHaveAttribute('href', '/custom-request/veil');
  });
});
