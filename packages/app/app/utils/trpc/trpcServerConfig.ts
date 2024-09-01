import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
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

  requestLogger.info("API Request");

  return next({ ctx: { ...ctx, logger: requestLogger } });
});

const isAuthed = t.middleware(async ({ next, ctx }) => {
  const user = ctx.user;

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user,
    },
  });
});

export const router = t.router;

export const publicProcedure = t.procedure.use(loggerMiddleware);

export const protectedProcedure = publicProcedure.use(isAuthed);
