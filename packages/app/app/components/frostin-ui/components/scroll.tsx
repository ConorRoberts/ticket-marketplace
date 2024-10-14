import {
  type HTMLMotionProps,
  type MotionValue,
  type SpringOptions,
  motion,
  useScroll as useFramerMotionScroll,
  useMotionValueEvent,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import type { FC, HTMLProps, PropsWithChildren, RefObject } from "react";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

interface ScrollApi {
  container: RefObject<HTMLElement>;
  progress: {
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
  position: {
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
  velocity: {
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
}

const SMOOTHING_SPRING = {
  mass: 0.01,
  damping: 2,
  stiffness: 100,
};

const ScrollContext = createContext<ScrollApi | null>(null);

export const useScroll = () => {
  const scroll = useContext(ScrollContext);
  if (!scroll) {
    throw new Error("Cannot call useScroll outside of ScrollContainer or WindowScrollProvider");
  }
  return scroll;
};

interface ScrollSmoothingProps {
  progress?: SpringOptions;
  position?: SpringOptions;
  velocity?: SpringOptions;
}

export const ScrollSmoothing: FC<PropsWithChildren<ScrollSmoothingProps>> = ({
  progress,
  position,
  velocity,
  children,
}) => {
  const inherit = useScroll();
  const progressX = useSpring(inherit.progress.x, progress);
  const progressY = useSpring(inherit.progress.y, progress);
  const positionX = useSpring(inherit.position.x, position);
  const positionY = useSpring(inherit.position.y, position);
  const velocityX = useSpring(inherit.velocity.x, velocity);
  const velocityY = useSpring(inherit.velocity.y, velocity);

  const scroll = useMemo(
    () => ({
      ...inherit,
      progress: {
        x: progress ? progressX : inherit.progress.x,
        y: progress ? progressY : inherit.progress.y,
      },
      position: {
        x: position ? positionX : inherit.position.x,
        y: position ? positionY : inherit.position.y,
      },
      velocity: {
        x: velocity ? velocityX : inherit.velocity.x,
        y: velocity ? velocityY : inherit.velocity.y,
      },
    }),
    [progressX, progressY, positionX, positionY, velocityX, velocityY, inherit, progress, position, velocity],
  );

  return <ScrollContext.Provider value={scroll}>{children}</ScrollContext.Provider>;
};

export const WindowScrollProvider = ({ children }: any) => {
  const container = useRef<HTMLElement | null>(null);
  const { scrollX, scrollXProgress, scrollY, scrollYProgress } = useFramerMotionScroll();
  // spring is necessary to smooth out velocity
  const scrollXSpring = useSpring(scrollX, SMOOTHING_SPRING);
  const scrollXVelocity = useVelocity(scrollXSpring);
  const scrollYSpring = useSpring(scrollY, SMOOTHING_SPRING);
  const scrollYVelocity = useVelocity(scrollYSpring);

  const scrollApi = useMemo(
    () => ({
      container,
      position: {
        x: scrollX,
        y: scrollY,
      },
      progress: {
        x: scrollXProgress,
        y: scrollYProgress,
      },
      velocity: {
        x: scrollXVelocity,
        y: scrollYVelocity,
      },
    }),
    [scrollX, scrollY, scrollXProgress, scrollYProgress, scrollXVelocity, scrollYVelocity],
  );

  useLayoutEffect(() => {
    // @ts-ignore
    container.current = document.documentElement;
  }, []);

  return <ScrollContext.Provider value={scrollApi}>{children}</ScrollContext.Provider>;
};

interface ScrollContainerProps extends HTMLMotionProps<"div"> {}

export const ScrollContainer = ({ children, ...otherProps }: ScrollContainerProps) => {
  const container = useRef<HTMLDivElement>(null);
  const { scrollX, scrollXProgress, scrollY, scrollYProgress } = useFramerMotionScroll({ container });
  // spring is necessary to smooth out velocity
  const scrollXSpring = useSpring(scrollX, SMOOTHING_SPRING);
  const scrollXVelocity = useVelocity(scrollXSpring);
  const scrollYSpring = useSpring(scrollY, SMOOTHING_SPRING);
  const scrollYVelocity = useVelocity(scrollYSpring);

  const scrollApi = useMemo(
    () => ({
      container,
      position: {
        x: scrollX,
        y: scrollY,
      },
      progress: {
        x: scrollXProgress,
        y: scrollYProgress,
      },
      velocity: {
        x: scrollXVelocity,
        y: scrollYVelocity,
      },
    }),
    [scrollX, scrollY, scrollXProgress, scrollYProgress, scrollXVelocity, scrollYVelocity],
  );

  return (
    <ScrollContext.Provider value={scrollApi}>
      <motion.div
        {...otherProps}
        ref={container}
        style={{
          position: "relative",
          overflow: "auto",
          ...otherProps.style,
        }}
      >
        {children}
      </motion.div>
    </ScrollContext.Provider>
  );
};

interface ScrollIntersection {
  target: "start" | "center" | "end" | number;
  container: "start" | "center" | "end" | number;
}

interface ScrollTargetProps extends HTMLProps<HTMLDivElement> {
  zero?: ScrollIntersection;
  one?: ScrollIntersection;
  axis?: "x" | "y";
}

export const ScrollTarget: FC<PropsWithChildren<ScrollTargetProps>> = ({
  children,
  zero = { target: "start", container: "start" },
  one = { target: "end", container: "end" },
  axis = "y",
  ...otherProps
}) => {
  const inherited = useScroll();
  const target = useRef<HTMLDivElement>(null);
  const { scrollX, scrollXProgress, scrollY, scrollYProgress } = useFramerMotionScroll({
    target: target,
    container: inherited.container,
    axis,
    offset: [`${zero.target} ${zero.container}`, `${one.target} ${one.container}`],
  });

  const scrollApi = useMemo(
    () => ({
      container: inherited.container,
      position: {
        x: scrollX,
        y: scrollY,
      },
      progress: {
        x: scrollXProgress,
        y: scrollYProgress,
      },
      velocity: {
        x: inherited.velocity.x,
        y: inherited.velocity.y,
      },
    }),
    [
      inherited.container,
      scrollX,
      scrollY,
      scrollXProgress,
      scrollYProgress,
      inherited.velocity.x,
      inherited.velocity.y,
    ],
  );

  return (
    <ScrollContext.Provider value={scrollApi}>
      <div {...otherProps} ref={target}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
};

interface ScrollRangeProps {
  zero?: number;
  one?: number;
}

export const ScrollRange: FC<PropsWithChildren<ScrollRangeProps>> = ({ children, zero = 0, one = 1 }) => {
  const inherited = useScroll();
  const adjustedXProgress = useTransform(inherited.progress.x, [zero, one], [0, 1]);
  const adjustedYProgress = useTransform(inherited.progress.y, [zero, one], [0, 1]);
  const scrollApi = useMemo(
    () => ({
      container: inherited.container,
      position: {
        x: inherited.position.x,
        y: inherited.position.y,
      },
      progress: {
        x: adjustedXProgress,
        y: adjustedYProgress,
      },
      velocity: {
        x: inherited.velocity.x,
        y: inherited.velocity.y,
      },
    }),
    [
      inherited.container,
      inherited.position.x,
      inherited.position.y,
      adjustedXProgress,
      adjustedYProgress,
      inherited.velocity.x,
      inherited.velocity.y,
    ],
  );

  return <ScrollContext.Provider value={scrollApi}>{children}</ScrollContext.Provider>;
};

type ScrollDirection = "up" | "down" | "static";

// Derive current scroll status from velocity
export const useScrollDirection = (): ScrollDirection => {
  const scroll = useScroll();
  const [direction, setDirection] = useState<ScrollDirection>("static");
  useMotionValueEvent(scroll.velocity.y, "change", (val) => {
    if (val > 0) {
      setDirection("down");
    } else if (val < 0) {
      setDirection("up");
    } else {
      setDirection("static");
    }
  });
  return direction;
};

export const useScrollAtStart = ({ axis = "y" }: { axis?: "x" | "y" } = {}) => {
  const scroll = useScroll();
  const [atStart, setAtStart] = useState(true);

  useEffect(() => {
    const listener = () => {
      // @ts-ignore
      const { scrollTop, scrollLeft } = scroll.container.current;
      if (axis === "y") {
        setAtStart(scrollTop < 1);
      } else if (axis === "x") {
        setAtStart(scrollLeft < 1);
      }
    };
    scroll.container.current?.addEventListener("scroll", listener);
    return () => {
      scroll.container.current?.removeEventListener("scroll", listener);
    };
  });

  return atStart;
};

export const useScrollAtEnd = ({ axis = "y" }: { axis?: "x" | "y" } = {}) => {
  const scroll = useScroll();
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const listener = () => {
      // @ts-ignore
      const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = scroll.container.current;
      if (axis === "y") {
        setAtEnd(scrollHeight - scrollTop - clientHeight < 1);
      } else if (axis === "x") {
        setAtEnd(scrollWidth - scrollLeft - clientWidth < 1);
      }
    };
    scroll.container.current?.addEventListener("scroll", listener);
    return () => {
      scroll.container.current?.removeEventListener("scroll", listener);
    };
  });

  return atEnd;
};
