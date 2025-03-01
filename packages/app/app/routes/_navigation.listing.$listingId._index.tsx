import { useUser } from "@clerk/remix";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { fromDate, getLocalTimeZone, toCalendarDate } from "@internationalized/date";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { type LoaderFunctionArgs, redirect } from "@remix-run/server-runtime";
import { useMutation } from "@tanstack/react-query";
import { parsePubSubMessage } from "common/pubsub";
import { ticketListings } from "common/schema";
import { eq } from "drizzle-orm";
import { PencilIcon, SettingsIcon, TicketIcon, TrashIcon } from "lucide-react";
import { usePartySocket } from "partysocket/react";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import * as v from "valibot";
import { ClientDate } from "~/components/ClientDate";
import { Image } from "~/components/Image";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { Page } from "~/components/Page";
import { SellTicketModal } from "~/components/SellTicketModal";
import { Noise } from "~/components/frostin-ui";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { clerk } from "~/utils/clerk.server";
import { createMetadata } from "~/utils/createMetadata";
import { db } from "~/utils/db.server";
import { trpc } from "~/utils/trpc/trpcClient";
import { useEnv } from "~/utils/useEnv";

export const loader = async (args: LoaderFunctionArgs) => {
  const listingId = args.params.listingId;

  if (!listingId) {
    throw redirect("/");
  }

  const listing = await db.query.ticketListings.findFirst({
    where: eq(ticketListings.id, listingId),
    with: {
      event: true,
      merchant: {
        columns: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!listing) {
    console.log(`Could not find listing with id=${listingId}`);
    throw redirect("/");
  }

  const merchantUser = await clerk.users.getUser(listing.merchant.userId);

  return { listing, merchantName: merchantUser.fullName };
};

export const meta: MetaFunction<typeof loader> = (args) => {
  if (!args.data) {
    return createMetadata({ title: "Listing" });
  }

  return createMetadata({ title: args.data.listing.event.name, imageId: args.data.listing.event.imageId ?? undefined });
};

const Route = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData<typeof loader>();
  const { mutateAsync: createPurchaseSession, isPending: isCreatingSession } =
    trpc.listings.createPurchaseSession.useMutation({
      onSuccess: (data) => {
        window.location.href = data.url;
      },
    });
  const { mutateAsync: deleteListing, isPending: isDeleteLoading } = trpc.listings.delete.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });
  const utils = trpc.useUtils();

  const env = useEnv();
  const _socket = usePartySocket({
    host: env.PUBLIC_PARTYKIT_URL,
    room: loaderData.listing.id,
    onMessage: (e) => {
      const ev = parsePubSubMessage(e.data);

      if (ev.type === "ticketPurchase") {
        utils.notifications.getAll.refetch();
      }
    },
  });

  const { isOpen: isDeleteOpen, onOpenChange: onDeleteOpenChange } = useDisclosure();
  const { isOpen: isEditOpen, onOpenChange: onEditOpenChange } = useDisclosure();
  const { isOpen: isEmailDialogOpen, onOpenChange: onEmailDialogOpenChange } = useDisclosure();
  const { mutateAsync: updateListing } = trpc.listings.update.useMutation();
  const { revalidate } = useRevalidator();
  const { user } = useUser();
  const isAdmin = user?.id === loaderData.listing.merchant.userId;

  const handlePurchaseContinue = async (email: string) => {
    await createPurchaseSession({ listingId: loaderData.listing.id, redirectUrl: window.location.href, email });
  };

  return (
    <Page classNames={{ container: "relative", content: "pb-8" }}>
      <Modal isOpen={isEmailDialogOpen} onOpenChange={onEmailDialogOpenChange}>
        <ModalContent>
          <ModalHeader>Provide your email</ModalHeader>

          <ModalBody className="mb-2">
            <EmailForm onSubmit={handlePurchaseContinue} />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Are you sure you want to delete your listing for &quot;{loaderData.listing.event.name}&quot;
              </ModalHeader>

              <ModalFooter>
                <Button
                  variant="light"
                  onClick={() => {
                    onClose();
                  }}
                >
                  Go Back
                </Button>
                <Button
                  color="danger"
                  onClick={async () => {
                    await deleteListing({ listingId: loaderData.listing.id });
                    onClose();
                  }}
                  isLoading={isDeleteLoading}
                >
                  Confirm, Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                Are you sure you want to delete your listing for &quot;{loaderData.listing.event.name}&quot;
              </ModalHeader>

              <ModalFooter>
                <Button
                  variant="light"
                  onClick={() => {
                    onClose();
                  }}
                >
                  Go Back
                </Button>
                <Button
                  color="danger"
                  onClick={async () => {
                    await deleteListing({ listingId: loaderData.listing.id });
                    onClose();
                  }}
                  isLoading={isDeleteLoading}
                >
                  Confirm, Delete
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {isEditOpen && (
        <SellTicketModal
          open={isEditOpen}
          onOpenChange={onEditOpenChange}
          key={JSON.stringify(loaderData.listing)}
          initialValue={{
            ...loaderData.listing,
            unitPriceDollars: Math.floor(loaderData.listing.unitPriceCents / 100).toString(),
            quantity: loaderData.listing.quantity.toString(),
            event: {
              ...loaderData.listing.event,
              date: toCalendarDate(fromDate(loaderData.listing.event.date, getLocalTimeZone())),
            },
          }}
          onSubmit={async (data) => {
            await updateListing({ listingId: loaderData.listing.id, data });
            revalidate();
          }}
        />
      )}

      <div className="border rounded-3xl p-4 relative overflow-hidden isolate">
        <div className="-z-[1] absolute inset-0 opacity-35">
          <Noise grainSize={1.1} />
        </div>
        {/* Background image */}
        <div className="absolute inset-0 opacity-50 -z-[2]">
          <Image
            imageId={loaderData.listing.event.imageId ?? ""}
            width={800}
            options={{ brightness: 3, blur: 35 }}
            className="z-0"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="w-full z-[2] shadow-lg h-[500px]">
            <Image imageId={loaderData.listing.event.imageId ?? ""} width={600} />
          </div>
          <div className="relative flex flex-col gap-2 lg:py-8">
            {isAdmin && (
              <Dropdown>
                <DropdownTrigger className="ml-auto">
                  <Button isIconOnly size="sm" variant="light">
                    <SettingsIcon className="size-5" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  disabledKeys={isDeleteLoading ? ["delete"] : []}
                  onAction={(key) => {
                    if (key === "delete") {
                      onDeleteOpenChange();
                    } else if (key === "edit") {
                      onEditOpenChange();
                    }
                  }}
                >
                  <DropdownItem key="edit" startContent={<PencilIcon className="size-4" />}>
                    Update
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    color="danger"
                    startContent={<TrashIcon className="size-4" />}
                    className="text-danger"
                    endContent={isDeleteLoading ? <LoadingSpinner className="size-4" /> : undefined}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
            <div className="flex flex-col gap-4 font-medium">
              <h1 className="font-extrabold text-4xl text-left">{loaderData.listing.event.name}</h1>

              <div className="flex sm:items-center gap-2 flex-col items-start sm:flex-row">
                <p className="font-semibold">Date:</p>

                <p className="tabular-nums">
                  <ClientDate date={loaderData.listing.event.date} />
                </p>
              </div>
              <div className="flex sm:items-center gap-2 flex-col items-start sm:flex-row">
                <p className="font-semibold">Listed by:</p>

                <p className="tabular-nums">{loaderData.merchantName}</p>
              </div>
              <div className="flex sm:items-center gap-2 flex-col items-start sm:flex-row">
                <p className="font-semibold">Quantity:</p>

                <p className="tabular-nums">{loaderData.listing.quantity}</p>
              </div>
              <p>{loaderData.listing.description}</p>
            </div>
            <Button
              className="w-full mt-auto"
              color="primary"
              isDisabled={
                user?.id === loaderData.listing.merchant.userId || isCreatingSession || loaderData.listing.isSold
              }
              isLoading={isCreatingSession}
              onClick={() => {
                const email = user?.primaryEmailAddress?.emailAddress;
                if (!email) {
                  onEmailDialogOpenChange();
                  return;
                }

                handlePurchaseContinue(email);
              }}
              startContent={<TicketIcon className="size-4" />}
            >
              {loaderData.listing.isSold ? "Sold Out" : "Buy"}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
};

const EmailForm: FC<{ onSubmit: (email: string) => void | Promise<void> }> = (props) => {
  const { mutateAsync: submit, isPending } = useMutation({
    mutationFn: async (email: string) => {
      await props.onSubmit(email);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const email = formData.get("email")?.toString();

        if (!email) {
          return;
        }

        submit(email);
      }}
      className="flex flex-col gap-4"
    >
      <Input type="email" name="email" autoFocus label="Email" />
      <Button type="submit" color="primary" className="mx-auto" isLoading={isPending}>
        Submit
      </Button>
    </form>
  );
};

const buyTicketFormSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  quantity: v.pipe(v.number(), v.minValue(1)),
});

type BuyTicketFormOutput = v.InferOutput<typeof buyTicketFormSchema>;

// The ticket form used for 1) known users to select ticket quantity, 2) unknown users to provide their email and select ticket quantity
const _BuyTicketForm: FC<{ onSubmit: (values: BuyTicketFormOutput) => void | Promise<void> }> = (props) => {
  const form = useForm({
    defaultValues: { email: "", quantity: 1 },
    resolver: valibotResolver(buyTicketFormSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          await props.onSubmit(values);
        })}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormControl>
                <Input
                  label="Email"
                  {...field}
                  errorMessage={fieldState.error?.message}
                  isInvalid={Boolean(fieldState.error?.message)}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field: _field, fieldState: _fieldState }) => (
            <FormItem>
              <FormControl>
                {/* <Input
                  label="Email"
                  {...field}
                  type="number"
                  errorMessage={fieldState.error?.message}
                  isInvalid={Boolean(fieldState.error?.message)}
                /> */}
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

export default Route;
