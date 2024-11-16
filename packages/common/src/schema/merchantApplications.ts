import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { merchants } from "./merchants";
import { sharedColumns } from "./shared/columns";

const applicationStatus = ["approved", "pending", "rejected"] as const;

export const merchantApplications = sqliteTable(
  "merchant_applications",
  {
    ...sharedColumns.common,
    merchantId: text("merchant_id")
      .notNull()
      .references(() => merchants.id),
    body: text("body").notNull(),
    links: text("links", { mode: "json" })
      .$type<string[]>()
      .$default(() => [])
      .notNull(),
    status: text("status", { enum: applicationStatus }).default("pending").notNull(),
  },
  (_table) => ({}),
);

export const merchantApplicationRelations = relations(merchantApplications, (r) => ({
  merchant: r.one(merchants, { fields: [merchantApplications.merchantId], references: [merchants.id] }),
}));

export type MerchantApplication = InferSelectModel<typeof merchantApplications>;
export type NewMerchantApplication = InferInsertModel<typeof merchantApplications>;
