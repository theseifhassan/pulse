ALTER TABLE "feed_items" DROP COLUMN "media_url";--> statement-breakpoint
ALTER TABLE "feed_items" RENAME COLUMN "body" TO "summary";--> statement-breakpoint
ALTER TABLE "feedback" DROP COLUMN "reasoning";
