import { describe, it, expect, beforeEach } from "vitest";

const STORAGE_KEY = "promptly_v1";
const KEYS_STORAGE = "promptly_keys";
const USAGE_STORAGE = "promptly_free_usage";

describe("localStorage persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves saved prompts", () => {
    const prompts = [{ id: 1, original: "test", optimized: "Better test" }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    const retrieved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(retrieved).toEqual(prompts);
  });

  it("saves and retrieves API keys", () => {
    const keys = { groq: "gsk_test", gemini: "AIza_test" };
    localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
    const retrieved = JSON.parse(localStorage.getItem(KEYS_STORAGE));
    expect(retrieved.groq).toBe("gsk_test");
    expect(retrieved.gemini).toBe("AIza_test");
  });

  it("tracks free usage counter", () => {
    localStorage.setItem(USAGE_STORAGE, "5");
    expect(parseInt(localStorage.getItem(USAGE_STORAGE), 10)).toBe(5);
  });

  it("returns null for missing keys", () => {
    expect(localStorage.getItem("nonexistent")).toBeNull();
  });

  it("clears all data on clear()", () => {
    localStorage.setItem("a", "1");
    localStorage.setItem("b", "2");
    localStorage.clear();
    expect(localStorage.getItem("a")).toBeNull();
    expect(localStorage.getItem("b")).toBeNull();
  });
});