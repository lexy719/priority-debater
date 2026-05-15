import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: ReactNode;
  speed?: "slow" | "normal" | "fast";
  className?: string;
  reverse?: boolean;
}

const speedMap = {
  slow: "60s",
  normal: "40s",
  fast: "20s",
};

/**
 * Infinite horizontal marquee. Pure CSS via two duplicated children + animate-marquee keyframe.
 */
export function Marquee({ children, speed = "normal", className = "", reverse = false }: MarqueeProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `marquee ${speedMap[speed]} linear infinite${reverse ? " reverse" : ""}`,
          width: "max-content",
        }}
      >
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
