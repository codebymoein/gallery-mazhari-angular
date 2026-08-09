import { expect, test } from '@playwright/test';

const preferenceKey = 'gallerymazhari:heritage-intro:v1';

async function startAsFirstVisit(page: import('@playwright/test').Page) {
  await page.addInitScript(key => localStorage.removeItem(key), preferenceKey);
  await page.goto('/');
}

test.describe('GM-002 heritage book', () => {
  test('first visit opens the optional story and completion prevents auto-open', async ({ page }) => {
    await startAsFirstVisit(page);

    const dialog = page.getByRole('dialog', { name: /یک داستان، پیش از داستان شما/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'رد کردن' })).toBeVisible();

    await dialog.getByRole('button', { name: /باز کردن کتاب/ }).click();
    await expect(dialog.getByRole('heading', { name: /از سال ۱۳۳۷/ })).toBeVisible();

    await dialog.getByRole('button', { name: 'صفحه بعد' }).click();
    await expect(dialog.getByRole('heading', { name: /هزاران عروس/ })).toBeVisible();

    await dialog.getByRole('button', { name: 'صفحه بعد' }).click();
    await expect(dialog.getByRole('heading', { name: /داستان شما از کجا/ })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /لباس عروس/ })).toHaveAttribute('href', '/catalog');
    await expect(dialog.getByRole('link', { name: /جزئیات استایل/ })).toHaveAttribute(
      'href',
      '/accessories'
    );
    await expect(dialog.getByRole('link', { name: /مشاوره/ })).toHaveAttribute(
      'href',
      '/consultation'
    );

    await dialog.getByRole('button', { name: /ورود به گالری/ }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: /داستان مظهری/ })).toBeVisible();

    expect(await page.evaluate(key => localStorage.getItem(key), preferenceKey)).toBe('seen');

    await page.reload();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: /داستان مظهری/ }).click();
    await expect(dialog).toBeVisible();
  });

  test('skip and Escape always leave the storefront usable', async ({ page }) => {
    await startAsFirstVisit(page);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('.editorial-hero')).toBeVisible();

    await page.getByRole('button', { name: /داستان مظهری/ }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'رد کردن' }).click();
    await expect(dialog).toBeHidden();
  });

  test('reduced motion replaces page turn transforms with a minimal fade', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startAsFirstVisit(page);

    const pageSurface = page.locator('.heritage-book__page');
    await expect(pageSurface).toBeVisible();

    const motion = await pageSurface.evaluate(element => {
      const styles = getComputedStyle(element);
      return {
        animationName: styles.animationName,
        animationDuration: styles.animationDuration,
        transform: styles.transform,
      };
    });

    expect(motion.animationName).toBe('heritage-page-fade');
    expect(motion.transform).toBe('none');
  });

  test('heritage media stays deferred so Home keeps one high-priority LCP image', async ({ page }) => {
    await startAsFirstVisit(page);

    const heritagePriority = await page.locator('.heritage-book__archive-frame img').evaluate(image => ({
      loading: image.getAttribute('loading'),
      fetchpriority: image.getAttribute('fetchpriority'),
    }));
    expect(heritagePriority).toEqual({ loading: 'lazy', fetchpriority: 'low' });

    const heroPriority = await page.locator('.editorial-hero__media').evaluate(image => ({
      loading: image.getAttribute('loading'),
      fetchpriority: image.getAttribute('fetchpriority'),
    }));
    expect(heroPriority).toEqual({ loading: 'eager', fetchpriority: 'high' });
  });
});
