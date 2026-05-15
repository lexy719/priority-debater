"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  scrambleMs?: number;
  pad?: number;
  className?: string;
  trigger?: "mount" | "view";
  onSettled?: () => void;
}

/**
 * Mono number that scrambles like a split-flap board, then settles on `value`.
 */
export function AnimatedNumber({
  value,
  duration = 1400,
  scrambleMs = 1100,
  pad = 0,
  className = "",
  trigger = "mount",
  onSettled,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(trigger === "mount");

  useEffect(() => {
    if (trigger !== "view" || shown) return;
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [trigger, shown]);

  useEffect(() => {
    if (!shown || !ref.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      ref.current.textContent = pad ? String(value).padStart(pad, "0") : String(value);
      onSettled?.();
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (!ref.current) return;
      if (elapsed < scrambleMs) {
        const max = Math.max(99, value);
        const n = Math.floor(Math.random() * max);
        ref.current.textContent = pad ? String(n).padStart(pad, "0") : String(n);
        raf = requestAnimationFrame(tick);
      } else if (elapsed < duration) {
        const t = (elapsed - scrambleMs) / Math.max(1, duration - scrambleMs);
        const noise = Math.round((Math.random() * 8 - 4) * (1 - t));
        const n = Math.max(0, Math.min(999, value + noise));
        ref.current.textContent = pad ? String(n).padStart(pad, "0") : String(n);
        raf = requestAnimationFrame(tick);
      } else {
        ref.current.textContent = pad ? String(value).padStart(pad, "0") : String(value);
        onSettled?.();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, value, duration, scrambleMs, pad]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {pad ? String(value).padStart(pad, "0") : String(value)}
    </span>
  );
}
