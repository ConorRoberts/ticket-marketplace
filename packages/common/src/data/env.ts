import { createEnv } from "@conorroberts/utils/env";

export const env = createEnv({
  env: process.env,
  schema: (v) => ({
    DATABASE_AUTH_TOKEN: v.string(),
    DATABASE_URL: v.string(),
    DEV: v.pipe(
      v.optional(v.picklist(["true", "false"]), "false"),
      v.transform((e) => e === "true"),
    ),
    CLEAN: v.fallback(v.boolean(), false),
  }),
});
