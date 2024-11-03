DROP INDEX IF EXISTS "merchants_user_id_unique";
--> statement-breakpoint
ALTER TABLE `merchants`
ALTER COLUMN "is_stripe_account_setup" TO "is_stripe_account_setup" integer NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_user_id_unique` ON `merchants` (`user_id`);
--> statement-breakpoint
ALTER TABLE `merchants`
ALTER COLUMN "is_approved" TO "is_approved" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE `ticket_listings`
ALTER COLUMN "is_sold" TO "is_sold" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE `notifications`
ALTER COLUMN "is_dismissed" TO "is_dismissed" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE `ticket_listing_chat_messages`
ADD `transaction_id` text NOT NULL REFERENCES ticket_listing_transactions(id);