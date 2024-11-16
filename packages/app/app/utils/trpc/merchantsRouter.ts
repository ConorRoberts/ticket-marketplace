import { TRPCError } from "@trpc/server";
import { merchantApplications, merchants, notifications } from "common/schema";
import { and, eq } from "drizzle-orm";
import { omit } from "remeda";
import * as v from "valibot";
import { db } from "../db.server";
import { publishPubSubMessage } from "../publishPubSubMessage";
import { stripe } from "../stripe";
import { merchantProcedure, platformAdminProcedure, protectedProcedure, router } from "./trpcServerConfig";

const applicationStatusMessage = {
  approved:
    "Your application has been approved! Please connect your bank account, for payouts, and begin making posts.",
  rejected: "Your application has been rejected. Please try again.",
};

export const merchantsRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const merchant = await db.query.merchants.findFirst({
      where: eq(merchants.userId, ctx.user.id),
      with: {
        applications: {
          where: eq(merchantApplications.status, "pending"),
        },
      },
    });

    if (!merchant) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Merchant not found for user id=${ctx.user.id}` });
    }

    return { ...omit(merchant, ["applications"]), isApplicationPending: merchant.applications.length > 0 };
  }),
  createStripeConnectLoginLink: merchantProcedure.mutation(async ({ ctx }) => {
    if (!ctx.merchant.stripeAccountId) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Merchant does not have a Stripe account ID" });
    }

    const loginLink = await stripe.accounts.createLoginLink(ctx.merchant.stripeAccountId);

    return { url: loginLink.url };
  }),
  createApplication: merchantProcedure
    .input(v.parser(v.object({ body: v.string(), links: v.array(v.string()) })))
    .mutation(async ({ ctx, input }) => {
      if (ctx.merchant.isApproved) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Merchant is already approved" });
      }

      const pendingApplication = await db.query.merchantApplications.findFirst({
        where: and(eq(merchantApplications.merchantId, ctx.merchant.id), eq(merchantApplications.status, "pending")),
      });

      if (pendingApplication) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already have a pending application." });
      }

      const newApplication = await db
        .insert(merchantApplications)
        .values({ body: input.body, links: input.links, merchantId: ctx.merchant.id })
        .returning()
        .get();

      return newApplication;
    }),
  updateApplicationStatus: platformAdminProcedure
    .input(v.parser(v.object({ applicationId: v.string(), status: v.picklist(["approved", "rejected"]) })))
    .mutation(async ({ input }) => {
      const application = await db.query.merchantApplications.findFirst({
        where: eq(merchantApplications.id, input.applicationId),
        with: { merchant: true },
      });

      if (!application) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Application does not exist" });
      }

      if (application.merchant.isApproved) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Merchant is already approved" });
      }

      const statusMessage = applicationStatusMessage[input.status];

      await db.transaction(async (tx) => {
        await tx
          .update(merchantApplications)
          .set({ status: input.status })
          .where(eq(merchantApplications.id, application.id));

        if (input.status === "approved") {
          await tx.update(merchants).set({ isApproved: true }).where(eq(merchants.id, application.merchantId));
        }

        await tx.insert(notifications).values({ userId: application.merchant.userId, message: statusMessage });
      });

      await publishPubSubMessage({
        room: application.merchant.userId,
        event: {
          type: "applicationUpdate",
          data: {
            message: statusMessage,
            status: input.status,
          },
        },
      });

      return {};
    }),
});
