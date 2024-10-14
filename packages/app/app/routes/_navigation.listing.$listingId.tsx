import { useUser } from "@clerk/remix";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@nextui-org/react";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@remix-run/server-runtime";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { SettingsIcon, TicketIcon, TrashIcon } from "lucide-react";
import { Image } from "~/components/Image";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { NoiseFilter } from "~/components/NoiseFilter";
import { Page } from "~/components/Page";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { trpc } from "~/utils/trpc/trpcClient";

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

  return { listing };
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

  const { user } = useUser();
  const isAdmin = user?.id === loaderData.listing.merchant.userId;

  return (
    <Page classNames={{ container: "relative" }}>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="w-full max-h-[500px] relative rounded-[30px] overflow-hidden">
          <div className="z-[1] absolute inset-0 opacity-35">
            <NoiseFilter className="w-full h-full" />
          </div>
          <Image
            imageId={loaderData.listing.event.imageId ?? ""}
            width={600}
            options={{ brightness: 6, blur: 80 }}
            className="z-0"
          />
          <div className="absolute inset-4 z-[2] shadow-lg">
            <Image imageId={loaderData.listing.event.imageId ?? ""} width={600} />
          </div>
        </div>
        <div className="relative flex flex-col gap-4 lg:py-8">
          {isAdmin && (
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <SettingsIcon className="size-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disabledKeys={isDeleteLoading ? ["delete"] : []}
                onAction={(key) => {
                  if (key === "delete") {
                    deleteListing({ listingId: loaderData.listing.id });
                  }
                }}
              >
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
          <h1 className="font-extrabold text-4xl text-center lg:text-left">{loaderData.listing.event.name}</h1>
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
