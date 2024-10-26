DROP INDEX IF EXISTS "merchants_user_id_unique";
--> statement-breakpoint
ALTER TABLE `events`
ALTER COLUMN "image_id" TO "image_id" text NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_user_id_unique` ON `merchants` (`user_id`);
--> statement-breakpoint
ALTER TABLE `ticket_listing_transactions`
ADD `stripe_checkout_session_id` text;