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

test("first visit follows the system dark preference", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await context.close();
});
