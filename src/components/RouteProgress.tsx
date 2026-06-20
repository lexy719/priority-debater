"use client";

/**
 * RouteProgress — a slim top loading bar shown between page navigations. Starts
 * when an internal link is clicked, trickles forward, and completes when the
 * route actually changes (or after a safety timeout). Lightweight, no deps,
 * brand-red, respects the dark/brutalist system.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearTimers() {
    if (trickle.current) clearInterval(trickle.current);
    if (safety.current) clearTimeout(safety.current);
    if (fade.current) clearTimeout(fade.current);
  }

  function start() {
    clearTimers();
    setVisible(true);
    setWidth(8);
    trickle.current = setInterval(() => {
      setWidth((w) => (w >= 90 ? w : w + (90 - w) * 0.12));
    }, 200);
    // Failsafe: never leave the bar stuck if navigation doesn't change pathname.
    safety.current = setTimeout(() => done(), 6000);
  }

  function done() {
    clearTimers();
    setWidth(100);
    fade.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 280);
  }

  // Complete the bar whenever the route resolves to a new path.
  useEffect(() => {
    if (visible) done();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Start the bar on internal link clicks (before the new route renders).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || target === "_blank" || href.startsWith("#") || href.startsWith("mailto:")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page / hash only
      start();
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      data-testid="route-progress"
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[#ff3b30] shadow-[0_0_10px_rgba(255,59,48,0.7)] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
