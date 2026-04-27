import { describe, it, expect } from "vitest";
import { validateInput, buildSystemPrompt } from "../optimize.js";

describe("validateInput()", () => {
  it("rejects empty text", () => {
    const result = validateInput({ text: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid");
  });

  it("rejects null/undefined text", () => {
    expect(validateInput({ text: null }).valid).toBe(false);
    expect(validateInput({ text: undefined }).valid).toBe(false);
  });

  it("rejects non-string text", () => {
    expect(validateInput({ text: 123 }).valid).toBe(false);
    expect(validateInput({ text: { foo: "bar" } }).valid).toBe(false);
  });

  it("rejects too short text (<3 chars)", () => {
    const result = validateInput({ text: "hi" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too short");
  });

  it("rejects too long text (>3000 chars)", () => {
    const result = validateInput({ text: "a".repeat(3001) });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too long");
  });

  it("accepts valid text", () => {
    const result = validateInput({ text: "Write hello world" });
    expect(result.valid).toBe(true);
  });

  it("defaults to General when category is invalid", () => {
    const result = validateInput({ text: "Valid prompt", category: "Hacking" });
    expect(result.safeCategory).toBe("General");
  });

  it("defaults to Formal when tone is invalid", () => {
    const result = validateInput({ text: "Valid prompt", tone: "Snarky" });
    expect(result.safeTone).toBe("Formal");
  });

  it("preserves valid category and tone", () => {
    const result = validateInput({
      text: "Valid prompt",
      category: "Coding",
      tone: "Technical",
    });
    expect(result.safeCategory).toBe("Coding");
    expect(result.safeTone).toBe("Technical");
  });

  it("accepts all whitelisted categories", () => {
    const cats = ["Software Development", "Coding", "Database / PL-SQL", "Writing", "General"];
    cats.forEach((c) => {
      expect(validateInput({ text: "test test", category: c }).safeCategory).toBe(c);
    });
  });
});

describe("buildSystemPrompt()", () => {
  it("includes the category in the prompt", () => {
    const prompt = buildSystemPrompt("Coding", "Formal");
    expect(prompt).toContain("Category: Coding");
  });

  it("includes the tone in the prompt", () => {
    const prompt = buildSystemPrompt("Writing", "Casual");
    expect(prompt).toContain("Tone: Casual");
  });

  it("contains critical safety rules", () => {
    const prompt = buildSystemPrompt("General", "Formal");
    expect(prompt).toContain("REWRITE");
    expect(prompt).toContain("Do NOT");
    expect(prompt).toContain("JSON");
  });

  it("specifies expected output format", () => {
    const prompt = buildSystemPrompt("General", "Formal");
    expect(prompt).toContain("optimized");
    expect(prompt).toContain("changes");
    expect(prompt).toContain("original_score");
    expect(prompt).toContain("optimized_score");
  });
});

