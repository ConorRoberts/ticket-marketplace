import { createClient } from "@libsql/client";
import { execSync } from "child_process";
import { sql } from "drizzle-orm";
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
  execSync("rm -rf ./packages/common/migrations");
  execSync("pnpm generate");

  // We're cleaning the database every time we run a migration.
  // This makes sense for now while we have no data that needs to be retained.
  await db.run(sql`drop table if exists migrations;`);
  await db.run(sql`drop table if exists loaders;`);
  await db.run(sql`drop table if exists ticket_listings;`);
  await db.run(sql`drop table if exists event_ticket_sources;`);
  await db.run(sql`drop table if exists events;`);
  await db.run(sql`drop table if exists ticket_listing_transactions;`);
  await db.run(sql`drop table if exists merchants;`);

  console.info("Running migrations");
  await migrate(db, {
    migrationsFolder: "./packages/common/migrations",
    migrationsTable: "migrations",
  });
  console.info("Migrations applied");

  await runLoaders({ db });

  process.exit(0);
})();
