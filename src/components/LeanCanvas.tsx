"use client";

import type { LeanCanvas as LeanCanvasType } from "@/lib/parse";

const CELLS: { key: keyof LeanCanvasType; label: string; accent: string }[] = [
  { key: "problem", label: "Problem", accent: "border-red-500/20 bg-red-500/[0.06]" },
  { key: "solution", label: "Solution", accent: "border-emerald-500/20 bg-emerald-500/[0.06]" },
  { key: "uvp", label: "Unique Value Prop", accent: "border-violet-500/20 bg-violet-500/[0.06]" },
  { key: "unfairAdvantage", label: "Unfair Advantage", accent: "border-amber-500/20 bg-amber-500/[0.06]" },
  { key: "customerSegments", label: "Customer Segments", accent: "border-sky-500/20 bg-sky-500/[0.06]" },
  { key: "keyMetrics", label: "Key Metrics", accent: "border-indigo-500/20 bg-indigo-500/[0.06]" },
  { key: "channels", label: "Channels", accent: "border-cyan-500/20 bg-cyan-500/[0.06]" },
  { key: "costStructure", label: "Cost Structure", accent: "border-orange-500/20 bg-orange-500/[0.06]" },
  { key: "revenueStreams", label: "Revenue Streams", accent: "border-emerald-500/20 bg-emerald-500/[0.06]" },
];

export function LeanCanvas({ canvas }: { canvas: LeanCanvasType }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CELLS.slice(0, 6).map((cell) => (
          <div key={cell.key} className={`rounded-xl border p-3.5 ${cell.accent} min-h-[80px]`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5">{cell.label}</h4>
            <p className="text-xs text-white/55 leading-relaxed">{canvas[cell.key] || "—"}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {CELLS.slice(6).map((cell) => (
          <div key={cell.key} className={`rounded-xl border p-3.5 ${cell.accent} min-h-[70px]`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-1.5">{cell.label}</h4>
            <p className="text-xs text-white/55 leading-relaxed">{canvas[cell.key] || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
