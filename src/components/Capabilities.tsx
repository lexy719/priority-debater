import { BarChart3, FileText, Rocket, Target, Users, Zap } from "lucide-react";
import { Eyebrow, Tag } from "./primitives";

const caps = [
  { icon: Zap, title: "AI Idea Validation", tag: "Core", tone: "blue", body: "50+ criteria scored. Viability index 0–100 with confidence interval." },
  { icon: BarChart3, title: "TAM / SAM / SOM", tag: "Market", tone: "green", body: "Real-time market sizing grounded in 2026 data with reasoning." },
  { icon: Target, title: "Competitor Map", tag: "Intel", tone: "amber", body: "3–5 named competitors with their angle and exploitable gaps." },
  { icon: FileText, title: "Investor-ready Plan", tag: "Plan", tone: "blue", body: "SWOT, revenue models, GTM tactics, risks — exportable." },
  { icon: Users, title: "5-Persona Debate", tag: "Differentiator", tone: "amber", body: "Argue your idea against VC, founder, CTO, CMO & customer voice." },
  { icon: Rocket, title: "GTM Tactics", tag: "Growth", tone: "green", body: "Channel-fit recommendations + positioning angles to ship now." },
] as const;

export function Capabilities() {
  return (
    <section id="features" className="border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Eyebrow index="02" label="/ Capabilities" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.96] tracking-[-0.02em] text-ink">
              Every angle. <br />
              Every objection. <br />
              <span className="hl-blue">Weaponized.</span>
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-ink/70">
              You get the same scrutiny a VC partnership meeting puts on a deal — condensed into a 120-second report and a live debate panel.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 gap-px bg-ink/15 border border-ink/15 sm:grid-cols-2 lg:grid-cols-3">
              {caps.map(({ icon: Icon, ...c }) => (
                <div key={c.title} className="group bg-paper p-6 transition-colors hover:bg-paper-2">
                  <div className="flex items-start justify-between">
                    <span className="grid h-9 w-9 place-items-center border border-ink/30 bg-paper">
                      <Icon className="h-4 w-4 text-ink" />
                    </span>
                    <Tag tone={c.tone as never}>{c.tag}</Tag>
                  </div>
                  <h3 className="mt-8 font-display text-base uppercase leading-tight text-ink">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-ink/70">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* sample verdicts ticker */}
      <div className="border-y border-ink overflow-hidden bg-paper">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap py-6 font-display text-4xl uppercase tracking-tight text-ink lg:text-6xl">
          {(() => {
            const verdicts = [
              { name: "Notion for chefs", score: "84", label: "go", cls: "bg-signal-green" },
              { name: "Senior rideshare", score: "31", label: "no-go", cls: "bg-signal-red text-paper" },
              { name: "Payments for clubs", score: "62", label: "caution", cls: "bg-signal-amber" },
              { name: "Carbon credits for SMBs", score: "78", label: "go", cls: "bg-signal-green" },
              { name: "AI lawyer for landlords", score: "44", label: "no-go", cls: "bg-signal-red text-paper" },
            ];
            const loop = [...verdicts, ...verdicts];
            return loop.map((v, i) => (
              <span key={i} className="flex items-center gap-5">
                <span className={`border border-ink ${v.cls} px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.2em]`}>
                  {v.label}
                </span>
                <span className="font-mono text-3xl lg:text-4xl text-ink">{v.score}</span>
                <span className="text-ink">{v.name}</span>
                <span className="text-ink/30">/</span>
              </span>
            ));
          })()}
        </div>
      </div>
    </section>
  );
}