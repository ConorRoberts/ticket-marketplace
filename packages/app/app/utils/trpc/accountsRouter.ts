import { TRPCError } from "@trpc/server";
import { merchants } from "common/schema";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { clerk } from "../clerk.server";
import { db } from "../db.server";
import { env } from "../env.server";
import { stripe } from "../stripe";
import { protectedProcedure, router } from "./trpcServerConfig";

export const accountsRouter = router({
  createStripeSetupSession: protectedProcedure
    .input(
      v.parser(
        v.object({
          redirectUrl: v.optional(v.string(), `${env.server.PUBLIC_WEBSITE_URL}/account`),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const merchant = await db.query.merchants.findFirst({
        where: eq(merchants.userId, ctx.user.id),
      });

      if (!merchant) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "User does not have merchant profile" });
      }

      if (merchant.isStripeAccountSetup) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Stripe account is already setup" });
      }

      const fullName =
        ctx.user.firstName && ctx.user.lastName ? `${ctx.user.firstName} ${ctx.user.lastName}` : undefined;

      const email = ctx.user.primaryEmailAddressId
        ? await clerk.emailAddresses.getEmailAddress(ctx.user.primaryEmailAddressId)
        : undefined;
      const acc = await stripe.accounts.create({
        email: email?.emailAddress ?? undefined,
        type: "express",
        business_profile: {
          url: `${env.server.PUBLIC_WEBSITE_URL}/merchants/${merchant.id}`,
          name: ctx.user.firstName && ctx.user.lastName ? `${ctx.user.firstName} ${ctx.user.lastName}` : undefined,
        },
        business_type: "individual",
        company: {
          name: fullName,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: {
            requested: true,
          },
        },
      });

      await ctx.db.update(merchants).set({ stripeAccountId: acc.id }).where(eq(merchants.id, merchant.id));

      const accountLink = await stripe.accountLinks.create({
        account: acc.id,
        refresh_url: input.redirectUrl,
        return_url: input.redirectUrl,
        type: "account_onboarding",
      });

      // TODO webhook to catch this and set account as valid

      return { url: accountLink.url };
    }),
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const merchant = await db.query.merchants.findFirst({
      where: eq(merchants.userId, ctx.user.id),
    });

    return { merchant };
  }),
});
