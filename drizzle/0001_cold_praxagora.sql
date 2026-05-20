CREATE INDEX "feed_items_created_at_id_idx" ON "feed_items" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "feed_items_read_at_idx" ON "feed_items" USING btree ("read_at");