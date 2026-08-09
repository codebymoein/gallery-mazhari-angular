import { expect, test } from '@playwright/test';

const expectedTokens = {
  '--color-matte-black': '#2b211d',
  '--color-dark-charcoal': '#3a2a24',
  '--color-champagne-gold': '#b78b62',
  '--color-gold-primary': '#8f4050',
  '--color-bg-cream': '#f5eadc',
  '--color-surface': '#fff6ec',
  '--color-text-main': '#3a2a24',
  '--color-text-muted': '#6d554c',
} as const;

test.describe('design-system contract', () => {
  test('canonical editorial palette and font tokens are available at runtime', async ({
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
        motion: {
          editorial: read('--transition-editorial'),
          editorialFast: read('--transition-editorial-fast'),
        },
      };
    });

    expect(contract.colors).toEqual(expectedTokens);
    expect(contract.fonts.persian).toContain('IRANSansX');
    expect(contract.fonts.persian).toContain('YekanBakh');
    expect(contract.fonts.display).toContain('YekanBakh');
    expect(contract.fonts.display).toContain('IRANSansX');
    expect(contract.fonts.english).toContain('Inter');
    expect(contract.fonts.serifEnglish).toContain('Playfair Display');
    expect(contract.motion.editorial).toContain('900ms');
    expect(contract.motion.editorialFast).toContain('550ms');
  });

  test('home editorial opening preserves semantic actions and LCP priority', async ({
    page,
  }) => {
    await page.goto('/');

    const hero = page.locator('.editorial-hero');
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1 })).toContainText('داستان شما');
    await expect(hero.getByRole('link', { name: /مشاهده کالکشن/ })).toHaveAttribute(
      'href',
      '/catalog'
    );
    await expect(hero.getByRole('link', { name: /رزرو مشاوره/ })).toHaveAttribute(
      'href',
      '/consultation'
    );

    const priority = await page.locator('.editorial-hero__media').evaluate((image) => ({
      loading: image.getAttribute('loading'),
      fetchpriority: image.getAttribute('fetchpriority'),
    }));
    expect(priority).toEqual({ loading: 'eager', fetchpriority: 'high' });

    const secondary = await page
      .locator('.editorial-hero__chapter img')
      .evaluate((image) => ({
        loading: image.getAttribute('loading'),
        fetchpriority: image.getAttribute('fetchpriority'),
      }));
    expect(secondary).toEqual({ loading: 'lazy', fetchpriority: 'low' });
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
