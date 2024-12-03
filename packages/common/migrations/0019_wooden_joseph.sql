DROP INDEX IF EXISTS "merchants_user_id_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "ticket_listing_chat_message_opens_user_id_messageId_unique";
--> statement-breakpoint
ALTER TABLE `ticket_listing_chat_messages`
ALTER COLUMN "attachments" TO "attachments" text NOT NULL DEFAULT '[]';
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_user_id_unique` ON `merchants` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `ticket_listing_chat_message_opens_user_id_messageId_unique` ON `ticket_listing_chat_message_opens` (`user_id`, `messageId`);