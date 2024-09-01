import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "~/utils/trpc/trpcContext";
import { trpcRouter } from "~/utils/trpc/trpcRouter";

const handler = (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: args.request,
    router: trpcRouter,
    createContext: async (_opts) => {
      return await createContext(args);
    },
    onError: ({ type, path, error, input, ctx }) => {
      if (ctx) {
        ctx.logger.error({
          type,
          path,
          error: { name: error.name, message: error.message, code: error.code },
          input,
        });
      }
    },
  });
};

export { handler as action, handler as loader };
