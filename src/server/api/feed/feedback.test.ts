import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleFeedback } from "~/server/api/feed/feedback";
import { feedback, feedItems } from "~/server/db/schema";
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

async function seed(): Promise<string> {
  const [row] = await rt.db
    .insert(feedItems)
    .values({
      title: "x",
      sourceUrl: `https://example.test/${crypto.randomUUID()}`,
      sourceName: "example.test",
      summary: "summary",
    })
    .returning({ id: feedItems.id });
  return row.id;
}

function req(body: unknown): Request {
  return new Request("http://localhost/api/feed/x/feedback", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/feed/:id/feedback", () => {
  it("returns 401 when unauthenticated", async () => {
    const id = await seed();
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: "up" }),
        itemId: id,
        auth: { userId: null },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-owner", async () => {
    const id = await seed();
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: "up" }),
        itemId: id,
        auth: { userId: "other" },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(403);
  });

  it("creates feedback on first PUT", async () => {
    const id = await seed();
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: "up" }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.feedItemId).toBe(id);
    expect(body.vote).toBe("up");
  });

  it("updates existing feedback — latest wins", async () => {
    const id = await seed();
    await rt.run(
      handleFeedback({
        req: req({ vote: "up" }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: "down" }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const body = await res.json();
    expect(body.vote).toBe("down");

    // verify storage has exactly one row
    const rows = await rt.db
      .select()
      .from(feedback)
      .where(eq(feedback.feedItemId, id));
    expect(rows).toHaveLength(1);
  });

  it("clears feedback when vote=null", async () => {
    const id = await seed();
    await rt.run(
      handleFeedback({
        req: req({ vote: "up" }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: null }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const body = await res.json();
    expect(body.vote).toBeNull();
  });

  it("returns 404 when the feed item does not exist", async () => {
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: "up" }),
        itemId: "00000000-0000-0000-0000-000000000000",
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 for an invalid vote value", async () => {
    const id = await seed();
    const res = await rt.run(
      handleFeedback({
        req: req({ vote: "sideways" }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(400);
  });
});
