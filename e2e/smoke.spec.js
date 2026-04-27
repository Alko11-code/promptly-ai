import { test, expect } from "@playwright/test";

test.describe("Smoke Test — Quick Sanity Check", () => {
  test("happy path: land → start → free mode → see app", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 1. Landing visible
    await expect(page.locator("h1")).toContainText("Promptly");

    // 2. Click Get Started
    await page.getByRole("button", { name: /Get Started/i }).click();

    // 3. Welcome shows after loading
    await expect(page.getByText(/Try for free/i)).toBeVisible({ timeout: 5000 });

    // 4. Pick free mode
    await page.getByText(/Try for free/i).click();

    // 5. Main app loads
    await expect(page.getByText("Free trial active")).toBeVisible();
    await expect(page.locator("textarea")).toBeVisible();

    // Take screenshot for portfolio!
    await page.screenshot({ path: "test-results/smoke-test-success.png", fullPage: true });
  });

  test("library tab is accessible", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("promptly_landed", "1");
      localStorage.setItem("promptly_mode", "free");
    });
    await page.reload();
    await page.getByRole("button", { name: /Library/i }).click();
    await expect(page.getByPlaceholder("Search saved prompts...")).toBeVisible();
  });

  test("settings modal opens", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("promptly_landed", "1");
      localStorage.setItem("promptly_mode", "free");
    });
    await page.reload();
    await page.getByRole("button", { name: /Settings/i }).click();
    await expect(page.getByText(/Current mode/i)).toBeVisible();
  });
});