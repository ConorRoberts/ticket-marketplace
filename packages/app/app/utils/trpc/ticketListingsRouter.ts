import { TRPCError } from "@trpc/server";
import { events, eventSchema, ticketListings } from "common/schema";
import { and, eq } from "drizzle-orm";
import { omit } from "remeda";
import * as v from "valibot";
import { createCheckoutMetadata } from "../checkoutMetadataSchema";
import { db } from "../db.server";
import { env } from "../env.server";
import { logger } from "../logger";
import { stripe } from "../stripe";
import { publicProcedure, router, validatedMerchantProcedure } from "./trpcServerConfig";
import { ticketListingChatMessagesRouter } from "./ticketListingChatMessagesRouter";
import { ticketListingTransactionsRouter } from "./ticketListingTransactionsRouter";

export const ticketListingsRouter = router({
  transactions: ticketListingTransactionsRouter,
  chat: ticketListingChatMessagesRouter,
  create: validatedMerchantProcedure
    .input(
      v.parser(
        v.object({
          description: v.string(),
          quantity: v.pipe(v.number(), v.minValue(1)),
          unitPriceCents: v.pipe(v.number(), v.minValue(0)),
          event: eventSchema,
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      let stripeProductId: string | null = null;
      let stripePriceId: string | null = null;

      if (input.unitPriceCents > 0) {
        const product = await stripe.products.create(
          {
            name: `${input.quantity}x - ${input.event.name}`,
            default_price_data: {
              currency: "cad",
              unit_amount: input.unitPriceCents,
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
    .input(
      v.parser(
        v.object({
          listingId: v.string(),
          data: v.object({
            description: v.string(),
            quantity: v.pipe(v.number(), v.minValue(1)),
            unitPriceCents: v.pipe(v.number(), v.minValue(0)),
            event: eventSchema,
          }),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      let stripePriceId: string | null = null;

      const listing = await ctx.db.query.ticketListings.findFirst({
        where: and(eq(ticketListings.id, input.listingId), eq(ticketListings.merchantId, ctx.merchant.id)),
      });

      if (!listing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Could not find listing" });
      }

      if (!listing.stripeProductId) {
        logger.error(`Listing id="${listing.id}" does not have a valid Stripe product ID`);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Listing is invalid" });
      }

      stripePriceId = listing.stripePriceId;

      if (input.data.unitPriceCents === 0 && stripePriceId) {
        // If the price is now zero, disable it
        await stripe.prices.update(stripePriceId, { active: false }, { stripeAccount: ctx.merchant.stripeAccountId });

        stripePriceId = null;
      } else if (input.data.unitPriceCents > 0 && input.data.unitPriceCents !== listing.unitPriceCents) {
        // If the price has changed, we need to create a new price object
        const newPrice = await stripe.prices.create(
          {
            currency: "cad",
            unit_amount: input.data.unitPriceCents,
            product: listing.stripeProductId,
          },
          { stripeAccount: ctx.merchant.stripeAccountId },
        );

        stripePriceId = newPrice.id;
      }

      return await db.transaction(async (tx) => {
        const updatedEvent = await tx
          .update(events)
          .set(input.data.event)
          .where(eq(events.id, listing.eventId))
          .returning()
          .get();

        const updatedListing = await tx
          .update(ticketListings)
          .set({
            ...omit(input.data, ["event"]),
            stripePriceId,
          })
          .where(eq(ticketListings.id, listing.id))
          .returning()
          .get();

        return { ...updatedListing, event: updatedEvent };
      });
    }),
  createPurchaseSession: publicProcedure
    .input(v.parser(v.object({ listingId: v.string(), redirectUrl: v.string(), email: v.string() })))
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
              email: input.email,
              userId: ctx.user?.id ?? null,
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
