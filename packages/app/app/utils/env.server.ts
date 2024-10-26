import { createEnv } from "@conorroberts/utils/env";

export const env = createEnv({
  env: process.env,
  schema: (v) => ({
    NODE_ENV: v.picklist(["development", "production", "testing"]),

    CLERK_PUBLISHABLE_KEY: v.string(),
    CLERK_SECRET_KEY: v.string(),
    CLERK_WEBHOOK_SIGNING_SECRET: v.string(),

    DATABASE_URL: v.string(),
    DATABASE_AUTH_TOKEN: v.string(),

    PUBLIC_WEBSITE_URL: v.string(),

    STRIPE_PUBLIC_KEY: v.string(),
    STRIPE_SECRET_KEY: v.string(),
    STRIPE_SIGNING_SECRET: v.string(),

    PUBLIC_MAPBOX_TOKEN: v.string(),
    MAPBOX_PRIVATE_TOKEN: v.string(),

    CLOUDFLARE_ACCOUNT_ID: v.string(),
    CLOUDFLARE_IMAGES_API_KEY: v.string(),

    PUBLIC_PARTYKIT_URL: v.string(),

    RESEND_API_KEY: v.string(),

    PORT: v.pipe(
      v.optional(v.string(), "3000"),
      v.transform((value) => Number(value)),
    ),
  }),
});

export type ClientEnv = (typeof env)["client"];
