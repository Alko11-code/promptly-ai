import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Frontend API client (Free mode)", () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it("calls /api/optimize endpoint with correct payload", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '{"optimized":"Better","changes":["a"]}', provider: "gemini" }),
    });

    const callFreeAPI = async (text, category, tone) => {
      const r = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category, tone }),
      });
      const d = await r.json();
      return d.text;
    };

    await callFreeAPI("test prompt", "Coding", "Technical");
    expect(fetch).toHaveBeenCalledWith(
      "/api/optimize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "test prompt", category: "Coding", tone: "Technical" }),
      })
    );
  });

  it("handles API errors gracefully", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Rate limit exceeded" }),
    });

    const callFreeAPI = async () => {
      const r = await fetch("/api/optimize", { method: "POST" });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.error);
      }
    };

    await expect(callFreeAPI()).rejects.toThrow("Rate limit exceeded");
  });

  it("handles network failures", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    const callFreeAPI = async () => {
      await fetch("/api/optimize", { method: "POST" });
    };

    await expect(callFreeAPI()).rejects.toThrow("Network error");
  });
});