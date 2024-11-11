import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Outlet, redirect } from "@remix-run/react";
import * as v from "valibot";
import { clerk } from "~/utils/clerk.server";
import { createMetadata } from "~/utils/createMetadata";
import { logger } from "~/utils/logger";
import { userPublicMetadataSchema } from "~/utils/userMetadataSchema";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Admin" });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const auth = await getAuth(args);

  if (!auth.userId) {
    throw redirect("/login");
  }

  const user = await clerk.users.getUser(auth.userId);

  const meta = v.safeParse(userPublicMetadataSchema, user.publicMetadata);

  if (!meta.success) {
    logger.error(meta.issues);
    throw new Error("Unexpected Error");
  }

  if (!meta.output.isAdmin) {
    throw redirect("/");
  }

  return {};
};

const Route = () => {
  return <Outlet />;
};

export default Route;
