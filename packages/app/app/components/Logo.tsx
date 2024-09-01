import type { FC } from "react";
import { cn } from "~/utils/cn";

export const Logo: FC<{
  className?: string;
  filled?: boolean;
}> = (props) => {
  const { filled = true } = props;

  if (filled) {
    return (
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("rounded-lg", props.className)}
      >
        <rect width="512" height="512" fill="white" />
        <path
          d="M327.102 373.085C209.839 352.687 155.42 294.863 139.832 182.867"
          stroke="#000"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M174.385 355.392C231.304 406.033 336.236 421.748 402.1 374.751L405 361.403C275.66 345.913 174.828 263.38 156.712 111.781C148.953 111.753 124.096 109 124.096 109C84.7812 215.028 111.78 299.64 174.4 355.322L174.385 355.392Z"
          stroke="#000"
          strokeWidth="15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <path
        d="M327.102 373.085C209.839 352.687 155.42 294.863 139.832 182.867"
        stroke="#FFE135"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M174.385 355.392C231.304 406.033 336.236 421.748 402.1 374.751L405 361.403C275.66 345.913 174.828 263.38 156.712 111.781C148.953 111.753 124.096 109 124.096 109C84.7812 215.028 111.78 299.64 174.4 355.322L174.385 355.392Z"
        stroke="#FFE135"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
