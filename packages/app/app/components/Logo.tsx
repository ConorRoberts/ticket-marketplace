import { type FC, useId } from "react";
import { cn } from "~/utils/cn";

export const Logo: FC<{
  className?: string;
}> = (props) => {
  const id = useId();

  const name = (str: string) => `${id}-${str}`;

  return (
    <div className={cn("rounded-lg size-10 flex items-center justify-center", props.className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath={`url(#${name("clip0_426_221")})`}>
          <path
            d="M20.3845 15.4209V17.5787M20.3845 21.8944V24.0522M20.3845 28.3679V30.5257M9.59533 15.4209H24.7001C25.2724 15.4209 25.8213 15.6482 26.2259 16.0529C26.6306 16.4576 26.8579 17.0064 26.8579 17.5787V20.8155C26.2856 20.8155 25.7368 21.0428 25.3321 21.4475C24.9275 21.8521 24.7001 22.401 24.7001 22.9733C24.7001 23.5456 24.9275 24.0944 25.3321 24.4991C25.7368 24.9038 26.2856 25.1311 26.8579 25.1311V28.3679C26.8579 28.9401 26.6306 29.489 26.2259 29.8937C25.8213 30.2983 25.2724 30.5257 24.7001 30.5257H9.59533C9.02304 30.5257 8.47418 30.2983 8.06951 29.8937C7.66484 29.489 7.4375 28.9401 7.4375 28.3679V25.1311C8.00979 25.1311 8.55864 24.9038 8.96331 24.4991C9.36798 24.0944 9.59533 23.5456 9.59533 22.9733C9.59533 22.401 9.36798 21.8521 8.96331 21.4475C8.55864 21.0428 8.00979 20.8155 7.4375 20.8155V17.5787C7.4375 17.0064 7.66484 16.4576 8.06951 16.0529C8.47418 15.6482 9.02304 15.4209 9.59533 15.4209Z"
            stroke={`url(#${name("paint0_linear_426_221")})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21.7673 10.0053L23.3857 12.8084M27.4982 9.25084L26.6605 12.3773M32.0841 12.7697L29.281 14.388M32.8386 18.5006L29.7121 17.6629"
            stroke={`url(#${name("paint1_linear_426_221")})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <linearGradient
            id={name("paint0_linear_426_221")}
            x1="17.1477"
            y1="15.4209"
            x2="17.1477"
            y2="30.5257"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7571FF" />
            <stop offset="1" stopColor="#FFA8E2" />
          </linearGradient>
          <linearGradient
            id={name("paint1_linear_426_221")}
            x1="28.5666"
            y1="9.5371"
            x2="26.6119"
            y2="16.8321"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7571FF" />
            <stop offset="1" stopColor="#FFA8E2" />
          </linearGradient>
          <clipPath id={name("clip0_426_221")}>
            <rect width="40" height="40" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};
