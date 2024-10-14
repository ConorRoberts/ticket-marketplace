import { useUser } from "@clerk/remix";
import { Button } from "@nextui-org/react";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@remix-run/server-runtime";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { TrashIcon } from "lucide-react";
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

  return (
    <Page>
      <h1>{loaderData.listing.event.name}</h1>

      <Button
        disabled={isCreatingSession}
        isLoading={isCreatingSession}
        onClick={() => {
          createPurchaseSession({ listingId: loaderData.listing.id, redirectUrl: window.location.href });
        }}
      >
        Buy
      </Button>
      {user?.id === loaderData.listing.merchant.userId && (
        <Button
          variant="solid"
          color="danger"
          className="mx-auto mt-4"
          startContent={<TrashIcon className="size-4" />}
          disabled={isDeleteLoading}
          isLoading={isDeleteLoading}
          onClick={() => {
            deleteListing({ listingId: loaderData.listing.id });
          }}
        >
          Delete
        </Button>
      )}
    </Page>
  );
};

export default Route;
