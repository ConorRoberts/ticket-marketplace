import { type FC, useId } from "react";
import { cn } from "~/utils/cn";

export const Logo: FC<{
  className?: string;
}> = (props) => {
  const id = useId();

  const name = (str: string) => `${id}-${str}`;

  return (
    <div className={cn("rounded-lg size-10 flex items-center justify-center", props.className)}>
      <svg viewBox="0 0 313 313" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path={`url(#${name("clip0_435_210")})`}>
          <path
            d="M159.213 120.458V137.314M159.213 171.024V187.879M159.213 221.59V238.445M74.9373 120.458H192.924C197.394 120.458 201.681 122.234 204.842 125.395C208.003 128.556 209.779 132.843 209.779 137.314V162.597C205.309 162.597 201.022 164.372 197.861 167.533C194.7 170.694 192.924 174.982 192.924 179.452C192.924 183.922 194.7 188.209 197.861 191.37C201.022 194.531 205.309 196.307 209.779 196.307V221.59C209.779 226.06 208.003 230.347 204.842 233.508C201.681 236.669 197.394 238.445 192.924 238.445H74.9373C70.467 238.445 66.1798 236.669 63.0188 233.508C59.8578 230.347 58.082 226.06 58.082 221.59V196.307C62.5523 196.307 66.8395 194.531 70.0005 191.37C73.1615 188.209 74.9373 183.922 74.9373 179.452C74.9373 174.982 73.1615 170.694 70.0005 167.533C66.8395 164.372 62.5523 162.597 58.082 162.597V137.314C58.082 132.843 59.8578 128.556 63.0188 125.395C66.1798 122.234 70.467 120.458 74.9373 120.458Z"
            stroke={`url(#${name("paint0_linear_435_210")})`}
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M170.02 78.1553L182.661 100.051M214.785 72.2619L208.242 96.6832M250.607 99.7484L228.711 112.39M256.5 144.514L232.079 137.97"
            stroke={`url(#${name("paint1_linear_435_210")})`}
            strokeWidth="15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <linearGradient
            id={name("paint0_linear_435_210")}
            x1="133.931"
            y1="120.458"
            x2="133.931"
            y2="238.445"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#5DBCFF" />
            <stop offset="1" stopColor="#BA26F4" />
          </linearGradient>
          <linearGradient
            id={name("paint1_linear_435_210")}
            x1="223.13"
            y1="74.4979"
            x2="207.862"
            y2="131.481"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#5DBCFF" />
            <stop offset="1" stopColor="#BA26F4" />
          </linearGradient>
          <clipPath id={name("clip0_435_210")}>
            <rect width="312.448" height="312.448" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
