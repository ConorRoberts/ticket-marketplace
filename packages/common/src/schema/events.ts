import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";

export const events = sqliteTable(
  "events",
  {
    ...sharedColumns.common,
    name: text("name").notNull(),
  },
  (_table) => ({}),
);

export const eventRelations = relations(events, () => ({}));

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;
