import consola from "consola";
import { inArray } from "drizzle-orm";
import type { DatabaseClient, DatabaseClientTransactionContext } from "../client";
import { loaders } from "../schema";

interface LoaderOptions {
  /**
   * Does this loader run before or after migrations?
   */
  timing: "before" | "after";
}

const createLoader = (
  id: string,
  callback: (args: { tx: DatabaseClientTransactionContext }) => Promise<void> | void,
  options: LoaderOptions,
) => {
  return {
    id,
    callback,
    options,
  };
};

const loaderFunctions: Array<ReturnType<typeof createLoader>> = [];

export const runLoaders = async (args: { db: DatabaseClient; timing: LoaderOptions["timing"] }) => {
  if (loaderFunctions.length === 0) {
    consola.info(`[${args.timing}] No pending loaders`);
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

  const pendingLoaders = loaderFunctions.filter((e) => !hasLoaderRun(e.id) && e.options.timing === args.timing);

  if (pendingLoaders.length === 0) {
    consola.info("No pending loaders");
    return;
  }

  consola.info(`Pending loaders - ${pendingLoaders.map((e) => e.id).join(", ")}`);

  await args.db.transaction(async (tx) => {
    for (const loader of pendingLoaders) {
      await loader.callback({ tx });

      await tx.insert(loaders).values({ id: loader.id });

      consola.success(`Loader Success - ${loader.id}`);
    }
  });

  consola.success("Commit");
};
