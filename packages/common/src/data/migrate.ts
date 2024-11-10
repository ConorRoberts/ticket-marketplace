import { createClient } from "@libsql/client";
import { consola } from "consola";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../schema";
import { env } from "./env";
import { runLoaders } from "./load";

const url = env.server.DATABASE_URL;

// Migrations are only supported via the libsql protocol
// url = url.startsWith("http") ? url.replace(/http(s)?/, "libsql") : url;

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
  if (env.server.CLEAN) {
    await db.run(sql`drop table if exists loaders;`);
    await db.run(sql`drop table if exists migrations;`);

    await db.run(sql`drop table if exists notifications;`);

    await db.run(sql`drop table if exists ticket_listing_transactions;`);
    await db.run(sql`drop table if exists ticket_listing_chat_messages;`);

    await db.run(sql`drop table if exists event_ticket_sources;`);
    await db.run(sql`drop table if exists events;`);

    await db.run(sql`drop table if exists ticket_listings;`);

    await db.run(sql`drop table if exists merchants;`);

    consola.success("Reset database");
  }

  await runLoaders({ db, timing: "before" });

  consola.info("Running migrations");
  await migrate(db, {
    migrationsFolder: "./packages/common/migrations",
    migrationsTable: "migrations",
  });
  consola.success("Migrations applied");

  await runLoaders({ db, timing: "after" });

  process.exit(0);
})();
