// Shared chart primitives for the Priority Debater terminal aesthetic.

export const monoTick = {
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 11,
  fill: "#888888",
};

export const axisLine = { stroke: "#333333" };

// Dark mono tooltip
export const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-black border border-[#333333] px-3 py-2 font-mono text-[11px]">
      {label !== undefined && (
        <div className="text-[#888888] uppercase mb-1 tracking-wider">{label}</div>
      )}
      {payload.map((p, i) => (
        <div
          key={i}
          className="flex items-center gap-2"
          style={{ color: p.color || p.stroke || p.fill || "#ffffff" }}
        >
          <span
            className="w-2 h-2 inline-block"
            style={{ background: p.color || p.stroke || p.fill }}
          />
          <span className="uppercase">{p.name}</span>
          <span className="ml-auto text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// Chart container card (dark)
export const ChartCard = ({ title, meta, children, height = "h-[300px]", testid, legend }) => (
  <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 flex flex-col" data-testid={testid}>
    <div className="flex items-start justify-between mb-1">
      <span className="font-mono text-[11px] text-white uppercase tracking-wider">{title}</span>
      {meta && <span className="font-mono text-[10px] text-[#888888]">{meta}</span>}
    </div>
    {legend && <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 mt-1">{legend}</div>}
    <div className={`${height} mt-2`}>{children}</div>
  </div>
);

export const LegendDot = ({ color, label }) => (
  <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#888888] uppercase tracking-wider">
    <span className="w-2.5 h-2.5 inline-block" style={{ background: color }} />
    {label}
  </span>
);

// Animated positive-delta chip (green glow) for improved numbers.
export const Delta = ({ children, tone = "green", className = "" }) => {
  const c = tone === "red" ? "#e8272a" : "#22c55e";
  const bg = tone === "red" ? "rgba(232,39,42,0.12)" : "rgba(34,197,94,0.12)";
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 ${tone === "red" ? "" : "pd-glow-green"} ${className}`}
      style={{ background: bg, color: c }}
    >
      <span>{tone === "red" ? "▼" : "▲"}</span>
      {children}
    </span>
  );
};

// Coaching callout line with a colored left rule.
export const Coach = ({ children, tone = "blue", variant = "black" }) => {
  const c = tone === "green" ? "#22c55e" : tone === "red" ? "#e8272a" : "#2d6bff";
  const cream = variant === "cream";
  return (
    <div className="flex items-start gap-3 border-l-2 pl-4 py-1" style={{ borderColor: c }}>
      <span className="font-mono text-[13px] leading-none mt-0.5" style={{ color: c }}>›</span>
      <p className={`text-[14px] sm:text-[15px] ${cream ? "text-black/70" : "text-[#aaaaaa]"}`}>
        {children}
      </p>
    </div>
  );
};
