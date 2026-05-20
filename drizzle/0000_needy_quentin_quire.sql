CREATE TYPE "public"."vote" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"source_url" text NOT NULL,
	"source_name" text NOT NULL,
	"media_url" text,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone,
	CONSTRAINT "feed_items_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"feed_item_id" uuid PRIMARY KEY NOT NULL,
	"vote" "vote",
	"reasoning" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_feed_item_id_feed_items_id_fk" FOREIGN KEY ("feed_item_id") REFERENCES "public"."feed_items"("id") ON DELETE cascade ON UPDATE no action;