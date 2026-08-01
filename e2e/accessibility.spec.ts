import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const publicRoutes = ['/', '/catalog', '/contact', '/cart', '/admin/login'];

for (const route of publicRoutes) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('app-root')).toBeVisible();

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
  });
}
