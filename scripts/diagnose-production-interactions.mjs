import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome' });
for (const width of [320, 390, 430]) {
  const context = await browser.newContext({
    viewport: { width, height: 800 },
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('console', message => message.type() === 'error' && errors.push(`console: ${message.text()}`));
  page.on('response', response => response.status() >= 400 && errors.push(`${response.status()}: ${response.url()}`));

  await page.goto('https://gallerymazhari.com/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const home = {
    title: await page.locator('#discover-title').textContent(),
    cards: await page.locator('.discover-card').count(),
    form: await page.locator('app-consultation-form form').count(),
    bodyText: (await page.locator('body').innerText()).length
  };

  const firstCard = page.locator('.discover-card').first();
  await firstCard.scrollIntoViewIfNeeded();
  const target = await firstCard.getAttribute('href');
  await firstCard.click();
  await page.waitForURL(url => url.pathname.startsWith('/shop/'), { timeout: 10000 });
  await page.waitForTimeout(750);
  const category = { target, url: page.url(), bodyText: (await page.locator('body').innerText()).length };

  await page.goto('https://gallerymazhari.com/consultation', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const form = {
    url: page.url(),
    forms: await page.locator('app-consultation-form form').count(),
    stepOneVisible: await page.locator('.consult-form__step').first().isVisible().catch(() => false),
    buttons: await page.locator('.consult-form button').count(),
    bodyText: (await page.locator('body').innerText()).length
  };
  console.log(JSON.stringify({ width, home, category, form, errors }, null, 2));
  await context.close();
}
await browser.close();
