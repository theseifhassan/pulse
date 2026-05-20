import { Effect } from "effect";
import { RateLimitedError } from "~/server/effect/errors";

export interface RateLimitConfig {
  readonly limit: number;
  readonly windowSeconds: number;
}

export interface RateLimitState {
  readonly windowStart: number;
  readonly count: number;
}

export interface RateLimitStore {
  get(key: string): RateLimitState | undefined;
  set(key: string, state: RateLimitState): void;
  clear(): void;
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly map = new Map<string, RateLimitState>();
  get(key: string): RateLimitState | undefined {
    return this.map.get(key);
  }
  set(key: string, state: RateLimitState): void {
    this.map.set(key, state);
  }
  clear(): void {
    this.map.clear();
  }
}

export const DEFAULT_INGEST_RATE_LIMIT: RateLimitConfig = {
  limit: 60,
  windowSeconds: 60,
};

export function checkRateLimit(
  store: RateLimitStore,
  key: string,
  config: RateLimitConfig,
  now: number = Date.now(),
): Effect.Effect<void, RateLimitedError> {
  const state = store.get(key);
  const windowMs = config.windowSeconds * 1000;
  if (!state || now - state.windowStart >= windowMs) {
    store.set(key, { windowStart: now, count: 1 });
    return Effect.void;
  }
  if (state.count >= config.limit) {
    const remainingMs = state.windowStart + windowMs - now;
    const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
    return Effect.fail(new RateLimitedError({ retryAfterSeconds }));
  }
  store.set(key, {
    windowStart: state.windowStart,
    count: state.count + 1,
  });
  return Effect.void;
}

let cachedIngestStore: InMemoryRateLimitStore | undefined;

export function getIngestRateLimitStore(): InMemoryRateLimitStore {
  if (!cachedIngestStore) {
    cachedIngestStore = new InMemoryRateLimitStore();
  }
  return cachedIngestStore;
}
