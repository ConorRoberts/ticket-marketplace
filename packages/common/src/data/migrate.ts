import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../schema";
import { env } from "./env";
import { runLoaders } from "./load";

let url = env.server.DATABASE_URL;

// Migrations are only supported via the libsql protocol
url = url.startsWith("http") ? url.replace(/http(s)?/, "libsql") : url;

const authToken = env.server.DATABASE_AUTH_TOKEN;

const db = drizzle(
  createClient(
    // Auth token must be either 1) present and not undefined or 2) not present
    authToken
      ? {
          url,
          authToken,
        }
      : { url },
  ),
  { schema },
);

(async () => {
  console.info("Running migrations");
  await migrate(db, {
    migrationsFolder: "./packages/common/migrations",
    migrationsTable: "migrations",
  });
  console.info("Migrations applied");

  await runLoaders({ db });

  process.exit(0);
})();
