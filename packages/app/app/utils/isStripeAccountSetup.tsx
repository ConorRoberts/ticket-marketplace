import { logger } from "./logger";
import { stripe } from "./stripe";

export const isStripeAccountSetup = async (stripeAccountId?: string | null) => {
  if (!stripeAccountId) {
    return false;
  }
  try {
    const acc = await stripe.accounts.retrieve(stripeAccountId);

    return acc.charges_enabled;
  } catch (e) {
    logger.error(e);
    return false;
  }
};
