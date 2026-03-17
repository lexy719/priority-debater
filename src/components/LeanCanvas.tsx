"use client";

import type { LeanCanvas as LeanCanvasType } from "@/lib/parse";

const CELLS: { key: keyof LeanCanvasType; label: string; color: string; span?: string }[] = [
  { key: "problem", label: "Problem", color: "border-red-300 bg-red-50" },
  { key: "solution", label: "Solution", color: "border-emerald-300 bg-emerald-50" },
  { key: "uvp", label: "Unique Value Prop", color: "border-violet-300 bg-violet-50" },
  { key: "unfairAdvantage", label: "Unfair Advantage", color: "border-amber-300 bg-amber-50" },
  { key: "customerSegments", label: "Customer Segments", color: "border-blue-300 bg-blue-50" },
  { key: "keyMetrics", label: "Key Metrics", color: "border-indigo-300 bg-indigo-50" },
  { key: "channels", label: "Channels", color: "border-sky-300 bg-sky-50" },
  { key: "costStructure", label: "Cost Structure", color: "border-orange-300 bg-orange-50", span: "col-span-1" },
  { key: "revenueStreams", label: "Revenue Streams", color: "border-emerald-300 bg-emerald-50", span: "col-span-1" },
];

export function LeanCanvas({ canvas }: { canvas: LeanCanvasType }) {
  return (
    <div className="space-y-3">
      {/* Top row: 2x3 grid like the actual lean canvas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {CELLS.slice(0, 6).map((cell) => (
          <div key={cell.key} className={`rounded-lg border p-3 ${cell.color} min-h-[80px]`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{cell.label}</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{canvas[cell.key] || "—"}</p>
          </div>
        ))}
      </div>
      {/* Bottom row: channels + cost/revenue */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`rounded-lg border p-3 ${CELLS[6].color} min-h-[70px]`}>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{CELLS[6].label}</h4>
          <p className="text-xs text-slate-700 leading-relaxed">{canvas.channels || "—"}</p>
        </div>
        <div className={`rounded-lg border p-3 ${CELLS[7].color} min-h-[70px]`}>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{CELLS[7].label}</h4>
          <p className="text-xs text-slate-700 leading-relaxed">{canvas.costStructure || "—"}</p>
        </div>
        <div className={`rounded-lg border p-3 ${CELLS[8].color} min-h-[70px]`}>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">{CELLS[8].label}</h4>
          <p className="text-xs text-slate-700 leading-relaxed">{canvas.revenueStreams || "—"}</p>
        </div>
      </div>
    </div>
  );
}
