"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface RadarPoint {
  axis: string;
  us: number;
  baseline?: number;
}

interface RadarChartProps {
  data: RadarPoint[];
  size?: number;
  className?: string;
  hideBaseline?: boolean;
}

/**
 * Custom SVG radar chart. Single-hue (accent) fill for "us",
 * optional dashed baseline. Hover any axis to highlight its label.
 */
export function RadarChart({ data, size = 420, className = "", hideBaseline = false }: RadarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const labelRadius = radius * 1.18;
  const max = 100;
  const n = data.length;

  // Polygon vertex for axis i at distance d (0-1)
  const vertex = (i: number, d: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * radius * d,
      y: cy + Math.sin(angle) * radius * d,
    };
  };

  // Concentric grid rings (20, 40, 60, 80, 100)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Polygon points string for a series at value d
  const polyPoints = (values: number[]) =>
    values.map((v, i) => {
      const p = vertex(i, v / max);
      return `${p.x},${p.y}`;
    }).join(" ");

  const usPoints = polyPoints(data.map((p) => p.us));
  const baselinePoints = polyPoints(data.map((p) => p.baseline ?? 60));

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        className="select-none overflow-visible"
        role="img"
        aria-label="Confidence radar"
      >
        {/* Concentric rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={Array.from({ length: n }, (_, i) => {
              const v = vertex(i, r);
              return `${v.x},${v.y}`;
            }).join(" ")}
            fill="none"
            stroke="black"
            strokeOpacity="0.1"
            strokeWidth={1}
          />
        ))}
        {/* Radial axes */}
        {data.map((_, i) => {
          const v = vertex(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={v.x}
              y2={v.y}
              stroke="black"
              strokeOpacity="0.1"
              strokeWidth={1}
            />
          );
        })}
        {/* Baseline polygon */}
        {!hideBaseline && (
          <polygon
            points={baselinePoints}
            fill="transparent"
            stroke="black"
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.3}
          />
        )}
        {/* Us polygon */}
        <polygon
          points={usPoints}
          fill="#4b9be3"
          fillOpacity={0.2}
          stroke="#4b9be3"
          strokeWidth={2}
        />
        {/* Vertex dots */}
        {data.map((p, i) => {
          const v = vertex(i, p.us / max);
          const isHovered = hovered === i;
          return (
            <g key={i}>
              <circle
                cx={v.x}
                cy={v.y}
                r={isHovered ? 6 : 3}
                fill="#4b9be3"
                stroke="white"
                strokeWidth={2}
                style={{ transition: "r 200ms ease" }}
              />
              <circle
                cx={v.x}
                cy={v.y}
                r={20}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}
        {/* Axis labels */}
        {data.map((p, i) => {
          const v = vertex(i, labelRadius / radius);
          const isHovered = hovered === i;
          const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
          const dx = Math.cos(angle);
          const anchor = Math.abs(dx) < 0.3 ? "middle" : dx > 0 ? "start" : "end";
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
              <text
                x={v.x}
                y={v.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
                letterSpacing="0.1em"
                fill={isHovered ? "black" : "rgba(0,0,0,0.4)"}
                style={{ transition: "fill 150ms ease", textTransform: "uppercase" as const, cursor: "pointer" }}
              >
                {p.axis}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
