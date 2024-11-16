import type { ComponentProps, FC } from "react";
import { cn } from "~/utils/cn";

export const Page: FC<
  Omit<ComponentProps<"div">, "className"> & {
    underNav?: boolean;
    classNames?: Partial<{ container: string; content: string }>;
  }
> = ({ children, classNames, underNav, ...props }) => {
  return (
    <div
      className={cn("flex flex-col pt-2 px-6 lg:pt-16 flex-1", underNav && "-mt-16", classNames?.container)}
      {...props}
    >
      <div className={cn("flex flex-col mx-auto w-full max-w-5xl", classNames?.content)}>{children}</div>
    </div>
  );
};
