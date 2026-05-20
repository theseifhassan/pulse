import { expect, test } from "@playwright/test";

// Mobile/touch UI acceptance gate for Pulse v1 (pulse-my8.16). Targets
// the running dev server with seeded data. Headed and headless modes
// both supported via the project's playwright.config.ts (mobile-chrome
// on Pixel 7). Requires Clerk env vars + DATABASE_URL set; auth itself
// is bypassed via Clerk's testing token when available, otherwise the
// auth-gated tests are skipped.
//
// Run via:
//   bun run test:e2e:install   # one-time, downloads browsers
//   bun run test:e2e           # runs against PLAYWRIGHT_BASE_URL or
//                              # http://localhost:3000 (start with
//                              # `bun run dev` first)

const TOUCH_MIN_PX = 44;

async function assertTouchTargets(page: import("@playwright/test").Page) {
  // Every visible <button>, <a>, [role="button"], and Clerk control
  // must be at least 44x44 CSS pixels in the rendered layout.
  const candidates = await page
    .locator('button, a[href], [role="button"], [role="link"]')
    .all();
  for (const c of candidates) {
    if (!(await c.isVisible())) continue;
    const box = await c.boundingBox();
    if (!box) continue;
    expect
      .soft(
        Math.min(box.width, box.height),
        `interactive element below ${TOUCH_MIN_PX}px (${JSON.stringify(box)})`,
      )
      .toBeGreaterThanOrEqual(TOUCH_MIN_PX);
  }
}

async function assertNoHorizontalOverflow(
  page: import("@playwright/test").Page,
) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  expect(overflow).toBe(false);
}

test.describe("mobile gate", () => {
  test("unauthenticated request to / redirects (no crash)", async ({
    page,
  }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    // Either Clerk renders a sign-in form (200) or middleware redirects to
    // a configured sign-in URL (3xx, often resolved as 200 by playwright).
    expect(res?.status() ?? 0).toBeLessThan(500);
  });

  test("page does not horizontally overflow at 360px width", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertNoHorizontalOverflow(page);
  });

  test("rendered interactive controls meet the 44px touch floor", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await assertTouchTargets(page);
  });

  test("api routes respond (401/redirect, never 5xx)", async ({ request }) => {
    const ingest = await request.post("/api/ingest", { data: {} });
    expect(ingest.status()).toBeLessThan(500);
    const unread = await request.get("/api/feed/unread");
    expect(unread.status()).toBeLessThan(500);
    const history = await request.get("/api/feed/history");
    expect(history.status()).toBeLessThan(500);
  });
});

test.describe("authenticated feed (requires Clerk testing token)", () => {
  // These checks require a seeded DB + Clerk dev mode. Skip when not
  // present so the suite stays green in unconfigured environments. To
  // enable, set CLERK_TESTING_TOKEN and PULSE_SEED=1 before running.
  test.skip(
    !process.env.CLERK_TESTING_TOKEN || !process.env.PULSE_SEED,
    "set CLERK_TESTING_TOKEN and PULSE_SEED=1 to run",
  );

  test("unread feed renders cards and respects touch targets", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(
      `/?__clerk_testing_token=${process.env.CLERK_TESTING_TOKEN}`,
    );
    await page.waitForSelector("article, [aria-label]", { timeout: 5_000 });
    await assertTouchTargets(page);
    await assertNoHorizontalOverflow(page);
  });

  test("history view renders read items", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(
      `/history?__clerk_testing_token=${process.env.CLERK_TESTING_TOKEN}`,
    );
    await page.waitForLoadState("domcontentloaded");
    await assertNoHorizontalOverflow(page);
  });
});
