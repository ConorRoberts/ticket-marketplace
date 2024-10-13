import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/common/src/schema.ts",
  out: "./packages/common/migrations",
  dialect: "turso",
  migrations: {
    table: "migrations",
  },
  dbCredentials: {
    url: String(process.env.DATABASE_URL),
    authToken: String(process.env.DATABASE_AUTH_TOKEN),
  },
});
