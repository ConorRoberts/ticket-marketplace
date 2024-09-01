import { publicProcedure, router } from "../trpcServerConfig";

export const pingRouter = router({
  ping: publicProcedure.query(() => {
    return "Pong";
  }),
});
