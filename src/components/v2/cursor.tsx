"use client";

import { useEffect, useRef, useState } from "react";

const parseRgb = (value: string) => {
  const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
};

const isColorDark = (value: string) => {
  const rgb = parseRgb(value);
  if (!rgb) return false;
  const [r, g, b] = rgb;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.55;
};

const getBackgroundColor = (el: HTMLElement | null): string | null => {
  while (el) {
    const style = window.getComputedStyle(el);
    const bg = style.backgroundColor;
    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "rgba(0,0,0,0)") {
      return bg;
    }
    el = el.parentElement;
  }
  return null;
};

/**
 * Magnetic cursor.
 *  - 8px dot follows the cursor with a soft lerp
 *  - Outer ring snaps to bounds of [data-cursor="snap"], buttons, links
 *  - Switches to + crosshair on [data-cursor="crosshair"]
 *  - Hidden on touch devices and prefers-reduced-motion
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0, w: 32, h: 32, r: 9999 });
  const ringTarget = useRef({ x: 0, y: 0, w: 32, h: 32, r: 9999, opacity: 0 });
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"default" | "snap" | "crosshair">("default");
  const [color, setColor] = useState("var(--ink-0)");

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || reduce) return;
    const enableTimer = window.setTimeout(() => setEnabled(true), 0);
    document.documentElement.classList.add("has-custom-cursor");

    const getElementBackgroundColorAtPoint = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      return getBackgroundColor(el);
    };

    const onMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const bg = getElementBackgroundColorAtPoint(e.clientX, e.clientY);
      const useWhite = bg ? isColorDark(bg) : false;
      setColor(useWhite ? "white" : "black");
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "[data-cursor], a, button, [role='button'], input, textarea, [data-snap]"
      );
      if (!el) {
        setMode("default");
        ringTarget.current.opacity = 0;
        return;
      }
      const cursorAttr = el.getAttribute("data-cursor");
      const bgColor = getBackgroundColor(el);
      const useWhite = bgColor ? isColorDark(bgColor) : false;
      setColor(useWhite ? "white" : "black");

      if (cursorAttr === "crosshair") {
        setMode("crosshair");
        ringTarget.current.opacity = 0;
        return;
      }
      const rect = el.getBoundingClientRect();
      ringTarget.current.x = rect.left + rect.width / 2;
      ringTarget.current.y = rect.top + rect.height / 2;
      ringTarget.current.w = rect.width + 12;
      ringTarget.current.h = rect.height + 12;
      ringTarget.current.r = 4;
      ringTarget.current.opacity = 1;
      setMode("snap");
    };

    const onLeave = () => {
      setMode("default");
      ringTarget.current.opacity = 0;
    };

    let raf = 0;
    const tick = () => {
      const lerp = 0.22;
      pos.current.x += (target.current.x - pos.current.x) * lerp;
      pos.current.y += (target.current.y - pos.current.y) * lerp;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.current.x - 4}px, ${pos.current.y - 4}px, 0)`;
      }
      const rl = 0.18;
      ringPos.current.x += (ringTarget.current.x - ringPos.current.x) * rl;
      ringPos.current.y += (ringTarget.current.y - ringPos.current.y) * rl;
      ringPos.current.w += (ringTarget.current.w - ringPos.current.w) * rl;
      ringPos.current.h += (ringTarget.current.h - ringPos.current.h) * rl;
      ringPos.current.r += (ringTarget.current.r - ringPos.current.r) * rl;
      if (ringRef.current) {
        ringRef.current.style.opacity = String(ringTarget.current.opacity);
        ringRef.current.style.transform = `translate3d(${ringPos.current.x - ringPos.current.w / 2}px, ${ringPos.current.y - ringPos.current.h / 2}px, 0)`;
        ringRef.current.style.width = `${ringPos.current.w}px`;
        ringRef.current.style.height = `${ringPos.current.h}px`;
        ringRef.current.style.borderRadius = `${ringPos.current.r}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onLeave);

    return () => {
      window.clearTimeout(enableTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] border"
        style={{
          willChange: "transform, opacity, width, height",
          opacity: 0,
          borderColor: color,
          transition: "opacity 200ms ease",
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[101]"
        style={{
          width: 8,
          height: 8,
          background: color,
          borderRadius: 9999,
          willChange: "transform",
        }}
      >
        {mode === "crosshair" && (
          <>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 24, height: 1, background: color }} />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 1, height: 24, background: color }} />
          </>
        )}
      </div>
    </>
  );
}
