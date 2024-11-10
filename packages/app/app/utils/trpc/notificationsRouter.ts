import { notifications } from "common/schema";
import { and, desc, eq } from "drizzle-orm";
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
});
