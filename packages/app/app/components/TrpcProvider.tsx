import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type FC, type PropsWithChildren } from "react";
import { apiClient, reactApi } from "~/utils/trpc/trpcClient";

export const TrpcProvider: FC<PropsWithChildren> = (props) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 5000 } },
      })
  );
  return (
    <reactApi.Provider client={apiClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </reactApi.Provider>
  );
};
