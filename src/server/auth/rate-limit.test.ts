import { Effect, Exit } from "effect";
import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  InMemoryRateLimitStore,
  type RateLimitConfig,
} from "~/server/auth/rate-limit";

const KEY = "ingest-token-A";
const cfg: RateLimitConfig = { limit: 3, windowSeconds: 60 };

let store: InMemoryRateLimitStore;
let now: number;

beforeEach(() => {
  store = new InMemoryRateLimitStore();
  now = 1_700_000_000_000;
});

describe("checkRateLimit", () => {
  it("allows the first request when no state exists", async () => {
    const result = await Effect.runPromise(
      checkRateLimit(store, KEY, cfg, now),
    );
    expect(result).toBeUndefined();
    expect(store.get(KEY)?.count).toBe(1);
  });

  it("allows requests under the limit and increments the count", async () => {
    await Effect.runPromise(checkRateLimit(store, KEY, cfg, now));
    await Effect.runPromise(checkRateLimit(store, KEY, cfg, now + 1_000));
    expect(store.get(KEY)?.count).toBe(2);
  });

  it("rejects with RateLimitedError when the limit is exceeded within the window", async () => {
    await Effect.runPromise(checkRateLimit(store, KEY, cfg, now));
    await Effect.runPromise(checkRateLimit(store, KEY, cfg, now + 1_000));
    await Effect.runPromise(checkRateLimit(store, KEY, cfg, now + 2_000));
    const exit = await Effect.runPromiseExit(
      checkRateLimit(store, KEY, cfg, now + 3_000),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      expect(JSON.stringify(exit.cause)).toMatch(/RateLimitedError/);
    }
  });

  it("includes a retryAfterSeconds hint within the remaining window", async () => {
    for (let i = 0; i < cfg.limit; i++) {
      await Effect.runPromise(checkRateLimit(store, KEY, cfg, now + i));
    }
    const exit = await Effect.runPromiseExit(
      checkRateLimit(store, KEY, cfg, now + 5_000),
    );
    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const serialized = JSON.stringify(exit.cause);
      const m = /retryAfterSeconds":\s*(\d+)/.exec(serialized);
      expect(m).not.toBeNull();
      const retry = Number(m?.[1]);
      expect(retry).toBeGreaterThanOrEqual(1);
      expect(retry).toBeLessThanOrEqual(cfg.windowSeconds);
    }
  });

  it("resets the count after the window expires", async () => {
    for (let i = 0; i < cfg.limit; i++) {
      await Effect.runPromise(checkRateLimit(store, KEY, cfg, now + i));
    }
    // jump past the window
    const result = await Effect.runPromise(
      checkRateLimit(store, KEY, cfg, now + cfg.windowSeconds * 1_000 + 1),
    );
    expect(result).toBeUndefined();
    expect(store.get(KEY)?.count).toBe(1);
  });

  it("tracks per-key state independently", async () => {
    await Effect.runPromise(checkRateLimit(store, "tokenA", cfg, now));
    await Effect.runPromise(checkRateLimit(store, "tokenA", cfg, now + 1));
    await Effect.runPromise(checkRateLimit(store, "tokenA", cfg, now + 2));
    // tokenA is now at the limit
    const exitA = await Effect.runPromiseExit(
      checkRateLimit(store, "tokenA", cfg, now + 3),
    );
    expect(Exit.isFailure(exitA)).toBe(true);
    // tokenB has its own window and should pass
    const okB = await Effect.runPromise(
      checkRateLimit(store, "tokenB", cfg, now + 3),
    );
    expect(okB).toBeUndefined();
  });
});
