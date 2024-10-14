import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { createId } from "@paralleldrive/cuid2";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { TRPCError } from "@trpc/server";
import * as v from "valibot";
import { env } from "../env.server";
import { userPrivateMetadataSchema } from "../userMetadataSchema";
import { accountsRouter } from "./accountsRouter";
import { merchantsRouter } from "./merchantsRouter";
import { notificationsRouter } from "./notificationsRouter";
import { ticketListingsRouter } from "./ticketListingsRouter";
import { createContext } from "./trpcContext";
import { protectedProcedure, router, t } from "./trpcServerConfig";

export const createCaller = async (args: LoaderFunctionArgs | ActionFunctionArgs) => {
  const ctx = await createContext(args);
  return t.createCallerFactory(trpcRouter)(ctx);
};

export const trpcRouter = router({
  listings: ticketListingsRouter,
  accounts: accountsRouter,
  merchants: merchantsRouter,
  notifications: notificationsRouter,
  getCredentials: protectedProcedure.query(async ({ ctx }) => {
    const meta = v.safeParse(userPrivateMetadataSchema, ctx.user.privateMetadata);

    if (!meta.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Invalid metadata",
      });
    }

    const roleArn = meta.output.awsRoleArn;

    if (!roleArn) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No role",
      });
    }

    const stsClient = new STSClient({ region: env.server.PUBLIC_AWS_REGION });

    const creds = await stsClient.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: createId(),
        DurationSeconds: 900,
      }),
    );

    if (!creds.Credentials?.AccessKeyId || !creds.Credentials?.SecretAccessKey || !creds.Credentials?.SessionToken) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Error getting credentials" });
    }

    return {
      accessKeyId: creds.Credentials.AccessKeyId,
      secretAccessKey: creds.Credentials.SecretAccessKey,
      sessionToken: creds.Credentials.SessionToken,
    };
  }),
});

export type TrpcRouter = typeof trpcRouter;
