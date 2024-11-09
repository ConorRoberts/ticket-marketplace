ALTER TABLE `merchants`
ADD `is_approved` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `notifications`
ADD `is_dismissed` integer DEFAULT false;