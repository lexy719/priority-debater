"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * App-wide smooth scroll. Lenis + GSAP ticker integrated so ScrollTrigger
 * stays synced with the smoothed scroll position (no jank on pinned scrubs).
 *
 * Disabled on the PD Commerce app surfaces (the visibility workspace + the agent):
 * Lenis' scroll transform fights their sticky sidebars and triggers a recharts
 * ResizeObserver loop. Those surfaces use native scroll; marketing pages keep smooth.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const appSurface = pathname.startsWith("/commerce/results") || pathname.startsWith("/commerce/agent");

  useEffect(() => {
    if (appSurface) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [appSurface]);

  return <>{children}</>;
}
