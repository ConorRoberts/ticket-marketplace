import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import * as v from "valibot";
import { eventTicketSources } from "./eventTicketSources";
import { events } from "./events";
import { merchants } from "./merchants";
import { sharedColumns } from "./shared/columns";

export const ticketListings = sqliteTable(
  "ticket_listings",
  {
    ...sharedColumns.common,
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    unitPriceCents: int("unit_price_cents").notNull(),
    quantity: int("quantity").notNull().default(1),
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    isSold: int("is_sold", { mode: "boolean" }).default(false).notNull(),
    ticketSourceId: text("ticket_source_id").references(() => eventTicketSources.id),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    deliveredAt: int("delivered_at", { mode: "timestamp_ms" }),
    deletedAt: int("deleted_at", { mode: "timestamp_ms" }),
    description: text("description").notNull().default(""),
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

export const ticketListingSchema = v.object({
  unitPriceCents: v.number(),
  quantity: v.number(),
  isSold: v.optional(v.boolean(), false),
  stripeProductId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  merchantId: v.string(),
  eventId: v.string(),
  ticketSourceId: v.string(),
});
