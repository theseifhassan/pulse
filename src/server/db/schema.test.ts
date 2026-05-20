import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { feedback, feedItems, voteEnum } from "~/server/db/schema";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  pg = new PGlite();
  db = drizzle(pg);
  await migrate(db, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  await pg.close();
});

beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE TABLE ${feedback}, ${feedItems} RESTART IDENTITY`,
  );
});

const sampleItem = {
  title: "Effect 4 beta release notes",
  sourceUrl: "https://effect.website/blog/effect-4-beta",
  sourceName: "effect.website",
  summary: "TLDR: Effect 4 beta ships a redesigned schema module.",
};

describe("feed_items schema", () => {
  it("persists and retrieves a feed item with defaults applied", async () => {
    const [inserted] = await db
      .insert(feedItems)
      .values(sampleItem)
      .returning();
    expect(inserted.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(inserted.createdAt).toBeInstanceOf(Date);
    expect(inserted.readAt).toBeNull();
    expect(inserted.title).toBe(sampleItem.title);
    expect(inserted.sourceUrl).toBe(sampleItem.sourceUrl);
    expect(inserted.summary).toBe(sampleItem.summary);
  });

  it("enforces the unique constraint on source_url", async () => {
    await db.insert(feedItems).values(sampleItem);
    await expect(db.insert(feedItems).values(sampleItem)).rejects.toThrow(
      /source_url|duplicate key/i,
    );
  });

  it("allows two items with the same title but different source URLs", async () => {
    await db.insert(feedItems).values(sampleItem);
    const [second] = await db
      .insert(feedItems)
      .values({ ...sampleItem, sourceUrl: "https://effect.website/blog/other" })
      .returning();
    expect(second.id).not.toBe("");
  });
});

describe("feedback schema", () => {
  async function seedItem() {
    const [row] = await db
      .insert(feedItems)
      .values({
        ...sampleItem,
        sourceUrl: `https://example.test/${crypto.randomUUID()}`,
      })
      .returning();
    return row;
  }

  it("inserts a feedback record for an item", async () => {
    const item = await seedItem();
    const [row] = await db
      .insert(feedback)
      .values({ feedItemId: item.id, vote: "up" })
      .returning();
    expect(row.feedItemId).toBe(item.id);
    expect(row.vote).toBe("up");
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  it("upserts existing feedback (latest wins)", async () => {
    const item = await seedItem();
    await db.insert(feedback).values({ feedItemId: item.id, vote: "up" });
    const [updated] = await db
      .insert(feedback)
      .values({ feedItemId: item.id, vote: "down" })
      .onConflictDoUpdate({
        target: feedback.feedItemId,
        set: { vote: "down", updatedAt: new Date() },
      })
      .returning();
    expect(updated.vote).toBe("down");
  });

  it("clears feedback by setting vote to null", async () => {
    const item = await seedItem();
    await db.insert(feedback).values({ feedItemId: item.id, vote: "up" });
    const [cleared] = await db
      .insert(feedback)
      .values({ feedItemId: item.id, vote: null })
      .onConflictDoUpdate({
        target: feedback.feedItemId,
        set: { vote: null, updatedAt: new Date() },
      })
      .returning();
    expect(cleared.vote).toBeNull();
  });

  it("cascade-deletes feedback when the parent feed item is deleted", async () => {
    const item = await seedItem();
    await db.insert(feedback).values({ feedItemId: item.id, vote: "up" });
    await db.delete(feedItems).where(sql`${feedItems.id} = ${item.id}`);
    const rows = await db
      .select()
      .from(feedback)
      .where(sql`${feedback.feedItemId} = ${item.id}`);
    expect(rows).toHaveLength(0);
  });

  it("rejects votes outside the enum", async () => {
    const item = await seedItem();
    await expect(
      db.execute(
        sql`INSERT INTO ${feedback} (feed_item_id, vote) VALUES (${item.id}, 'sideways')`,
      ),
    ).rejects.toThrow();
  });
});

describe("vote enum", () => {
  it("exposes the configured values", () => {
    expect(voteEnum.enumValues).toEqual(["up", "down"]);
  });
});
