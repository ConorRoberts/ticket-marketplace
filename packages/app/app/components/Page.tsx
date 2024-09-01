import type { ComponentProps, FC } from "react";
import { cn } from "~/utils/cn";

export const Page: FC<ComponentProps<"div">> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col mx-auto w-full max-w-5xl pt-2 px-2 md:px-0 md:pt-36",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
