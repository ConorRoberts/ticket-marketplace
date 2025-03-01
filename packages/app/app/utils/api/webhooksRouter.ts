import type { WebhookEvent } from "@clerk/remix/api.server";
import { merchants } from "common/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { Webhook } from "svix";
import { db } from "~/utils/db.server";
import { env } from "~/utils/env.server";
import { stripe } from "~/utils/stripe";
import { handleCheckoutSessionCompleted } from "./utils/handleCheckoutSessionCompleted";

export const webhooksRouter = new Hono()
  .basePath("/webhooks")
  .all("/clerk", async (c) => {
    const svixId = c.req.header("svix-id");
    const svixTimestamp = c.req.header("svix-timestamp");
    const svixSignature = c.req.header("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error("No svix headers");
    }

    const body = await c.req.text();

    const wh = new Webhook(env.server.CLERK_WEBHOOK_SIGNING_SECRET);

    const event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;

    if (event.type === "user.created") {
      await db.insert(merchants).values({ userId: event.data.id }).onConflictDoNothing();
    }

    return c.json({});
  })
  .all("/stripe", async (c) => {
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature");

    if (!sig) {
      throw new Error(`Missing header "stripe-signature"`);
    }

    const _event = stripe.webhooks.constructEvent(body, sig, env.server.STRIPE_SIGNING_SECRET);

    return c.json({});
  })
  .all("/stripe/connect", async (c) => {
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature");

    if (!sig) {
      throw new Error(`Missing header "stripe-signature"`);
    }

    const event = stripe.webhooks.constructEvent(body, sig, env.server.STRIPE_CONNECT_SIGNING_SECRET);

    if (event.type === "checkout.session.completed") {
      await handleCheckoutSessionCompleted(event);
    } else if (event.type === "account.updated") {
      // We handle marking a merchant's Stripe account as setup and able to accept payment

      const isChargesEnabled = event.data.object.charges_enabled;
      const stripeAccountId = event.data.object.id;

      await db
        .update(merchants)
        .set({ isStripeAccountSetup: isChargesEnabled })
        .where(eq(merchants.stripeAccountId, stripeAccountId));
    }

    return c.json({});
  });
