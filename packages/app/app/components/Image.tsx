import type { FC } from "react";
import { cn } from "~/utils/cn";
import { images } from "~/utils/images";

export const Image: FC<{
  width: number;
  imageId: string;
  className?: string;
}> = (props) => {
  return (
    <img
      className={cn("w-full h-full", props.className)}
      src={images.optimizeId(props.imageId, {
        width: props.width,
      })}
    />
  );
};
