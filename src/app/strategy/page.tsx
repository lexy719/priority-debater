"use client";

import Link from "next/link";
import { Download, RefreshCcw, Share2 } from "lucide-react";
import { Sidebar } from "@/components/v2/sidebar";
import { PageHeader } from "@/components/v2/page-header";
import { Button } from "@/components/v2/button";
import { Stat } from "@/components/v2/stat";
import { cn } from "@/lib/utils";

const NORTH_STAR = {
  thesis:
    "Make the family-paid concierge ride the default for adults 65+ in the metros where adult children live.",
  metric: "Recurring weekly riders per ZIP",
};

const PRINCIPLES = [
  { id: "01", rule: "Pick density over coverage.", tradeoff: "Slower expansion. Healthier loss ratio." },
  { id: "02", rule: "Manual before software.", tradeoff: "More sweat. Higher signal on what to build." },
  { id: "03", rule: "Family is the buyer.", tradeoff: "Smaller TAM. Higher willingness-to-pay." },
  { id: "04", rule: "Insurance is the moat.", tradeoff: "12 weeks of underwriting before scale." },
  { id: "05", rule: "Same driver, every Tuesday.", tradeoff: "We give up algorithmic dispatch. We get retention." },
  { id: "06", rule: "Don't build the iOS app first.", tradeoff: "Phone-only intake. Slower per-rider scale, faster learning." },
];

type Intensity = "go" | "caution" | "no-go" | "accent";
const PILLARS: Array<{
  id: string;
  name: string;
  why: string;
  metric: string;
  current: string;
  target: string;
  pct: number;
  intensity: Intensity;
}> = [
  { id: "01", name: "Loss-ratio discipline", why: "If insurance bleeds, the company dies before product-market fit.", metric: "Loss ratio", current: "0.78", target: "0.65", pct: 35, intensity: "no-go" },
  { id: "02", name: "Driver retention", why: "Same driver weekly is the brand promise. If they churn, riders churn.", metric: "90-day retention", current: "71%", target: "90%", pct: 79, intensity: "caution" },
  { id: "03", name: "Family payment depth", why: "Family-pays is the wedge. If billing breaks, we revert to consumer rideshare.", metric: "Avg $/family/mo", current: "$184", target: "$320", pct: 58, intensity: "accent" },
  { id: "04", name: "Care-coordinator pipeline", why: "B2B referrals scale CAC down. Coordinators are an unfair channel.", metric: "Referring partners", current: "3", target: "25", pct: 12, intensity: "go" },
];

const TRADEOFFS = [
  { a: "Phone dispatch", b: "Native iOS app", pick: "A", reason: "Riders won't download apps. Daughter calls or texts. Build the app at 1k riders, not 100." },
  { a: "1099 drivers", b: "W-2 drivers", pick: "B", reason: "Senior-care quality + driver retention requires employment. Premium pricing covers it." },
  { a: "Family-pays", b: "Rider-pays", pick: "A", reason: "Higher willingness-to-pay, lower payment friction, larger contract." },
  { a: "One Phoenix ZIP", b: "Three Phoenix ZIPs", pick: "A", reason: "Density compounds. Same drivers, same coordinators. Expand once unit economics prove." },
  { a: "VC seed now", b: "Self-fund 90 days", pick: "B", reason: "Self-fund the pilot, raise on the data. Better terms, fewer fights." },
];

const ROADMAP = [
  { q: "Q2", month: "Apr · May · Jun", goal: "Phoenix pilot · 100 paid rides · 25 family-pays accounts.", proof: "Loss ratio < 0.75 · CAC < $60 · NPS > 70" },
  { q: "Q3", month: "Jul · Aug · Sep", goal: "Expand to 3 Phoenix ZIPs. Hire 1 ops generalist. 250 active riders.", proof: "Driver 90d retention > 80% · 5+ partners referring monthly" },
  { q: "Q4", month: "Oct · Nov · Dec", goal: "Raise $1.2M seed. Hire CTO. Build family-pays billing engine.", proof: "$10k MRR · loss ratio < 0.65 · 25 partners" },
  { q: "Q1·27", month: "Jan · Feb · Mar", goal: "First metro outside Phoenix (Tucson or Scottsdale).", proof: "Repeatable playbook · 90-day metro setup runbook" },
];

const ANTI_GOALS = [
  { id: "01", never: "Generic rideshare for everyone over 60", why: "Becomes a feature in Uber. Erases the moat." },
  { id: "02", never: "Medicaid-only / NEMT", why: "State reimbursement walls. Bureaucracy. Wrong margins." },
  { id: "03", never: "Subscription pricing in year 1", why: "Family won't commit until trust is proven. Rides first, plans later." },
  { id: "04", never: "VC-funded blitz to 10 cities", why: "Loss-ratio collapses. One wrongful-death suit ends the company." },
  { id: "05", never: "AI dispatch", why: "We sell same-driver-every-Tuesday. Algorithmic matching breaks the brand." },
];

const colorOf = (i: Intensity) =>
  i === "go" ? "var(--go)" : i === "caution" ? "var(--caution)" : i === "no-go" ? "var(--no-go)" : "var(--accent)";

export default function StrategyPage() {
  return (
    <div className="app-page-shell min-h-screen flex text-[--ink-0]">
      <Sidebar
        project={{ title: "Rideshare for elders", verdict: "CAUTION", validatedAt: "26 APR 2026" }}
        user={{ name: "Sarah Chen", email: "sarah@studio.com", initial: "S" }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader
          kicker="STRATEGY · CASE №017"
          title="Linden — operating doctrine"
          meta={<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">v1 · 12-month plan</span>}
          actions={
            <>
              <Button variant="ghost" size="sm"><RefreshCcw className="w-3.5 h-3.5" /> Re-run</Button>
              <Button variant="ghost" size="sm"><Share2 className="w-3.5 h-3.5" /> Share</Button>
              <Button size="sm"><Download className="w-3.5 h-3.5" /> Export memo</Button>
            </>
          }
        />

        {/* Hero — north star */}
        <section className="relative px-6 md:px-8 py-14 md:py-20 border-b border-[--line] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-50" style={{ background: "radial-gradient(ellipse 60% 60% at 88% 100%, color-mix(in srgb, var(--accent) 5%, transparent), transparent 70%)" }} />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-end">
            <div className="space-y-6 max-w-[840px]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                north star · operating thesis
              </div>
              <h1 className="font-serif text-[clamp(40px,5.6vw,84px)] leading-[1.0] tracking-[-0.03em] text-[--ink-0]">
                "{NORTH_STAR.thesis}"
              </h1>
              <p className="font-serif italic text-[clamp(16px,1.8vw,22px)] leading-[1.4] text-[--ink-1]">
                One sentence. Read in every meeting. Refuse anything that doesn't move the needle.
              </p>
            </div>
            <div className="space-y-6 lg:pl-12 lg:border-l lg:border-[--line]">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2] mb-2">
                  one metric that matters
                </div>
                <p className="font-serif text-[24px] leading-[1.2] text-[--ink-0]">
                  {NORTH_STAR.metric}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-[--line]">
                <Stat label="Today" value="12" unit="riders/ZIP" size="md" />
                <Stat label="Q4 target" value={<span className="text-[--accent]">200</span>} unit="riders/ZIP" size="md" />
              </div>
            </div>
          </div>
        </section>

        <main className="flex-1 px-6 md:px-8 py-12 md:py-16 max-w-[1480px] w-full">
          <div className="space-y-20 md:space-y-24">
            {/* §01 Principles */}
            <section className="space-y-8">
              <SectionHeader number="01" title="Operating principles" right={`${PRINCIPLES.length} rules · 12 mo`} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[--line] border border-[--line] rounded-[--radius] overflow-hidden">
                {PRINCIPLES.map((p) => (
                  <article key={p.id} data-cursor="snap" className="bg-[--bg] p-7 md:p-8 hover:bg-[--surface-1] transition-colors flex flex-col gap-5 min-h-[220px]">
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">rule {p.id}</div>
                    <h3 className="font-serif text-[clamp(22px,2.4vw,32px)] leading-[1.1] tracking-[-0.02em] text-[--ink-0]">{p.rule}</h3>
                    <div className="mt-auto pt-5 border-t border-[--line] space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">trade-off</div>
                      <p className="font-serif italic text-[14px] leading-[1.5] text-[--ink-1]">{p.tradeoff}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* §02 Pillars */}
            <section className="space-y-8">
              <SectionHeader number="02" title="Pillars" right={`${PILLARS.length} metrics that matter`} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[--line] border border-[--line] rounded-[--radius] overflow-hidden">
                {PILLARS.map((p) => (
                  <article key={p.id} data-cursor="snap" className="bg-[--bg] p-7 md:p-9 hover:bg-[--surface-1] transition-colors flex flex-col gap-5">
                    <div className="flex items-baseline justify-between">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">pillar {p.id}</div>
                      <span className="w-2 h-2 rounded-full" style={{ background: colorOf(p.intensity) }} />
                    </div>
                    <h3 className="font-serif text-[clamp(28px,3vw,40px)] leading-[1.05] tracking-[-0.02em] text-[--ink-0]">{p.name}</h3>
                    <p className="font-serif italic text-[15px] leading-[1.5] text-[--ink-1]">{p.why}</p>
                    <div className="mt-auto pt-5 border-t border-[--line] space-y-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">{p.metric}</div>
                        <div className="flex items-baseline gap-2 font-mono tabular-nums">
                          <span className="text-[16px] text-[--ink-1]">{p.current}</span>
                          <span className="text-[--ink-3]">→</span>
                          <span className="text-[20px]" style={{ color: colorOf(p.intensity) }}>{p.target}</span>
                        </div>
                      </div>
                      <div className="h-[3px] bg-[--line] overflow-hidden rounded-[1px]">
                        <div className="h-full transition-[width] duration-700 ease-out" style={{ width: `${p.pct}%`, background: colorOf(p.intensity) }} />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* §03 Trade-offs */}
            <section className="space-y-8">
              <SectionHeader number="03" title="Trade-offs" right={`${TRADEOFFS.length} forks · with reasoning`} />
              <div className="border border-[--line] rounded-[--radius] overflow-hidden divide-y divide-[--line]">
                {TRADEOFFS.map((t, i) => {
                  const aPicked = t.pick === "A";
                  return (
                    <article key={i} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_2fr] gap-5 md:gap-7 px-7 py-6 items-center hover:bg-[--surface-1] transition-colors">
                      <div className={cn("space-y-1", aPicked ? "" : "opacity-40 line-through decoration-[--line-strong]")}>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">option a</div>
                        <div className={cn("font-serif text-[20px] tracking-[-0.015em]", aPicked ? "text-[--ink-0]" : "text-[--ink-2]")}>{t.a}</div>
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--accent] hidden md:block text-center">vs</div>
                      <div className={cn("space-y-1", !aPicked ? "" : "opacity-40 line-through decoration-[--line-strong]")}>
                        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">option b</div>
                        <div className={cn("font-serif text-[20px] tracking-[-0.015em]", !aPicked ? "text-[--ink-0]" : "text-[--ink-2]")}>{t.b}</div>
                      </div>
                      <p className="font-serif italic text-[14px] leading-[1.55] text-[--ink-1]">
                        <span className="text-[--accent]">→ </span>
                        {t.reason}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* §04 Roadmap */}
            <section className="space-y-8">
              <SectionHeader number="04" title="Roadmap" right={`${ROADMAP.length} quarters · 12 mo`} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[--line] border border-[--line] rounded-[--radius] overflow-hidden">
                {ROADMAP.map((r, i) => (
                  <article key={r.q} className={cn("p-7 md:p-8 flex flex-col gap-5 hover:bg-[--surface-1] transition-colors", i === 0 ? "bg-[--surface-1]" : "bg-[--bg]")}>
                    <div className="flex items-baseline justify-between">
                      <div className="font-mono text-[clamp(40px,4vw,56px)] leading-none tabular-nums tracking-[-0.04em] text-[--ink-0]">{r.q}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2] text-right">{r.month}</div>
                    </div>
                    <p className="font-serif text-[18px] leading-[1.3] tracking-[-0.01em] text-[--ink-0]">{r.goal}</p>
                    <div className="mt-auto pt-5 border-t border-[--line] space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--accent]">proof of progress</div>
                      <p className="font-mono text-[12px] tabular-nums text-[--ink-1] leading-[1.5]">{r.proof}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* §05 Anti-goals */}
            <section className="space-y-8">
              <SectionHeader number="05" title="Anti-goals" right={`${ANTI_GOALS.length} things we won't do`} />
              <div className="border border-[--line] rounded-[--radius] overflow-hidden divide-y divide-[--line]">
                {ANTI_GOALS.map((a) => (
                  <article key={a.id} className="grid grid-cols-[60px_1fr_1.4fr] gap-6 px-7 py-6 items-baseline hover:bg-[--surface-1] transition-colors">
                    <div className="font-mono text-[12px] tabular-nums text-[--no-go]">{a.id}</div>
                    <div className="font-serif text-[20px] leading-[1.2] tracking-[-0.015em] text-[--ink-0] line-through decoration-[--no-go]/40">{a.never}</div>
                    <p className="font-serif italic text-[14px] leading-[1.5] text-[--ink-1]">
                      <span className="text-[--no-go]">✕ </span>
                      {a.why}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            {/* Signature */}
            <div className="pt-10 border-t border-[--line] flex flex-wrap items-baseline justify-between gap-4">
              <div className="space-y-1">
                <p className="font-serif italic text-[18px] text-[--ink-0]">— Linden operating doctrine</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                  v1 · 03 MAY 2026 · case №017 · {PRINCIPLES.length} principles · {PILLARS.length} pillars · {ROADMAP.length} quarters
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/results">
                  <Button variant="ghost" size="sm">← Back to verdict</Button>
                </Link>
                <Button size="sm">Export memo<Download className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionHeader({ number, title, right }: { number: string; title: string; right?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 pb-4 border-b border-[--line]">
      <div className="flex items-baseline gap-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--ink-2]">§{number}</span>
        <h2 className="font-serif text-[clamp(28px,3vw,40px)] tracking-[-0.02em] text-[--ink-0]">{title}</h2>
      </div>
      {right && (
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">{right}</div>
      )}
    </div>
  );
}
