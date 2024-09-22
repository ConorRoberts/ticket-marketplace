import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { events } from "./events";
import { eventTicketSources } from "./eventTicketSources";
import { sharedColumns } from "./shared/columns";
import { merchants } from "./merchants";

export const ticketListings = sqliteTable(
  "ticket_listings",
  {
    ...sharedColumns.common,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    priceCents: int("price_cents").notNull(),
    quantity: int("quantity").notNull().default(1),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    isSold: int("is_sold", { mode: "boolean" }).default(false),
    ticketSourceId: text("ticket_source_id").references(() => eventTicketSources.id),
    stripeProductId: text("stripe_product_id"),
  },
  (_table) => ({}),
);

export const ticketListingRelations = relations(ticketListings, (r) => ({
  ticketSource: r.one(eventTicketSources, {
    fields: [ticketListings.ticketSourceId],
    references: [eventTicketSources.id],
  }),
  event: r.one(events, {
    fields: [ticketListings.eventId],
    references: [events.id],
  }),
  merchant: r.one(merchants, { fields: [ticketListings.merchantId], references: [merchants.id] }),
}));

export type TicketListing = InferSelectModel<typeof ticketListings>;
export type NewTicketListing = InferInsertModel<typeof ticketListings>;
