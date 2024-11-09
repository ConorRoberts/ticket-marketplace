import { publicProcedure, router } from "./trpcServerConfig";
import * as v from "valibot";

export const ticketListingTransactionsRouter = router({
  completeTransaction: publicProcedure.input(v.parser(v.object({ transactionId: v.string() }))).mutation(() => {
    return null;
  }),
  createReport: publicProcedure.mutation(() => {
    return null;
  }),
});
