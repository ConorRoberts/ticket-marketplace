import { TRPCError } from "@trpc/server";
import { merchants } from "common/schema";
import { eq } from "drizzle-orm";
import { db } from "../db.server";
import { protectedProcedure, router } from "./trpcServerConfig";

export const merchantsRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const merchant = await db.query.merchants.findFirst({
      where: eq(merchants.userId, ctx.user.id),
    });

    if (!merchant) {
      throw new TRPCError({ code: "BAD_REQUEST", message: `Merchant not found for user id=${ctx.user.id}` });
    }

    return merchant;
  }),
});
