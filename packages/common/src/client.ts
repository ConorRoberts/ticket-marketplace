import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const createLibsqlClient = (args: {
  url: string;
  authToken?: string;
}) => {
  return createClient(args);
};

export const createDbClient = (args: { url: string; authToken?: string }) => {
  const client = createLibsqlClient(args);
  const db = drizzle(client, {
    schema,
    logger: false,
  });

  return db;
};

export type DatabaseClient = ReturnType<typeof createDbClient>;
export type DatabaseClientTransactionContext = Parameters<
  Parameters<ReturnType<typeof createDbClient>["transaction"]>[0]
>[0];
