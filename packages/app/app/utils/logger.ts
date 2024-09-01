import { createLogger } from "@conorroberts/utils/logger";

export const logger = createLogger({
  service: "app",
  pretty: process.env.NODE_ENV === "development",
});
