import { motion, useTransform } from "framer-motion";
import type { FC, HTMLProps, PropsWithChildren } from "react";
import type { Clock } from "../utils/clocks";
import { cn } from "../utils/css";

interface TickerProps extends HTMLProps<HTMLDivElement> {
  clock: Clock;
  loopDuration?: number;
  direction?: "horizontal" | "vertical";
}

export const Ticker: FC<PropsWithChildren<TickerProps>> = ({
  clock,
  loopDuration = 12000,
  direction = "horizontal",
  children,
  ...otherProps
}) => {
  const progress = useTransform(clock.value, (time) => (time % loopDuration) / loopDuration);
  const percentage = useTransform(progress, (t) => t * 100);
  const translate = useTransform(percentage, (val) => `${-val}%`);
  return (
    <div {...otherProps} className={cn("relative inline-block overflow-hidden", otherProps.className)}>
      <motion.div
        style={{
          x: direction === "horizontal" ? translate : 0,
          y: direction === "vertical" ? translate : 0,
        }}
        className="w-full h-full"
      >
        {direction === "horizontal" && <div className="absolute top-0 right-0 h-full w-full">{children}</div>}
        {direction === "vertical" && <div className="absolute bottom-[100%] left-0 h-full w-full">{children}</div>}
        <div className="w-full h-full">{children}</div>
        {direction === "horizontal" && <div className="absolute top-0 left-[100%] h-full w-full">{children}</div>}
        {direction === "vertical" && <div className="absolute top-[100%] left-0 h-full w-full">{children}</div>}
      </motion.div>
    </div>
  );
};
