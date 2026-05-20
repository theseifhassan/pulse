import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "~/server/api/cursor";

describe("cursor encoding", () => {
  it("roundtrips through encode/decode", () => {
    const c = {
      ts: "2026-05-20T12:00:00.000Z",
      id: "11111111-2222-3333-4444-555555555555",
    };
    const encoded = encodeCursor(c);
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(c);
  });

  it("produces URL-safe base64", () => {
    const encoded = encodeCursor({ ts: "2026-05-20T00:00:00.000Z", id: "x" });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("returns null for malformed input", () => {
    expect(decodeCursor("not-base64!!!")).toBeNull();
    expect(decodeCursor("")).toBeNull();
    expect(
      decodeCursor(Buffer.from("not-json").toString("base64url")),
    ).toBeNull();
    expect(
      decodeCursor(
        Buffer.from(JSON.stringify({ ts: 1 })).toString("base64url"),
      ),
    ).toBeNull();
  });
});
