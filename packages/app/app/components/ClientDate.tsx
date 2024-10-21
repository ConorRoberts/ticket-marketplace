import dayjs from "dayjs";
import calendarPlugin from "dayjs/plugin/calendar";
import type { FC } from "react";
import { cn } from "~/utils/cn";
import { useClientDate } from "~/utils/useClientDate";
dayjs.extend(calendarPlugin);

export const ClientDate: FC<{
  date: Parameters<typeof dayjs>[0];
  format?: string;
  calendar?: boolean;
  className?: string;
}> = (props) => {
  const str = useClientDate(props);

  return <span className={cn(props.className)}>{str ? str : <>&#8203;</>}</span>;
};
