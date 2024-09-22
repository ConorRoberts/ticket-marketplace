import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { events } from "./events";
import { sharedColumns } from "./shared/columns";

export const eventTicketSources = sqliteTable(
  "event_ticket_sources",
  {
    ...sharedColumns.common,
    name: text("name").notNull(),
    // The URL where the ticket was acquired
    url: text("url").notNull(),
    eventId: text("event_id").notNull(),
  },
  (_table) => ({}),
);

export const eventTicketSourceRelations = relations(eventTicketSources, (r) => ({
  event: r.one(events, { fields: [eventTicketSources.eventId], references: [events.id] }),
}));

export type EventTicketSource = InferSelectModel<typeof eventTicketSources>;
export type NewEventTicketSource = InferInsertModel<typeof eventTicketSources>;
