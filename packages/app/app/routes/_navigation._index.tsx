import { useLoaderData, type MetaFunction } from "@remix-run/react";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
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
  });
  return { listings };
};

const Route = () => {
  const _loaderData = useLoaderData<typeof loader>();

  return (
    <Page>
      <h1>Hello, World!</h1>
    </Page>
  );
};

export default Route;
