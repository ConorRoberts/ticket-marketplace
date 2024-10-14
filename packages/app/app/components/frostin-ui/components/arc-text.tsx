import { type HTMLMotionProps, motion } from "framer-motion";
import React from "react";
import { toDegrees } from "../utils";
import { cn } from "../utils/css";

interface ArcTextProps extends HTMLMotionProps<"div"> {
  text: string;
  radius: number;
  charWidth?: number;
}

function getArcAngle(arcLength: number, radius: number) {
  radius = Math.max(radius, 0.01);
  return toDegrees(arcLength / radius);
}

export const ArcText = React.memo(({ text, radius, charWidth = 13, ...otherProps }: ArcTextProps) => {
  const characters = text.split("");
  const degreesPerChar = getArcAngle(charWidth, radius);

  return (
    <motion.div
      {...otherProps}
      className={cn("relative !font-mono", otherProps.className)}
      style={{
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        ...otherProps.style,
      }}
    >
      <div className="absolute inset-0" aria-hidden="true">
        {characters.map((char, i) => (
          <span
            key={i.toString()}
            className="absolute top-0 left-1/2 inline-block"
            style={{
              fontSize: 14,
              textAlign: "center",
              letterSpacing: 0,
              bottom: 0,
              height: `${radius}px`,
              transform: `translateX(-50%) rotate(${degreesPerChar * (i - (characters.length - 1) / 2)}deg)`,
              transformOrigin: "bottom center",
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </motion.div>
  );
});
