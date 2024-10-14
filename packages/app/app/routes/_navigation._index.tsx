import { Link, type MetaFunction, useLoaderData } from "@remix-run/react";
import { ticketListings } from "common/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { FC } from "react";
import { ClientDate } from "~/components/ClientDate";
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
    where: and(eq(ticketListings.isSold, false), isNull(ticketListings.deletedAt)),
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loaderData.listings.map((e) => (
          <TicketListingPreview key={e.id} data={e} />
        ))}
      </div>
    </Page>
  );
};

const TicketListingPreview: FC<{ data: Awaited<ReturnType<typeof loader>>["listings"][number] }> = (props) => {
  return (
    <Link
      className="h-64 relative w-full flex flex-col gap-4 flex-grow-0 flex-shrink-0 hover:brightness-[90%] bg-transparent transition"
      to={`/listing/${props.data.id}`}
    >
      <div className="w-full overflow-hidden flex-1">
        <Image imageId={props.data.event.imageId ?? ""} width={300} className="rounded-none" />
      </div>
      <div className="flex flex-col justify-end">
        <p className="font-semibold">{props.data.event.name}</p>
        <p className="text-xs font-medium text-gray-600">
          <ClientDate date={props.data.event.date} format="DD/MM/YYYY" />
        </p>
      </div>
    </Link>
  );
};

export default Route;
