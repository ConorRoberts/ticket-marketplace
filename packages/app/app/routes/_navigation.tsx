import { SignedIn, SignedOut, UserButton } from "@clerk/remix";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/navbar";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "@remix-run/react";
import { ArrowRightFromLine, MenuIcon, TicketIcon } from "lucide-react";
import { type ComponentProps, type FC, useState } from "react";
import { Form, useForm } from "react-hook-form";
import { Drawer } from "vaul";
import { Footer } from "~/components/Footer";
import { Logo } from "~/components/Logo";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { cn } from "~/utils/cn";
import { createTicketListingInputSchema } from "~/utils/createTicketListingInputSchema";
// import * as v from "valibot";

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
  const location = useLocation();
  const { isOpen, onOpenChange } = useDisclosure();
  const navigate = useNavigate();

  return (
    <>
      <SellTicketDialog open={isOpen} onOpenChange={onOpenChange} />
      <div className="flex min-h-screen flex-col relative">
        <div className="flex items-center justify-end isolate z-50 fixed bottom-0 inset-x-0 p-2">
          <MobileNavigation key={location.pathname} />
        </div>
        <Navbar className="w-full max-w-5xl mx-auto hidden lg:block bg-transparent" position="static">
          <NavbarBrand>
            <Link to="/">
              <Logo className="size-8 shadow hover:brightness-[98%] transition" />
            </Link>
          </NavbarBrand>
          <NavbarContent className="flex gap-4 h-16" justify="end">
            <NavbarItem>
              <DesktopNavLink to="/">Home</DesktopNavLink>
            </NavbarItem>
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
              <button type="button" onClick={() => onOpenChange()} className={desktopNavLinkStyle}>
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

const SellTicketDialog: FC<{ open: boolean; onOpenChange: (state: boolean) => void }> = (props) => {
  const form = useForm({
    defaultValues: { priceCents: 0 },
    resolver: valibotResolver(createTicketListingInputSchema),
  });

  return (
    <Modal size="xl" isOpen={props.open} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
            <ModalBody>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(async (_values) => {
                    return;
                  })}
                >
                  <FormField
                    control={form.control}
                    name="priceCents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input label="Price" {...field} value={String(field.value * 100)} type="number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Input label="Something" />
                </form>
              </Form>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Action
              </Button>
            </ModalFooter>
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
