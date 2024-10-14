import { type HTMLMotionProps, motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../utils/css";
import { Mask, masks } from "./mask";
import { ProgressiveBlur } from "./progressive-blur";

export interface ReflectionProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  opacityStart?: number;
  opacityEnd?: number;
  blurStart?: number;
  blurEnd?: number;
}

export const Reflection = ({
  children,
  opacityStart = 0.9,
  opacityEnd = 0.1,
  blurStart = 0,
  blurEnd = 4,
  style,
  ...props
}: ReflectionProps) => {
  return (
    <motion.div
      {...props}
      style={{
        position: "relative",
        ...style,
      }}
      className={cn("w-fit h-fit", props.className)}
    >
      <div className="relative w-fit h-fit">{children}</div>
      <div
        className="relative w-fit h-fit"
        style={{
          transform: "scaleY(-1)",
        }}
      >
        <Mask
          image={masks.linear({
            direction: "to-bottom",
            opacities: [opacityEnd, opacityStart],
          })}
        >
          {children}
        </Mask>
        <ProgressiveBlur
          style={{
            position: "absolute",
            inset: 0,
          }}
          blurStart={blurEnd}
          blurEnd={blurStart}
        />
      </div>
    </motion.div>
  );
};
