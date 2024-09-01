import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "./shared/columns";

export const loaders = sqliteTable(
  "loaders",
  {
    ...sharedColumns.common,
  },
  (_table) => ({}),
);

export const loaderRelations = relations(loaders, () => ({}));

export type Loader = InferSelectModel<typeof loaders>;
export type NewLoader = InferInsertModel<typeof loaders>;
