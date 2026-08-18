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
  test('legacy and monochrome migration tokens are available at runtime', async ({
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
        foundation: {
          surfacePage: read('--surface-page'),
          radiusControl: read('--radius-control'),
          borderDefault: read('--border-default'),
          glassBlur: read('--glass-blur'),
          durationBase: read('--duration-base'),
          easingEditorial: read('--ease-editorial'),
          controlHeight: read('--control-height'),
          headerLayer: read('--z-header'),
          pageGutter: read('--gutter-page'),
        },
        storefrontMigration: {
          page: read('--storefront-surface-page'),
          raised: read('--storefront-surface-raised'),
          text: read('--storefront-text-primary'),
          muted: read('--storefront-text-secondary'),
          divider: read('--storefront-border-subtle'),
          strongBorder: read('--storefront-border-strong'),
          controlRadius: read('--storefront-radius-control'),
          inputRadius: read('--storefront-radius-input'),
          focusRing: read('--storefront-focus-ring'),
          focusOffset: read('--storefront-focus-offset'),
          raisedShadow: read('--storefront-shadow-raised'),
          fast: read('--storefront-duration-fast'),
          base: read('--storefront-duration-base'),
          slow: read('--storefront-duration-slow'),
          revealDistance: read('--storefront-motion-reveal-distance'),
          imageScale: read('--storefront-motion-image-scale'),
          container: read('--storefront-container-max'),
          gutter: read('--storefront-gutter'),
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
    expect(contract.foundation).toEqual({
      surfacePage: '#f5eadc',
      radiusControl: '0.5rem',
      borderDefault: '1px solid #d9c0b1',
      glassBlur: '16px',
      durationBase: '250ms',
      easingEditorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      controlHeight: '2.75rem',
      headerLayer: '1000',
      pageGutter: 'clamp(0.75rem, 3vw, 1.5rem)',
    });
    expect(contract.storefrontMigration).toEqual({
      page: '#ffffff',
      raised: '#f5f5f5',
      text: '#000000',
      muted: '#4f4f4f',
      divider: '1px solid #e8e8e1',
      strongBorder: '1px solid #242424',
      controlRadius: '0.1875rem',
      inputRadius: '0.125rem',
      focusRing: '2px solid #000000',
      focusOffset: '3px',
      raisedShadow: '0 0 1px rgba(0, 0, 0, 0.2)',
      fast: '200ms',
      base: '250ms',
      slow: '300ms',
      revealDistance: '1rem',
      imageScale: '1.03',
      container: '84.4375rem',
      gutter: 'clamp(0.75rem, 4vw, 2rem)',
    });
  });

  test('home editorial opening preserves its accessible heading and LCP priority', async ({
    page,
  }) => {
    await page.goto('/');

    const hero = page.locator('.editorial-hero');
    await expect(hero).toBeVisible();
    await expect(hero.getByRole('heading', { level: 1 })).toHaveText(
      'گالری مظهری؛ پوشاک و اکسسوری عروس',
    );
    const priority = await page.locator('.editorial-hero__media').evaluate((image) => ({
      loading: image.getAttribute('loading'),
      fetchpriority: image.getAttribute('fetchpriority'),
    }));
    expect(priority).toEqual({ loading: 'eager', fetchpriority: 'high' });

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
