// Shared building blocks for the Priority Debater design system.
import {
  Link2,
  Search,
  Wrench,
  LineChart,
  ArrowUpRight,
} from "lucide-react";

// Alternating full-bleed section with an "N" corner marker.
export const Section = ({ variant = "black", children, testid }) => {
  const cream = variant === "cream";
  return (
    <section
      className={`relative ${cream ? "bg-[#ede6d8] text-black" : "bg-black text-white"}`}
      data-testid={testid}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-20 sm:py-28">{children}</div>
      <span
        className={`absolute bottom-4 left-5 font-mono text-[12px] select-none ${
          cream ? "text-black/30" : "text-[#555555]"
        }`}
        aria-hidden="true"
      >
        N
      </span>
    </section>
  );
};

// Mono metadata strip: "→ 01 / THE COMMERCE REPORT"
export const Meta = ({ children, variant = "black", className = "" }) => (
  <div
    className={`font-mono text-[11px] uppercase tracking-[0.08em] ${
      variant === "cream" ? "text-black/50" : "text-[#888888]"
    } ${className}`}
  >
    {children}
  </div>
);

// Generic data card used across the app.
export const DataCard = ({
  color = "#2d6bff",
  label,
  title,
  subtitle,
  big,
  bigDanger,
  stats = [],
  variant = "black",
  highlight = false,
  testid,
}) => {
  const cream = variant === "cream";
  return (
    <div
      className={`relative p-5 border flex flex-col ${
        highlight
          ? "border-[#e8272a] " + (cream ? "bg-white" : "bg-[#0d0606]")
          : cream
            ? "border-black/20 bg-white"
            : "border-[#1a1a1a] bg-[#0a0a0a]"
      }`}
      data-testid={testid}
    >
      <div className="flex items-start justify-between mb-4">
        <span
          className="w-4 h-4 inline-block shrink-0"
          style={{ background: color }}
        />
        <span
          className={`font-mono text-[10px] uppercase tracking-wider ${
            cream ? "text-black/45" : "text-[#888888]"
          }`}
        >
          {label}
        </span>
      </div>

      {big !== undefined && (
        <div
          className={`font-display leading-none text-5xl ${
            bigDanger ? "text-[#e8272a]" : cream ? "text-black" : "text-white"
          }`}
        >
          {big}
        </div>
      )}

      <div
        className={`font-bold uppercase text-[15px] tracking-wide mt-3 ${
          cream ? "text-black" : "text-white"
        }`}
      >
        {title}
      </div>
      {subtitle && (
        <div
          className={`text-[12px] mt-1 ${cream ? "text-black/55" : "text-[#888888]"}`}
        >
          {subtitle}
        </div>
      )}

      <div className="flex items-end justify-between mt-5 gap-3">
        <div
          className={`font-mono text-[11px] leading-relaxed ${
            cream ? "text-black/55" : "text-[#888888]"
          }`}
        >
          {stats.join("  /  ")}
        </div>
        <ArrowUpRight
          size={16}
          className={`shrink-0 ${cream ? "text-black" : "text-white"}`}
        />
      </div>
    </div>
  );
};

const stepIcons = { Link2, Search, Wrench, LineChart };

// Numbered "how it works" steps row.
export const Steps = ({ steps, variant = "cream" }) => {
  const cream = variant === "cream";
  return (
    <div className="grid grid-cols-1 md:grid-cols-4">
      {steps.map((s, i) => {
        const Icon = stepIcons[s.icon] || Link2;
        return (
          <div
            key={s.num}
            className={`px-6 py-6 md:py-0 ${
              i > 0
                ? cream
                  ? "md:border-l border-black/15"
                  : "md:border-l border-[#1a1a1a]"
                : "md:pl-0"
            }`}
            data-testid={`step-${s.num}`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-mono text-4xl ${cream ? "text-black/25" : "text-[#333333]"}`}
              >
                {s.num}
              </span>
              <Icon
                size={20}
                className={cream ? "text-[#2d6bff]" : "text-[#2d6bff]"}
              />
            </div>
            <div
              className={`font-bold uppercase text-[15px] tracking-wide mt-4 ${
                cream ? "text-black" : "text-white"
              }`}
            >
              {s.title}
            </div>
            <p
              className={`text-[13px] mt-2 ${cream ? "text-black/55" : "text-[#888888]"}`}
            >
              {s.body}
            </p>
            <span
              className={`inline-block mt-4 font-mono text-[10px] uppercase tracking-wider px-2 py-1 border ${
                s.done
                  ? "border-[#22c55e] text-[#22c55e]"
                  : cream
                    ? "border-black/25 text-black/60"
                    : "border-[#333333] text-[#888888]"
              }`}
            >
              {s.tag}
            </span>
          </div>
        );
      })}
    </div>
  );
};
