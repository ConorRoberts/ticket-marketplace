import { httpBatchLink, httpLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import SuperJSON from "superjson";
import type { TrpcRouter } from "~/utils/trpc/trpcRouter";

export const trpc = createTRPCReact<TrpcRouter>();

const USE_BATCHING = true;
const httpLinkFn = USE_BATCHING ? httpBatchLink : httpLink;

// export const api = createTRPCClient<TrpcRouter>({
//   links: [
//     httpLinkFn({
//       transformer: SuperJSON,
//       url: "/api/trpc",
//       fetch: (url, options) => {
//         return fetch(url, {
//           ...options,
//           credentials: "include",
//         });
//       },
//     }),
//   ],
// });

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: () => process.env.NODE_ENV === "development",
    }),
    httpLinkFn({
      transformer: SuperJSON,
      url: "/api/trpc",
    }),
  ],
});
