import { events, ticketListings } from "common/schema";
import { omit } from "remeda";
import * as v from "valibot";
import { createTicketListingInputSchema } from "../createTicketListingInputSchema";
import { db } from "../db.server";
import { stripe } from "../stripe";
import { router, validatedMerchantProcedure } from "./trpcServerConfig";

export const ticketListingsRouter = router({
  create: validatedMerchantProcedure
    .input(v.parser(createTicketListingInputSchema))
    .mutation(async ({ ctx, input }) => {
      // Create entry in database
      // Create product in Stripe

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
});
