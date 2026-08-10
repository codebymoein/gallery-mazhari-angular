import { expect, test } from "@playwright/test";

const leafletStub = `
  window.L = {
    map: function () {
      return {
        setView: function () { return this; },
        on: function () {},
        invalidateSize: function () {},
        remove: function () {},
        panTo: function () {}
      };
    },
    tileLayer: function () { return { addTo: function () {} }; },
    marker: function () {
      return {
        addTo: function () { return { setLatLng: function () {} }; }
      };
    }
  };
`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("**/api/ops/web-vitals", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await page.route(
    "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
    (route) =>
      route.fulfill({ status: 200, contentType: "text/css", body: "" }),
  );
  await page.route("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/javascript",
      body: leafletStub,
    }),
  );
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mazhariWeddingTimelinePromptV1",
      JSON.stringify({ dismissUntil: Date.now() + 60 * 60 * 1000 }),
    );
  });
});

test("consultation stays visible and touch-safe at 320px", async ({ page }) => {
  await page.goto("/consultation");

  await expect(page.locator("#home-appointment-title")).toBeVisible();
  await expect(page.locator(".consult-form__progress")).toBeVisible();
  await expect(page.locator(".consult-form__step:not([hidden])")).toBeVisible();

  const form = await page
    .locator(".home-appointment__form-card")
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const action = element.querySelector<HTMLElement>(
        ".consult-form__btn--next",
      );
      return {
        left: rect.left,
        right: rect.right,
        viewport: document.documentElement.clientWidth,
        actionHeight: action?.getBoundingClientRect().height ?? 0,
      };
    });
  expect(form.left).toBeGreaterThanOrEqual(-1);
  expect(form.right).toBeLessThanOrEqual(form.viewport + 1);
  expect(form.actionHeight).toBeGreaterThanOrEqual(44);
});

test("custom request keeps its calendar, upload and consent journey", async ({
  page,
}) => {
  await page.goto("/custom-request/veil");

  await expect(page.locator(".custom-page__intro h1")).toBeVisible();
  await expect(page.locator(".consult-form__calendar")).toBeVisible();
  await page
    .locator(".consult-form__step:not([hidden]) .consult-form__btn--next")
    .click();
  await expect(page.locator('input[name="phone"]')).toBeVisible();
  await page
    .locator(".consult-form__step:not([hidden]) .consult-form__btn--next")
    .click();
  await expect(
    page.locator('.custom-form__upload input[type="file"]'),
  ).toBeVisible();
  await expect(page.locator(".consult-form__consent")).toBeVisible();

  const custom = await page.locator(".custom-form").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const submit = element.querySelector<HTMLElement>(
      ".consult-form__btn--submit",
    );
    return {
      left: rect.left,
      right: rect.right,
      viewport: document.documentElement.clientWidth,
      submitHeight: submit?.getBoundingClientRect().height ?? 0,
    };
  });
  expect(custom.left).toBeGreaterThanOrEqual(-1);
  expect(custom.right).toBeLessThanOrEqual(custom.viewport + 1);
  expect(custom.submitHeight).toBeGreaterThanOrEqual(44);
});

test("home trial keeps core fields visible when the selection is empty", async ({
  page,
}) => {
  const ssrResponse = await page.request.get("/home-trial");
  expect(ssrResponse.ok()).toBe(true);
  expect(await ssrResponse.text()).toContain('class="hero"');

  await page.goto("/home-trial");

  await expect(page.locator(".hero h1")).toBeVisible();
  await expect(page.locator(".selection .empty")).toBeVisible();
  await expect(page.locator(".details")).toBeVisible();
  await expect(page.locator(".map")).toBeVisible();
  await expect(page.locator(".pay")).toBeVisible();
  await expect(page.locator(".pay")).toBeDisabled();

  const trial = await page.locator(".trial").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const input = element.querySelector<HTMLElement>('input[name="name"]');
    const pay = element.querySelector<HTMLElement>(".pay");
    return {
      left: rect.left,
      right: rect.right,
      viewport: document.documentElement.clientWidth,
      inputHeight: input?.getBoundingClientRect().height ?? 0,
      payHeight: pay?.getBoundingClientRect().height ?? 0,
    };
  });
  expect(trial.left).toBeGreaterThanOrEqual(-1);
  expect(trial.right).toBeLessThanOrEqual(trial.viewport + 1);
  expect(trial.inputHeight).toBeGreaterThanOrEqual(44);
  expect(trial.payHeight).toBeGreaterThanOrEqual(44);
});
