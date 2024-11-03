import { TRPCError, initTRPC } from "@trpc/server";
import { merchants } from "common/schema";
import { eq } from "drizzle-orm";
import superjson from "superjson";
import * as v from "valibot";
import { db } from "../db.server";
import { logger } from "../logger";
import { userPublicMetadataSchema } from "../userMetadataSchema";
import type { Context } from "./trpcContext";

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

const loggerMiddleware = t.middleware(async ({ next, path, type, ctx, getRawInput }) => {
  const requestLogger = ctx.logger.child({
    path,
    type,
    input: await getRawInput(),
    headers: process.env.NODE_ENV === "production" ? Object.fromEntries(ctx.request.headers.entries()) : undefined,
  });

  requestLogger.info("TRPC Request");

  return next({ ctx: { ...ctx, logger: requestLogger } });
});

export const router = t.router;

export const publicProcedure = t.procedure.use(loggerMiddleware);

export const protectedProcedure = publicProcedure.use(async ({ next, ctx }) => {
  const user = ctx.user;

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const publicMetadata = v.parse(userPublicMetadataSchema, user.publicMetadata);

  return next({
    ctx: {
      ...ctx,
      user: { ...user, publicMetadata },
    },
  });
});

export const merchantProcedure = protectedProcedure.use(async ({ next, ctx }) => {
  const merchant = await db.query.merchants.findFirst({
    where: eq(merchants.userId, ctx.user.id),
  });

  if (!merchant) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Merchant profile not found" });
  }

  return next({
    ctx: {
      ...ctx,
      merchant,
    },
  });
});

export const validatedMerchantProcedure = merchantProcedure.use(async ({ next, ctx }) => {
  const stripeAccountId = ctx.merchant.stripeAccountId;

  if (!stripeAccountId) {
    logger.error(`Merchant id=${ctx.merchant.id} does not have a Stripe account ID`);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Merchant Stripe account not setup",
    });
  }

  if (!ctx.merchant.isStripeAccountSetup) {
    logger.error(`Merchant id=${ctx.merchant.id} does not have a setup Stripe account`);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Merchant Stripe account not setup",
    });
  }

  return next({
    ctx: { ...ctx, merchant: { ...ctx.merchant, stripeAccountId } },
  });
});

export const platformAdminProcedure = protectedProcedure.use(async ({ next, ctx }) => {
  if (!ctx.user.publicMetadata.isAdmin) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User is not an admin",
    });
  }

  return next();
});
