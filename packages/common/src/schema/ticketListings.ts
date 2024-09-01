import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { events } from "./events";
import { sharedColumns } from "./shared/columns";

export const ticketListings = sqliteTable(
  "ticket_listings",
  {
    ...sharedColumns.common,
    name: text("name").notNull(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    isSold: int("is_sold", { mode: "boolean" }).default(false),
  },
  (_table) => ({}),
);

export const ticketListingRelations = relations(ticketListings, () => ({}));

export type TicketListing = InferSelectModel<typeof ticketListings>;
export type NewTicketListing = InferInsertModel<typeof ticketListings>;
