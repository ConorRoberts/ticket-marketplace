import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { springs } from "../utils/springs";

export const MotionNumber = ({
  value,
  initialValue = 0,
}: {
  value: number;
  initialValue?: number;
}) => {
  const spring = useSpring(initialValue, springs.slow());

  useEffect(() => {
    spring.set(value);
  }, [value, spring.set]);

  const formatted = useTransform(spring, (val: number) => val.toFixed(0));

  return <motion.span className="tabular-nums">{formatted}</motion.span>;
};
