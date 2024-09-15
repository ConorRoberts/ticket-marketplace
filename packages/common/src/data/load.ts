import { inArray } from "drizzle-orm";
import { omit } from "remeda";
import type { DatabaseClient, DatabaseClientTransactionContext } from "../client";
import {
  events,
  eventTicketSources,
  loaders,
  ticketListings,
  type NewEvent,
  type NewEventTicketSource,
  type NewTicketListing,
} from "../schema";
import { env } from "./env";

const createLoader = (
  id: string,
  callback: (args: { tx: DatabaseClientTransactionContext }) => Promise<void> | void,
  options?: { dev?: boolean },
) => {
  return {
    id,
    callback,
    options,
  };
};

const loaderFunctions: Array<ReturnType<typeof createLoader>> = [
  createLoader(
    "devData",
    async (args) => {
      const devUserId = "user_2m4I8pOBBKoZzUYmdnEJG8pqoQX";

      const sampleListings: (Omit<NewTicketListing, "eventId"> & {
        event: NewEvent;
        ticketSource: Omit<NewEventTicketSource, "eventId">;
      })[] = [
        {
          priceCents: 1_000,
          event: {
            name: "Taylor Swift Concert",
            type: "concert",
          },
          ticketSource: {
            name: "TicketMaster",
            url: "https://ticketmaster.com/taylor-swift-concert",
          },
          userId: devUserId,
        },
      ];

      for (const e of sampleListings) {
        const newEvent = await args.tx.insert(events).values(e.event).returning().get();
        const newTicketSource = await args.tx
          .insert(eventTicketSources)
          .values({ ...e.ticketSource, eventId: newEvent.id })
          .returning()
          .get();

        await args.tx
          .insert(ticketListings)
          .values({ ...omit(e, ["ticketSource", "event"]), eventId: newEvent.id, ticketSourceId: newTicketSource.id });
      }
    },
    { dev: true },
  ),
];

export const runLoaders = async (args: { db: DatabaseClient }) => {
  if (loaderFunctions.length === 0) {
    console.log("No pending loaders");
    return;
  }

  const previousLoaders = await args.db.query.loaders.findMany({
    columns: {
      id: true,
    },
    where: inArray(
      loaders.id,
      loaderFunctions.map((e) => e.id),
    ),
  });

  const previousLoaderIds = new Set(previousLoaders.map((e) => e.id));

  const hasLoaderRun = (id: string) => previousLoaderIds.has(id);

  const pendingLoaders = loaderFunctions.filter((e) => !hasLoaderRun(e.id) || (e.options?.dev && env.server.DEV));
  console.log(`Pending loaders - ${pendingLoaders.map((e) => e.id).join(", ")}`);

  for (const loader of pendingLoaders) {
    await args.db.transaction(async (tx) => {
      await loader.callback({ tx });

      await tx.insert(loaders).values({ id: loader.id });
    });

    console.log(`Loader Success - ${loader.id}`);
  }
};
