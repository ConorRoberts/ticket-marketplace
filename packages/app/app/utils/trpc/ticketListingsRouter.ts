import { TRPCError } from "@trpc/server";
import { events, ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { omit } from "remeda";
import * as v from "valibot";
import { createTicketListingInputSchema } from "../createTicketListingInputSchema";
import { db } from "../db.server";
import { env } from "../env.server";
import { logger } from "../logger";
import { stripe } from "../stripe";
import { publicProcedure, router, validatedMerchantProcedure } from "./trpcServerConfig";

export const ticketListingsRouter = router({
  create: validatedMerchantProcedure
    .input(v.parser(createTicketListingInputSchema))
    .mutation(async ({ ctx, input }) => {
      let stripeProductId: string | null = null;

      if (input.priceCents > 0) {
        const product = await stripe.products.create(
          {
            name: `${input.quantity}x - ${input.event.name}`,
            default_price_data: {
              currency: "cad",
              unit_amount: input.priceCents,
            },
          },
          { stripeAccount: ctx.merchant.stripeAccountId },
        );

        stripeProductId = product.id;
      }

      return await db.transaction(async (tx) => {
        const newEvent = await tx.insert(events).values(input.event).returning().get();
        const newListing = await tx
          .insert(ticketListings)
          .values({ ...omit(input, ["event"]), stripeProductId, eventId: newEvent.id, merchantId: ctx.merchant.id });

        return { ...newListing, event: newEvent };
      });
    }),
  createPurchaseSession: publicProcedure
    .input(v.parser(v.object({ listingId: v.string(), redirectUrl: v.string() })))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.query.ticketListings.findFirst({
        where: eq(ticketListings.id, input.listingId),
        with: {
          merchant: true,
        },
      });

      if (!listing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing not found" });
      }

      if (listing.isSold) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing is already sold" });
      }

      if (!listing.merchant.stripeAccountId || !listing.merchant.isStripeAccountSetup) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Merchant does not have a valid Stripe account",
        });
      }

      if (!listing.stripePriceId) {
        logger.error(`Listing id="${listing.id}" does not have a Stripe price ID`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Invalid listing" });
      }

      if (ctx.user && listing.merchant.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot purchase a listing you own" });
      }

      const session = await stripe.checkout.sessions.create(
        {
          return_url: env.server.PUBLIC_WEBSITE_URL,
          line_items: [
            {
              adjustable_quantity: {
                enabled: true,
                minimum: 1,
                maximum: listing.quantity,
              },
              price: listing.stripePriceId,
            },
          ],
        },
        { stripeAccount: listing.merchant.stripeAccountId },
      );

      if (!session.url) {
        logger.error(`Could not create Stripe checkout session for listing id="${listing.id}"`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error purchasing ticket" });
      }

      return { url: session.url };
    }),
});
