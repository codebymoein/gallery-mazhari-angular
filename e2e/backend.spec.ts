import { expect, test } from '@playwright/test';

test('backend health endpoint is reachable', async ({ request }) => {
  const apiUrl = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:3000';
  const response = await request.get(`${apiUrl}/api`);

  expect(response.ok()).toBeTruthy();
  await expect(response.text()).resolves.toContain('Hello World');
});
