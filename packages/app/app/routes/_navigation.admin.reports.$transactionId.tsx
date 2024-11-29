import { getAuth } from "@clerk/remix/ssr.server";
import { Button } from "@nextui-org/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import { Ban, RotateCcw, XIcon } from "lucide-react";
import { ChatMessages } from "~/components/ChatMessages";
import { Page } from "~/components/Page";
import { isAdmin } from "~/utils/api/utils/isAdmin";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { formatChatMessages } from "~/utils/formatChatMessages";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Admin" });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const transactionId = args.params.transactionId;

  if (!transactionId) {
    throw new Error(`Missing param "transactionId"`);
  }

  const auth = await getAuth(args);

  const admin = await isAdmin(auth);

  if (!admin) {
    throw redirect("/");
  }

  const t = await db.query.ticketListingTransactions.findFirst({
    where: eq(ticketListingTransactions.id, transactionId),
    with: {
      messages: true,
      ticketListing: {
        with: {
          merchant: true,
          event: true,
        },
      },
    },
  });

  if (!t) {
    throw new Error("Transaction not found");
  }

  const { messages } = await formatChatMessages({ transaction: t, userId: auth.userId });

  return { transaction: t, messages };
};

const Route = () => {
  const ld = useLoaderData<typeof loader>();

  return (
    <Page classNames={{ content: "flex-1 flex flex-col py-4", container: "px-0" }}>
      <div className="grid grid-cols-2 flex-1 gap-4 mx-auto max-w-5xl w-full">
        <div className="flex-col flex sm:shadow rounded-3xl p-4 h-max gap-2">
          <Button endContent={<RotateCcw className="size-4" />} variant="bordered">
            Refund Buyer
          </Button>
          <Button endContent={<XIcon className="size-4" />} variant="bordered">
            Close Report
          </Button>
          <Button endContent={<Ban className="size-4" />} variant="light" color="danger">
            Ban Seller
          </Button>
        </div>
        <div className="flex-col flex sm:shadow rounded-3xl p-4">
          <ChatMessages messages={ld.messages} />
        </div>
      </div>
    </Page>
  );
};

export default Route;
