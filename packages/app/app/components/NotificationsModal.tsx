import { useUser } from "@clerk/remix";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { useNavigate } from "@remix-run/react";
import type { Notification } from "common/schema";
import { ArrowRightIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import { trpc } from "~/utils/trpc/trpcClient";
import { ClientDate } from "./ClientDate";

export const NotificationsModal: FC<{ open: boolean; onOpenChange: () => void }> = (props) => {
  const { isSignedIn = false } = useUser();
  const { data: notifications, refetch: refetchNotifications } = trpc.notifications.getAll.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const { mutateAsync: dismiss } = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });

  const navigate = useNavigate();

  return (
    <Modal size="xl" isOpen={props.open} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Notifications</ModalHeader>
            <ModalBody>
              {notifications && notifications.length === 0 && (
                <p className="text-center text-gray-600 font-medium">No notifications</p>
              )}
              {notifications && notifications.length > 0 && (
                <div className="flex flex-col divide-y">
                  {notifications?.map((e) => (
                    <NotificationItem
                      data={e}
                      key={e.id}
                      onDismiss={() => dismiss({ id: e.id })}
                      onSelect={(url) => {
                        navigate(url);
                        props.onOpenChange();
                      }}
                    />
                  ))}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

const NotificationItem: FC<{ data: Notification; onDismiss: () => void; onSelect: (url: string) => void }> = (
  props,
) => {
  return (
    <div className="p-2 relative">
      <div className="bg-gray-50 rounded-lg p-2 flex flex-col gap-1">
        <div className="flex items-center gap-2 justify-between">
          <p className="text-xs text-gray-400">
            <ClientDate date={props.data.createdAt} calendar />
          </p>
          <button
            type="button"
            className="cursor-pointer transition size-4 flex items-center justify-center"
            onClick={() => props.onDismiss()}
          >
            <XIcon className="size-4 " />
          </button>
        </div>
        <p className="whitespace-pre-line truncate">{props.data.message}</p>

        <div className="flex items-center">
          {props.data.url && (
            <button
              type="button"
              className="ml-auto flex items-center gap-2 text-sm px-2"
              onClick={() => {
                if (!props.data.url) {
                  return;
                }

                props.onSelect(props.data.url);
              }}
            >
              <span>Go To</span>
              <ArrowRightIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
