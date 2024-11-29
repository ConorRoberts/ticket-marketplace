import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { useMutation } from "@tanstack/react-query";
import { type FC, useState } from "react";
import { cn } from "~/utils/cn";
import type { ApplicationTableData } from "./AdminApplicationsTable";

type ApplicationStatus = "approved" | "rejected";

export const AdminSelectedApplicationModal: FC<{
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
