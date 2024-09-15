import { TicketIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "~/utils/cn";

export const Logo: FC<{
  className?: string;
}> = (props) => {
  return (
    <div
      className={cn(
        "bg-white border border-gray-100 rounded-lg size-10 flex items-center justify-center",
        props.className,
      )}
    >
      <TicketIcon className={cn("size-5")} />
    </div>
  );
};
