import type { OptimizedImageOptions } from "@conorroberts/utils/images";
import { Image as NextUiImage } from "@nextui-org/image";
import type { ComponentProps, FC } from "react";
import { omit } from "remeda";
import { cn } from "~/utils/cn";
import { images } from "~/utils/images";

export const Image: FC<
  Omit<ComponentProps<typeof NextUiImage>, "width"> & {
    className?: string;
  } & ({ imageId: string; width: number; options?: Omit<OptimizedImageOptions, "width"> } | { src: string })
> = ({ className, ...props }) => {
  const formattedProps = (() => {
    if ("imageId" in props) {
      return omit(props, ["imageId", "width"]);
    }

    return omit(props, ["src"]);
  })();

  return (
    <NextUiImage
      {...formattedProps}
      removeWrapper
      classNames={{
        img: cn("w-full h-full object-cover", className),
      }}
      src={
        "imageId" in props
          ? images.optimizeId(props.imageId, {
              width: props.width,
              ...props.options,
            })
          : props.src
      }
    />
  );
};
