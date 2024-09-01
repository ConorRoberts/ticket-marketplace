import type { User } from "@clerk/remix/api.server";
import { getAuth } from "@clerk/remix/ssr.server";
import { createId } from "@paralleldrive/cuid2";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { clerk } from "~/utils/clerk.server";
import { logger } from "~/utils/logger";
import { db } from "../db.server";

export const createContext = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const auth = await getAuth(args);

  let user: User | null = null;

  if (auth.userId) {
    const u = await clerk.users.getUser(auth.userId);
    user = u;
  }

  const requestLogger = logger.child({
    reqId: createId(),
  });

  return {
    user,
    request: args.request,
    db,
    logger: requestLogger,
    clerk,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
