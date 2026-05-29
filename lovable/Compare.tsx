import { Bot, Gavel, Heart } from "lucide-react";
import { Tag } from "./primitives";

const cols = [
  {
    icon: Heart,
    name: "Friends & Family",
    invert: false,
    rows: [
      ["Tone", "Supportive"],
      ["Signal", "Low"],
      ["Output", "A feeling"],
    ],
  },
  {
    icon: Bot,
    name: "Generic AI",
    invert: false,
    rows: [
      ["Tone", "Agreeable"],
      ["Signal", "Medium"],
      ["Output", "A summary"],
    ],
  },
  {
    icon: Gavel,
    name: "Priority Debater",
    invert: true,
    rows: [
      ["Tone", "Adversarial"],
      ["Signal", "High"],
      ["Output", "A decision"],
    ],
  },
];

export function Compare() {
  return (
    <section className="border-b border-ink/15 bg-paper-2">
      <div className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10 lg:py-36">
        <div className="text-center">
          <Tag tone="blue" className="mb-8">The alternative</Tag>
          <h2 className="mx-auto max-w-4xl font-display text-[clamp(2.75rem,7vw,6rem)] leading-[0.95] tracking-[-0.02em] text-ink">
            Built to <br /> disagree.
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-ink/70">
            Friendly feedback keeps weak ideas alive. Priority Debater is built for the harder job: pressure, disagreement, and better decisions before expensive mistakes.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-ink bg-ink/15 md:grid-cols-3">
          {cols.map(({ icon: Icon, ...c }) => (
            <div
              key={c.name}
              className={`p-7 ${c.invert ? "bg-signal-blue text-ink" : "bg-paper"}`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 place-items-center border ${c.invert ? "border-ink/40 bg-signal-blue" : "border-ink/30 bg-paper"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="font-display text-base uppercase">{c.name}</span>
              </div>
              <div className="mt-8 space-y-4">
                {c.rows.map(([k, v], i) => (
                  <div key={k}>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-60">
                        {k}
                      </span>
                      <span className="font-display text-base">{v}</span>
                    </div>
                    {i < c.rows.length - 1 && (
                      <div className="mt-3 border-b border-dashed border-current opacity-25" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}