import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { AnimatePresence, motion } from "framer-motion";
import React, { Children, type ReactNode, createContext, useContext, useState } from "react";
import { cn } from "../utils/css";
import { springs } from "../utils/springs";
import { Material, MaterialOverlay } from "./material";

export interface NavContextApi {
  activeItem: string | undefined;
  items: string[];
}

export const NavContext = createContext<NavContextApi | null>(null);

export const useNav = () => {
  const nav = useContext(NavContext);
  if (!nav) {
    throw new Error("Cannot call useNav outside of Nav.");
  }
  return nav;
};

export const Nav = ({
  children,
  defaultValue,
  onValueChange,
}: {
  children: ReactNode;
  defaultValue?: string | undefined;
  onValueChange?: (val: string | undefined) => void;
}) => {
  const [activeItem, setActiveItem] = useState<string | undefined>(defaultValue);
  const lightAngle = -40;

  const items = Children.toArray(children)
    .filter((c: any) => c?.type === NavItem)
    .map((c: any) => c.props.value);

  return (
    <NavContext.Provider value={{ activeItem, items }}>
      <NavigationMenu.Root
        className="fixed z-10 overflow-hidden"
        value={activeItem || ""}
        onValueChange={(val) => {
          setActiveItem(val);
          onValueChange?.(val);
        }}
      >
        <NavigationMenu.List
          asChild
          className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-5 px-3 h-14 bg-frostin-background/60 backdrop-blur-[10px] rounded-full z-10 list-none"
        >
          <Material
            rounding={1}
            lightAngle={lightAngle}
            lightEdgeColor="rgba(255,255,255,0.4)"
            midEdgeColor="rgba(255,255,255,0.05)"
            darkEdgeColor="rgba(255,255,255,0.15)"
            shadowBlurriness={0.5}
            shadowIntensity={0.45}
            shadowDistance={150}
            shadowLayers={5}
          >
            {children}
            <MaterialOverlay nearBgColor="rgba(255,255,255,0.75)" farBgColor="rgba(255,255,255,0.25)" />
          </Material>
        </NavigationMenu.List>
        <AnimatePresence>
          {activeItem && (
            <motion.div
              className="fixed inset-0 h-screen bg-gradient-to-b from-frostin-background/100 to-frostin-background/50"
              initial={{ backdropFilter: "none", opacity: 0 }}
              animate={{
                backdropFilter: "blur(16px)",
                opacity: 1,
              }}
              exit={{
                backdropFilter: "none",
                opacity: 0,
                transition: { duration: 0.5 },
              }}
              transition={springs.fast()}
              onPointerEnter={() => setActiveItem(undefined)}
            />
          )}
        </AnimatePresence>
        <NavigationMenu.Viewport forceMount className="fixed top-0 h-[60vh] w-full" />
      </NavigationMenu.Root>
    </NavContext.Provider>
  );
};

export interface NavItemContextApi {
  item: string | undefined;
}

export const NavItemContext = createContext<NavItemContextApi | null>(null);

export const useNavItem = () => {
  const navItem = useContext(NavItemContext);
  if (!navItem) {
    throw new Error("Cannot call useNavItem outside of NavItem.");
  }
  return navItem;
};

export const NavItem = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Item>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Item>
>(({ value, ...props }, ref) => {
  return (
    <NavItemContext.Provider value={{ item: value }}>
      <NavigationMenu.Item {...props} ref={ref} value={value} />
    </NavItemContext.Provider>
  );
});

export const NavLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Link>
>((props, ref) => {
  return (
    <NavigationMenu.Link
      {...props}
      ref={ref}
      className={cn("text-frostin-foreground/60 hover:text-frostin-foreground transition-colors", props.className)}
    />
  );
});

export const NavItemTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Trigger>
>((props, ref) => {
  return (
    <NavigationMenu.Trigger
      {...props}
      ref={ref}
      className={cn(
        "text-frostin-foreground/60 data-[state=open]:text-frostin-foreground/100 transition-colors px-3 py-1",
        props.className,
      )}
      onPointerDownCapture={(e) => {
        e.stopPropagation();
        props.onPointerDownCapture?.(e);
      }}
      onClick={(e) => {
        e.preventDefault();
        //   e.stopPropagation();
        props.onClick?.(e);
      }}
    />
  );
});

const variants = {
  content: {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
    hidden: { opacity: 0 },
  },
};

export const NavItemContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenu.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenu.Content>
>(({ children, ...props }, _ref) => {
  const nav = useNav();
  const navItem = useNavItem();

  return (
    <NavigationMenu.Content
      forceMount
      {...props}
      onPointerLeave={(e) => {
        e.stopPropagation();
        props.onPointerLeave?.(e);
      }}
    >
      <AnimatePresence mode="popLayout">
        {nav.activeItem === navItem.item && (
          <motion.div
            variants={variants.content}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="pt-32 pl-8 h-full max-w-2xl mx-auto"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </NavigationMenu.Content>
  );
});
