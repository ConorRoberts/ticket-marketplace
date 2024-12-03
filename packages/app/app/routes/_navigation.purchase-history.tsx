import { getAuth } from "@clerk/remix/ssr.server";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@nextui-org/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ticketListingTransactions } from "common/schema";
import { desc, eq } from "drizzle-orm";
import type { FC } from "react";
import { ClientDate } from "~/components/ClientDate";
import { Image } from "~/components/Image";
import { Page } from "~/components/Page";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Purchase History" });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const auth = await getAuth(args);

  if (!auth.userId) {
    throw new Error("Unauthorized");
  }

  const transactions = await db.query.ticketListingTransactions.findMany({
    where: eq(ticketListingTransactions.buyerUserId, auth.userId),
    orderBy: desc(ticketListingTransactions.createdAt),
    with: {
      ticketListing: {
        with: {
          event: true,
        },
      },
    },
  });

  return { transactions };
};

const Route = () => {
  const ld = useLoaderData<typeof loader>();

  return (
    <Page classNames={{ container: "px-1" }}>
      <h1 className="text-center font-bold text-2xl mb-8 mt-8 md:mt-8">Purchase History</h1>
      <div className="divide-y divide-gray-200 mx-auto max-w-lg w-full">
        {ld.transactions.length === 0 && <p className="text-center mt-16 font-medium text-sm">No purchases</p>}
        {ld.transactions.map((e) => (
          <TransactionItem key={e.id} data={e} />
        ))}
      </div>
    </Page>
  );
};

const TransactionItem: FC<{ data: Awaited<ReturnType<typeof loader>>["transactions"][number] }> = (props) => {
  const { isOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader>Purchase Details</ModalHeader>
          <ModalBody>
            <p>{`${props.data.ticketListing.quantity}x - ${props.data.ticketListing.event.name}`}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light">Close</Button>
            <Link to={`/listing/${props.data.ticketListing.id}/chat/${props.data.id}`}>
              <Button color="primary">Chat with Seller</Button>
            </Link>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <button
        onClick={onOpenChange}
        key={props.data.id}
        className="p-4 flex items-center gap-4 hover:bg-gray-100 transition w-full max-w-full"
        type="button"
      >
        <div className="size-20">
          <Image imageId={props.data.ticketListing.event.imageId} width={250} />
        </div>
        <div className="flex-1 overflow-hidden text-left">
          <p className="font-medium truncate">{props.data.ticketListing.event.name}</p>
          <p className="text-xs font-medium text-gray-600">
            Purchased:{" "}
            <span>
              <ClientDate date={props.data.createdAt} calendar />
            </span>
          </p>
        </div>
      </button>
    </>
  );
};

export default Route;
