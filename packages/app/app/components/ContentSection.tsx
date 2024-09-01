import type { FC, PropsWithChildren } from "react";
import { cn } from "~/utils/cn";

export const ContentSection: FC<
  PropsWithChildren<{ containerClassName?: string; contentClassName?: string }>
> = (props) => {
  return (
    <div
      className={cn(
        "flex flex-col justify-center items-center lg:h-[80vh] py-16 lg:py-0",
        props.containerClassName
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-5xl flex flex-col w-full p-4 lg:px-0",
          props.contentClassName
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
