import { Stripe } from "stripe";
import { env } from "~/utils/env.server";

export const stripe = new Stripe(env.server.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  telemetry: false,
});
