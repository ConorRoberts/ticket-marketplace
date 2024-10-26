import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { apiRouter } from "~/utils/api/apiRouter.server";

const handler = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  return apiRouter(args).fetch(args.request, {});
};

export { handler as action, handler as loader };
