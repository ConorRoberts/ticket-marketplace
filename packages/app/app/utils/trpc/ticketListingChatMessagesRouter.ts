import { TRPCError } from "@trpc/server";
import { ticketListingChatMessages, ticketListingTransactions } from "common/schema";
import { eq, inArray } from "drizzle-orm";
import * as v from "valibot";
import { db } from "../db.server";
import { publishPubSubMessage } from "../publishPubSubMessage";
import { publicProcedure, router } from "./trpcServerConfig";

export const ticketListingChatMessagesRouter = router({
  createMessage: publicProcedure
    .input(
      v.parser(
        v.object({
          message: v.object({
            message: v.string(),
            attachments: v.array(v.object({ id: v.string(), type: v.picklist(["image"]) })),
          }),
          transactionId: v.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const transaction = await db.query.ticketListingTransactions.findFirst({
        where: eq(ticketListingTransactions.id, input.transactionId),
        with: {
          ticketListing: {
            with: {
              merchant: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Transaction not found" });
      }

      // Must be 1) listing owner, 2) transaction owner, 3) not signed in + transaction has no owner
      if (ctx.user) {
        const isListingOwner = ctx.user.id === transaction.ticketListing.merchant.userId;
        const isTransactionOwner = ctx.user.id === transaction.buyerUserId;

        if (!isListingOwner && !isTransactionOwner) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are not authorized to chat within this transaction",
          });
        }
      } else {
        const transactionHasOwner = Boolean(transaction.buyerUserId);

        if (transactionHasOwner) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are not authorized to chat within this transaction",
          });
        }
      }

      const newMessage = await db
        .insert(ticketListingChatMessages)
        .values({
          listingId: transaction.ticketListingId,
          message: input.message.message,
          attachments: input.message.attachments,
          transactionId: transaction.id,
          userId: ctx.user?.id ?? null,
        })
        .returning()
        .get();

      await publishPubSubMessage({ room: transaction.id, event: { type: "chatMessage", data: newMessage } });

      return newMessage;
    }),
  readMessages: publicProcedure
    .input(v.parser(v.object({ transactionId: v.string(), messageIds: v.array(v.string()) })))
    .mutation(async ({ ctx, input }) => {
      if (input.messageIds.length === 0) {
        return null;
      }

      const userId = ctx.user?.id ?? null;

      const messages = await db.query.ticketListingChatMessages.findMany({
        where: inArray(ticketListingChatMessages.id, input.messageIds),
      });

      return [];
    }),
});
