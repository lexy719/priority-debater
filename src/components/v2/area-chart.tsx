"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AreaPoint {
  label: string;
  us: number;
  peer?: number;
}

interface AreaChartProps {
  data: AreaPoint[];
  className?: string;
  height?: number;
  yMax?: number;
  yTicks?: number[];
}

/**
 * Custom SVG area chart. Single-hue accent fill, dashed peer baseline.
 * Hover scrub: vertical accent line follows the cursor with mono tooltip.
 */
export function AreaChart({
  data,
  className = "",
  height = 280,
  yMax,
  yTicks = [0, 20, 40, 60],
}: AreaChartProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const PADDING = { top: 16, right: 16, bottom: 32, left: 40 };
  const WIDTH = 1000; // viewBox width — scales fluidly
  const HEIGHT = height;
  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const max = yMax ?? Math.ceil(Math.max(...data.map((d) => Math.max(d.us, d.peer ?? 0))) / 20) * 20;
  const x = (i: number) => PADDING.left + (i / (data.length - 1)) * innerW;
  const y = (v: number) => PADDING.top + innerH - (v / max) * innerH;

  // Construct path strings
  const pathFor = (key: "us" | "peer") => {
    return data
      .map((d, i) => {
        const v = d[key];
        if (v == null) return null;
        return `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`;
      })
      .filter(Boolean)
      .join(" ");
  };

  const usPath = pathFor("us");
  const usFill = `${usPath} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const peerPath = pathFor("peer");

  // Mouse handler — find nearest data point
  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    // find closest x
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const d = Math.abs(x(i) - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    setHovered(best);
  };

  const hoveredX = hovered != null ? x(hovered) : null;
  const hoveredUs = hovered != null ? data[hovered].us : null;
  const hoveredPeer = hovered != null ? data[hovered].peer : null;
  const hoveredLabel = hovered != null ? data[hovered].label : null;

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      <svg
        ref={ref}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHovered(null)}
        style={{ cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id="areaUsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.42} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid lines (horizontal only) */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--line)"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              fontFamily="var(--app-font-mono)"
              fill="var(--ink-2)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={usFill} fill="url(#areaUsFill)" />

        {/* Peer dashed line */}
        {peerPath && (
          <path
            d={peerPath}
            fill="none"
            stroke="var(--ink-2)"
            strokeWidth={1}
            strokeDasharray="2 4"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Us line */}
        <path
          d={usPath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />

        {/* X-axis labels */}
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 || i === data.length - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="11"
              fontFamily="var(--app-font-mono)"
              fill="var(--ink-2)"
            >
              {d.label}
            </text>
          ) : null
        )}

        {/* Hover scrub line */}
        {hoveredX != null && (
          <>
            <line
              x1={hoveredX}
              x2={hoveredX}
              y1={PADDING.top}
              y2={HEIGHT - PADDING.bottom}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="2 4"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={hoveredX}
              cy={y(hoveredUs ?? 0)}
              r={5}
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth={2}
            />
            {hoveredPeer != null && (
              <circle
                cx={hoveredX}
                cy={y(hoveredPeer)}
                r={3}
                fill="var(--ink-2)"
                stroke="var(--bg)"
                strokeWidth={1.5}
              />
            )}
          </>
        )}
      </svg>

      {/* Tooltip — positioned absolutely, follows hovered point */}
      {hovered != null && hoveredLabel && (
        <div
          className="pointer-events-none absolute top-0 px-3 py-2 bg-[--surface-1] border border-[--line-strong] rounded-[--radius] font-mono text-[11px] tabular-nums z-10"
          style={{
            left: `calc(${(x(hovered) / WIDTH) * 100}% - 4px)`,
            transform: "translate(-50%, -120%)",
            top: "20%",
            whiteSpace: "nowrap",
          }}
        >
          <div className="text-[--ink-2] uppercase tracking-[0.16em] text-[10px] mb-1">
            {hoveredLabel}
          </div>
          <div className="text-[--accent]">us · {hoveredUs}</div>
          {hoveredPeer != null && (
            <div className="text-[--ink-2]">peer · {hoveredPeer}</div>
          )}
        </div>
      )}
    </div>
  );
}
