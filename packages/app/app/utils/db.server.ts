import { createDbClient } from "common/client";
import { env } from "~/utils/env.server";

export const db = createDbClient({
  url: env.server.DATABASE_URL,
  authToken: env.server.DATABASE_AUTH_TOKEN,
});
