import type { AuthObject } from "@clerk/backend";
import * as v from "valibot";
import { clerk } from "~/utils/clerk.server";
import { logger } from "~/utils/logger";
import { userPublicMetadataSchema } from "~/utils/userMetadataSchema";

export const isAdmin = async (auth: AuthObject) => {
  if (!auth.userId) {
    return false;
  }

  const user = await clerk.users.getUser(auth.userId);

  const meta = v.safeParse(userPublicMetadataSchema, user.publicMetadata);

  if (!meta.success) {
    logger.error(meta.issues);
    return false;
  }

  if (!meta.output.isAdmin) {
    return false;
  }

  return true;
};
