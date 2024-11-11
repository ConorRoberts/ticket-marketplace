import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";

export const notifications = sqliteTable(
  "notifications",
  {
    ...sharedColumns.common,
    userId: text("user_id").notNull(),
    message: text("message").notNull(),
    name: text("name").notNull().default("Notification"),
    url: text("url"),
    isDismissed: int("is_dismissed", { mode: "boolean" }).default(false).notNull(),
  },
  (_table) => ({}),
);

export const notificationRelations = relations(notifications, (_r) => ({}));

export type Notification = InferSelectModel<typeof notifications>;
export type NewNotification = InferInsertModel<typeof notifications>;
