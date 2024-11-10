import type Stripe from "stripe";
import { parseCheckoutMetadata } from "~/utils/checkoutMetadataSchema";
import { handleTicketPurchase } from "./handleTicketPurchase";

export const handleCheckoutSessionCompleted = async (event: Stripe.CheckoutSessionCompletedEvent) => {
  const data = parseCheckoutMetadata(event.data.object.metadata);

  if (data.type === "ticketPurchase") {
    await handleTicketPurchase({ meta: data, checkoutSessionId: event.data.object.id });
  }
};
