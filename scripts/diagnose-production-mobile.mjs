import { chromium, devices } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome' });
for (const viewport of [
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'pixel-7', ...devices['Pixel 7'].viewport },
]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  });
  await page.goto('https://gallerymazhari.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += Math.floor(viewport.height * 0.7)) {
    await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1200);
  const report = await page.locator('body').evaluate(body => ({
    scrollHeight: body.scrollHeight,
    clientHeight: body.clientHeight,
    scrollWidth: body.scrollWidth,
    clientWidth: body.clientWidth,
    overflow: getComputedStyle(body).overflow,
    images: [...body.querySelectorAll('img')].map(image => ({
      src: image.currentSrc || image.src,
      alt: image.alt,
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      hidden: image.hidden,
    })).filter(image => !image.naturalWidth || image.hidden),
    children: [...body.querySelectorAll('main section, main > *')].map((element, index) => {
      const rect = element.getBoundingClientRect();
      return {
        index,
        tag: element.tagName,
        className: element.className,
        top: Math.round(rect.top + scrollY),
        height: Math.round(rect.height),
        display: getComputedStyle(element).display,
        visibility: getComputedStyle(element).visibility,
      };
    }),
  }));
  await page.screenshot({ path: `test-results/production-${viewport.name}.png`, fullPage: true });
  console.log(JSON.stringify({ viewport: viewport.name, report, errors }, null, 2));
  await context.close();
}
await browser.close();
