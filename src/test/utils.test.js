import { describe, it, expect } from "vitest";

// ─── Helper functions to test (copied from App.jsx for testability) ─────────
const tokenCount = (t) => Math.ceil((t || "").trim().length / 4);

const parseResult = (raw) => {
  const match = (raw || "").match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return {
    optimized: raw || "",
    changes: ["Restructured for clarity", "Added role and context", "Improved specificity"],
    original_score: null,
    optimized_score: null,
  };
};

// ─── TEST SUITE: Token Counter ──────────────────────────────────────────────
describe("tokenCount()", () => {
  it("returns 0 for empty string", () => {
    expect(tokenCount("")).toBe(0);
  });

  it("returns 0 for null/undefined", () => {
    expect(tokenCount(null)).toBe(0);
    expect(tokenCount(undefined)).toBe(0);
  });

  it("calculates ~1 token per 4 characters", () => {
    expect(tokenCount("test")).toBe(1); // 4 chars
    expect(tokenCount("hello")).toBe(2); // 5 chars → ceil(5/4) = 2
    expect(tokenCount("hello world")).toBe(3); // 11 chars → ceil(11/4) = 3
  });

  it("handles long strings correctly", () => {
    const longText = "a".repeat(1000);
    expect(tokenCount(longText)).toBe(250);
  });

  it("trims whitespace before counting", () => {
    expect(tokenCount("   hello   ")).toBe(2); // trimmed = 5 chars
  });
});

// ─── TEST SUITE: JSON Parser ────────────────────────────────────────────────
describe("parseResult()", () => {
  it("parses valid JSON correctly", () => {
    const raw = '{"optimized":"Better prompt","changes":["a","b","c"],"original_score":3,"optimized_score":8}';
    const result = parseResult(raw);
    expect(result.optimized).toBe("Better prompt");
    expect(result.changes).toHaveLength(3);
    expect(result.original_score).toBe(3);
    expect(result.optimized_score).toBe(8);
  });

  it("extracts JSON from text with extra content", () => {
    const raw = 'Here is the result: {"optimized":"Test","changes":["x"]} hope this helps!';
    const result = parseResult(raw);
    expect(result.optimized).toBe("Test");
  });

  it("strips markdown code fences", () => {
    const raw = '```json\n{"optimized":"Clean","changes":[]}\n```';
    const result = parseResult(raw);
    expect(result.optimized).toBe("Clean");
  });

  it("returns fallback for invalid JSON", () => {
    const raw = "Just some plain text response";
    const result = parseResult(raw);
    expect(result.optimized).toBe("Just some plain text response");
    expect(result.changes).toHaveLength(3);
    expect(result.original_score).toBeNull();
  });

  it("handles empty input", () => {
    const result = parseResult("");
    expect(result.optimized).toBe("");
    expect(result.changes).toBeInstanceOf(Array);
  });
});

// ─── TEST SUITE: Diff Logic ─────────────────────────────────────────────────
describe("Diff word detection", () => {
  const findNewWords = (original, optimized) => {
    const origSet = new Set(original.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    return optimized
      .split(/\s+/)
      .filter((w) => w.length > 3 && !origSet.has(w.toLowerCase().replace(/\W+/g, "")));
  };

  it("identifies new words in optimized version", () => {
    const original = "write code";
    const optimized = "Please write efficient code with proper documentation";
    const newWords = findNewWords(original, optimized);
    expect(newWords).toContain("Please");
    expect(newWords).toContain("efficient");
    expect(newWords).toContain("documentation");
  });

  it("does NOT flag short words (3 chars or less)", () => {
    const newWords = findNewWords("hi", "hi to all");
    expect(newWords).not.toContain("to");
    expect(newWords).not.toContain("all");
  });

  it("returns empty array if optimized = original", () => {
    const newWords = findNewWords("same words", "same words");
    expect(newWords).toHaveLength(0);
  });
});
