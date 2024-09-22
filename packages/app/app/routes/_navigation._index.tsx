import { Link, useLoaderData, type MetaFunction } from "@remix-run/react";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import type { FC } from "react";
import { Image } from "~/components/Image";
import { Page } from "~/components/Page";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";

export const meta: MetaFunction = () =>
  createMetadata({
    title: "Home",
  });

export const loader = async () => {
  const listings = await db.query.ticketListings.findMany({
    where: eq(ticketListings.isSold, false),
    with: {
      event: true,
    },
  });

  return { listings };
};

const Route = () => {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <Page>
      <div className="flex justify-start gap-4 items-center">
        {loaderData.listings.map((e) => (
          <TicketListingPreview key={e.id} data={e} />
        ))}
      </div>
    </Page>
  );
};

const TicketListingPreview: FC<{ data: Awaited<ReturnType<typeof loader>>["listings"][number] }> = (props) => {
  return (
    <Link className="h-80 relative w-56 flex flex-col gap-4" to={`/listing/${props.data.id}`}>
      <div className="w-full overflow-hidden flex-1">
        <Image imageId={props.data.event.imageId ?? ""} width={300} className="rounded-none" />
      </div>
      <div className="z-10 flex flex-col justify-end">
        <p className="font-semibold">{props.data.event.name}</p>
      </div>
    </Link>
  );
};

export default Route;
