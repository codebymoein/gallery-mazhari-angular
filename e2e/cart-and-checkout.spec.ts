import { expect, test } from '@playwright/test';

const storedCart = {
  items: [
    {
      product_id: 991001,
      source_id: 'E2E-PRODUCT',
      product_name: 'محصول تست سبد',
      quantity: 1,
      price: 2_500_000,
      added_at: new Date().toISOString(),
    },
  ],
  expiresAt: Date.now() + 60 * 60 * 1000,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(cart => {
    if (!window.localStorage.getItem('mazhari_cart')) {
      window.localStorage.setItem('mazhari_cart', JSON.stringify(cart));
    }
    window.localStorage.setItem(
      'mazhariWeddingTimelinePromptV1',
      JSON.stringify({ dismissUntil: Date.now() + 60 * 60 * 1000 }),
    );
  }, storedCart);
});

test('cart quantity persists across refresh and item can be removed', async ({
  page,
}) => {
  await page.goto('/cart');
  await expect(page.locator('.cart__item')).toHaveCount(1);
  await expect(page.locator('.cart__qty-value')).toHaveText('1');

  await page.locator('.cart__qty-btn').last().click();
  await expect(page.locator('.cart__qty-value')).toHaveText('2');

  await page.reload();
  await expect(page.locator('.cart__qty-value')).toHaveText('2');

  await page.locator('.cart__qty-btn').first().click();
  await expect(page.locator('.cart__qty-value')).toHaveText('1');

  await page.locator('.cart__remove').click();
  await expect(page.locator('.cart__empty')).toBeVisible();
});

test('checkout blocks invalid customer details with accessible errors', async ({
  page,
}) => {
  await page.goto('/checkout');
  await expect(page.locator('#checkout-title')).toBeVisible();
  const timelineDialog = page.locator(
    'dialog[open] .wedding-timeline__close',
  );
  if (await timelineDialog.isVisible()) {
    await timelineDialog.click();
  }
  await expect(page.locator('.ls')).toBeHidden();
  await page.locator('form.checkout__form button[type="submit"]').click();

  await expect(page.locator('[role="alert"]')).not.toHaveCount(0);
  await expect(page.locator('input[name="lastName"]')).toHaveAttribute(
    'aria-invalid',
    'true',
  );

  await page.locator('input[name="lastName"]').fill('آزمایش');
  await page.locator('input[name="phone"]').fill('09123456789');
  await page.locator('input[name="city"]').fill('تهران');
  await page.locator('textarea[name="address"]').fill(
    'نشانی معتبر آزمایشی برای بررسی فرم',
  );
  await page.locator('input[name="postalCode"]').fill('1234567890');
  await page.locator('form.checkout__form button[type="submit"]').click();

  await expect(page.locator('.checkout__step--active')).toContainText('۲');
});
