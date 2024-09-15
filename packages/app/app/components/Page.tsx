import type { ComponentProps, FC } from "react";
import { cn } from "~/utils/cn";

export const Page: FC<ComponentProps<"div"> & { underNav?: boolean }> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn("flex flex-col mx-auto w-full max-w-5xl pt-2 px-6 md:pt-16", props.underNav && "-mt-16", className)}
      {...props}
    >
      {children}
    </div>
  );
};
