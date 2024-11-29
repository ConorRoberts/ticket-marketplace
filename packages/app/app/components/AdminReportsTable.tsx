import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, getKeyValue } from "@nextui-org/table";
import type { Event, TicketListing, TicketListingChatMessage, TicketListingTransaction } from "common/schema";
import type { FC } from "react";
import { ClientDate } from "~/components/ClientDate";

export type ReportsTableData = TicketListingTransaction & {
  ticketListing: TicketListing & { event: Event };
  messages: TicketListingChatMessage[];
};

const reportsTableColumns = [
  {
    key: "imageUrl",
    label: "Image",
  },
  {
    key: "reportReason",
    label: "Reason",
  },
  {
    key: "createdAt",
    label: "Created",
  },
];

export const AdminReportsTable: FC<{
  data: ReportsTableData[];
  onRowSelect: (data: ReportsTableData) => void;
}> = (props) => {
  return (
    <>
      <Table aria-label="Table">
        <TableHeader columns={reportsTableColumns}>
          {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
        </TableHeader>
        <TableBody items={props.data}>
          {(item) => (
            <TableRow key={item.id} className="hover:bg-gray-100" onClick={() => props.onRowSelect(item)}>
              {(columnKey) => (
                <TableCell>
                  <ReportTableCellContent data={item} columnKey={columnKey.toString()} />
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};

const ReportTableCellContent: FC<{ data: ReportsTableData; columnKey: string }> = (props) => {
  if (props.columnKey === "createdAt") {
    return <ClientDate date={props.data.createdAt} calendar />;
  }

  return getKeyValue(props.data, props.columnKey);
};
