import { Link, Tailwind } from "@react-email/components";
import type { FC } from "react";
import { env } from "~/utils/env.server";

export const TicketListingPurchaseConfirmationEmail: FC<{ transactionId: string; listingId: string }> = (props) => {
  const chatUrl = new URL(`/listing/${props.listingId}/chat/${props.transactionId}`, env.server.PUBLIC_WEBSITE_URL);

  return (
    <Tailwind>
      <Link href={chatUrl.toString()}>Chat with Seller</Link>
    </Tailwind>
  );
};
