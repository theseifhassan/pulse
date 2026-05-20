import { describe, expect, it } from "vitest";
import { parseEnv } from "~/lib/env";

const valid = {
  DATABASE_URL: "postgres://user:pass@localhost:5432/pulse",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_xxx",
  CLERK_SECRET_KEY: "sk_test_xxx",
  ALLOWED_OWNER_USER_ID: "user_xxx",
  INGEST_TOKEN: "ingest-token-12345",
} as const;

describe("parseEnv", () => {
  it("returns the parsed env when all required vars are present and valid", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe(valid.DATABASE_URL);
    expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe(
      valid.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    );
    expect(env.CLERK_SECRET_KEY).toBe(valid.CLERK_SECRET_KEY);
    expect(env.ALLOWED_OWNER_USER_ID).toBe(valid.ALLOWED_OWNER_USER_ID);
    expect(env.INGEST_TOKEN).toBe(valid.INGEST_TOKEN);
  });

  it("throws when a required var is missing", () => {
    const { DATABASE_URL: _omit, ...rest } = valid;
    expect(() => parseEnv(rest as Record<string, string>)).toThrowError(
      /DATABASE_URL/,
    );
  });

  it("throws when DATABASE_URL is not a URL", () => {
    expect(() =>
      parseEnv({ ...valid, DATABASE_URL: "not-a-url" }),
    ).toThrowError(/DATABASE_URL/);
  });

  it("throws when INGEST_TOKEN is shorter than 8 characters", () => {
    expect(() => parseEnv({ ...valid, INGEST_TOKEN: "short" })).toThrowError(
      /INGEST_TOKEN/,
    );
  });

  it("aggregates multiple errors into a single thrown message", () => {
    const broken = { DATABASE_URL: "not-a-url", INGEST_TOKEN: "x" } as Record<
      string,
      string
    >;
    let caught: Error | undefined;
    try {
      parseEnv(broken);
    } catch (err) {
      caught = err as Error;
    }
    expect(caught).toBeDefined();
    expect(caught?.message).toMatch(/DATABASE_URL/);
    expect(caught?.message).toMatch(/INGEST_TOKEN/);
    expect(caught?.message).toMatch(/CLERK_SECRET_KEY/);
  });

  it("does not leak env values in error messages", () => {
    const broken = { ...valid, INGEST_TOKEN: "super-secret-but-too-short" };
    let caught: Error | undefined;
    try {
      parseEnv({ ...broken, INGEST_TOKEN: "x" });
    } catch (err) {
      caught = err as Error;
    }
    expect(caught?.message).not.toContain("super-secret");
  });
});
