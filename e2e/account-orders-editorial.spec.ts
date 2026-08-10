import { expect, test } from "@playwright/test";

const storedOrders = [
  {
    id: "e2e-order-1",
    number: "GM-E2E-1042",
    createdAt: "2026-08-01T09:30:00.000Z",
    status: "pending-payment",
    items: [
      {
        product_id: 991013,
        product_name: "Editorial bridal accessory",
        product_image: "/assets/images/home-hero-bride.webp",
        quantity: 1,
        price: 12_500_000,
      },
    ],
    subtotal: 12_500_000,
    shipping: 0,
    total: 12_500_000,
    shippingMethod: "Pickup",
    paymentMethod: "Online payment",
    customer: {
      firstName: "Test",
      lastName: "Customer",
      phone: "09120000000",
      email: "customer@example.com",
      address: "Test address for responsive order detail",
      city: "Tehran",
      postalCode: "1234567890",
    },
  },
];

const storedCanvas = {
  ids: [991013],
  items: [
    {
      productId: 991013,
      name: "Editorial bridal accessory",
      image: "/assets/images/home-hero-bride.webp",
      addedAt: "2026-08-02T09:30:00.000Z",
    },
  ],
  expiresAt: Date.now() + 60 * 60 * 1000,
};

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.route("**/api/ops/web-vitals", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      "mazhariWeddingTimelinePromptV1",
      JSON.stringify({ dismissUntil: Date.now() + 60 * 60 * 1000 }),
    );
  });
});

test("empty account and order states stay visible at 320px", async ({
  page,
}) => {
  await page.goto("/account");

  await expect(page.locator("#account-title")).toBeVisible();
  await expect(page.locator(".account__quick-link").first()).toBeVisible();
  await expect(page.locator("#activity-title")).toBeVisible();
  await expect(page.locator(".account__activity-empty")).toBeVisible();
  await expect(page.locator(".account__referral")).toBeHidden();

  const account = await page.locator(".account").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const quick = element.querySelector<HTMLElement>(".account__quick-link");
    return {
      left: rect.left,
      right: rect.right,
      viewport: document.documentElement.clientWidth,
      quickTarget: quick?.getBoundingClientRect().height ?? 0,
      background: getComputedStyle(element).backgroundColor,
    };
  });
  expect(account.left).toBeGreaterThanOrEqual(-1);
  expect(account.right).toBeLessThanOrEqual(account.viewport + 1);
  expect(account.quickTarget).toBeGreaterThanOrEqual(44);
  expect(account.background).not.toBe("rgb(255, 255, 255)");

  await page.goto("/orders");
  await expect(page.locator("#orders-title")).toBeVisible();
  await expect(page.locator(".orders__empty")).toBeVisible();
  await expect(page.locator(".orders__btn")).toBeVisible();
});

test("populated account and pending order preserve customer actions", async ({
  page,
}) => {
  await page.addInitScript(
    ({ orders, canvas }) => {
      window.localStorage.setItem("mazhari_orders_v1", JSON.stringify(orders));
      window.localStorage.setItem(
        "mazhariDreamCanvasGuestV1",
        JSON.stringify(canvas),
      );
    },
    { orders: storedOrders, canvas: storedCanvas },
  );

  await page.goto("/account");
  await expect(page.locator(".account__liked-item")).toBeVisible();
  await expect(page.locator(".account__activity-item").first()).toBeVisible();

  await page.goto("/orders");
  const summary = page.locator(".orders__summary");
  await expect(summary).toBeVisible();
  await expect(summary).toHaveAttribute("aria-expanded", "false");
  expect(
    await summary.evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);

  await summary.click();
  await expect(summary).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".orders__detail")).toBeVisible();
  await expect(page.locator(".orders__pay-btn")).toBeVisible();

  const layout = await page.locator(".orders__card").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      viewport: document.documentElement.clientWidth,
    };
  });
  expect(layout.left).toBeGreaterThanOrEqual(-1);
  expect(layout.right).toBeLessThanOrEqual(layout.viewport + 1);
  expect(
    await page
      .locator(".orders__pay-btn")
      .evaluate((element) => element.getBoundingClientRect().height),
  ).toBeGreaterThanOrEqual(44);

  await page.locator(".orders__pay-btn").click();
  await expect(page).toHaveURL(/\/checkout\?order=e2e-order-1$/);
  await expect(page.locator("#checkout-title")).toBeVisible();
});
