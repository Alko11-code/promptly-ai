import { test, expect } from "@playwright/test";

test.describe("Library Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Pre-populate library with test data
    await page.evaluate(() => {
      localStorage.setItem("promptly_landed", "1");
      localStorage.setItem("promptly_mode", "free");
      localStorage.setItem("promptly_v1", JSON.stringify([
        {
          id: 1,
          original: "Write code",
          optimized: "Write a well-structured function with error handling",
          changes: ["Added structure", "Added error handling"],
          category: "Coding",
          priority: "Medium",
          tone: "Technical",
          provider: "gemini",
          date: "4/25/2026",
          pinned: false,
          copyCount: 0,
          note: "",
          versions: [],
          originalScore: 3,
          optimizedScore: 8,
        },
        {
          id: 2,
          original: "Test database",
          optimized: "Write comprehensive PL/SQL test cases",
          changes: ["More specific"],
          category: "Database / PL-SQL",
          priority: "High",
          tone: "Formal",
          provider: "groq",
          date: "4/24/2026",
          pinned: true,
          copyCount: 5,
          note: "Important reference",
          versions: [],
          originalScore: 4,
          optimizedScore: 9,
        },
      ]));
    });
    await page.reload();
    await page.getByRole("button", { name: /Library/i }).click();
  });

  test("displays saved prompts", async ({ page }) => {
    await expect(page.getByText("Write a well-structured function")).toBeVisible();
    await expect(page.getByText("Write comprehensive PL/SQL")).toBeVisible();
  });

  test("library count shows correct number", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Library \(2\)/i })).toBeVisible();
  });

  test("search filters prompts by keyword", async ({ page }) => {
    await page.getByPlaceholder("Search saved prompts...").fill("PL/SQL");
    await expect(page.getByText("Write comprehensive PL/SQL")).toBeVisible();
    await expect(page.getByText("Write a well-structured function")).not.toBeVisible();
  });

  test("pinned prompt has yellow border", async ({ page }) => {
    const pinnedCard = page.locator("text=Important reference").locator("..").locator("..");
    await expect(pinnedCard).toBeVisible();
  });

  test("displays score badges", async ({ page }) => {
    await expect(page.getByText("3→8/10")).toBeVisible();
    await expect(page.getByText("4→9/10")).toBeVisible();
  });

  test("displays usage count", async ({ page }) => {
    await expect(page.getByText("5x")).toBeVisible();
  });
});
