import { ticketListingTransactions, ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import type { CheckoutMetadata } from "~/utils/checkoutMetadataSchema";
import { db } from "~/utils/db.server";

export const handleTicketPurchase = async (args: {
  checkoutSessionId: string | null;
  meta: CheckoutMetadata & { type: "ticketPurchase" };
}) => {
  // Ticket was purchased

  await db.transaction(async (tx) => {
    await tx
      .insert(ticketListingTransactions)
      .values({ ticketListingId: args.meta.data.listingId, buyerUserId: args.meta.data.userId });

    await tx.update(ticketListings).set({ isSold: true }).where(eq(ticketListings.id, args.meta.data.listingId));
  });

  // Send notification to customer to rate transaction
  // Send notification to merchant that they sold a ticket
};
