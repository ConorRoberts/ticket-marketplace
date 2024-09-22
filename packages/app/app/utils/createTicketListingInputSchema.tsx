import { eventSchema } from "common/schema";
import * as v from "valibot";

export const createTicketListingInputSchema = v.object({
  quantity: v.number(),
  priceCents: v.union([v.pipe(v.number(), v.maxValue(0)), v.pipe(v.number(), v.minValue(50))]),
  event: eventSchema,
});
