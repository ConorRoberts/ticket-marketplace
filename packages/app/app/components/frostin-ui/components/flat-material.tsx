import { type HTMLMotionProps, type MotionValue, motion, useTransform } from "framer-motion";
import { type ReactNode, createContext, useContext } from "react";
import { cn } from "../utils/css";
import { useCoerceToMotionValue } from "../utils/motion";
import { shadows } from "../utils/shadows";
import { BorderMask, type BorderPlacement } from "./border-mask";
import { useLight } from "./light";
import { Mask, masks } from "./mask";

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

export interface FlatMaterialOverlayProps extends HTMLMotionProps<"div"> {
  lightBgColor?: string;
  darkBgColor?: string;
}

export const FlatMaterialOverlay = ({
  lightBgColor = "rgba(255, 255, 255, 1)",
  darkBgColor = "rgba(255, 255, 255, 0.2)",
  ...otherProps
}: FlatMaterialOverlayProps) => {
  const material = useMaterial();
  const bgGradient = useTransform(
    material.lightAngle,
    (val) => `linear-gradient(${180 + val}deg, ${lightBgColor} 0%, ${darkBgColor} 100%)`,
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

export interface FlatMaterialProps extends HTMLMotionProps<"div"> {
  lightAngle?: number | MotionValue<number>;
  lightSpread?: string | number;
  lightEdgeColor?: string;
  baseEdgeColor?: string;
  edgeWidth?: string | number;
  edgePlacement?: BorderPlacement;
  shadowIntensity?: number;
  shadowBlurriness?: number;
  shadowDistance?: number;
  shadowColor?: string;
  shadowLayers?: number;
  children?: ReactNode;
}

export const FlatMaterial = ({
  lightAngle,
  lightSpread = "220px",
  baseEdgeColor = "rgba(255,255,255,0.05)",
  lightEdgeColor = "rgba(255,255,255,0.3)",
  edgeWidth = 1,
  edgePlacement = "inside",
  shadowIntensity = 0.1,
  shadowBlurriness = 0.4,
  shadowDistance = 24,
  shadowColor = "black",
  shadowLayers = 1,
  children,
  ...props
}: FlatMaterialProps) => {
  const light = useLight();
  lightAngle = lightAngle ?? light.angle;
  const angle = useCoerceToMotionValue(lightAngle);
  const boxShadow = useTransform(angle, (val) => {
    return shadows.soft({
      angle: val,
      distance: shadowDistance,
      color: shadowColor,
      intensity: shadowIntensity,
      layers: shadowLayers,
      blurriness: shadowBlurriness,
    });
  });

  const shimmerTransform = useTransform(angle, (val) => `translateX(-100%) translateY(-50%) rotate(${val + 90}deg)`);

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
        <BorderMask width={edgeWidth} placement="inside">
          <div className="absolute inset-0" style={{ background: baseEdgeColor }} />
          <Mask
            image={masks.linear({
              direction: "to-bottom",
              opacities: [0, 1, 0],
            })}
            className="absolute w-[200%] left-1/2 top-1/2 origin-right"
            style={{
              transform: shimmerTransform,
              background: lightEdgeColor,
              height: lightSpread,
            }}
          />
        </BorderMask>
      </motion.div>
    </MaterialContext.Provider>
  );
};
