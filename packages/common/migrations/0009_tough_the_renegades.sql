DROP INDEX IF EXISTS "merchants_user_id_unique";
--> statement-breakpoint
ALTER TABLE `ticket_listing_chat_messages`
ALTER COLUMN "user_id" TO "user_id" text;
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_user_id_unique` ON `merchants` (`user_id`);
--> statement-breakpoint
ALTER TABLE `ticket_listing_transactions`
ADD `reported_at` integer;
--> statement-breakpoint
ALTER TABLE `ticket_listing_transactions`
ADD `completed_at` integer;