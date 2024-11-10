import type Stripe from "stripe";
import { parseCheckoutMetadata } from "~/utils/checkoutMetadataSchema";
import { handleTicketPurchase } from "./handleTicketPurchase";

export const handleCheckoutSessionCompleted = async (event: Stripe.CheckoutSessionCompletedEvent) => {
  const meta = parseCheckoutMetadata(event.data.object.metadata);

  if (meta.success) {
    const data = meta.output;
    if (data.type === "ticketPurchase") {
      await handleTicketPurchase({ meta: data, checkoutSessionId: event.data.object.id });
    }
  } else {
    throw new Error(JSON.stringify(meta.issues));
  }
};
