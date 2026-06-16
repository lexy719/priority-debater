import { TickerBar } from "./TickerBar";
import { Check } from "lucide-react";

const TABS = [
  { label: "Home", href: "/", key: null },
  { label: "Brand", href: "/brand-kit", key: "brand" },
  { label: "Launch", href: "/launch-kit", key: "launch" },
  { label: "Campaign", href: "/campaign", key: "campaign" },
  { label: "Landing", href: "/landing-builder", key: "landing" },
  { label: "Ship", href: "/ship", key: "ship" },
];

const STEPS = [
  { n: "1", label: "Validate" },
  { n: "2", label: "Debate" },
  { n: "3", label: "Results" },
  { n: "4", label: "Brand" },
  { n: "5", label: "Launch" },
  { n: "6", label: "Campaign" },
  { n: "7", label: "Landing" },
  { n: "8", label: "Ship" },
];

const INDEX = { brand: 3, launch: 4, campaign: 5, landing: 6, ship: 7 };

export const FlowNav = ({ current = "brand", subtitle }) => {
  const currentIndex = INDEX[current] ?? 3;

  return (
    <header className="sticky top-0 z-50">
      <TickerBar />
      <div className="bg-[#0a0a0a] border-b border-white/15">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 h-14 flex items-center justify-between">
          <a href="/" data-testid="flow-logo" className="flex items-center gap-3">
            <span className="grid place-items-center w-8 h-8 bg-[#ff3b30] text-white font-display text-base leading-none pt-0.5">
              PD
            </span>
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white">
                Priority Debater
              </span>
              {subtitle && (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">
                  {subtitle}
                </span>
              )}
            </span>
          </a>

          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {TABS.map((t) => {
              const active = t.key === current;
              return (
                <a
                  key={t.label}
                  href={t.href}
                  data-testid={`flownav-${t.label.toLowerCase()}`}
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-2 transition-colors shrink-0 ${
                    active ? "bg-[#ff3b30] text-white" : "text-white/55 hover:text-white"
                  }`}
                >
                  {t.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-[#0a0a0a] border-b border-white/15">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-8 py-2.5 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <div key={s.n} className="flex items-center gap-1 shrink-0">
                <div
                  className={`flex items-center gap-2 px-2.5 py-1 border ${
                    active
                      ? "border-[#ff3b30] bg-[#ff3b30]/10"
                      : done
                      ? "border-[#32d74b]/40 bg-[#32d74b]/5"
                      : "border-white/15"
                  }`}
                >
                  <span
                    className={`font-mono text-[9px] grid place-items-center w-4 h-4 ${
                      active
                        ? "bg-[#ff3b30] text-white"
                        : done
                        ? "bg-[#32d74b] text-black"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {done ? <Check size={10} /> : s.n}
                  </span>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.16em] ${
                      active ? "text-white" : done ? "text-white/60" : "text-white/30"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`w-3 h-px ${done ? "bg-[#32d74b]/40" : "bg-white/15"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
};
