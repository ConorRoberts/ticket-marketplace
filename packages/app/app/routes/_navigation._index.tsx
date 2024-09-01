import type { MetaFunction } from "@remix-run/react";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { Page } from "~/components/Page";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { defineLoader } from "~/utils/remix";

export const meta: MetaFunction = () =>
  createMetadata({
    title: "Home",
  });

export const loader = defineLoader(async () => {
  const listings = await db.query.ticketListings.findMany({
    where: eq(ticketListings.sold, false),
  });
  return {};
});

const Route = () => {
  return (
    <Page>
      <h1>Hello, World!</h1>
    </Page>
  );
};

export default Route;
