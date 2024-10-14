import { type HTMLMotionProps, type MotionValue, motion, useMotionTemplate, useTransform } from "framer-motion";
import { type PropsWithChildren, type RefObject, createContext, useContext, useEffect, useState } from "react";
import { useRef } from "react";
import { cn } from "../utils/css";
import { useCoerceToMotionValue } from "../utils/motion";

interface OrbitContextApi {
  orbitRef: RefObject<SVGRectElement>;
}

const OrbitContext = createContext<OrbitContextApi | null>(null);

const useOrbit = () => {
  const orbit = useContext(OrbitContext);
  if (!orbit) {
    throw new Error("Cannot call useOrbit outside of Orbit");
  }
  return orbit;
};

export type OrbitProps = PropsWithChildren<HTMLMotionProps<"div">>;

export const Orbit = ({ children, ...props }: OrbitProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGRectElement>(null);

  const [orbitRadius, setOrbitRadius] = useState("0px");

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const r = getComputedStyle(svgRef.current).getPropertyValue("border-radius");
    setOrbitRadius(r);
  }, []);

  return (
    <OrbitContext.Provider value={{ orbitRef: pathRef }}>
      <motion.div {...props} className={cn("relative", props.className)}>
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "inherit",
          }}
        >
          <rect ref={pathRef} rx={orbitRadius} ry={orbitRadius} fill="none" width="100%" height="100%" />
        </svg>
        {children}
      </motion.div>
    </OrbitContext.Provider>
  );
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

export interface SatelliteProps extends HTMLMotionProps<"div"> {
  // Position in degrees around the orbit. 360 degrees is one full revolution.
  position?: number | MotionValue<number>;
}

export const Satellite = ({ position = 0, ...props }: SatelliteProps) => {
  const orbit = useOrbit();
  const angle = useCoerceToMotionValue(position);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // this timeout is required for firefox to have a path length ready
    setTimeout(() => {
      setReady(true);
    }, 0);
  }, []);

  // useAnimationFrame((time) => {
  //   const length = orbit.orbitRef.current?.getTotalLength();
  //   if (length) {
  //     const pxPerMillisecond = length / duration;
  //     const directionMultiplier = direction === "counterclockwise" ? -1 : 1;
  //     progress.set(mod(directionMultiplier * time * pxPerMillisecond, length));
  //   }
  // });

  const offset = useTransform(angle, (val) => {
    const length = orbit.orbitRef.current?.getTotalLength();
    if (length) {
      return mod((val / 360) * length, length);
    }
    return 0;
  });

  const x = useTransform(offset, (val) => orbit.orbitRef.current?.getPointAtLength(val).x);
  const y = useTransform(offset, (val) => orbit.orbitRef.current?.getPointAtLength(val).y);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <motion.div
      {...props}
      style={{
        transform,
        visibility: ready ? "visible" : "hidden",
        ...props.style,
      }}
      className={cn("absolute top-0 left-0 inline-block", props.className)}
    />
  );
};
