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
  body: "TLDR: Effect 4 beta ships a redesigned schema module.",
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
    expect(inserted.mediaUrl).toBeNull();
    expect(inserted.title).toBe(sampleItem.title);
    expect(inserted.sourceUrl).toBe(sampleItem.sourceUrl);
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

  it("supports nullable media_url and read_at", async () => {
    const withMedia = {
      ...sampleItem,
      sourceUrl: "https://example.test/with-media",
      mediaUrl: "https://example.test/img.png",
    };
    const [row] = await db.insert(feedItems).values(withMedia).returning();
    expect(row.mediaUrl).toBe("https://example.test/img.png");
    expect(row.readAt).toBeNull();
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
      .values({ feedItemId: item.id, vote: "up", reasoning: "useful" })
      .returning();
    expect(row.feedItemId).toBe(item.id);
    expect(row.vote).toBe("up");
    expect(row.reasoning).toBe("useful");
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  it("upserts existing feedback (latest wins)", async () => {
    const item = await seedItem();
    await db.insert(feedback).values({ feedItemId: item.id, vote: "up" });
    const [updated] = await db
      .insert(feedback)
      .values({ feedItemId: item.id, vote: "down", reasoning: "noisy" })
      .onConflictDoUpdate({
        target: feedback.feedItemId,
        set: { vote: "down", reasoning: "noisy", updatedAt: new Date() },
      })
      .returning();
    expect(updated.vote).toBe("down");
    expect(updated.reasoning).toBe("noisy");
  });

  it("clears feedback by setting vote and reasoning to null", async () => {
    const item = await seedItem();
    await db
      .insert(feedback)
      .values({ feedItemId: item.id, vote: "up", reasoning: "useful" });
    const [cleared] = await db
      .insert(feedback)
      .values({ feedItemId: item.id, vote: null, reasoning: null })
      .onConflictDoUpdate({
        target: feedback.feedItemId,
        set: { vote: null, reasoning: null, updatedAt: new Date() },
      })
      .returning();
    expect(cleared.vote).toBeNull();
    expect(cleared.reasoning).toBeNull();
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
