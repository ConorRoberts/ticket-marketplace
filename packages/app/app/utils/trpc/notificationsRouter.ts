import { protectedProcedure, router } from "./trpcServerConfig";

export const notificationsRouter = router({
  getAll: protectedProcedure.query(() => {
    return [];
  }),
});
