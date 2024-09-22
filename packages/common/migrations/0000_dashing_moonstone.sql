CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`date` integer NOT NULL,
	`image_id` text
);
--> statement-breakpoint
CREATE TABLE `event_ticket_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`event_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `loaders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `merchants` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	`stripe_account_id` text,
	`is_stripe_account_setup` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `ticket_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`event_id` text NOT NULL,
	`price_cents` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`merchant_id` text NOT NULL,
	`is_sold` integer DEFAULT false,
	`ticket_source_id` text,
	`stripe_product_id` text,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ticket_source_id`) REFERENCES `event_ticket_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ticket_listing_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`buyer_user_id` text,
	`buyer_rating` integer,
	`ticket_listing_id` text NOT NULL,
	FOREIGN KEY (`ticket_listing_id`) REFERENCES `ticket_listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `merchants_user_id_unique` ON `merchants` (`user_id`);