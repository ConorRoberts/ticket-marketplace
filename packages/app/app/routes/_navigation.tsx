import * as DialogPrimitive from "@radix-ui/react-dialog";
import { NavLink, Outlet, useLocation } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { MenuIcon } from "lucide-react";
import { useEffect, useState, type ComponentProps, type FC } from "react";
import { Footer } from "~/components/Footer";
import { Image } from "~/components/Image";
// import { Logo } from "~/components/Logo";
import { Dialog, DialogPortal, DialogTrigger } from "~/components/ui/dialog";
import { cn } from "~/utils/cn";
import { images } from "~/utils/createMetadata";

const desktopNavLinkStyle =
  "font-medium text-sm h-8 px-3 rounded-lg flex gap-2 items-center justify-center hover:text-gray-700 transition whitespace-nowrap";

const _DesktopNavLink: FC<ComponentProps<typeof NavLink>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <NavLink {...props} className={(_e) => cn(desktopNavLinkStyle, className)}>
      {children}
    </NavLink>
  );
};

const MobileNavLink: FC<ComponentProps<typeof NavLink>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <NavLink
      {...props}
      className={(state) =>
        cn(
          "font-medium text-sm h-8 px-3 rounded-sm flex gap-2 items-center hover:text-gray-700 transition whitespace-nowrap text-left",
          state.isActive && "bg-gray-50",
          className
        )
      }
    >
      {children}
    </NavLink>
  );
};

const Layout = () => {
  return (
    <>
      <div className="flex min-h-screen flex-col relative">
        <div className="flex-1 brightness-[30%] grayscale w-full overflow-hidden -z-10 fixed inset-0">
          <Image
            width={1920}
            imageId={images.imageIds.menuSplash}
            className="object-cover sm:block hidden"
          />
          <Image
            width={800}
            imageId={images.imageIds.menuSplash}
            className="object-cover sm:hidden"
          />
        </div>
        {/* <div className="absolute top-0 w-full isolate z-50">
          <div className="flex items-center justify-end">
            <MobileNavigation />
          </div>
          <div className="items-center justify-between gap-2 mx-auto w-full max-w-5xl hidden md:flex h-16 px-4 lg:px-0">
            <Link to="/">
              <Logo className="size-8 shadow hover:brightness-[98%] transition" />
            </Link>
            <div className="flex items-center justify-between gap-2">
              <DesktopNavLink to="/">Home</DesktopNavLink>
            </div>
          </div>
        </div> */}
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </div>
      <Footer />
    </>
  );
};

const _MobileNavigation = () => {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Need this
  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="hover:text-gray-700 text-black transition cursor-pointer size-12 flex items-center justify-center md:hidden">
        <MenuIcon className="size-7" />
      </DialogTrigger>

      <AnimatePresence>
        {open && (
          <DialogPortal forceMount>
            <DialogPrimitive.Overlay>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-white/75"
              />
            </DialogPrimitive.Overlay>
            <div className="fixed inset-0 isolate flex items-center justify-center z-50">
              <DialogPrimitive.Content forceMount>
                <motion.div
                  initial={{ y: "-110%" }}
                  animate={{ y: "-10%" }}
                  exit={{ y: "-110%" }}
                  className="px-8 pb-8 pt-16 fixed top-0 inset-x-0 bg-white rounded-b-3xl border-b border-gray-100 overflow-hidden shadow"
                >
                  <div className="hidden">
                    <DialogPrimitive.DialogTitle className="hidden">
                      Navigation
                    </DialogPrimitive.DialogTitle>
                    <DialogPrimitive.DialogDescription className="hidden">
                      Navigation
                    </DialogPrimitive.DialogDescription>
                  </div>
                  <div className="flex flex-col gap-4">
                    <MobileNavLink to="/">Home</MobileNavLink>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </div>
          </DialogPortal>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default Layout;
