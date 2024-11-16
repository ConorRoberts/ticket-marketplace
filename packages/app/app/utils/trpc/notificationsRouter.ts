import { TRPCError } from "@trpc/server";
import { notifications } from "common/schema";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "../db.server";
import { protectedProcedure, router } from "./trpcServerConfig";

export const notificationsRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const foundNotifications = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, ctx.user.id), eq(notifications.isDismissed, false)),
      orderBy: desc(notifications.createdAt),
    });

    return foundNotifications;
  }),
  dismiss: protectedProcedure.input(v.parser(v.object({ id: v.string() }))).mutation(async ({ ctx, input }) => {
    const foundNotification = await db.query.notifications.findFirst({
      where: and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)),
    });

    if (!foundNotification) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Notification not found" });
    }

    await db.update(notifications).set({ isDismissed: true }).where(eq(notifications.id, foundNotification.id));

    return {};
  }),
});
