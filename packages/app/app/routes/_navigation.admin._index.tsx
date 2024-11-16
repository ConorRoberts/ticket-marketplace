import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, getKeyValue } from "@nextui-org/table";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { type Merchant, type MerchantApplication, merchantApplications, merchants } from "common/schema";
import { and, eq, inArray } from "drizzle-orm";
import { type FC, useState } from "react";
import { ClientDate } from "~/components/ClientDate";
import { Page } from "~/components/Page";
import { clerk } from "~/utils/clerk.server";
import { cn } from "~/utils/cn";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { trpc } from "~/utils/trpc/trpcClient";

export const meta: MetaFunction = () => {
  return createMetadata({ title: "Admin" });
};

export const loader = async (_args: LoaderFunctionArgs) => {
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

  return { applications: applicationsWithUsers };
};

const Route = () => {
  const ld = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const { mutateAsync: updateApplicationStatus } = trpc.merchants.updateApplicationStatus.useMutation({
    onSuccess: () => {
      revalidate();
    },
  });

  return (
    <Page classNames={{ content: "lg:px-6", container: "px-2" }}>
      <ApplicationsTable
        data={ld.applications}
        onStatusUpdate={async ({ applicationId, status }) => {
          await updateApplicationStatus({ status, applicationId });
        }}
      />
    </Page>
  );
};

type ApplicationTableData = MerchantApplication & {
  merchant: Merchant;
  user: { id: string; name: string; email: string; imageUrl: string };
};

const columns = [
  {
    key: "imageUrl",
    label: "Image",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "createdAt",
    label: "Created",
  },
];

const ApplicationsTable: FC<{
  data: ApplicationTableData[];
  onStatusUpdate: (args: { applicationId: string; status: ApplicationStatus }) => void | Promise<void>;
}> = (props) => {
  const [selectedApplication, setSelectedApplication] = useState<ApplicationTableData | null>(null);

  return (
    <>
      {selectedApplication && (
        <SelectedApplicationModal
          onStatusUpdate={async (status) => {
            await props.onStatusUpdate({ status, applicationId: selectedApplication.id });
          }}
          data={selectedApplication}
          isOpen={true}
          onOpenChange={() => {
            setSelectedApplication(null);
          }}
        />
      )}
      <Table aria-label="Table">
        <TableHeader columns={columns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={props.data}>
          {(item) => (
            <TableRow
              key={item.id}
              className="hover:bg-gray-100"
              aria-label={item.user.name}
              onClick={() => setSelectedApplication(item)}
            >
              {(columnKey) => (
                <TableCell>
                  <TableCellContent data={item} columnKey={columnKey.toString()} />
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

const TableCellContent: FC<{ data: ApplicationTableData; columnKey: string }> = (props) => {
  if (props.columnKey === "imageUrl") {
    return (
      <div className="size-10 rounded-full overflow-hidden">
        <img src={props.data.user.imageUrl} className="size-full object-cover" />
      </div>
    );
  }

  if (props.columnKey === "createdAt") {
    return <ClientDate date={props.data.createdAt} calendar />;
  }

  return getKeyValue(props.data.user, props.columnKey);
};

type ApplicationStatus = "approved" | "rejected";

const SelectedApplicationModal: FC<{
  isOpen: boolean;
  onOpenChange: () => void;
  data: ApplicationTableData;
  onStatusUpdate: (value: ApplicationStatus) => void | Promise<void>;
}> = (props) => {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null);

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async (value: ApplicationStatus) => {
      await props.onStatusUpdate(value);
    },
    onSuccess: () => {
      props.onOpenChange();
    },
  });

  return (
    <>
      {selectedStatus !== null && (
        <Modal isOpen={true} onOpenChange={() => setSelectedStatus(null)}>
          <ModalContent>
            <ModalHeader>Confirm Status Update</ModalHeader>
            <ModalBody>
              <p className="text-center">
                The application from <span className="font-semibold">{props.data.user.name}</span> will be
              </p>
              <div
                className={cn("mx-auto rounded-full px-4 capitalize py-1 font-semibold", {
                  "text-primary-500": selectedStatus === "approved",
                  "text-danger-500": selectedStatus === "rejected",
                })}
              >
                <span>{selectedStatus}</span>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onClick={() => setSelectedStatus(null)} isDisabled={isPending}>
                Cancel
              </Button>
              <Button
                color={selectedStatus === "approved" ? "primary" : "danger"}
                onClick={() => {
                  updateStatus(selectedStatus);
                }}
                isLoading={isPending}
              >
                Confirm
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
      <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
        <ModalContent>
          <ModalHeader>Review Application</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">From</p>
                <div className="flex items-center gap-2">
                  <div className="size-10 rounded-full overflow-hidden">
                    <img src={props.data.user.imageUrl} className="size-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{props.data.user.name}</p>
                    <p className="text-sm text-gray-600">{props.data.user.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Body</p>
                <p className="whitespace-pre-line">{props.data.body}</p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Links</p>
                <div className="flex flex-col divide-y">
                  {props.data.links.map((url) => (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      key={url}
                      className="text-blue-700 hover:text-blue-800 underline transition py-1.5 hover:bg-gray-100 truncate max-w-full"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="grid grid-cols-2">
            <Button color="danger" variant="light" onClick={() => setSelectedStatus("rejected")}>
              Reject
            </Button>
            <Button color="primary" onClick={() => setSelectedStatus("approved")}>
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Route;
