import { init } from "@paralleldrive/cuid2";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";
import { ticketListingChatMessages } from "./ticketListingChatMessages";
import { ticketListings } from "./ticketListings";

const createTransactionId = init({ length: 30 });
export const ticketListingTransactions = sqliteTable(
  "ticket_listing_transactions",
  {
    ...sharedColumns.time,
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createTransactionId()),
    buyerUserId: text("buyer_user_id"),
    buyerRating: int("buyer_rating"),
    reportedAt: int("reported_at", { mode: "timestamp_ms" }),
    reportReason: text("report_reason"),
    completedAt: int("completed_at", { mode: "timestamp_ms" }),
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
  messages: r.many(ticketListingChatMessages),
}));

export type TicketListingTransaction = InferSelectModel<typeof ticketListingTransactions>;
export type NewTicketListingTransaction = InferInsertModel<typeof ticketListingTransactions>;
