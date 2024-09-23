import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { accountsRouter } from "./accountsRouter";
import { ticketListingsRouter } from "./ticketListingsRouter";
import { createContext } from "./trpcContext";
import { router, t } from "./trpcServerConfig";
import { merchantsRouter } from "./merchantsRouter";

export const createCaller = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const ctx = await createContext(args);
  return t.createCallerFactory(trpcRouter)(ctx);
};

export const trpcRouter = router({
  listings: ticketListingsRouter,
  accounts: accountsRouter,
  merchants: merchantsRouter,
});

export type TrpcRouter = typeof trpcRouter;
