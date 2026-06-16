"use client";

/**
 * Reveal — a scroll-triggered entrance wrapper. Fades + lifts its children
 * into view once, the first time they cross the viewport. This is the motion
 * layer that makes long marketing pages feel deliberate rather than static.
 *
 * - Fires slightly BEFORE the section is fully visible (-12% root margin) so
 *   content is already settling as the user arrives at it.
 * - Honors prefers-reduced-motion: renders instantly, no transform, no fade.
 * - Never animates layout-critical above-the-fold content (use sparingly on
 *   the hero); it's built for the sections the user scrolls down to.
 */

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger this section behind the previous one (seconds). */
  delay?: number;
  /** Travel distance in px before settling. Smaller = subtler. */
  y?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, y = 28, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
