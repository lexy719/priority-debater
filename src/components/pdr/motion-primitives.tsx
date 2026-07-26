"use client";

/**
 * Shared motion primitives for the PDR brand landing.
 *
 * All respect `prefers-reduced-motion` (render static). Built on framer-motion,
 * which reads the Lenis-smoothed scroll wired app-wide in `SmoothScroll`.
 */

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  animate,
  type HTMLMotionProps,
} from "framer-motion";

/* Fade + rise. Scroll-triggered by default; pass `mount` for above-the-fold
   content that should play immediately on load (never waits for an in-view event). */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  blur = false,
  mount = false,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; blur?: boolean; mount?: boolean }) {
  const reduce = useReducedMotion();
  // Motion children can be MotionValues; the static fallback renders plain nodes only.
  if (reduce) return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>;
  const target = { opacity: 1, y: 0, filter: "blur(0px)" };
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" }}
      {...(mount
        ? { animate: target }
        : { whileInView: target, viewport: { once: true, margin: "0px 0px -12% 0px" } })}
      transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* Headline that reveals line-by-line — each line fades and rises, staggered.
   Plays on mount (used above the fold). No overflow clip, so it paints reliably. */
export function MaskLines({
  lines,
  className,
  delay = 0,
}: {
  lines: React.ReactNode[];
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <span className={className} style={{ display: "block" }}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block" }}>
          {reduce ? (
            line
          ) : (
            <motion.span
              style={{ display: "block" }}
              initial={{ y: 34, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.75, delay: delay + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </span>
  );
}

/* Number that counts up when it scrolls into view. */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce || !inView) return;
    const controls = animate(0, to, {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {Math.round(val).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/* Bar that fills to a percentage on scroll-in. */
export function ScoreBar({
  label,
  pct,
  color,
  delay = 0,
}: {
  label: string;
  pct: number;
  color: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="text-black/55">{label}</span>
        <span style={{ color }}>{pct}</span>
      </div>
      <div className="mt-1.5 h-[6px] w-full bg-black/8">
        <motion.div
          className="h-full"
          style={{ backgroundColor: color }}
          initial={reduce ? false : { width: 0 }}
          whileInView={reduce ? undefined : { width: `${pct}%` }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
