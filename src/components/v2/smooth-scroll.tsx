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
 * Also disabled on PD Studio: the machine HMI is a fixed-viewport layout whose
 * modules scroll in nested containers — Lenis swallows the wheel events they need.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const appSurface =
    pathname.startsWith("/commerce/results") || pathname.startsWith("/commerce/agent") || pathname.startsWith("/studio");

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

    // Expose the instance so views that swap their whole content (e.g. PD Studio
    // entry → scroll experience) can reset the scroll position with Lenis rather
    // than fighting it with window.scrollTo.
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      if ((window as unknown as { lenis?: Lenis }).lenis === lenis) {
        delete (window as unknown as { lenis?: Lenis }).lenis;
      }
    };
  }, [appSurface]);

  return <>{children}</>;
}
