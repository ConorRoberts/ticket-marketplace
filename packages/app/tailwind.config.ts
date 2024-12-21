import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import colors from "tailwindcss/colors";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "../../node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        gray: colors.neutral,
        brand: {
          blue: "#5DBCFF",
          purple: "#BA26F4",
        },
      },
    },
  },
  plugins: [
    animate,
    nextui({
      layout: {
        borderWidth: {
          small: "1px",
          medium: "1px",
        },
      },
    }),
  ],
};

export default config;
