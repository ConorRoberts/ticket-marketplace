import type { WebhookEvent } from "@clerk/remix/api.server";
import { getAuth } from "@clerk/remix/ssr.server";
import { vValidator } from "@hono/valibot-validator";
import { createId } from "@paralleldrive/cuid2";
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { merchants } from "common/schema";
import { Hono } from "hono";
import { Webhook } from "svix";
import * as v from "valibot";
import { db } from "~/utils/db.server";
import { env } from "~/utils/env.server";
import { stripe } from "~/utils/stripe";
import { images } from "./images";

const success = <T>(data: T) => {
  return { success: true as const, data };
};

const error = (message: string) => {
  return {
    success: false as const,
    data: {
      message,
    },
  };
};

export const apiRouter = (args: LoaderFunctionArgs | ActionFunctionArgs) =>
  new Hono<{ Variables: { args: typeof args } }>()
    .basePath("/api")
    .use(async (c, next) => {
      c.set("args", args);

      await next();
    })
    .get("/health", (c) => {
      return c.json({ message: "Success" });
    })
    .all("/webhooks/clerk", async (c) => {
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
    })
    .all("/webhooks/stripe", async (c) => {
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
    })
    .post("uploadImage", vValidator("form", v.object({ file: v.blob() })), async (c) => {
      const { userId } = await getAuth(c.get("args"));

      if (!userId) {
        return c.json(error("Unauthorized"), 401);
      }

      const form = await c.req.formData();

      const file = form.get("file");

      if (!file) {
        return c.json(error("Missing 'file' field"));
      }

      if (!(file instanceof Blob)) {
        return c.json(error("File is not Blob"));
      }

      const imageId = createId();

      await images.upload(file, { apiKey: env.server.CLOUDFLARE_IMAGES_API_KEY, id: imageId });

      return c.json(success({ imageId }));
    });

export type Api = ReturnType<typeof apiRouter>;
