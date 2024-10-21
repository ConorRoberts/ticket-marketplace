import * as v from "valibot";

export const checkoutMetadataSchema = v.variant("type", [
  v.object({
    type: v.literal("ticketPurchase"),
    data: v.object({ listingId: v.string(), userId: v.nullish(v.string()) }),
  }),
]);

export type CheckoutMetadata = v.InferOutput<typeof checkoutMetadataSchema>;

export const createCheckoutMetadata = (data: CheckoutMetadata) => {
  return { data: JSON.stringify(data) };
};

export const parseCheckoutMetadata = (data: any) => {
  return v.safeParse(
    v.pipe(
      v.any(),
      v.transform((value) => JSON.parse(value.data)),
      checkoutMetadataSchema,
    ),
    data,
  );
};
