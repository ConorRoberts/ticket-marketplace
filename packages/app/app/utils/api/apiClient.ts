import { hc } from "hono/client";
import type { Api } from "./apiRouter.server";

export const { api } = hc<Api>("/");
