import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const voteEnum = pgEnum("vote", ["up", "down"]);

export const feedItems = pgTable(
  "feed_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull().unique(),
    sourceName: text("source_name").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    // cursor pagination on /api/feed/unread and /api/feed/history is
    // (created_at DESC, id DESC); cover both with one index.
    index("feed_items_created_at_id_idx").on(table.createdAt, table.id),
    // /api/feed/unread filters read_at IS NULL; partial-ish workload
    // is served well by a plain b-tree over a nullable column.
    index("feed_items_read_at_idx").on(table.readAt),
  ],
);

export const feedback = pgTable("feedback", {
  feedItemId: uuid("feed_item_id")
    .primaryKey()
    .references(() => feedItems.id, { onDelete: "cascade" }),
  vote: voteEnum("vote"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export type FeedItem = typeof feedItems.$inferSelect;
export type NewFeedItem = typeof feedItems.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
