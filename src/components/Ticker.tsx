import { Tag } from "./primitives";

const items = [
  { tag: "MNT", tone: "amber", text: "Pricing is weak. You're leaving 40% on the table." },
  { tag: "CUS", tone: "red", text: "No SOC-2, no annual contract. Ever." },
  { tag: "INV", tone: "green", text: "TAM feels like a feature, not a company." },
  { tag: "ADV", tone: "yellow", text: "Linear is $8 and ships weekly. You are $42." },
  { tag: "OPR", tone: "blue", text: "Onboarding takes 11 days. Churn starts day 12." },
  { tag: "MNT", tone: "amber", text: "You're describing a workflow, not a wedge." },
  { tag: "CUS", tone: "red", text: "Series A buyers won't pay $42/seat." },
  { tag: "INV", tone: "green", text: "Capital efficiency at this CAC is brutal." },
] as const;

export function Ticker() {
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-2.5 text-paper grid-paper-dark">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {loop.map((it, i) => (
          <div key={i} className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em]">
            <Tag tone={it.tone as never}>[{it.tag}]</Tag>
            <span>{it.text}</span>
            <span className="text-paper/30">//</span>
          </div>
        ))}
      </div>
    </div>
  );
}