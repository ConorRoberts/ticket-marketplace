import { createClerkClient as createClient } from "@clerk/remix/api.server";
import { env } from "~/utils/env.server";

export const clerk = createClient({
  secretKey: env.server.CLERK_SECRET_KEY,
  publishableKey: env.server.CLERK_PUBLISHABLE_KEY,
});