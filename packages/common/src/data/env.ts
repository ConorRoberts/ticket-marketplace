import { createEnv } from "@conorroberts/utils/env";

export const env = createEnv({
  env: process.env,
  schema: (v) => ({
    DATABASE_AUTH_TOKEN: v.string(),
    DATABASE_URL: v.string(),
  }),
});
