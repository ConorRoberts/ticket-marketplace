import { type FC, useId } from "react";
import { cn } from "~/utils/cn";

export const NoiseFilter: FC<{ className?: string }> = (props) => {
  const id = useId();

  const noiseId = `${id}-noiseFilter`;

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={cn(props.className)}>
      <filter id={noiseId}>
        <feTurbulence type="fractalNoise" baseFrequency="0.99" numOctaves="3" stitchTiles="stitch" />
      </filter>

      <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
    </svg>
  );
};
