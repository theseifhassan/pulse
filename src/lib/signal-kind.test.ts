import { describe, expect, it } from "vitest";
import { inferKind, inferReadLabel } from "~/lib/signal-kind";

describe("inferKind", () => {
  it("recognises tweets on x.com / twitter.com", () => {
    expect(inferKind("https://x.com/p_collison/status/1")).toBe("tweet");
    expect(inferKind("https://twitter.com/x/y")).toBe("tweet");
    expect(inferKind("https://www.x.com/x")).toBe("tweet");
  });

  it("recognises videos on common hosts", () => {
    expect(inferKind("https://www.youtube.com/watch?v=abc")).toBe("video");
    expect(inferKind("https://youtu.be/abc")).toBe("video");
    expect(inferKind("https://vimeo.com/123")).toBe("video");
  });

  it("recognises posts on newsletter / blog platforms", () => {
    expect(inferKind("https://stratechery.com/2024/foo")).toBe("post");
    expect(inferKind("https://my-newsletter.substack.com/p/x")).toBe("post");
    expect(inferKind("https://medium.com/@x/y")).toBe("post");
  });

  it("defaults to article", () => {
    expect(inferKind("https://reuters.com/world/x")).toBe("article");
    expect(inferKind("https://example.test/whatever")).toBe("article");
  });

  it("falls back to article on malformed URLs", () => {
    expect(inferKind("not a url at all")).toBe("article");
  });
});

describe("inferReadLabel", () => {
  it("returns 30 SEC for tweets regardless of length", () => {
    expect(inferReadLabel("a".repeat(2000), "tweet")).toBe("30 SEC");
  });

  it("returns 30 SEC for very short bodies", () => {
    expect(inferReadLabel("short blurb here", "article")).toBe("30 SEC");
  });

  it("returns minutes for mid-length content", () => {
    const body = "word ".repeat(400);
    const out = inferReadLabel(body, "article");
    expect(out).toMatch(/^\d MIN$/);
  });

  it("returns hours+minutes for long content", () => {
    const body = "word ".repeat(20_000);
    const out = inferReadLabel(body, "post");
    expect(out).toMatch(/^\d+H( \d+ MIN)?$/);
  });
});
