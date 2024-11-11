DROP INDEX IF EXISTS "merchants_user_id_unique";
--> statement-breakpoint
ALTER TABLE `notifications`
ALTER COLUMN "name" TO "name" text NOT NULL DEFAULT 'Notification';
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_user_id_unique` ON `merchants` (`user_id`);