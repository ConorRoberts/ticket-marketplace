import { stripe } from "../stripe";
import { protectedProcedure, router } from "./trpcServerConfig";
import * as v from "valibot";

export const ticketListingsRouter = router({
  create: protectedProcedure
    .input(
      v.parser(
        v.object({
          quantity: v.number(),
          priceCents: v.union([v.pipe(v.number(), v.maxValue(0)), v.pipe(v.number(), v.minValue(50))]),
          event: v.object({ name: v.string(), date: v.date(), placeId: v.string() }),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // Create entry in database
      // Create product in Stripe

      if (input.priceCents > 0) {
        await stripe.products.create({
          name: `${input.quantity}x - ${input.event.name}`,
          default_price_data: {
            currency: "cad",
            unit_amount: input.priceCents,
          },
        });
      }

      return null;
    }),
});
