import { test, expect } from "@playwright/test";

test.describe("Prompt Optimization Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("promptly_landed", "1");
      localStorage.setItem("promptly_mode", "free");
      localStorage.setItem("promptly_free_usage", "0");
    });
    await page.reload();
  });

  test("displays main app interface correctly", async ({ page }) => {
    await expect(page.getByText("Templates")).toBeVisible();
    await expect(page.getByText("Your rough prompt")).toBeVisible();
    await expect(page.getByText("Tone")).toBeVisible();
    await expect(page.getByText("Context")).toBeVisible();
    await expect(page.getByRole("button", { name: /Optimize Prompt/i })).toBeVisible();
  });

  test("optimize button is disabled when prompt is empty", async ({ page }) => {
    const button = page.getByRole("button", { name: /Optimize Prompt/i });
    await expect(button).toBeDisabled();
  });

  test("entering text enables optimize button", async ({ page }) => {
    await page.locator("textarea").fill("Write hello world program");
    const button = page.getByRole("button", { name: /Optimize Prompt/i });
    await expect(button).toBeEnabled();
  });

  test("token counter updates as user types", async ({ page }) => {
    await page.locator("textarea").fill("Write a function");
    await expect(page.getByText(/~\d+ tokens/)).toBeVisible();
  });

  test("can switch tones", async ({ page }) => {
    await page.getByRole("button", { name: /Casual/i }).click();
    // After clicking, button should have purple selected color (rgb(109, 40, 217))
    await expect(page.getByRole("button", { name: /Casual/i })).toHaveCSS("color", "rgb(109, 40, 217)");
  });

  test("templates panel opens and inserts text", async ({ page }) => {
    await page.getByRole("button", { name: /Browse/i }).click();
    const firstTemplate = page.locator("button").filter({ hasText: /\[task\]/ }).first();
    await firstTemplate.click();
    const textarea = page.locator("textarea");
    await expect(textarea).not.toBeEmpty();
  });
});
