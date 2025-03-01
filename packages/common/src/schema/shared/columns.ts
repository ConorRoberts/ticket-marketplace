import { createId } from "@paralleldrive/cuid2";
import { int, text } from "drizzle-orm/sqlite-core";

const timeColumns = {
  createdAt: int("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: int("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

const commonColumns = {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  ...timeColumns,
};

export const sharedColumns = {
  time: timeColumns,
  common: commonColumns,
};
