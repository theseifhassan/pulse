import { describe, expect, it } from "vitest";
import { cn, formatRelative } from "~/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("dedupes conflicting tailwind utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatRelative", () => {
  const NOW = new Date("2026-05-20T12:00:00Z");

  it("formats seconds", () => {
    const d = new Date(NOW.getTime() - 30_000);
    expect(formatRelative(d, NOW)).toBe("30s ago");
  });

  it("formats minutes", () => {
    const d = new Date(NOW.getTime() - 5 * 60_000);
    expect(formatRelative(d, NOW)).toBe("5m ago");
  });

  it("formats hours", () => {
    const d = new Date(NOW.getTime() - 3 * 60 * 60_000);
    expect(formatRelative(d, NOW)).toBe("3h ago");
  });

  it("formats days", () => {
    const d = new Date(NOW.getTime() - 2 * 24 * 60 * 60_000);
    expect(formatRelative(d, NOW)).toBe("2d ago");
  });

  it("formats weeks", () => {
    const d = new Date(NOW.getTime() - 14 * 24 * 60 * 60_000);
    expect(formatRelative(d, NOW)).toBe("2w ago");
  });

  it("falls back to date string for far past", () => {
    const d = new Date("2026-01-01T12:00:00Z");
    const out = formatRelative(d, NOW);
    expect(out).toMatch(/Jan/);
  });
});
