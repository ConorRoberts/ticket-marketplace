import { eventSchema } from "common/schema";
import * as v from "valibot";

export const createTicketListingInputSchema = v.object({
  description: v.string(),
  quantity: v.pipe(v.union([v.string(), v.number()]), v.transform(Number), v.number(), v.minValue(0)),
  unitPriceCents: v.pipe(v.union([v.string(), v.number()]), v.transform(Number), v.number()),
  event: eventSchema,
});
