CREATE TABLE `ticket_listing_chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`listing_id` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `ticket_listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `ticket_listings` ADD `description` text DEFAULT '' NOT NULL;