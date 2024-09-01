import { useRouteLoaderData } from "@remix-run/react";
import type { RootLoader } from "~/root";

type RootLoaderData = NonNullable<Awaited<ReturnType<RootLoader>>>;

export const useEnv = () => {
  const { env } = useRouteLoaderData<RootLoader>("root") as RootLoaderData;

  return env;
};
