import { getAuth } from "@clerk/remix/ssr.server";
import { Tab, Tabs } from "@nextui-org/react";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect, useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { merchantApplications, merchants, ticketListingTransactions } from "common/schema";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { useState } from "react";
import { AdminApplicationsTable } from "~/components/AdminApplicationsTable";
import { AdminReportsTable } from "~/components/AdminReportsTable";
import { Page } from "~/components/Page";
import { isAdmin } from "~/utils/api/utils/isAdmin";
import { clerk } from "~/utils/clerk.server";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { trpc } from "~/utils/trpc/trpcClient";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Admin" });
};

export const loader = async (args: LoaderFunctionArgs) => {
  const auth = await getAuth(args);

  const admin = await isAdmin(auth);

  if (!admin) {
    throw redirect("/");
  }

  const pendingApplications = await db.query.merchantApplications.findMany({
    where: and(
      eq(merchantApplications.status, "pending"),
      inArray(
        merchantApplications.merchantId,
        db.select({ id: merchants.id }).from(merchants).where(eq(merchants.isApproved, false)),
      ),
    ),
    with: {
      merchant: true,
    },
  });

  const reportedTransactions = await db.query.ticketListingTransactions.findMany({
    where: isNotNull(ticketListingTransactions.reportedAt),
    with: {
      messages: true,
      ticketListing: {
        with: {
          event: true,
        },
      },
    },
  });

  const users = await clerk.users.getUserList({
    userId: pendingApplications.map((e) => e.merchant.userId),
    limit: 500,
  });

  const applicationsWithUsers = pendingApplications.map((e) => {
    const u = users.data.find((x) => x.id === e.merchant.userId);

    if (!u) {
      throw new Error(`Could not find user id="${e.merchant.userId}" in user list`);
    }

    return {
      ...e,
      user: {
        id: u.id,
        imageUrl: u.imageUrl,
        name: u.fullName ?? "",
        email: u.emailAddresses[0]?.emailAddress ?? "",
      },
    };
  });

  return { applications: applicationsWithUsers, reports: reportedTransactions };
};

type TabOption = "applications" | "reports";

const Route = () => {
  const ld = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const { mutateAsync: updateApplicationStatus } = trpc.merchants.updateApplicationStatus.useMutation({
    onSuccess: () => {
      revalidate();
    },
  });
  const [tab, setTab] = useState<TabOption>("applications");
  const navigate = useNavigate();

  return (
    <Page classNames={{ content: "lg:px-6 gap-8", container: "px-2" }}>
      <Tabs selectedKey={tab} onSelectionChange={(value) => setTab(value as TabOption)}>
        <Tab key="applications" title={`Applications (${ld.applications.length})`} />
        <Tab key="reports" title={`Reports (${ld.reports.length})`} />
      </Tabs>
      {tab === "reports" && (
        <AdminReportsTable data={ld.reports} onRowSelect={(data) => navigate(`reports/${data.id}`)} />
      )}
      {tab === "applications" && (
        <AdminApplicationsTable
          data={ld.applications}
          onStatusUpdate={async ({ applicationId, status }) => {
            await updateApplicationStatus({ status, applicationId });
          }}
        />
      )}
    </Page>
  );
};

export default Route;
