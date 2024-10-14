import { type HTMLMotionProps, motion } from "framer-motion";
import { type ReactNode, memo } from "react";
import { cn } from "../utils/css";
import { type Direction, Mask, masks } from "./mask";

export interface ProgressiveBlurProps extends HTMLMotionProps<"div"> {
  direction?: Direction;
  blurStart?: number;
  blurEnd?: number;
  layers?: number;
  children?: ReactNode;
}

export const ProgressiveBlur = memo(
  ({
    blurStart = 0,
    blurEnd = 12,
    direction = "to-bottom",
    layers = 5,
    children,
    ...otherProps
  }: ProgressiveBlurProps) => {
    layers = Math.max(layers, 2);
    const step = 1 / (layers + 1);
    const blurMin = Math.min(blurStart, blurEnd);
    const blurMax = Math.max(blurStart, blurEnd);
    const blurRange = blurMax - blurMin;
    const blurBase = blurRange ** (1 / (layers - 1));
    return (
      <motion.div {...otherProps} className={cn("relative", otherProps.className)}>
        {children}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backdropFilter: `blur(${blurMin}px)`,
          }}
        />
        {[...new Array(layers).keys()].map((layer) => {
          return (
            <Mask
              key={layer}
              image={masks.linear({
                direction,
                opacities: [0, 1, 1, 0],
                positions: [layer * step, (layer + 1) * step, (layer + 2) * step, (layer + 3) * step],
                rotate: blurStart > blurEnd ? 180 : 0,
              })}
              className="absolute inset-0 pointer-events-none rounded-[inherit]"
              style={{
                backdropFilter: `blur(${blurBase ** layer}px)`,
              }}
            />
          );
        })}
      </motion.div>
    );
  },
);
