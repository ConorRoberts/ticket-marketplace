import { type HTMLMotionProps, motion } from "framer-motion";
import { type FC, type PropsWithChildren, useEffect, useState } from "react";

interface DelayedMountProps extends HTMLMotionProps<"div"> {
  delay: number; // Duration in milliseconds
}

/**
 * Mounts its children only after the provided duration has elapsed.
 */
export const DelayedMount: FC<PropsWithChildren<DelayedMountProps>> = ({ delay, children, ...otherProps }) => {
  const [shouldRender, setShouldRender] = useState(delay === 0);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [delay]);

  return <motion.div {...otherProps}>{shouldRender ? children : null}</motion.div>;
};
