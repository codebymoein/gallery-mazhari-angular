import { expect, test } from '@playwright/test';

const expectedTokens = {
  '--color-matte-black': '#656561',
  '--color-dark-charcoal': '#484846',
  '--color-champagne-gold': '#9d7937',
  '--color-gold-primary': '#89682f',
  '--color-bg-cream': '#f4f3f0',
  '--color-surface': '#fbfaf8',
  '--color-text-main': '#555552',
  '--color-text-muted': '#666560',
} as const;

test.describe('RM-08 design-system contract', () => {
  test('canonical palette and font tokens are available at runtime', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('app-root')).toBeVisible();

    const contract = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      const read = (name: string) => styles.getPropertyValue(name).trim();

      return {
        colors: {
          '--color-matte-black': read('--color-matte-black'),
          '--color-dark-charcoal': read('--color-dark-charcoal'),
          '--color-champagne-gold': read('--color-champagne-gold'),
          '--color-gold-primary': read('--color-gold-primary'),
          '--color-bg-cream': read('--color-bg-cream'),
          '--color-surface': read('--color-surface'),
          '--color-text-main': read('--color-text-main'),
          '--color-text-muted': read('--color-text-muted'),
        },
        fonts: {
          persian: read('--font-persian'),
          display: read('--font-display'),
          english: read('--font-english'),
          serifEnglish: read('--font-serif-en'),
        },
      };
    });

    expect(contract.colors).toEqual(expectedTokens);
    expect(contract.fonts.persian).toContain('IRANSansX');
    expect(contract.fonts.persian).toContain('YekanBakh');
    expect(contract.fonts.display).toBe(contract.fonts.persian);
    expect(contract.fonts.english).toContain('Inter');
    expect(contract.fonts.serifEnglish).toContain('Playfair Display');
  });

  test('representative public pages produce mobile/desktop visual evidence', async ({
    page,
  }, testInfo) => {
    for (const route of ['/', '/catalog']) {
      await page.goto(route);
      await expect(page.locator('app-root')).toBeVisible();

      const safeName = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${safeName}-${testInfo.project.name}`, {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  });
});
