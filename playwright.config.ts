import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1:4200';
const backendUrl = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Keep E2E runnable with a system Chrome even when Playwright's CDN
    // (and therefore its bundled ffmpeg) is unavailable.
    video: 'off',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env['PLAYWRIGHT_CHANNEL'] ?? 'chrome',
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        channel: process.env['PLAYWRIGHT_CHANNEL'] ?? 'chrome',
      },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'], browserName: 'webkit' },
    },
  ],
  webServer: [
    {
      command: 'npm --prefix backend run start',
      url: `${backendUrl}/api`,
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm start -- --host 127.0.0.1 --port 4200',
      url: frontendUrl,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
