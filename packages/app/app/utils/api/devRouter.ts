import { vValidator } from "@hono/valibot-validator";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { merchants } from "common/schema";
import { Hono } from "hono";
import { db } from "~/utils/db.server";
import { checkoutMetadataSchema } from "../checkoutMetadataSchema";
import { clerk } from "../clerk.server";
import { handleTicketPurchase } from "./utils/handleTicketPurchase";

export const devRouter = (_args: LoaderFunctionArgs | ActionFunctionArgs) => {
  return new Hono()
    .basePath("/dev")
    .post("/setup", async (c) => {
      const users = await clerk.users.getUserList({ limit: 500 });

      for (const u of users.data) {
        await db.insert(merchants).values({ userId: u.id }).onConflictDoNothing();
      }

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
    })
    .post("forceCheckoutSuccess", vValidator("json", checkoutMetadataSchema), async (c) => {
      const data = c.req.valid("json");

      if (data.type === "ticketPurchase") {
        await handleTicketPurchase({ meta: data, checkoutSessionId: null });
      }

      return c.json({});
    });
};
