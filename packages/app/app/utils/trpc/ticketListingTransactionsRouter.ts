import { ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "../db.server";
import { router, transactionProcedure } from "./trpcServerConfig";

export const ticketListingTransactionsRouter = router({
  completeTransaction: transactionProcedure
    .input(v.parser(v.object({ rating: v.optional(v.number()) })))
    .mutation(async ({ input }) => {
      await db
        .update(ticketListingTransactions)
        .set({ completedAt: new Date() })
        .where(eq(ticketListingTransactions.id, input.transactionId));

      return null;
    }),
  createReport: transactionProcedure
    .input(v.parser(v.object({ reason: v.string(), description: v.string() })))
    .mutation(async ({ input }) => {
      await db
        .update(ticketListingTransactions)
        .set({ reportedAt: new Date(), reportReason: input.reason, reportDescription: input.description })
        .where(eq(ticketListingTransactions.id, input.transactionId));

      return null;
    }),
});
