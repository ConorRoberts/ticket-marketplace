import type {
  ChatMessage,
  Merchant,
  TicketListing,
  TicketListingChatMessage,
  TicketListingTransaction,
} from "common/schema";
import { isNonNullish } from "remeda";
import { clerk } from "~/utils/clerk.server";
import { logger } from "~/utils/logger";

export const formatChatMessages = async (args: {
  transaction: TicketListingTransaction & {
    messages: TicketListingChatMessage[];
    ticketListing: TicketListing & { merchant: Merchant };
  };
  userId: string | null;
}) => {
  const users = await clerk.users.getUserList({
    userId: [args.transaction.buyerUserId, args.transaction.ticketListing.merchant.userId].filter(isNonNullish),
  });

  const merchantUser = users.data.find((e) => e.id === args.transaction.ticketListing.merchant.userId);

  if (!merchantUser) {
    logger.error("Merchant user was undefined");
    throw new Error("Merchant not found");
  }

  const messages: ChatMessage[] = args.transaction.messages.map((e) => ({
    ...e,
    imageUrl: e.userId === args.transaction.ticketListing.merchant.userId ? merchantUser.imageUrl : "",
    sender: args.transaction.ticketListing.merchant.userId === e.userId ? "seller" : "buyer",
  }));

  const sender: ChatMessage["sender"] =
    args.transaction.ticketListing.merchant.userId === args.userId ? "seller" : "buyer";

  return {
    messages,
    sender,
  };
};
