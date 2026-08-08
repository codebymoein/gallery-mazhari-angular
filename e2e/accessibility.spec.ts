import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/catalog', '/contact', '/cart', '/checkout', '/admin/login'];
const reflowRoutes = ['/catalog', '/contact', '/admin/login'];

async function expectNoBlockingAxeViolations(page: Parameters<typeof AxeBuilder>[0]['page']) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blockingViolations = result.violations.filter(
    violation =>
      violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(
    blockingViolations,
    blockingViolations
      .map(
        violation =>
          `${violation.id}: ${violation.help}\n${violation.nodes
            .map(node => `  ${node.target.join(' ')}: ${node.failureSummary}`)
            .join('\n')}`,
      )
      .join('\n\n'),
  ).toEqual([]);
}

for (const route of publicRoutes) {
  test(`${route} has no critical or serious axe violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('app-root')).toBeVisible();
    await expectNoBlockingAxeViolations(page);
  });
}

for (const route of reflowRoutes) {
  test(`${route} reflows at 320 CSS pixels without horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(route);
    await expect(page.locator('app-root')).toBeVisible();

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));

    expect(overflow.body).toBeLessThanOrEqual(1);
    expect(overflow.document).toBeLessThanOrEqual(1);
  });
}

test('dream canvas traps keyboard focus and returns it to the opener', async ({ page }) => {
  await page.goto('/catalog');
  const trigger = page.getByRole('button', { name: /باز کردن بوم رویایی من/ });
  await expect(trigger).toBeVisible();

  await trigger.focus();
  await trigger.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'بوم رویایی من' });
  await expect(dialog).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    const focusInsideDialog = await page.evaluate(() => {
      const modal = document.querySelector('#dream-canvas-dialog');
      return Boolean(modal && document.activeElement && modal.contains(document.activeElement));
    });
    expect(focusInsideDialog).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('status and error surfaces use screen-reader announcement semantics', async ({ page }) => {
  await page.goto('/admin/login');

  await expect(page.locator('[role="alert"]')).toHaveCount(0);
  await expect(page.locator('input#admin-username')).toHaveAttribute('type', 'email');
  await expect(page.locator('label[for="admin-username"]')).toBeVisible();
  await expect(page.locator('label[for="admin-password"]')).toBeVisible();

  await page.goto('/catalog');
  const dreamStatus = page.locator('.dream-canvas__announcement');
  await expect(dreamStatus).toHaveAttribute('role', 'status');
  await expect(dreamStatus).toHaveAttribute('aria-live', 'polite');
  await expect(dreamStatus).toHaveAttribute('aria-atomic', 'true');
});
