import { test, expect } from "@playwright/test";

test.describe("Landing & Onboarding Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("displays landing screen with logo and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Promptly");
    await expect(page.getByText("Transform rough prompts")).toBeVisible();
    await expect(page.getByRole("button", { name: /Get Started/i })).toBeVisible();
  });

  test("shows feature badges on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("10 free credits")).toBeVisible();
    await expect(page.getByText("BYOK supported")).toBeVisible();
    await expect(page.getByText("4 AI providers")).toBeVisible();
  });

  test("clicking Get Started shows loading then welcome screen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Get Started/i }).click();
    // Wait for welcome screen to appear after loading
    await expect(page.getByText(/Try for free/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Use your own API key/i)).toBeVisible();
  });

  test("selecting Try for free goes to main app", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Get Started/i }).click();
    await page.getByText(/Try for free/i).click();
    await expect(page.getByText("Free trial active")).toBeVisible();
    await expect(page.getByText("10/10 left")).toBeVisible();
  });

  test("selecting BYOK goes to API key input", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Get Started/i }).click();
    await page.getByText(/Use your own API key/i).click();
    await expect(page.getByText("Add your API keys")).toBeVisible();
  });
});
