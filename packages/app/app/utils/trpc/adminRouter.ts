import { TRPCError } from "@trpc/server";
import { merchants, notifications } from "common/schema";
import { eq } from "drizzle-orm";
import { db } from "../db.server";
import { protectedProcedure, router } from "./trpcServerConfig";
import * as v from "valibot";

export const adminRouter = router({
  approveMerchant: protectedProcedure
    .input(v.parser(v.object({ merchantId: v.string() })))
    .mutation(async ({ ctx, input }) => {
      const merchant = await db.query.merchants.findFirst({
        where: eq(merchants.id, input.merchantId),
      });

      if (!merchant) {
        ctx.logger.error("Could not find merchant ", { merchantId: input.merchantId });
        throw new TRPCError({ code: "BAD_REQUEST", message: "Merchant not found" });
      }

      await db.update(merchants).set({ isApproved: true }).where(eq(merchants.id, input.merchantId));
      await db
        .insert(notifications)
        .values({ message: "You are now approved to sell tickets.", userId: merchant.userId });

      return { message: "Merchant approved" };
    }),
});
