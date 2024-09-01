import { inArray } from "drizzle-orm";
import type { DatabaseClient, DatabaseClientTransactionContext } from "../client";
import { loaders } from "../schema";

const createLoader = (id: string, callback: (args: { tx: DatabaseClientTransactionContext }) => Promise<void>) => {
  return {
    id,
    callback,
  };
};

const loaderFunctions: Array<ReturnType<typeof createLoader>> = [];

export const runLoaders = async (args: { db: DatabaseClient }) => {
  if (loaderFunctions.length === 0) {
    console.log("No pending loaders");
    return;
  }

  const foundLoaders = await args.db.query.loaders.findMany({
    where: inArray(
      loaders.id,
      loaderFunctions.map((e) => e.id),
    ),
  });

  const pendingLoaders = loaderFunctions.filter((e) => !foundLoaders.some((x) => x.id === e.id));
  console.log(`Pending loaders - ${pendingLoaders.map((e) => e.id).join(", ")}`);

  for (const loader of pendingLoaders) {
    await args.db.transaction(async (tx) => {
      await loader.callback({ tx });

      await tx.insert(loaders).values({ id: loader.id });
    });

    console.log(`Loader Success - ${loader.id}`);
  }
};
