"use client";

import type { TamSamSom as TamSamSomType } from "@/lib/parse";

export function TamSamSomChart({ data }: { data: TamSamSomType }) {
  if (!data.tam && !data.sam && !data.som) return null;

  const circles = [
    { label: "TAM", value: data.tam, size: 180, color: "rgba(99, 102, 241, 0.15)", border: "#6366f1", textColor: "#6366f1" },
    { label: "SAM", value: data.sam, size: 120, color: "rgba(139, 92, 246, 0.2)", border: "#8b5cf6", textColor: "#8b5cf6" },
    { label: "SOM", value: data.som, size: 60, color: "rgba(16, 185, 129, 0.25)", border: "#10b981", textColor: "#10b981" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: 200, height: 200 }}>
        {circles.map((c, i) => (
          <div
            key={c.label}
            className="absolute rounded-full flex items-center justify-center border-2 transition-all"
            style={{
              width: c.size,
              height: c.size,
              top: `${(200 - c.size) / 2}px`,
              left: `${(200 - c.size) / 2}px`,
              backgroundColor: c.color,
              borderColor: c.border,
              zIndex: i + 1,
            }}
          >
            {i === 2 && (
              <span className="text-[10px] font-bold" style={{ color: c.textColor }}>
                SOM
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-xs">
        {circles.map((c) => (
          c.value && (
            <div key={c.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2" style={{ backgroundColor: c.color, borderColor: c.border }} />
              <span className="font-bold" style={{ color: c.textColor }}>{c.label}</span>
              <span className="text-white/40">{c.value}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
