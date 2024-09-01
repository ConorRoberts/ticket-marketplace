import { createEnv } from "@conorroberts/utils/env";

export const env = createEnv({
  env: process.env,
  schema: (v) => ({
    NODE_ENV: v.picklist(["development", "production", "testing"]),
    CLERK_PUBLISHABLE_KEY: v.string(),
    CLERK_SECRET_KEY: v.string(),
    DATABASE_URL: v.string(),
    DATABASE_AUTH_TOKEN: v.string(),
    PUBLIC_WEBSITE_URL: v.string(),
    PORT: v.pipe(
      v.optional(v.string(), "3000"),
      v.transform((value) => Number(value)),
    ),
  }),
});

export type ClientEnv = (typeof env)["client"];
