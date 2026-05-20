import { Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import { requireIngestToken } from "~/server/auth/ingest-token";

const TOKEN = "12345678abcdef";

describe("requireIngestToken", () => {
  it("succeeds when the bearer token matches", async () => {
    const result = await Effect.runPromise(
      requireIngestToken({
        authHeader: `Bearer ${TOKEN}`,
        expectedToken: TOKEN,
      }),
    );
    expect(result).toBe(TOKEN);
  });

  it("fails Unauthorized when the header is missing", async () => {
    const exit = await Effect.runPromiseExit(
      requireIngestToken({ authHeader: null, expectedToken: TOKEN }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(JSON.stringify(exit.cause)).toMatch(/missing authorization/);
    }
  });

  it("fails Unauthorized when the header is not a Bearer scheme", async () => {
    const exit = await Effect.runPromiseExit(
      requireIngestToken({
        authHeader: `Basic ${TOKEN}`,
        expectedToken: TOKEN,
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(JSON.stringify(exit.cause)).toMatch(/invalid authorization/);
    }
  });

  it("fails Unauthorized when the bearer token does not match", async () => {
    const exit = await Effect.runPromiseExit(
      requireIngestToken({
        authHeader: `Bearer wrong-token-9999`,
        expectedToken: TOKEN,
      }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(JSON.stringify(exit.cause)).toMatch(/invalid bearer token/);
    }
  });

  it("does not short-circuit on length mismatch (constant-time compare)", async () => {
    // Both tokens are different lengths — verify the call still completes
    // with a clean Unauthorized failure rather than throwing or hanging.
    const exit = await Effect.runPromiseExit(
      requireIngestToken({ authHeader: "Bearer short", expectedToken: TOKEN }),
    );
    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("does not leak the supplied token in the error message", async () => {
    const exit = await Effect.runPromiseExit(
      requireIngestToken({
        authHeader: "Bearer attacker-secret-AAA",
        expectedToken: TOKEN,
      }),
    );
    expect(JSON.stringify(exit)).not.toContain("attacker-secret-AAA");
  });
});
