import { Image as NextUiImage } from "@nextui-org/image";
import type { ComponentProps, FC } from "react";
import { cn } from "~/utils/cn";
import { images } from "~/utils/images";

export const Image: FC<
  ComponentProps<typeof NextUiImage> & {
    width: number;
    imageId: string;
    className?: string;
  }
> = ({ className, imageId, width, ...props }) => {
  return (
    <NextUiImage
      {...props}
      removeWrapper
      classNames={{
        img: cn("w-full h-full object-cover", className),
      }}
      src={images.optimizeId(imageId, {
        width,
      })}
    />
  );
};
