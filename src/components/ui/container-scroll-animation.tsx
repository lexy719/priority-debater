"use client";

import React, { useRef } from "react";
import {
  useScroll,
  useTransform,
  motion,
  type MotionValue,
} from "framer-motion";

/**
 * ContainerScroll
 * - Scroll-driven 3D card reveal: the card tilts from 20deg to flat
 *   while the title translates up.
 * - Reskinned to Tribunal Theatre tokens (no #222 / no rounded-30px /
 *   no heavy box-shadow). Hairline border on bg-deep canvas.
 * - Adapted from the Aceternity reference implementation.
 */
export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = (): [number, number] => {
    return isMobile ? [0.7, 0.9] : [1.02, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[52rem] md:h-[72rem] flex items-center justify-center relative p-4 md:p-16"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-32 w-full relative"
        style={{ perspective: "1000px" }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <ScrollCard rotate={rotate} translate={translate} scale={scale}>
          {children}
        </ScrollCard>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
}) => {
  return (
    <motion.div
      style={{ translateY: translate }}
      className="max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const ScrollCard = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{ rotateX: rotate, scale }}
      className={[
        "max-w-6xl -mt-12 mx-auto",
        "h-[28rem] md:h-[38rem] w-full",
        "border border-[--line-strong]",
        "bg-[--bg-deep] rounded-[--radius]",
        "p-1.5 md:p-2",
      ].join(" ")}
    >
      <div className="h-full w-full overflow-hidden rounded-[--radius] bg-[--surface-1] border border-[--line]">
        {children}
      </div>
    </motion.div>
  );
};
