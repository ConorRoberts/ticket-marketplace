import { TRPCError } from "@trpc/server";
import { merchants, notifications, ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "../db.server";
import { stripe } from "../stripe";
import { platformAdminProcedure, router } from "./trpcServerConfig";

export const adminRouter = router({
  approveMerchant: platformAdminProcedure
    .input(v.parser(v.object({ merchantId: v.string() })))
    .mutation(async ({ ctx, input }) => {
      const merchant = await db.query.merchants.findFirst({
        where: eq(merchants.id, input.merchantId),
      });

      if (!merchant) {
        ctx.logger.error("Could not find merchant ", { merchantId: input.merchantId });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Merchant not found" });
      }

      await db.update(merchants).set({ isApproved: true }).where(eq(merchants.id, input.merchantId));
      await db
        .insert(notifications)
        .values({ message: "You are now approved to sell tickets.", userId: merchant.userId });

      return { message: "Merchant approved" };
    }),
  banMerchant: platformAdminProcedure
    .input(v.parser(v.object({ merchantId: v.string(), banned: v.optional(v.boolean(), true) })))
    .mutation(async ({ input }) => {
      await db
        .update(merchants)
        .set({ bannedAt: input.banned ? new Date() : null })
        .where(eq(merchants.id, input.merchantId));

      return {};
    }),
  closeReport: platformAdminProcedure
    .input(v.parser(v.object({ transactionId: v.string() })))
    .mutation(async ({ input }) => {
      await db
        .update(ticketListingTransactions)
        .set({ reportClosedAt: new Date() })
        .where(eq(ticketListingTransactions.id, input.transactionId));

      return {};
    }),
  refundTransaciton: platformAdminProcedure
    .input(v.parser(v.object({ transactionId: v.string() })))
    .mutation(async ({ input }) => {
      const t = await db.query.ticketListingTransactions.findFirst({
        where: eq(ticketListingTransactions.id, input.transactionId),
      });

      if (!t) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Transaction does not exist" });
      }

      if (!t.stripeCheckoutSessionId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Transaction doesn't have a Stripe Checkout Session ID",
        });
      }

      const session = await stripe.checkout.sessions.retrieve(t.stripeCheckoutSessionId);

      if (!session.payment_intent) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Session doesn't have a payment intent",
        });
      }

      const payment =
        typeof session.payment_intent === "string"
          ? await stripe.paymentIntents.retrieve(session.payment_intent)
          : session.payment_intent;

      await stripe.refunds.create({ payment_intent: payment.id });

      await db
        .update(ticketListingTransactions)
        .set({ refundedAt: new Date() })
        .where(eq(ticketListingTransactions.id, t.id));

      return {};
    }),
});
