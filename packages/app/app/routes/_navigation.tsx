import { SignedIn, SignedOut, UserButton } from "@clerk/remix";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/navbar";
import {
  Button,
  Calendar,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "@remix-run/react";
import { ArrowRightFromLine, InboxIcon, MenuIcon, TicketIcon } from "lucide-react";
import { type ComponentProps, type FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as v from "valibot";
import { Drawer } from "vaul";
import { Footer } from "~/components/Footer";
import { Logo } from "~/components/Logo";
import { Form, FormLabel } from "~/components/ui/form";
import { FormControl, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { cn } from "~/utils/cn";
import { createTicketListingInputSchema } from "~/utils/createTicketListingInputSchema";
import { reactApi } from "~/utils/trpc/trpcClient";

const ticketListingFormSchema = v.object({
  ...v.omit(createTicketListingInputSchema, ["event"]).entries,
  event: v.object({
    ...createTicketListingInputSchema.entries.event.entries,
    date: v.custom((value) => value instanceof CalendarDate),
  }),
});

const useStripeAccountChecker = () => {
  const { data: merchant } = reactApi.merchants.getCurrent.useQuery();
  const { mutateAsync: createStripeSetupSession } = reactApi.accounts.createStripeSetupSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  useEffect(() => {
    if (!merchant) {
      return;
    }

    if (!merchant.isStripeAccountSetup) {
      toast.error("Connect a bank account to begin receiving payouts", {
        action: {
          label: "Connect",
          onClick: async () => {
            toast.promise(createStripeSetupSession({ redirectUrl: window.location.href }), {
              loading: "Redirecting...",
            });
          },
        },
      });
    }
  }, [merchant, createStripeSetupSession]);
};

const desktopNavLinkStyle =
  "font-medium text-sm h-8 px-3 rounded-lg flex gap-2 items-center justify-center hover:text-gray-700 transition whitespace-nowrap";

const DesktopNavLink: FC<ComponentProps<typeof NavLink>> = ({ children, className, ...props }) => {
  return (
    <NavLink {...props} className={(args) => cn(desktopNavLinkStyle, args.isActive && "bg-gray-100", className)}>
      {children}
    </NavLink>
  );
};

const MobileNavLink: FC<ComponentProps<typeof NavLink>> = ({ children, className, ...props }) => {
  return (
    <NavLink
      {...props}
      className={(state) =>
        cn(
          "font-medium text-sm h-8 px-3 rounded-sm flex gap-2 items-center hover:bg-gray-100 transition whitespace-nowrap text-left",
          state.isActive && "bg-gray-50",
          className,
        )
      }
    >
      {children}
    </NavLink>
  );
};

const Layout = () => {
  useStripeAccountChecker();
  const location = useLocation();
  const { isOpen: isSellModalOpen, onOpenChange: onSellModalOpenChange } = useDisclosure();
  const { isOpen: isNotificationsModalOpen, onOpenChange: onNotificationsModalOpenChange } = useDisclosure();
  const navigate = useNavigate();

  return (
    <>
      <SellTicketModal open={isSellModalOpen} onOpenChange={onSellModalOpenChange} />
      <NotificationsModal open={isNotificationsModalOpen} onOpenChange={onNotificationsModalOpenChange} />
      <div className="flex min-h-screen flex-col relative">
        <div className="flex items-center justify-end isolate z-50 fixed bottom-0 inset-x-0 p-2">
          <MobileNavigation key={location.pathname} />
        </div>
        <Navbar className="w-full max-w-5xl mx-auto hidden lg:block bg-transparent" position="static">
          <NavbarContent>
            <NavbarBrand className="flex-grow-0">
              <Link to="/">
                <Logo className="size-8 shadow hover:brightness-[98%] transition" />
              </Link>
            </NavbarBrand>
            <NavbarItem>
              <DesktopNavLink to="/">Home</DesktopNavLink>
            </NavbarItem>
          </NavbarContent>
          <NavbarContent className="flex gap-4 h-16" justify="end">
            <SignedOut>
              <button type="button" onClick={() => navigate("/login")} className={desktopNavLinkStyle}>
                <p>Sell Tickets</p>
                <TicketIcon className="size-4" />
              </button>
              <DesktopNavLink to="/login">
                <p>Login</p>
                <ArrowRightFromLine className="size-4" />
              </DesktopNavLink>
            </SignedOut>
            <SignedIn>
              <button type="button" className={desktopNavLinkStyle} onClick={() => onNotificationsModalOpenChange()}>
                <InboxIcon className="size-4" />
              </button>
              <button type="button" onClick={() => onSellModalOpenChange()} className={desktopNavLinkStyle}>
                <p>Sell Tickets</p>
                <TicketIcon className="size-4" />
              </button>
              <UserButton showName afterSwitchSessionUrl="/" signInUrl="/login" />
            </SignedIn>
          </NavbarContent>
        </Navbar>
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
      <Footer />
    </>
  );
};

const NotificationsModal: FC<{ open: boolean; onOpenChange: (state: boolean) => void }> = (props) => {
  return (
    <Modal size="xl" isOpen={props.open} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Notifications</ModalHeader>
            <ModalBody>Notifications</ModalBody>
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

const SellTicketModal: FC<{ open: boolean; onOpenChange: (state: boolean) => void }> = (props) => {
  const form = useForm({
    defaultValues: {
      priceCents: 0.0,
      quantity: 1,
      event: {
        name: "",
        date: today(getLocalTimeZone()),
        type: "concert" as const,
        imageId: "",
      },
    },
    resolver: valibotResolver(ticketListingFormSchema),
  });
  const { mutateAsync: createListing, isPending: isCreateListingLoading } = reactApi.listings.create.useMutation();

  return (
    <Modal size="xl" isOpen={props.open} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Create Listing</ModalHeader>
            <ModalBody>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(async (values) => {
                    await createListing({
                      ...values,
                      event: { ...values.event, date: values.event.date.toDate(getLocalTimeZone()) },
                    });
                    onClose();
                  })}
                  className="flex flex-col gap-4"
                >
                  <FormField
                    control={form.control}
                    name="event.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Event Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="event.date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col ">
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Calendar
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priceCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input label="Price" {...field} value={String(field.value)} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <ModalFooter>
                    <Button className="w-full" color="primary" type="submit" isLoading={isCreateListingLoading}>
                      Create
                    </Button>
                  </ModalFooter>
                </form>
              </Form>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

const MobileNavigation = () => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="flex h-12 w-16 items-start justify-center pt-2">
        <div className="relative">
          <MenuIcon className="h-8 w-8" />
        </div>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Title>Navigation Drawer</Drawer.Title>
        <Drawer.Description>This is an accessible navigation drawer for mobile devices.</Drawer.Description>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl bg-white isolate border-t border-gray-200">
          <div className="mx-auto my-2 h-1.5 w-1/6 rounded-full bg-gray-300" />

          <div className="flex flex-col gap-2 p-8">
            <MobileNavLink to="/">Home</MobileNavLink>
          </div>
        </Drawer.Content>
        <Drawer.Overlay />
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default Layout;
