import type { FC } from "react";

export const SimiaStudiosLogo: FC<{ className?: string }> = (props) => {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={props.className}
    >
      <path
        d="M370.201 441.7C183.84 409.282 97.3552 317.385 72.5814 139.394"
        stroke="#FFE135"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M127.494 413.581C217.951 494.063 384.717 519.037 489.391 444.348L494 423.134C288.445 398.516 128.197 267.349 99.4055 26.4191C87.0744 26.3745 47.5703 22 47.5703 22C-14.9108 190.506 27.9969 324.976 127.516 413.47L127.494 413.581Z"
        stroke="#FFE135"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
