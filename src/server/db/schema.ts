import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const voteEnum = pgEnum("vote", ["up", "down"]);

export const feedItems = pgTable("feed_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  sourceUrl: text("source_url").notNull().unique(),
  sourceName: text("source_name").notNull(),
  mediaUrl: text("media_url"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

export const feedback = pgTable("feedback", {
  feedItemId: uuid("feed_item_id")
    .primaryKey()
    .references(() => feedItems.id, { onDelete: "cascade" }),
  vote: voteEnum("vote"),
  reasoning: text("reasoning"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type FeedItem = typeof feedItems.$inferSelect;
export type NewFeedItem = typeof feedItems.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
