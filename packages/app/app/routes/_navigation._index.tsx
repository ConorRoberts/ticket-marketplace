import { Link, type MetaFunction, useLoaderData } from "@remix-run/react";
import { ticketListings } from "common/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { FC } from "react";
import { ClientDate } from "~/components/ClientDate";
import { Image } from "~/components/Image";
import { NoiseFilter } from "~/components/NoiseFilter";
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loaderData.listings.map((e) => (
          <TicketListingPreview key={e.id} data={e} />
        ))}
      </div>
    </Page>
  );
};

const TicketListingPreview: FC<{ data: Awaited<ReturnType<typeof loader>>["listings"][number] }> = (props) => {
  return (
    <>
      <Link className="w-full relative rounded-2xl overflow-hidden h-80" to={`/listing/${props.data.id}`}>
        <div className="relative z-10 h-80 w-full flex flex-col rounded-2xl gap-3 flex-grow-0 flex-shrink-0 hover:brightness-[90%] transition border border-gray-100 p-2">
          <div className="w-full overflow-hidden flex-1 rounded-lg">
            <Image imageId={props.data.event.imageId ?? ""} width={500} className="rounded-none" />
          </div>
          <div className="flex flex-col justify-end px-2">
            <p className="font-semibold">{props.data.event.name}</p>
            <p className="text-xs font-semibold text-gray-700">
              <ClientDate date={props.data.event.date} format="DD/MM/YYYY" />
            </p>
          </div>
        </div>
        <div className="z-[2] absolute inset-0 opacity-35">
          <NoiseFilter className="w-full h-full" />
        </div>
        <div className="w-full overflow-hidden absolute z-[1] inset-0 blur-lg">
          <Image
            imageId={props.data.event.imageId ?? ""}
            width={600}
            options={{ brightness: 6 }}
            className="rounded-none"
          />
        </div>
      </Link>
    </>
  );
};

export default Route;
