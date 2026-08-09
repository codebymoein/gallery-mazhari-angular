import { expect, test } from '@playwright/test';

test(
  'storefront remains usable across the RM-13 browser matrix',
  async ({ page, context, browserName }, testInfo) => {
    const pageErrors: string[] = [];
    const telemetry: Array<Record<string, unknown>> = [];
    const isConstrained =
      testInfo.project.name === 'chromium-constrained' &&
      browserName === 'chromium';

    page.on('pageerror', error => pageErrors.push(error.message));

    await page.route('**/api/ops/web-vitals', async route => {
      const request = route.request();
      if (request.method() === 'POST') {
        telemetry.push(request.postDataJSON() as Record<string, unknown>);
      }
      await route.fulfill({ status: 204, body: '' });
    });

    if (isConstrained) {
      const session = await context.newCDPSession(page);
      await session.send('Network.enable');
      await session.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1_600 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        connectionType: 'cellular3g',
      });
      await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }

    await page.goto('/?utm_source=rm13', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
    await expect.poll(() => telemetry.length).toBeGreaterThan(0);

    for (const metric of telemetry) {
      expect(['CLS', 'INP', 'LCP', 'TTFB']).toContain(metric['name']);
      expect(metric['route']).toBe('/');
      expect(String(metric['route'])).not.toContain('?');
      expect(Number.isFinite(metric['value'])).toBe(true);
    }

    if (isConstrained) {
      await expect(page.locator('.editorial-hero')).toBeVisible();
      await expect(page.locator('#home-hero-title')).toBeVisible();
    } else {
      await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
    }

    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
    expect(pageErrors).toEqual([]);
  },
);
