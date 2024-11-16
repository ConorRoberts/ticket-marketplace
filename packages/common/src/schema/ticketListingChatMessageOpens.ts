import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";
import { ticketListingChatMessages } from "./ticketListingChatMessages";

/**
 * A table tracking which users have read which messages at which time.
 */
export const ticketListingChatMessageOpens = sqliteTable(
  "ticket_listing_chat_message_opens",
  {
    ...sharedColumns.common,
    userId: text("user_id"),
    messageId: text("messageId")
      .notNull()
      .references(() => ticketListingChatMessages.id),
  },
  (t) => ({ unq: unique().on(t.userId, t.messageId) }),
);

export const ticketListingChatMessageOpensRelations = relations(ticketListingChatMessageOpens, (r) => ({
  message: r.one(ticketListingChatMessages, {
    fields: [ticketListingChatMessageOpens.messageId],
    references: [ticketListingChatMessages.id],
  }),
}));

export type TicketListingChatMessageOpen = InferSelectModel<typeof ticketListingChatMessageOpens>;
export type NewTicketListingChatMessagesOpen = InferInsertModel<typeof ticketListingChatMessageOpens>;
