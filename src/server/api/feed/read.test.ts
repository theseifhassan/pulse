import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleReadToggle } from "~/server/api/feed/read";
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

async function seed(): Promise<string> {
  const [row] = await rt.db
    .insert(feedItems)
    .values({
      title: "x",
      sourceUrl: `https://example.test/${crypto.randomUUID()}`,
      sourceName: "example.test",
      body: "body",
    })
    .returning({ id: feedItems.id });
  return row.id;
}

function req(body: unknown): Request {
  return new Request("http://localhost/api/feed/x/read", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/feed/:id/read", () => {
  it("returns 401 when unauthenticated", async () => {
    const id = await seed();
    const res = await rt.run(
      handleReadToggle({
        req: req({ read: true }),
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
      handleReadToggle({
        req: req({ read: true }),
        itemId: id,
        auth: { userId: "other" },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(403);
  });

  it("marks an item read", async () => {
    const id = await seed();
    const res = await rt.run(
      handleReadToggle({
        req: req({ read: true }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(id);
    expect(body.readAt).not.toBeNull();
  });

  it("clears read state when read=false", async () => {
    const id = await seed();
    await rt.run(
      handleReadToggle({
        req: req({ read: true }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const res = await rt.run(
      handleReadToggle({
        req: req({ read: false }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.readAt).toBeNull();
  });

  it("is idempotent — re-marking read keeps the item read", async () => {
    const id = await seed();
    await rt.run(
      handleReadToggle({
        req: req({ read: true }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const res = await rt.run(
      handleReadToggle({
        req: req({ read: true }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    const body = await res.json();
    expect(body.readAt).not.toBeNull();
  });

  it("returns 404 when the item does not exist", async () => {
    const res = await rt.run(
      handleReadToggle({
        req: req({ read: true }),
        itemId: "00000000-0000-0000-0000-000000000000",
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(404);
  });

  it("returns 400 when the body is missing `read`", async () => {
    const id = await seed();
    const res = await rt.run(
      handleReadToggle({
        req: req({ not_read: true }),
        itemId: id,
        auth: { userId: OWNER },
        ownerUserId: OWNER,
      }),
    );
    expect(res.status).toBe(400);
  });
});
