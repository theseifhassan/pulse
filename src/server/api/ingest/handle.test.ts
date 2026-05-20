import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleIngest } from "~/server/api/ingest/handle";
import {
  InMemoryRateLimitStore,
  type RateLimitConfig,
} from "~/server/auth/rate-limit";
import {
  makeTestRuntime,
  type TestRuntime,
} from "../../../../tests/helpers/test-runtime";

const TOKEN = "ingest-token-test-12345678";
const RATE: RateLimitConfig = { limit: 60, windowSeconds: 60 };

let rt: TestRuntime;
let store: InMemoryRateLimitStore;

function makeRequest(
  body: unknown,
  opts: { auth?: string | null } = {},
): Request {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (opts.auth !== null) {
    headers.authorization = opts.auth ?? `Bearer ${TOKEN}`;
  }
  return new Request("http://localhost/api/ingest", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const validBody = {
  title: "Effect 4 beta release",
  sourceUrl: "https://effect.website/blog/effect-4-beta-69",
  sourceName: "effect.website",
  summary: "TLDR: Effect 4 beta 69 ships service refactors.",
};

beforeEach(async () => {
  if (!rt) rt = await makeTestRuntime();
  await rt.reset();
  store = new InMemoryRateLimitStore();
});

afterAll(async () => {
  await rt?.close();
});

describe("POST /api/ingest", () => {
  it("creates a feed item with valid token and body", async () => {
    const res = await rt.run(
      handleIngest({
        req: makeRequest(validBody),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("returns 401 when the bearer token is missing", async () => {
    const res = await rt.run(
      handleIngest({
        req: makeRequest(validBody, { auth: null }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when the bearer token is wrong", async () => {
    const res = await rt.run(
      handleIngest({
        req: makeRequest(validBody, { auth: "Bearer wrong-token" }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with validation issues for a missing field", async () => {
    const { title: _omit, ...rest } = validBody;
    const res = await rt.run(
      handleIngest({
        req: makeRequest(rest),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation");
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.join("\n")).toMatch(/title/);
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: {
        authorization: `Bearer ${TOKEN}`,
        "content-type": "application/json",
      },
      body: "not json",
    });
    const res = await rt.run(
      handleIngest({
        req,
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 with existingId when the source URL is already known", async () => {
    // First insert succeeds
    const first = await rt.run(
      handleIngest({
        req: makeRequest(validBody),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(first.status).toBe(201);
    const { id: firstId } = await first.json();

    // Second insert with the same source URL conflicts
    const second = await rt.run(
      handleIngest({
        req: makeRequest(validBody),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(second.status).toBe(409);
    const body = await second.json();
    expect(body.error).toBe("Conflict");
    expect(body.existingId).toBe(firstId);
    expect(body.reason).toMatch(/source_url/);
  });

  it("rejects requests beyond the configured rate limit with 429 + Retry-After", async () => {
    const tightRate: RateLimitConfig = { limit: 2, windowSeconds: 60 };
    for (let i = 0; i < tightRate.limit; i++) {
      await rt.run(
        handleIngest({
          req: makeRequest({
            ...validBody,
            sourceUrl: `https://example.test/${i}`,
          }),
          expectedToken: TOKEN,
          rateLimitStore: store,
          rateLimitConfig: tightRate,
        }),
      );
    }
    const res = await rt.run(
      handleIngest({
        req: makeRequest({
          ...validBody,
          sourceUrl: "https://example.test/over",
        }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: tightRate,
      }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });

  it("rejects titles longer than the configured limit", async () => {
    const res = await rt.run(
      handleIngest({
        req: makeRequest({ ...validBody, title: "x".repeat(201) }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation");
    expect(body.issues.join("\n")).toMatch(/title/);
  });

  it("rejects summaries longer than the configured limit", async () => {
    const res = await rt.run(
      handleIngest({
        req: makeRequest({ ...validBody, summary: "x".repeat(2001) }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation");
    expect(body.issues.join("\n")).toMatch(/summary/);
  });
});
