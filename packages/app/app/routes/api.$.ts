import type { WebhookEvent } from "@clerk/remix/api.server";
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { merchants } from "common/schema";
import { Hono } from "hono";
import { Webhook } from "svix";
import { db } from "~/utils/db.server";
import { env } from "~/utils/env.server";
import { stripe } from "~/utils/stripe";

const handler = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const app = new Hono().basePath("/api");

  app.get("/health", (c) => {
    return c.json({ message: "Success" });
  });

  app.all("/webhooks/clerk", async (c) => {
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
      await db.insert(merchants).values({ userId: event.data.id });
    }

    return c.json({});
  });

  app.all("/webhooks/stripe", async (c) => {
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature");

    if (!sig) {
      throw new Error("Missing header 'stripe-signature'");
    }

    const event = stripe.webhooks.constructEvent(body, sig, env.server.STRIPE_SIGNING_SECRET);

    if (!event.livemode || env.server.NODE_ENV === "development") {
      return json({ message: "Event ignored" }, { status: 200 });
    }

    if (event.type === "checkout.session.completed") {
      return c.json({});
    }

    return c.json({});
  });

  return app.fetch(args.request, {});
};

export { handler as action, handler as loader };
