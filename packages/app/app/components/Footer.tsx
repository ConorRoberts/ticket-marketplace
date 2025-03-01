import { Link } from "@remix-run/react";
import type { ComponentProps, FC } from "react";
import { cn } from "~/utils/cn";
import { Logo } from "./Logo";

const FooterLink: FC<ComponentProps<typeof Link>> = ({ className, children, ...props }) => {
  return (
    <Link {...props} className={cn("font-medium text-sm hover:text-gray-800 transition", className)}>
      {children}
    </Link>
  );
};

export const Footer = () => {
  return (
    <div className="border-t border-gray-200 bg-gray-100 px-2 py-8 flex flex-col gap-4 pb-20 lg:pb-8">
      <div className="flex">
        <div className="flex w-full flex-col gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 md:gap-32">
            <div className="flex flex-row sm:flex-col justify-between sm:justify-start gap-4">
              <Logo className="size-10 border border-gray-100" />
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-2 px-2">
              <FooterLink to="/">Home</FooterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
