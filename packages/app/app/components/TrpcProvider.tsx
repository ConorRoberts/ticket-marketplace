import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { type FC, type PropsWithChildren, useState } from "react";
import { toast } from "sonner";
import { trpc, trpcClient } from "~/utils/trpc/trpcClient";

export const TrpcProvider: FC<PropsWithChildren> = (props) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 5000 },
        mutations: {
          onError: (e) => {
            if (e instanceof TRPCClientError) {
              console.error(e);
              toast.error(e.message);
            }
          },
        },
      },
    });

    return client;
  });
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
    </trpc.Provider>
  );
};
