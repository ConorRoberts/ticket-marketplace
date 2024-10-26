import { TRPCError } from "@trpc/server";
import { events, ticketListings } from "common/schema";
import { and, eq } from "drizzle-orm";
import { omit } from "remeda";
import * as v from "valibot";
import { createCheckoutMetadata } from "../checkoutMetadataSchema";
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
      let stripePriceId: string | null = null;

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

        if (!product.default_price) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Error creating Stripe price for new listing",
          });
        }

        stripePriceId = typeof product.default_price === "string" ? product.default_price : product.default_price.id;
      }

      return await db.transaction(async (tx) => {
        const newEvent = await tx.insert(events).values(input.event).returning().get();
        const newListing = await tx
          .insert(ticketListings)
          .values({
            ...omit(input, ["event"]),
            stripeProductId,
            stripePriceId,
            eventId: newEvent.id,
            merchantId: ctx.merchant.id,
          })
          .returning()
          .get();

        return { ...newListing, event: newEvent };
      });
    }),
  update: validatedMerchantProcedure
    .input(v.parser(v.object({ listingId: v.string(), data: createTicketListingInputSchema })))
    .mutation(async ({ ctx, input }) => {
      let stripePriceId: string | null = null;

      const listing = await ctx.db.query.ticketListings.findFirst({
        where: eq(ticketListings.id, input.listingId),
      });

      if (!listing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Could not find listing" });
      }

      stripePriceId = listing.stripePriceId;

      if (input.data.priceCents < 50 && stripePriceId) {
        // If the price is now less than the minimum price, disable it
        await stripe.prices.update(stripePriceId, { active: false }, { stripeAccount: ctx.merchant.stripeAccountId });

        stripePriceId = null;
      } else if (input.data.priceCents >= 50 && input.data.priceCents !== listing.priceCents) {
        // If the price has changed, we need to create a new price object
        const newPrice = await stripe.prices.create({
          currency: "cad",
          unit_amount: input.priceCents,
        });
      }

      return await db.transaction(async (tx) => {
        const newEvent = await tx.insert(events).values(input.event).returning().get();
        const newListing = await tx
          .insert(ticketListings)
          .values({
            ...omit(input, ["event"]),
            stripePriceId,
            eventId: newEvent.id,
            merchantId: ctx.merchant.id,
          })
          .returning()
          .get();

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
          success_url: env.server.PUBLIC_WEBSITE_URL,
          cancel_url: env.server.PUBLIC_WEBSITE_URL,
          mode: "payment",
          line_items: [
            {
              adjustable_quantity:
                listing.quantity > 1
                  ? {
                      enabled: true,
                      minimum: 1,
                      maximum: listing.quantity,
                    }
                  : undefined,
              quantity: 1,
              price: listing.stripePriceId,
            },
          ],
          metadata: createCheckoutMetadata({
            type: "ticketPurchase",
            data: {
              listingId: listing.id,
            },
          }),
        },
        { stripeAccount: listing.merchant.stripeAccountId },
      );

      if (!session.url) {
        logger.error(`Could not create Stripe checkout session for listing id="${listing.id}"`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error purchasing ticket" });
      }

      return { url: session.url };
    }),
  delete: validatedMerchantProcedure
    .input(v.parser(v.object({ listingId: v.string() })))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.query.ticketListings.findFirst({
        where: and(eq(ticketListings.id, input.listingId), eq(ticketListings.merchantId, ctx.merchant.id)),
      });

      if (!listing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing does not exist" });
      }

      await db.update(ticketListings).set({ deletedAt: new Date() }).where(eq(ticketListings.id, listing.id));

      if (listing.stripeProductId) {
        await stripe.products.update(
          listing.stripeProductId,
          { active: false },
          { stripeAccount: ctx.merchant.stripeAccountId },
        );
      }

      return {};
    }),
});
