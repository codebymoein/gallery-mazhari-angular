import { expect, test } from '@playwright/test';

const planner = {
  id: 'planner-1',
  eventDate: '2027-02-14',
  ceremonyTypes: ['wedding'],
  version: 2,
  daysRemaining: 180,
  phase: 'planning',
  progress: { completed: 1, total: 3, percent: 33 },
  tasks: [
    {
      id: 'define-style-direction',
      title: 'استایل کلی مراسم را مشخص کنید',
      description: 'فرم لباس، حس مراسم و اولویت‌های اصلی را مشخص کنید.',
      group: 'foundation',
      daysBefore: 180,
      dueDate: '2026-08-18',
      status: 'completed',
      completed: true,
    },
    {
      id: 'choose-bridal-look',
      title: 'لباس اصلی را انتخاب کنید',
      description: 'مدل‌های مناسب را مقایسه کنید.',
      group: 'style',
      daysBefore: 120,
      dueDate: '2026-10-17',
      status: 'later',
      completed: false,
      action: { kind: 'catalog', target: 'bridal' },
    },
    {
      id: 'final-fitting',
      title: 'پرو نهایی را انجام دهید',
      description: 'فیت لباس و جزئیات نهایی را بررسی کنید.',
      group: 'final',
      daysBefore: 21,
      dueDate: '2027-01-24',
      status: 'later',
      completed: false,
      action: { kind: 'consultation' },
    },
  ],
  createdAt: '2026-08-09T00:00:00.000Z',
  updatedAt: '2026-08-09T00:00:00.000Z',
};

test('guest sees customer authentication before durable planner use', async ({ page }) => {
  await page.route('**/api/auth/profile', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );

  await page.goto('/planner');

  await expect(page.getByRole('heading', { name: 'برنامه‌تان را روی هر دستگاه ادامه دهید' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ورود' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ساخت حساب' })).toBeVisible();
});

test('customer sees server planner and sends versioned task mutation', async ({ page }) => {
  await page.route('**/api/auth/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        userId: 'user-1',
        email: 'bride@example.com',
        role: 'customer',
        permissions: [],
      }),
    }),
  );
  await page.route('**/api/planner/me', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(planner) });
      return;
    }
    await route.continue();
  });

  let taskBody: unknown;
  await page.route('**/api/planner/me/tasks/choose-bridal-look', async (route) => {
    taskBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...planner,
        version: 3,
        progress: { completed: 2, total: 3, percent: 67 },
        tasks: planner.tasks.map((task) =>
          task.id === 'choose-bridal-look' ? { ...task, completed: true, status: 'completed' } : task,
        ),
      }),
    });
  });

  await page.goto('/planner');
  await expect(page.getByText('bride@example.com')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');

  await page.getByText('لباس اصلی را انتخاب کنید').click();
  await expect.poll(() => taskBody).toEqual({ completed: true, version: 2 });
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  await expect(page.getByRole('link', { name: /دیدن کالکشن/ })).toHaveAttribute('href', '/catalog');
});

test('planner route preserves noindex metadata and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/profile', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );

  await page.goto('/planner');
  await expect(page).toHaveTitle(/برنامه‌ریز مراسم/);
  const duration = await page.locator('.planner-button').first().evaluate((element) =>
    getComputedStyle(element).transitionDuration,
  );
  expect(['0s', '0.001ms']).toContain(duration);
});
