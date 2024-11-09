import { type InferResponseType, hc } from "hono/client";
import { useMemo } from "react";
import { useEnv } from "../useEnv";
import type { Api } from "./apiRouter.server";

export const useApi = () => {
  const env = useEnv();
  const api = useMemo(() => {
    const client = hc<Api>(env.PUBLIC_WEBSITE_URL);

    return client.api;
  }, [env]);

  return api;
};

type ApiClient = ReturnType<typeof useApi>;

export type UploadImageResponse = InferResponseType<ApiClient["uploadImage"]["$post"]>;
