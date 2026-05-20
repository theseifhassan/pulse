import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleFeedList } from "~/server/api/feed/list";
import { feedItems } from "~/server/db/schema";
import {
  makeTestRuntime,
  type TestRuntime,
} from "../../../../tests/helpers/test-runtime";

const OWNER = "user_owner_xyz";

let rt: TestRuntime;

beforeEach(async () => {
  if (!rt) rt = await makeTestRuntime();
  await rt.reset();
});

afterAll(async () => {
  await rt?.close();
});

async function seedItems(
  count: number,
  opts: { readSome?: boolean } = {},
): Promise<void> {
  // Insert with explicit createdAt so ordering is deterministic.
  const base = Date.parse("2026-05-01T00:00:00Z");
  const values = Array.from({ length: count }, (_, i) => ({
    title: `item ${i}`,
    sourceUrl: `https://example.test/${i}`,
    sourceName: "example.test",
    summary: `summary ${i}`,
    createdAt: new Date(base + i * 60_000),
    // mark every other item as read when readSome=true
    readAt:
      opts.readSome && i % 2 === 0
        ? new Date(base + i * 60_000 + 10_000)
        : null,
  }));
  await rt.db.insert(feedItems).values(values).execute();
}

function makeRequest(query: string = ""): URL {
  return new URL(`http://localhost/api/feed/unread${query}`);
}

describe("GET /api/feed/unread", () => {
  it("returns 401 when unauthenticated", async () => {
    const res = await rt.run(
      handleFeedList({
        url: makeRequest(),
        auth: { userId: null },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-owner", async () => {
    const res = await rt.run(
      handleFeedList({
        url: makeRequest(),
        auth: { userId: "user_someone_else" },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("returns an empty page when there are no items", async () => {
    const res = await rt.run(
      handleFeedList({
        url: makeRequest(),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
    expect(body.nextCursor).toBeNull();
  });

  it("returns items sorted newest first", async () => {
    await seedItems(3);
    const res = await rt.run(
      handleFeedList({
        url: makeRequest(),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    const body = await res.json();
    expect(body.items.map((i: { title: string }) => i.title)).toEqual([
      "item 2",
      "item 1",
      "item 0",
    ]);
  });

  it("excludes read items from the unread feed", async () => {
    await seedItems(4, { readSome: true });
    const res = await rt.run(
      handleFeedList({
        url: makeRequest(),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    const body = await res.json();
    expect(
      body.items.every((i: { readAt: unknown }) => i.readAt === null),
    ).toBe(true);
  });

  it("respects the limit query parameter and returns a cursor", async () => {
    await seedItems(5);
    const res = await rt.run(
      handleFeedList({
        url: makeRequest("?limit=2"),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    const body = await res.json();
    expect(body.items).toHaveLength(2);
    expect(body.nextCursor).not.toBeNull();
  });

  it("paginates deterministically through cursor", async () => {
    await seedItems(5);
    // page 1
    const r1 = await rt.run(
      handleFeedList({
        url: makeRequest("?limit=2"),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    const b1 = await r1.json();
    // page 2 via returned cursor
    const r2 = await rt.run(
      handleFeedList({
        url: makeRequest(
          `?limit=2&cursor=${encodeURIComponent(b1.nextCursor)}`,
        ),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    const b2 = await r2.json();
    expect(b2.items.map((i: { title: string }) => i.title)).toEqual([
      "item 2",
      "item 1",
    ]);
    // page 3 (final, partial)
    const r3 = await rt.run(
      handleFeedList({
        url: makeRequest(
          `?limit=2&cursor=${encodeURIComponent(b2.nextCursor)}`,
        ),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    const b3 = await r3.json();
    expect(b3.items.map((i: { title: string }) => i.title)).toEqual(["item 0"]);
    expect(b3.nextCursor).toBeNull();
  });

  it("rejects an invalid cursor with 400", async () => {
    const res = await rt.run(
      handleFeedList({
        url: makeRequest("?cursor=not-a-real-cursor"),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "unread",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/feed/history", () => {
  it("returns only read items sorted by read_at desc", async () => {
    await seedItems(4, { readSome: true });
    const res = await rt.run(
      handleFeedList({
        url: new URL("http://localhost/api/feed/history"),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "history",
      }),
    );
    const body = await res.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(
      body.items.every((i: { readAt: unknown }) => i.readAt !== null),
    ).toBe(true);
  });

  it("paginates history view independently from unread view", async () => {
    await seedItems(6, { readSome: true });
    const res = await rt.run(
      handleFeedList({
        url: new URL("http://localhost/api/feed/history?limit=2"),
        auth: { userId: OWNER },
        ownerUserId: OWNER,
        variant: "history",
      }),
    );
    const body = await res.json();
    expect(body.items).toHaveLength(2);
    expect(body.nextCursor).not.toBeNull();
  });
});
