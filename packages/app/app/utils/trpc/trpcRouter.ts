import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { createContext } from "./trpcContext";
import { router, t } from "./trpcServerConfig";
import { pingRouter } from "./routers/pingRouter";

export const createCaller = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const ctx = await createContext(args);
  return t.createCallerFactory(trpcRouter)(ctx);
};

export const trpcRouter = router({
  ping: pingRouter,
});

export type TrpcRouter = typeof trpcRouter;
