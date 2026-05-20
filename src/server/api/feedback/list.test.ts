import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleFeedbackList } from "~/server/api/feedback/list";
import {
  InMemoryRateLimitStore,
  type RateLimitConfig,
} from "~/server/auth/rate-limit";
import { feedback, feedItems } from "~/server/db/schema";
import {
  makeTestRuntime,
  type TestRuntime,
} from "../../../../tests/helpers/test-runtime";

const TOKEN = "feedback-token-test-12345678";
const RATE: RateLimitConfig = { limit: 60, windowSeconds: 60 };

let rt: TestRuntime;
let store: InMemoryRateLimitStore;

function makeReq(opts: { auth?: string | null } = {}): Request {
  const headers: Record<string, string> = {};
  if (opts.auth !== null) {
    headers.authorization = opts.auth ?? `Bearer ${TOKEN}`;
  }
  return new Request("http://localhost/api/feedback", {
    method: "GET",
    headers,
  });
}

beforeEach(async () => {
  if (!rt) rt = await makeTestRuntime();
  await rt.reset();
  store = new InMemoryRateLimitStore();
});

afterAll(async () => {
  await rt?.close();
});

async function seed(
  rows: ReadonlyArray<{
    sourceUrl: string;
    vote: "up" | "down" | null;
    updatedAt: Date;
  }>,
): Promise<void> {
  for (const r of rows) {
    const [item] = await rt.db
      .insert(feedItems)
      .values({
        title: "x",
        sourceUrl: r.sourceUrl,
        sourceName: "example.test",
        summary: "summary",
      })
      .returning({ id: feedItems.id });
    await rt.db.insert(feedback).values({
      feedItemId: item.id,
      vote: r.vote,
      updatedAt: r.updatedAt,
    });
  }
}

describe("GET /api/feedback", () => {
  it("returns 401 when the bearer token is missing", async () => {
    const res = await rt.run(
      handleFeedbackList({
        req: makeReq({ auth: null }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when the bearer token is wrong", async () => {
    const res = await rt.run(
      handleFeedbackList({
        req: makeReq({ auth: "Bearer wrong" }),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns an empty list when there is no feedback", async () => {
    const res = await rt.run(
      handleFeedbackList({
        req: makeReq(),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it("returns items newest-first by updated_at", async () => {
    const base = Date.parse("2026-05-01T00:00:00Z");
    await seed([
      {
        sourceUrl: "https://a.test/1",
        vote: "up",
        updatedAt: new Date(base + 60_000),
      },
      {
        sourceUrl: "https://a.test/2",
        vote: "down",
        updatedAt: new Date(base),
      },
      {
        sourceUrl: "https://a.test/3",
        vote: null,
        updatedAt: new Date(base + 120_000),
      },
    ]);
    const res = await rt.run(
      handleFeedbackList({
        req: makeReq(),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    const body = await res.json();
    expect(body.items.map((i: { sourceUrl: string }) => i.sourceUrl)).toEqual([
      "https://a.test/3",
      "https://a.test/1",
      "https://a.test/2",
    ]);
  });

  it("includes cleared votes (vote=null) so retractions are surfaced", async () => {
    await seed([
      {
        sourceUrl: "https://a.test/cleared",
        vote: null,
        updatedAt: new Date("2026-05-01T00:00:00Z"),
      },
    ]);
    const res = await rt.run(
      handleFeedbackList({
        req: makeReq(),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: RATE,
      }),
    );
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].vote).toBeNull();
  });

  it("rate-limits beyond the configured budget", async () => {
    const tight: RateLimitConfig = { limit: 2, windowSeconds: 60 };
    for (let i = 0; i < tight.limit; i++) {
      await rt.run(
        handleFeedbackList({
          req: makeReq(),
          expectedToken: TOKEN,
          rateLimitStore: store,
          rateLimitConfig: tight,
        }),
      );
    }
    const res = await rt.run(
      handleFeedbackList({
        req: makeReq(),
        expectedToken: TOKEN,
        rateLimitStore: store,
        rateLimitConfig: tight,
      }),
    );
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).not.toBeNull();
  });
});
