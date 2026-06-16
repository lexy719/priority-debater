import { TICKER } from "@/lib/flowData";

export const TickerBar = ({ reverse = false, theme = "dark" }) => {
  const items = TICKER.concat(TICKER, TICKER);
  const bg = theme === "dark" ? "bg-black" : "bg-[#0a0a0a]";
  return (
    <div
      data-testid="ticker-bar"
      className={`${bg} overflow-hidden py-1.5 border-y border-white/15 select-none`}
    >
      <div
        className="flex whitespace-nowrap animate-marquee"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {items.map((it, i) => (
          <span key={i} className="flex items-center gap-2 px-4 font-mono text-[10px] uppercase tracking-[0.18em]">
            <span
              className="px-1.5 py-0.5 text-[9px] font-bold text-black"
              style={{ background: it.color }}
            >
              {it.tag}
            </span>
            <span className="text-white/55">{it.text}</span>
            <span className="text-white/20">//</span>
          </span>
        ))}
      </div>
    </div>
  );
};
