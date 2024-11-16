CREATE TABLE `ticket_listing_chat_message_opens` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text,
	`messageId` text NOT NULL,
	FOREIGN KEY (`messageId`) REFERENCES `ticket_listing_chat_messages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ticket_listing_chat_message_opens_user_id_messageId_unique` ON `ticket_listing_chat_message_opens` (`user_id`, `messageId`);
--> statement-breakpoint
CREATE TABLE `merchant_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`merchant_id` text NOT NULL,
	`body` text NOT NULL,
	`links` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE no action
);