import { ticketListingTransactions, ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { TicketListingPurchaseConfirmationEmail } from "~/components/emails/TicketListingPurchaseConfirmationEmail.server";
import type { CheckoutMetadata } from "~/utils/checkoutMetadataSchema";
import { db } from "~/utils/db.server";
import { sendEmail } from "~/utils/sendEmail";

export const handleTicketPurchase = async (args: {
  checkoutSessionId: string | null;
  meta: CheckoutMetadata & { type: "ticketPurchase" };
}) => {
  const { newTransaction } = await db.transaction(async (tx) => {
    const newTransaction = await tx
      .insert(ticketListingTransactions)
      .values({ ticketListingId: args.meta.data.listingId, buyerUserId: args.meta.data.userId })
      .returning()
      .get();

    await tx.update(ticketListings).set({ isSold: true }).where(eq(ticketListings.id, args.meta.data.listingId));

    return { newTransaction };
  });

  await sendEmail(
    { to: args.meta.data.email, subject: "Your Ticket Purchase" },
    {
      component: TicketListingPurchaseConfirmationEmail,
      props: { listingId: args.meta.data.listingId, transactionId: newTransaction.id },
    },
  );

  // Send pubsub notifications
};
