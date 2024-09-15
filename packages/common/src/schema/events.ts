import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eventTicketSources } from "./eventTicketSources";
import { sharedColumns } from "./shared/columns";

export const eventType = ["concert", "rave", "other"] as const;

export const events = sqliteTable(
  "events",
  {
    ...sharedColumns.common,
    name: text("name").notNull(),
    type: text("type", { enum: eventType }).notNull(),
  },
  (_table) => ({}),
);

export const eventRelations = relations(events, (r) => ({
  ticketSources: r.many(eventTicketSources),
}));

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;
