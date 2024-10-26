import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";
import { ticketListings } from "./ticketListings";

export const ticketListingTransactions = sqliteTable(
  "ticket_listing_transactions",
  {
    ...sharedColumns.common,
    buyerUserId: text("buyer_user_id"),
    buyerRating: int("buyer_rating"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    ticketListingId: text("ticket_listing_id")
      .notNull()
      .references(() => ticketListings.id),
  },
  (_table) => ({}),
);

export const ticketListingTransactionRelations = relations(ticketListingTransactions, (r) => ({
  ticketListing: r.one(ticketListings, {
    fields: [ticketListingTransactions.ticketListingId],
    references: [ticketListings.id],
  }),
}));

export type TicketListingTransaction = InferSelectModel<typeof ticketListingTransactions>;
export type NewTicketListingTransaction = InferInsertModel<typeof ticketListingTransactions>;
