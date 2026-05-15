"use client";

import { useEffect, useRef, useState } from "react";

/**
 * SplitText — splits children into per-character spans and animates them in.
 * Renders as <span> by default. Pass `block` to render as a div.
 *
 * Splitting + GSAP are loaded dynamically on the client so SSR doesn't
 * touch `document` during prerender.
 */
export function SplitText({
  children,
  className = "",
  delay = 0,
  stagger = 0.025,
  trigger = "mount",
  block = false,
}: {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: "mount" | "view";
  block?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !ref.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ gsap }, splittingModule] = await Promise.all([
        import("gsap"),
        import("splitting"),
      ]);
      if (cancelled || !ref.current) return;
      const Splitting = splittingModule.default;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      Splitting({ target: ref.current, by: "chars" });
      const chars = ref.current.querySelectorAll<HTMLElement>(".char");
      gsap.set(chars, { opacity: 0, y: "0.6em", rotateX: -90 });

      const tween = () => {
        gsap.to(chars, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: reduce ? 0.001 : 0.85,
          ease: "power3.out",
          stagger: reduce ? 0 : stagger,
          delay,
        });
      };

      if (trigger === "view") {
        const obs = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                tween();
                obs.disconnect();
                break;
              }
            }
          },
          { threshold: 0.4 }
        );
        obs.observe(ref.current);
        cleanup = () => obs.disconnect();
      } else {
        tween();
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [hydrated, delay, stagger, trigger]);

  const style: React.CSSProperties = { display: block ? "block" : "inline-block", perspective: 800 };

  if (block) {
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>} className={className} style={style}>
        {children}
      </div>
    );
  }
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className} style={style}>
      {children}
    </span>
  );
}
