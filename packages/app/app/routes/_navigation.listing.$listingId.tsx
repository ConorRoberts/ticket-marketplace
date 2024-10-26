import { useUser } from "@clerk/remix";
import { fromDate, getLocalTimeZone, toCalendarDate } from "@internationalized/date";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@remix-run/server-runtime";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { PencilIcon, SettingsIcon, TicketIcon, TrashIcon } from "lucide-react";
import { usePartySocket } from "partysocket/react";
import { Image } from "~/components/Image";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { Page } from "~/components/Page";
import { SellTicketModal } from "~/components/SellTicketModal";
import { Noise } from "~/components/frostin-ui";
import { clerk } from "~/utils/clerk.server";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { trpc } from "~/utils/trpc/trpcClient";
import { useEnv } from "~/utils/useEnv";

export const loader = async (args: LoaderFunctionArgs) => {
  const listingId = args.params.listingId;

  if (!listingId) {
    throw redirect("/");
  }

  const listing = await db.query.ticketListings.findFirst({
    where: eq(ticketListings.id, listingId),
    with: {
      event: true,
      merchant: {
        columns: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!listing) {
    console.log(`Could not find listing with id=${listingId}`);
    throw redirect("/");
  }

  const merchantUser = await clerk.users.getUser(listing.merchant.userId);

  return { listing, merchantName: merchantUser.fullName };
};

export const meta: MetaFunction<typeof loader> = (args) => {
  if (!args.data) {
    return createMetadata({ title: "Listing" });
  }

  return createMetadata({ title: args.data.listing.event.name, imageId: args.data.listing.event.imageId ?? undefined });
};

const Route = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const { mutateAsync: createPurchaseSession, isPending: isCreatingSession } =
    trpc.listings.createPurchaseSession.useMutation({
      onSuccess: (data) => {
        window.location.href = data.url;
      },
    });
  const { mutateAsync: deleteListing, isPending: isDeleteLoading } = trpc.listings.delete.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });

  const env = useEnv();
  const _socket = usePartySocket({
    host: env.PUBLIC_PARTYKIT_URL,
    room: loaderData.listing.id,
    onMessage: (e) => {
      console.log(e);
    },
  });

  const { isOpen: isDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { user } = useUser();
  const isAdmin = user?.id === loaderData.listing.merchant.userId;

  return (
    <Page classNames={{ container: "relative" }}>
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Are you sure you want to delete your listing for &quot;{loaderData.listing.event.name}&quot;
              </ModalHeader>

              <ModalFooter>
                <Button
                  variant="light"
                  onClick={() => {
                    onClose();
                  }}
                >
                  Go Back
                </Button>
                <Button
                  color="danger"
                  onClick={async () => {
                    await deleteListing({ listingId: loaderData.listing.id });
                    onClose();
                  }}
                  isLoading={isDeleteLoading}
                >
                  Confirm, Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <SellTicketModal
        open={isEditOpen}
        onOpenChange={onEditOpenChange}
        initialValue={{
          ...loaderData.listing,
          event: {
            ...loaderData.listing.event,
            date: toCalendarDate(fromDate(loaderData.listing.event.date, getLocalTimeZone())),
          },
        }}
        onSubmit={(data) => {
          return;
        }}
      />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="w-full h-[500px] relative rounded-[30px] overflow-hidden">
          <div className="z-[1] absolute inset-0 opacity-35">
            <Noise grainSize={1.5} />
          </div>
          <Image
            imageId={loaderData.listing.event.imageId ?? ""}
            width={800}
            options={{ brightness: 6, blur: 80 }}
            className="z-0"
          />
          <div className="absolute inset-4 z-[2] shadow-lg">
            <Image imageId={loaderData.listing.event.imageId ?? ""} width={600} />
          </div>
        </div>
        <div className="relative flex flex-col gap-2 lg:py-8">
          {isAdmin && (
            <Dropdown>
              <DropdownTrigger className="ml-auto">
                <Button isIconOnly size="sm" variant="light">
                  <SettingsIcon className="size-5" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disabledKeys={isDeleteLoading ? ["delete"] : []}
                onAction={(key) => {
                  if (key === "delete") {
                    onDeleteOpenChange();
                  } else if (key === "edit") {
                    onEditOpenChange();
                  }
                }}
              >
                <DropdownItem key="edit" startContent={<PencilIcon className="size-4" />}>
                  Update
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  color="danger"
                  startContent={<TrashIcon className="size-4" />}
                  className="text-danger"
                  endContent={isDeleteLoading ? <LoadingSpinner className="size-4" /> : undefined}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
          <div className="flex flex-col">
            <h1 className="font-extrabold text-4xl text-center lg:text-left">{loaderData.listing.event.name}</h1>
            <p>Listed by {loaderData.merchantName}</p>
            <p className="mt-4 font-semibold">{`${loaderData.listing.quantity} Ticket${loaderData.listing.quantity > 1 ? "s" : ""}`}</p>
          </div>
          <p>{loaderData.listing.description}</p>
          <Button
            className="w-full mt-auto"
            color="primary"
            disabled={user?.id === loaderData.listing.merchant.userId || isCreatingSession}
            isLoading={isCreatingSession}
            onClick={() => {
              createPurchaseSession({ listingId: loaderData.listing.id, redirectUrl: window.location.href });
            }}
            startContent={<TicketIcon className="size-4" />}
          >
            Buy
          </Button>
        </div>
      </div>
    </Page>
  );
};

export default Route;
