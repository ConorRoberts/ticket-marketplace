import { type MotionValue, isMotionValue, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export function useCoerceToMotionValue<T>(val: T | MotionValue<T>): MotionValue<T> {
  const fallbackMotionVal = useMotionValue(isMotionValue(val) ? val.get() : val);

  useEffect(() => {
    if (!isMotionValue(val)) {
      fallbackMotionVal.set(val);
    }
  }, [val, fallbackMotionVal.set]);

  return isMotionValue(val) ? val : fallbackMotionVal;
}
