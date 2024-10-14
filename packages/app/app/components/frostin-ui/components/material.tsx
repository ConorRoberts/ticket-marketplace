import { type HTMLMotionProps, type MotionValue, motion, useTransform } from "framer-motion";
import { type ReactNode, createContext, useContext } from "react";
import { cn } from "../utils/css";
import { toComponents } from "../utils/math";
import { useCoerceToMotionValue } from "../utils/motion";
import { shadows } from "../utils/shadows";
import { useLight } from "./light";

interface MaterialContextApi {
  lightAngle: MotionValue<number>;
}

const MaterialContext = createContext<MaterialContextApi | null>(null);

const useMaterial = () => {
  const material = useContext(MaterialContext);
  if (!material) {
    throw new Error("Cannot call useMaterial outside of Material");
  }
  return material;
};

export interface MaterialOverlayProps extends HTMLMotionProps<"div"> {
  nearBgColor?: string;
  farBgColor?: string;
}

export const MaterialOverlay = ({
  nearBgColor = "rgba(255, 255, 255, 1)",
  farBgColor = "rgba(255, 255, 255, 0.2)",
  ...otherProps
}: MaterialOverlayProps) => {
  const material = useMaterial();
  const bgGradient = useTransform(
    material.lightAngle,
    (val) => `linear-gradient(${180 + val}deg, ${nearBgColor} 0%, ${farBgColor} 100%)`,
  );

  return (
    <motion.div
      {...otherProps}
      className={cn("absolute inset-0 rounded-[inherit] opacity-[0.04] pointer-events-none", otherProps.className)}
      style={{
        background: bgGradient,
        ...otherProps.style,
      }}
    />
  );
};

export interface MaterialProps extends HTMLMotionProps<"div"> {
  lightAngle?: number | MotionValue<number>;
  rounding?: number;
  shadowIntensity?: number;
  shadowBlurriness?: number;
  shadowDistance?: number;
  shadowColor?: string;
  shadowLayers?: number;
  lightEdgeColor?: string;
  midEdgeColor?: string;
  darkEdgeColor?: string;
  children?: ReactNode;
}

export const Material = ({
  lightAngle,
  rounding = 1,
  lightEdgeColor = "rgba(255,255,255,0.225)",
  midEdgeColor = "rgba(255,255,255,0)",
  darkEdgeColor = "rgba(0, 0, 0, 0.225)",
  shadowIntensity = 0.1,
  shadowBlurriness = 0.4,
  shadowDistance = rounding,
  shadowColor = "black",
  shadowLayers = 1,
  children,
  ...props
}: MaterialProps) => {
  const light = useLight();
  lightAngle = lightAngle ?? light.angle;
  const angle = useCoerceToMotionValue(lightAngle);
  const boxShadow = useTransform(angle, (val) => {
    const components = {
      mainAxis: toComponents(val + 90),
      crossAxis: toComponents(val),
    };
    const mainXOffset = components.mainAxis.x * rounding;
    const mainYOffset = components.mainAxis.y * rounding;
    const crossXOffset = components.crossAxis.x * rounding;
    const crossYOffset = components.crossAxis.y * rounding;
    return `
      inset ${mainXOffset}px ${mainYOffset}px ${rounding}px ${-rounding / 2}px ${lightEdgeColor}, 
      inset ${-mainXOffset}px ${-mainYOffset}px ${rounding}px ${-rounding / 2}px ${darkEdgeColor},
      inset ${-crossXOffset}px ${-crossYOffset}px ${rounding}px ${-rounding / 2}px ${midEdgeColor},
      inset ${crossXOffset}px ${crossYOffset}px ${rounding}px ${-rounding / 2}px ${midEdgeColor},
      ${shadows.soft({
        angle: val,
        distance: shadowDistance,
        color: shadowColor,
        intensity: shadowIntensity,
        layers: shadowLayers,
        blurriness: shadowBlurriness,
      })}
    `;
  });

  return (
    <MaterialContext.Provider value={{ lightAngle: angle }}>
      <motion.div
        {...props}
        className={cn("relative rounded-[inherit]", props.className)}
        style={{
          boxShadow,
          ...props.style,
        }}
      >
        {children}
      </motion.div>
    </MaterialContext.Provider>
  );
};
