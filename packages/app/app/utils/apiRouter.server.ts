import { CreateRoleCommand, IAMClient, PutRolePolicyCommand } from "@aws-sdk/client-iam";
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
import type { UserPrivateMetadata } from "~/utils/userMetadataSchema";
import { clerk } from "./clerk.server";
import { images } from "./images";
import { parseCheckoutMetadata } from "./checkoutMetadataSchema";

const iam = new IAMClient({ region: env.server.PUBLIC_AWS_REGION });

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

const createUserAwsRole = async (userId: string) => {
  const iamCreateRoleResponse = await iam.send(
    new CreateRoleCommand({
      RoleName: `ticket-marketplace-user-role-${userId}`,
      AssumeRolePolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              AWS: "*",
            },
            Action: "sts:AssumeRole",
          },
        ],
      }),
    }),
  );

  if (!iamCreateRoleResponse.Role?.RoleName || !iamCreateRoleResponse.Role?.Arn) {
    throw new Error("No role name");
  }

  await iam.send(
    new PutRolePolicyCommand({
      RoleName: iamCreateRoleResponse.Role.RoleName,
      PolicyName: `ticket-marketplace-user-policy-${userId}`,
      PolicyDocument: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: "iot:Connect",
            Resource: `arn:aws:iot:${env.server.PUBLIC_AWS_REGION}:${env.server.PUBLIC_AWS_ACCOUNT_ID}:client/*`,
          },
          {
            Effect: "Allow",
            Action: "iot:Subscribe",
            Resource: `arn:aws:iot:${env.server.PUBLIC_AWS_REGION}:${env.server.PUBLIC_AWS_ACCOUNT_ID}:topicfilter/*`,
          },
          {
            Effect: "Allow",
            Action: ["iot:Receive", "iot:Publish"],
            Resource: `arn:aws:iot:${env.server.PUBLIC_AWS_REGION}:${env.server.PUBLIC_AWS_ACCOUNT_ID}:topic/*`,
            // Resource: `arn:aws:iot:${env.server.PUBLIC_AWS_REGION}:${env.server.PUBLIC_AWS_ACCOUNT_ID}:topic/${userId}:*`,
          },
        ],
      }),
    }),
  );

  const privateMetadata: UserPrivateMetadata = {
    awsRoleArn: iamCreateRoleResponse.Role.Arn,
  };

  await clerk.users.updateUserMetadata(userId, { privateMetadata });
};

const devRouter = (_args: LoaderFunctionArgs | ActionFunctionArgs) => {
  return new Hono()
    .post("/setup", async (c) => {
      const users = await clerk.users.getUserList();

      const userIds = users.data.map((e) => e.id);

      await Promise.all(userIds.map((id) => createUserAwsRole(id)));

      return c.json({});
    })
    .post("validateBankAccounts", async (c) => {
      const result = await db.update(merchants).set({ isStripeAccountSetup: true }).returning();

      return c.json({ result });
    })
    .get("getMerchants", async (c) => {
      const result = await db.query.merchants.findMany({
        with: {
          ticketListings: {
            with: {
              event: true,
            },
          },
        },
      });

      return c.json({ result });
    });
};

export const apiRouter = (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const router = new Hono<{ Variables: {} }>()
    .basePath("/api")

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
        await db.insert(merchants).values({ userId: event.data.id }).onConflictDoNothing();

        await createUserAwsRole(event.data.id);
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
        const meta = parseCheckoutMetadata(event.data.object.metadata);

        if (meta.success) {
          if (meta.output.type === "ticketPurchase") {
            // Ticket was purchased
            // Send notification to customer to rate transaction
            // Send notification to merchant that they sold a ticket
            // Mark listing as sold
            // Create transaction
          }
        }
        return c.json({});
      }

      return c.json({});
    })
    .post("uploadImage", vValidator("form", v.object({ file: v.blob() })), async (c) => {
      const { userId } = await getAuth(args);

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

  if (env.server.NODE_ENV === "development") {
    router.route("/dev", devRouter(args));
  }

  return router;
};

export type Api = ReturnType<typeof apiRouter>;
