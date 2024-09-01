import dayjs from "dayjs";
import calendarPlugin from "dayjs/plugin/calendar";
import type { FC } from "react";
import { useEffect, useState } from "react";
dayjs.extend(calendarPlugin);

export const ClientDate: FC<{
  date: Parameters<typeof dayjs>[0];
  format?: string;
  calendar?: boolean;
}> = (props) => {
  const str = useClientDate(props);

  return <>{str}</>;
};

export const useClientDate: FC<{
  date: Parameters<typeof dayjs>[0];
  format?: string;
  calendar?: boolean;
}> = (props) => {
  const [str, setStr] = useState("");

  useEffect(() => {
    const date = dayjs(props.date);
    setStr(props.calendar ? date.calendar() : date.format(props.format ?? "dddd MMMM D, YYYY [at] h:mm a"));
  }, [props]);

  return str;
};
