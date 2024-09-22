import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import * as v from "valibot";
import { eventTicketSources } from "./eventTicketSources";
import { sharedColumns } from "./shared/columns";

export const eventType = ["concert", "rave", "other"] as const;

export const events = sqliteTable(
  "events",
  {
    ...sharedColumns.common,
    name: text("name").notNull(),
    type: text("type", { enum: eventType }).notNull(),
    date: int("date", { mode: "timestamp_ms" }).notNull(),
    imageId: text("image_id"),
  },
  (_table) => ({}),
);

export const eventRelations = relations(events, (r) => ({
  ticketSources: r.many(eventTicketSources),
}));

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;

export const eventSchema = v.object({
  name: v.string(),
  type: v.picklist(eventType),
  date: v.date(),
  imageId: v.string(),
});
