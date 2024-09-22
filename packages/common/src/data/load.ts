import dayjs from "dayjs";
import { inArray } from "drizzle-orm";
import { omit } from "remeda";
import type { DatabaseClient, DatabaseClientTransactionContext } from "../client";
import {
  events,
  eventTicketSources,
  loaders,
  merchants,
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

      const newMerchant = await args.tx
        .insert(merchants)
        .values({ userId: devUserId, stripeAccountId: "" })
        .returning()
        .get();

      const sampleListings: (Omit<NewTicketListing, "eventId"> & {
        event: NewEvent;
        ticketSource: Omit<NewEventTicketSource, "eventId">;
      })[] = [
        {
          priceCents: 1_000,
          event: {
            name: "Denzel Curry Concert",
            type: "concert",
            date: dayjs().add(1, "month").toDate(),
            imageId: "79b80c3a-99cb-4488-62a3-31412d10e400",
          },
          quantity: 2,
          ticketSource: {
            name: "TicketMaster",
            url: "https://ticketmaster.com/denzel-curry-concert",
          },
          merchantId: newMerchant.id,
        },
        {
          priceCents: 1_000,
          event: {
            name: "Taylor Swift Concert",
            type: "concert",
            date: dayjs().add(2, "month").toDate(),
            imageId: "d702ac4a-0a3b-47d9-b683-22b15545b900",
          },
          quantity: 2,
          ticketSource: {
            name: "TicketMaster",
            url: "https://ticketmaster.com/taylor-swift-concert",
          },
          merchantId: newMerchant.id,
        },
        {
          priceCents: 10_000,
          event: {
            name: "Tate McRae Concert",
            type: "concert",
            date: dayjs().add(7, "day").toDate(),
            imageId: "b182c821-dfc7-4534-0d4f-1cbbea4d2800",
          },
          quantity: 5,
          ticketSource: {
            name: "TicketMaster",
            url: "https://ticketmaster.com/denzel-curry-concert",
          },
          merchantId: newMerchant.id,
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
