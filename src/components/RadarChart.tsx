"use client";

import type { CategoryScores } from "@/lib/parse";

const LABELS: { key: keyof CategoryScores; label: string; shortLabel: string }[] = [
  { key: "problemSolutionFit", label: "Problem-Solution Fit", shortLabel: "Problem Fit" },
  { key: "marketOpportunity", label: "Market Opportunity", shortLabel: "Market" },
  { key: "competitiveEdge", label: "Competitive Edge", shortLabel: "Competition" },
  { key: "businessModel", label: "Business Model", shortLabel: "Biz Model" },
  { key: "teamExecution", label: "Team & Execution", shortLabel: "Team" },
  { key: "timingTrends", label: "Timing & Trends", shortLabel: "Timing" },
];

function polarToXY(cx: number, cy: number, r: number, angleIdx: number, total: number) {
  const angle = (Math.PI * 2 * angleIdx) / total - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function RadarChart({ scores }: { scores: CategoryScores }) {
  const cx = 150, cy = 150, maxR = 110;
  const n = LABELS.length;
  const hasScores = LABELS.some((l) => scores[l.key] != null);
  if (!hasScores) return null;

  const rings = [2, 4, 6, 8, 10];

  const dataPoints = LABELS.map((l, i) => {
    const val = scores[l.key] ?? 0;
    const r = (val / 10) * maxR;
    return polarToXY(cx, cy, r, i, n);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox="0 0 300 300" className="w-full h-auto">
        {/* Grid rings */}
        {rings.map((ring) => {
          const r = (ring / 10) * maxR;
          const pts = Array.from({ length: n }, (_, i) => polarToXY(cx, cy, r, i, n));
          const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
          return <path key={ring} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={ring === 10 ? 1.5 : 0.5} />;
        })}

        {/* Axis lines */}
        {LABELS.map((_, i) => {
          const p = polarToXY(cx, cy, maxR, i, n);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
        })}

        {/* Data polygon */}
        <path d={dataPath} fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth={2} />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#6366f1" stroke="#08080e" strokeWidth={2} />
        ))}

        {/* Labels */}
        {LABELS.map((l, i) => {
          const p = polarToXY(cx, cy, maxR + 22, i, n);
          const val = scores[l.key];
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.35)" fontSize={10} fontWeight={500}>
              {l.shortLabel}
              {val != null && (
                <tspan x={p.x} dy={13} fontSize={10} fontWeight={700} fill="rgba(255,255,255,0.7)">{val}/10</tspan>
              )}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function ScoreBreakdownBars({ scores }: { scores: CategoryScores }) {
  const hasScores = LABELS.some((l) => scores[l.key] != null);
  if (!hasScores) return null;

  return (
    <div className="space-y-3">
      {LABELS.map((l) => {
        const val = scores[l.key];
        if (val == null) return null;
        const pct = (val / 10) * 100;
        const color = val >= 7 ? "bg-emerald-500" : val >= 5 ? "bg-amber-500" : "bg-red-500";
        return (
          <div key={l.key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-white/40">{l.label}</span>
              <span className="text-xs font-bold text-white/70">{val}/10</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
