import { SignedIn, SignedOut, UserButton } from "@clerk/remix";
import { useUser } from "@clerk/remix";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/navbar";
import { Button, useDisclosure } from "@nextui-org/react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useRevalidator } from "@remix-run/react";
import { CreditCardIcon, InboxIcon, LogInIcon, MenuIcon, ShieldIcon, TicketIcon } from "lucide-react";
import { type ComponentProps, type FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { Footer } from "~/components/Footer";
import { Logo } from "~/components/Logo";
import { MerchantApplyModal } from "~/components/MerchantApplyModal";
import { NotificationsModal } from "~/components/NotificationsModal";
import { SellTicketModal } from "~/components/SellTicketModal";
import { useUserMetadata } from "~/utils/api/utils/useUserMetadata";
import { cn } from "~/utils/cn";
import { trpc } from "~/utils/trpc/trpcClient";

const useSendStripeAccountToast = () => {
  const { mutateAsync: createStripeSetupSession } = trpc.accounts.createStripeSetupSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const sendToast = useCallback(
    (message: string) => {
      toast.error(message, {
        action: {
          label: "Connect",
          onClick: async () => {
            toast.promise(createStripeSetupSession({ redirectUrl: window.location.href }), {
              loading: "Redirecting...",
            });
          },
        },
      });
    },
    [createStripeSetupSession],
  );

  return sendToast;
};

const useStripeAccountChecker = () => {
  const { isSignedIn = false } = useUser();
  const { data: merchant } = trpc.merchants.getCurrent.useQuery(undefined, {
    enabled: isSignedIn,
    staleTime: Infinity,
  });

  const sendToast = useSendStripeAccountToast();

  useEffect(() => {
    if (!merchant) {
      return;
    }

    if (!merchant.isStripeAccountSetup && merchant.isApproved) {
      sendToast("Connect a bank account to begin receiving payouts");
    }
  }, [merchant, sendToast]);
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

const CustomUserButton: FC<ComponentProps<typeof UserButton>> = (props) => {
  const { mutateAsync: createLoginLink } = trpc.merchants.createStripeConnectLoginLink.useMutation();
  const meta = useUserMetadata();
  const navigate = useNavigate();

  return (
    <UserButton afterSwitchSessionUrl="/" signInUrl="/login" {...props}>
      <UserButton.MenuItems>
        <UserButton.Action
          label="Manage Stripe account"
          labelIcon={<CreditCardIcon className="size-3 m-auto" />}
          onClick={() => {
            // Create login link
            toast.promise(createLoginLink, {
              loading: "Redirecting",
              success: (data) => {
                window.location.href = data.url;

                return "Redirecting";
              },
            });
          }}
        />
        {meta?.public.isAdmin && (
          <UserButton.Action
            label="Admin page"
            labelIcon={<ShieldIcon className="size-3 m-auto" />}
            onClick={() => {
              navigate("/admin");
            }}
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
};

const Layout = () => {
  useStripeAccountChecker();
  const location = useLocation();
  const { isSignedIn = false } = useUser();
  const { isOpen: isSellModalOpen, onOpenChange: onSellModalOpenChange } = useDisclosure();
  const { isOpen: isNotificationsModalOpen, onOpenChange: onNotificationsModalOpenChange } = useDisclosure();
  const { data: merchant, refetch: refetchMerchant } = trpc.merchants.getCurrent.useQuery(undefined, {
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: isSignedIn,
    retry: false,
  });
  const { data: notifications } = trpc.notifications.getAll.useQuery(undefined, { enabled: isSignedIn });
  const navigate = useNavigate();
  const sendToast = useSendStripeAccountToast();
  const { isOpen: isMerchantApplyOpen, onOpenChange: toggleMerchantApplyOpen } = useDisclosure();

  const { revalidate } = useRevalidator();

  const { mutateAsync: createListing } = trpc.listings.create.useMutation({
    onSuccess: (data) => {
      revalidate();
      navigate(`/listing/${data.id}`);
    },
  });

  const { mutateAsync: createApplication } = trpc.merchants.createApplication.useMutation({
    onSuccess: () => {
      refetchMerchant();
    },
  });

  return (
    <>
      <SellTicketModal
        onSubmit={(data) => {
          createListing(data);
        }}
        open={isSellModalOpen}
        onOpenChange={onSellModalOpenChange}
        key={isSellModalOpen ? "true" : "false"}
      />
      <MerchantApplyModal
        isOpen={isMerchantApplyOpen}
        onOpenChange={toggleMerchantApplyOpen}
        onSubmit={async (data) => {
          await createApplication(data);
          toggleMerchantApplyOpen();
        }}
      />
      <NotificationsModal open={isNotificationsModalOpen} onOpenChange={onNotificationsModalOpenChange} />
      <div className="flex min-h-screen flex-col relative">
        <div className="flex items-center justify-end isolate z-50 fixed bottom-0 inset-x-0 h-16 lg:hidden rounded-tl-3xl bg-white border ml-auto w-max">
          {isSignedIn ? (
            <CustomUserButton
              appearance={{
                elements: { userButtonAvatarBox: "size-6", rootBox: "h-10 w-16 flex justify-center pt-2 items-start" },
              }}
            />
          ) : (
            <Link className="flex h-10 w-16 items-start justify-center pt-2" to="/login">
              <div className="relative">
                <LogInIcon className="size-6" />
              </div>
            </Link>
          )}
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
                <LogInIcon className="size-4" />
              </DesktopNavLink>
            </SignedOut>
            <SignedIn>
              <button
                type="button"
                className={cn(desktopNavLinkStyle)}
                onClick={() => onNotificationsModalOpenChange()}
              >
                <div className="relative size-4">
                  {notifications && notifications.length > 0 && (
                    <div className="size-1.5 absolute bg-blue-400 rounded-full top-0 right-0 translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  )}
                  <InboxIcon className="size-4" />
                </div>
              </button>
              <Button
                type="button"
                variant="light"
                onClick={() => {
                  if (!merchant) {
                    return;
                  }

                  if (merchant.isApplicationPending) {
                    toast.info("Your application is currently under review.");
                    return;
                  }

                  if (!merchant.isApproved) {
                    // TODO need to create an "apply" modal
                    toggleMerchantApplyOpen();
                    return;
                  }

                  if (!merchant.isStripeAccountSetup && merchant.isApproved) {
                    sendToast("Please connect your bank account before selling tickets.");
                    return;
                  }
                  onSellModalOpenChange();
                }}
                className={desktopNavLinkStyle}
              >
                <p>Sell Tickets</p>
                <TicketIcon className="size-4" />
              </Button>
              <CustomUserButton showName />
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

const MobileNavigation = () => {
  const [open, setOpen] = useState(false);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger className="flex h-10 w-16 items-start justify-center pt-2">
        <div className="relative">
          <MenuIcon className="size-6" />
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
