import { type HTMLMotionProps, motion } from "framer-motion";
import * as React from "react";
import { cn } from "../utils/css";

export type BorderPlacement = "inside" | "outside";

export interface BorderMaskProps extends HTMLMotionProps<"div"> {
  width: string | number;
  placement?: BorderPlacement;
  radius?: string | number;
}

export const BorderMask = ({
  width,
  radius = "inherit",
  placement = "inside",
  children,
  ...props
}: BorderMaskProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const widthWithUnit = typeof width === "number" ? `${width}px` : width;
  const inset = placement === "inside" ? 0 : `calc(-1 * ${widthWithUnit})`;

  const adjustedRadius = placement === "outside" ? `calc(${radius} + ${widthWithUnit})` : radius;

  return (
    <motion.div
      ref={ref}
      {...props}
      style={{
        inset,
        borderRadius: adjustedRadius,
        borderWidth: widthWithUnit,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        ...props.style,
      }}
      className={cn("absolute pointer-events-none border-transparent rounded-[inherit]", props.className)}
    >
      <motion.div className="absolute overflow-hidden" style={{ inset: `calc(-1 * ${widthWithUnit})` }}>
        {children}
      </motion.div>
    </motion.div>
  );
};
