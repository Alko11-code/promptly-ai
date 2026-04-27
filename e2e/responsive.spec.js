import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("promptly_landed", "1");
      localStorage.setItem("promptly_mode", "free");
    });
    await page.reload();
  });

  test("mobile viewport (375px) displays correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByText("Templates")).toBeVisible();
    await expect(page.getByText("Your rough prompt")).toBeVisible();
    // Tone grid should stack to 2 columns on mobile
    const toneButtons = page.getByRole("button", { name: /Formal|Casual|Technical|Academic/ });
    await expect(toneButtons.first()).toBeVisible();
  });

  test("tablet viewport (768px) displays correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByText("Templates")).toBeVisible();
    await expect(page.getByText("Context")).toBeVisible();
  });

  test("desktop viewport (1920px) displays correctly", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByText("Templates")).toBeVisible();
    await expect(page.getByText("Your rough prompt")).toBeVisible();
  });

  test("very narrow viewport (320px) does not break layout", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    // Page should still render core elements
    await expect(page.getByRole("button", { name: /Optimize Prompt/i })).toBeVisible();
    // No horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});
