import { expect, test } from "@playwright/test";

test("landing renders and the dark theme survives a reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const html = page.locator("html");
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Dark theme" })).toHaveAttribute("aria-pressed", "true");

  expect(errors).toEqual([]);
});

// Production prefetches every visible <Link>; a missing route shows up as console 404s.
test("every internal link on the landing resolves", async ({ page, request }) => {
  await page.goto("/");
  const hrefs = await page.locator('a[href^="/"], form[action^="/"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute("href") ?? e.getAttribute("action")),
  );
  for (const href of new Set(hrefs)) {
    expect((await request.get(href!)).status(), href!).toBe(200);
  }
});

test("security headers are set, with a fresh CSP nonce per request", async ({ request }) => {
  const [a, b] = await Promise.all([request.get("/"), request.get("/")]);
  const csp = a.headers()["content-security-policy"];
  expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
  expect(csp).not.toBe(b.headers()["content-security-policy"]);
  expect(a.headers()["x-content-type-options"]).toBe("nosniff");
  expect(a.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(a.headers()["strict-transport-security"]).toContain("max-age=");
});

test("first visit follows the system dark preference", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await context.close();
});

test("signed-out visit to /app redirects to sign-in with a next param", async ({ page }) => {
  await page.goto("/app/prompts?tag=sql");
  await expect(page).toHaveURL("/sign-in?next=%2Fapp%2Fprompts%3Ftag%3Dsql");
});

test("sign-in rejects an invalid email with a text error, keeping the next param", async ({ page }) => {
  await page.goto("/app");
  await page.getByLabel("Email").fill("jane");
  await page.getByRole("button", { name: "Send magic link" }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.locator('input[name="next"]')).toHaveValue("/app");
});
