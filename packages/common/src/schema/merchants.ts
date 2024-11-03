import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";
import { ticketListings } from "./ticketListings";

export const merchants = sqliteTable(
  "merchants",
  {
    ...sharedColumns.common,
    userId: text("user_id").notNull().unique(),
    stripeAccountId: text("stripe_account_id"),
    isStripeAccountSetup: int("is_stripe_account_setup", { mode: "boolean" }).default(false).notNull(),
    isApproved: int("is_approved", { mode: "boolean" }).default(false).notNull(),
  },
  (_table) => ({}),
);

export const merchantRelations = relations(merchants, (r) => ({ ticketListings: r.many(ticketListings) }));

export type Merchant = InferSelectModel<typeof merchants>;
export type NewMerchant = InferInsertModel<typeof merchants>;
