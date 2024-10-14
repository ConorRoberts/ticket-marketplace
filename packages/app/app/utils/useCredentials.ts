import { trpc } from "./trpc/trpcClient";

export const useCredentials = () => {
  return trpc.getCredentials.useQuery(undefined, { staleTime: 1000 * 60 * 4, gcTime: Infinity });
};
