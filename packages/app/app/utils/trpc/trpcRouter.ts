import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { accountsRouter } from "./accountsRouter";
import { adminRouter } from "./adminRouter";
import { merchantsRouter } from "./merchantsRouter";
import { notificationsRouter } from "./notificationsRouter";
import { ticketListingsRouter } from "./ticketListingsRouter";
import { createContext } from "./trpcContext";
import { router, t } from "./trpcServerConfig";

export const createCaller = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const ctx = await createContext(args);
  return t.createCallerFactory(trpcRouter)(ctx);
};

export const trpcRouter = router({
  listings: ticketListingsRouter,
  accounts: accountsRouter,
  merchants: merchantsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
});

export type TrpcRouter = typeof trpcRouter;
