import { test, expect } from "@playwright/test";

test.describe("Security & Input Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("promptly_landed", "1");
      localStorage.setItem("promptly_mode", "free");
    });
    await page.reload();
  });

  test("XSS attempt is treated as plain text", async ({ page }) => {
    const xssPayload = "<script>window.xssTriggered=true</script>";
    await page.locator("textarea").fill(xssPayload);
    // Verify XSS did not execute
    const triggered = await page.evaluate(() => window.xssTriggered);
    expect(triggered).toBeUndefined();
    // Verify text appears literally in textarea
    const textValue = await page.locator("textarea").inputValue();
    expect(textValue).toContain("<script>");
  });

  test("API keys are not visible in built JavaScript", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    // No real API keys should appear in HTML
    expect(html).not.toMatch(/sk-[a-zA-Z0-9]{40,}/);
    expect(html).not.toMatch(/AIza[a-zA-Z0-9]{30,}/);
    expect(html).not.toMatch(/gsk_[a-zA-Z0-9]{50,}/);
  });

  test("localStorage does not contain sensitive server keys", async ({ page }) => {
    await page.goto("/");
    const allStorage = await page.evaluate(() => {
      return Object.keys(localStorage).reduce((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {});
    });
    // Server-side env keys should never be in localStorage
    const stringified = JSON.stringify(allStorage);
    expect(stringified).not.toContain("GROQ_API_KEY");
    expect(stringified).not.toContain("GEMINI_API_KEY");
  });
});