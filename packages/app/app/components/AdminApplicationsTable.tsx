import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, getKeyValue } from "@nextui-org/table";
import type { Merchant, MerchantApplication } from "common/schema";
import { type FC, useState } from "react";
import { ClientDate } from "~/components/ClientDate";
import { AdminSelectedApplicationModal } from "./AdminSelectedApplicationModal";

export type ApplicationTableData = MerchantApplication & {
  merchant: Merchant;
  user: { id: string; name: string; email: string; imageUrl: string };
};

const applicationsTableColumns = [
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

export const AdminApplicationsTable: FC<{
  data: ApplicationTableData[];
  onStatusUpdate: (args: { applicationId: string; status: ApplicationStatus }) => void | Promise<void>;
}> = (props) => {
  const [selectedApplication, setSelectedApplication] = useState<ApplicationTableData | null>(null);

  return (
    <>
      {selectedApplication && (
        <AdminSelectedApplicationModal
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
        <TableHeader columns={applicationsTableColumns}>
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
                  <ApplicationTableCellContent data={item} columnKey={columnKey.toString()} />
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

const ApplicationTableCellContent: FC<{ data: ApplicationTableData; columnKey: string }> = (props) => {
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
