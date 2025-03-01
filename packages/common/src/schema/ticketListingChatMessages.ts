import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";
import { ticketListingChatMessageOpens } from "./ticketListingChatMessageOpens";
import { ticketListingTransactions } from "./ticketListingTransactions";
import { ticketListings } from "./ticketListings";

export type ChatMessage = TicketListingChatMessage & { sender: "buyer" | "seller"; imageUrl: string };
type ChatMessageAttachment = { type: "image"; id: string };

export const ticketListingChatMessages = sqliteTable(
  "ticket_listing_chat_messages",
  {
    ...sharedColumns.common,
    // User can be unknown
    userId: text("user_id"),
    message: text("message").notNull(),
    listingId: text("listing_id")
      .notNull()
      .references(() => ticketListings.id),
    transactionId: text("transaction_id")
      .notNull()
      .references(() => ticketListingTransactions.id),
    attachments: text("attachments", { mode: "json" }).$type<ChatMessageAttachment[]>().default([]).notNull(),
  },
  (_table) => ({}),
);

export const ticketListingChatMessageRelations = relations(ticketListingChatMessages, (r) => ({
  listing: r.one(ticketListings, { fields: [ticketListingChatMessages.listingId], references: [ticketListings.id] }),
  transaction: r.one(ticketListingTransactions, {
    fields: [ticketListingChatMessages.transactionId],
    references: [ticketListingTransactions.id],
  }),
  opens: r.many(ticketListingChatMessageOpens),
}));

export type TicketListingChatMessage = InferSelectModel<typeof ticketListingChatMessages>;
export type NewTicketListingChatMessages = InferInsertModel<typeof ticketListingChatMessages>;
