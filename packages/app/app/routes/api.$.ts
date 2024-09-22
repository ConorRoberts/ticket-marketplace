import type { WebhookEvent } from "@clerk/remix/api.server";
import { merchants } from "common/schema";
import { Hono } from "hono";
import { Webhook } from "svix";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { env } from "~/utils/env.server";
import { db } from "~/utils/db";
import { stripe } from "~/utils/stripe";

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

  if (!event.livemode || import.meta.env.DEV) {
    return json({ message: "Event ignored" }, { status: 200 });
  }

  if (event.type === "checkout.session.completed") {
    return c.json({});
  }

  return c.json({});
});

const handler = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  return app.fetch(args.request, {});
};

export { handler as action, handler as loader };
