import { getAuth } from "@clerk/remix/ssr.server";
import { Button } from "@nextui-org/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect, useLoaderData, useRevalidator } from "@remix-run/react";
import { ticketListingTransactions } from "common/schema";
import { eq } from "drizzle-orm";
import { Ban, RotateCcw, XIcon } from "lucide-react";
import { ChatMessages } from "~/components/ChatMessages";
import { ClientDate } from "~/components/ClientDate";
import { Page } from "~/components/Page";
import { isAdmin } from "~/utils/api/utils/isAdmin";
import { clerk } from "~/utils/clerk.server";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { formatChatMessages } from "~/utils/formatChatMessages";
import { trpc } from "~/utils/trpc/trpcClient";

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

  const merchantUser = await clerk.users.getUser(t.ticketListing.merchant.userId);

  return { transaction: t, messages, merchantUser: { name: merchantUser.fullName } };
};

const Route = () => {
  const { revalidate } = useRevalidator();
  const ld = useLoaderData<typeof loader>();

  const { mutateAsync: banMerchant, isPending: isBanPending } = trpc.admin.banMerchant.useMutation({
    onSuccess: () => {
      revalidate();
    },
  });
  const { mutateAsync: refund, isPending: isRefundPending } = trpc.admin.refundTransaciton.useMutation({
    onSuccess: () => {
      revalidate();
    },
  });
  const { mutateAsync: closeReport, isPending: isClosePending } = trpc.admin.closeReport.useMutation({
    onSuccess: () => {
      revalidate();
    },
  });

  const isBanned = ld.transaction.ticketListing.merchant.bannedAt !== null;
  const isClosed = ld.transaction.reportClosedAt !== null;
  const isRefunded = ld.transaction.refundedAt !== null;

  return (
    <Page classNames={{ content: "flex-1 flex flex-col py-4", container: "px-0" }}>
      <div className="grid lg:grid-cols-2 flex-1 gap-4 mx-auto max-w-5xl w-full">
        <div className="flex-col flex sm:shadow rounded-3xl p-4 h-max gap-2">
          <div className="flex flex-col gap-2 text-sm mb-2">
            <p className="text-center w-full font-semibold">{isClosed ? " Report Closed" : "Decision Pending"}</p>
            <div className="flex flex-col">
              <p>
                <span className="font-semibold">Seller:</span> {ld.merchantUser.name}
              </p>
              <p>
                <span className="font-semibold">Purchased:</span> <ClientDate date={ld.transaction.createdAt} />
              </p>
            </div>
          </div>
          <Button
            endContent={<RotateCcw className="size-4" />}
            variant="bordered"
            isDisabled={isRefunded || isClosed}
            onClick={() => refund({ transactionId: ld.transaction.id })}
            isLoading={isRefundPending}
          >
            Refund Buyer
          </Button>
          <Button
            endContent={<XIcon className="size-4" />}
            variant="bordered"
            isDisabled={isClosed}
            onClick={() => closeReport({ transactionId: ld.transaction.id })}
            isLoading={isClosePending}
          >
            Close Report
          </Button>
          <Button
            endContent={<Ban className="size-4" />}
            variant={isBanned ? "solid" : "light"}
            color="danger"
            onClick={() => banMerchant({ merchantId: ld.transaction.ticketListing.merchantId, banned: !isBanned })}
            isLoading={isBanPending}
            isDisabled={isClosed}
          >
            {isBanned ? "Unban Seller" : "Ban Seller"}
          </Button>
        </div>
        <div className="flex-col flex sm:shadow rounded-3xl p-4 h-[800px] lg:h-full">
          <ChatMessages messages={ld.messages} />
        </div>
      </div>
    </Page>
  );
};

export default Route;
