import { useUser } from "@clerk/remix";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/react";
import { Link } from "@remix-run/react";
import type { Notification } from "common/schema";
import { ArrowRightIcon, XIcon } from "lucide-react";
import type { FC } from "react";
import { trpc } from "~/utils/trpc/trpcClient";
import { ClientDate } from "./ClientDate";

export const NotificationsModal: FC<{ open: boolean; onOpenChange: (state: boolean) => void }> = (props) => {
  const { isSignedIn = false } = useUser();
  const { data: notifications, refetch: refetchNotifications } = trpc.notifications.getAll.useQuery(undefined, {
    enabled: isSignedIn,
  });
  const { mutateAsync: dismiss } = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
  });

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
                    <NotificationItem data={e} key={e.id} onDismiss={() => dismiss({ id: e.id })} />
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

const itemClassName = "p-2 relative group";
const NotificationItem: FC<{ data: Notification; onDismiss: () => void }> = (props) => {
  const content = (
    <div className="bg-gray-50 rounded-lg p-2 flex flex-col gap-1">
      <button
        type="button"
        className="absolute top-0 right-0 text-gray-700 cursor-pointer group-hover:opacity-100 transition opacity-0 size-6 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow hover:bg-gray-100"
        onClick={() => props.onDismiss()}
      >
        <XIcon className="size-4 " />
      </button>
      <p>{props.data.message}</p>
      <div className="flex items-center">
        <p className="text-xs text-gray-400">
          <ClientDate date={props.data.createdAt} calendar />
        </p>
        {props.data.url && (
          <Link to={props.data.url} className="ml-auto flex items-center gap-2 text-sm px-2 ">
            <span>Go To</span>
            <ArrowRightIcon className="size-4" />
          </Link>
        )}
      </div>
    </div>
  );

  if (props.data.url) {
    return (
      <Link to={props.data.url} className={itemClassName}>
        {content}
      </Link>
    );
  }

  return <div className={itemClassName}>{content}</div>;
};
