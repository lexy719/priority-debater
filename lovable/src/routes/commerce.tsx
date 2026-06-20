import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/commerce")({
  head: () => ({
    meta: [
      { title: "AI Commerce Audit — Priority Debater" },
      {
        name: "description",
        content:
          "Ship-ready audit of your store's AI visibility, agent readiness, and commerce optimization across ChatGPT, Claude, and Gemini.",
      },
      { property: "og:title", content: "AI Commerce Audit — Priority Debater" },
      {
        property: "og:description",
        content:
          "Eight modules that score, monitor, and fix your store for agentic commerce.",
      },
    ],
  }),
  component: CommercePage,
});

/* ---------- shared atoms ---------- */

function Tag({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "red" | "blue" | "green" | "amber";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground border-border",
    red: "bg-[color:var(--signal-red)]/15 text-[color:var(--signal-red)] border-[color:var(--signal-red)]/40",
    blue: "bg-[color:var(--signal-blue)]/15 text-[color:var(--signal-blue)] border-[color:var(--signal-blue)]/40",
    green:
      "bg-[color:var(--signal-green)]/15 text-[color:var(--signal-green)] border-[color:var(--signal-green)]/40",
    amber:
      "bg-[color:var(--signal-amber)]/15 text-[color:var(--signal-amber)] border-[color:var(--signal-amber)]/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${map[tone]}`}
    >
      {children}
    </span>
  );
}

function Panel({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-border bg-card ${className}`}>
      {label ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono opacity-50">//</span>
        </div>
      ) : null}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function PaperPanel({
  label,
  index,
  title,
  children,
}: {
  label: string;
  index: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-y border-border bg-[color:var(--paper)] text-[color:var(--paper-foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
          <span>— {label}</span>
          <span>{index}</span>
        </div>
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl">{title}</h2>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

/* ---------- ticker ---------- */

function Ticker({
  items,
  tone = "neutral",
}: {
  items: string[];
  tone?: "neutral" | "red" | "blue";
}) {
  const palette =
    tone === "red"
      ? "bg-[color:var(--signal-red)] text-primary-foreground"
      : tone === "blue"
        ? "bg-[color:var(--signal-blue)] text-primary-foreground"
        : "bg-card text-muted-foreground border-y border-border";
  const doubled = [...items, ...items];
  return (
    <div className={`overflow-hidden ${palette}`}>
      <div className="ticker-mask flex">
        <div className="flex shrink-0 animate-ticker whitespace-nowrap">
          {doubled.map((t, i) => (
            <span
              key={i}
              className="px-6 py-2 text-[11px] uppercase tracking-[0.25em]"
            >
              {t}
              <span className="ml-6 opacity-50">//</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- score atoms ---------- */

function ScoreBar({
  label,
  value,
  prev,
  tone = "blue",
}: {
  label: string;
  value: number;
  prev?: number;
  tone?: "red" | "blue" | "green" | "amber";
}) {
  const color =
    tone === "red"
      ? "var(--signal-red)"
      : tone === "green"
        ? "var(--signal-green)"
        : tone === "amber"
          ? "var(--signal-amber)"
          : "var(--signal-blue)";
  const delta = prev !== undefined ? value - prev : undefined;
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">
          {value}
          <span className="text-muted-foreground">/100</span>
          {delta !== undefined && (
            <span
              className={`ml-2 text-[10px] ${
                delta >= 0
                  ? "text-[color:var(--signal-green)]"
                  : "text-[color:var(--signal-red)]"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full bg-muted">
        <div
          className="h-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ---------- page ---------- */

function CommercePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopNav />
      <Hero />
      <Ticker
        tone="red"
        items={[
          "AI VISIBILITY 47/100",
          "AGENT READINESS LOW",
          "GEO SCORE 52",
          "CHATGPT MENTIONS 12%",
          "COMPETITOR A 46%",
          "FAQ SCHEMA MISSING",
          "LLMS.TXT NOT FOUND",
          "MERCHANT FEED STALE",
        ]}
      />

      <Module1 />
      <Module2 />
      <Module3 />
      <Module4 />
      <Module5 />
      <Module6 />
      <Module7 />
      <Module8 />
      <Roadmap />

      <Footer />
    </main>
  );
}

/* ---------- nav + hero ---------- */

function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em]">
          <span className="inline-flex h-7 w-7 items-center justify-center bg-[color:var(--signal-red)] font-display text-base text-primary-foreground">
            PD
          </span>
          <span className="text-foreground">Priority Debater</span>
          <span className="text-muted-foreground hidden sm:inline">
            /// AI Commerce
          </span>
        </div>
        <nav className="hidden items-center gap-5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground">
            Validate
          </Link>
          <span className="text-foreground">Commerce</span>
          <a href="#audit" className="hover:text-foreground">
            Audit
          </a>
          <a href="#simulation" className="hover:text-foreground">
            Simulation
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden sm:inline-flex border border-border px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
            ↓ Report
          </button>
          <button className="inline-flex items-center gap-2 bg-[color:var(--signal-red)] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-primary-foreground">
            + Run audit
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              <span className="bg-[color:var(--signal-red)] px-1.5 py-0.5 text-primary-foreground">
                ● Audit ready
              </span>
              <span>02 / commerce / agentic visibility report</span>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl md:text-8xl">
              <span className="block">YOUR STORE IS</span>
              <span className="block">
                <span className="highlight-red">INVISIBLE</span> TO AI.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Eight modules. One agent-grade report. We score how ChatGPT, Claude,
              and Gemini see your catalog, simulate how buyer-agents shop it, and
              ship the fixes that close the gap with the competitor they keep
              recommending instead of you.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center border border-border bg-card">
                <span className="px-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  URL
                </span>
                <input
                  defaultValue="https://your-store.com"
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button className="inline-flex items-center justify-center gap-2 bg-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-primary-foreground">
                Run AI audit →
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6 text-[11px] uppercase tracking-[0.2em]">
              <div>
                <div className="text-muted-foreground">Verdict</div>
                <div className="mt-1 text-[color:var(--signal-amber)]">
                  ▲ Fix before scaling
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Confidence</div>
                <div className="mt-1 text-foreground">HIGH</div>
              </div>
              <div>
                <div className="text-muted-foreground">Rank</div>
                <div className="mt-1 text-foreground">BOTTOM 38%</div>
              </div>
            </div>
          </div>

          {/* score card */}
          <Panel label="Overall AI commerce score">
            <div className="flex items-baseline gap-4">
              <div className="font-display text-7xl text-[color:var(--signal-blue)] sm:text-8xl">
                47
              </div>
              <div className="text-sm text-muted-foreground">/ 100</div>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              −9 vs category median (56)
            </div>

            <div className="mt-8 space-y-4">
              <ScoreBar label="AI Recommendation" value={42} tone="red" />
              <ScoreBar label="GEO" value={52} tone="amber" />
              <ScoreBar label="Agent Readiness" value={48} tone="amber" />
              <ScoreBar label="Schema Coverage" value={61} tone="blue" />
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {["Crawl", "Index", "Mention", "Convert"].map((s, i) => (
                <div
                  key={s}
                  className={`border border-border py-2 ${
                    i < 2 ? "bg-[color:var(--signal-blue)]/15" : ""
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------- MODULE 1 — Audit ---------- */

function Module1() {
  return (
    <PaperPanel
      label="Module 01 / AI Visibility Audit"
      index="01 / 08"
      title={
        <>
          HOW THE MODELS{" "}
          <span className="highlight-red">SEE YOUR STORE.</span>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            label: "AI Recommendation",
            value: 42,
            tone: "red" as const,
            sub: "Models recommend competitors 3× more often.",
          },
          {
            label: "GEO Score",
            value: 52,
            tone: "amber" as const,
            sub: "Generative-engine optimization — partial coverage.",
          },
          {
            label: "Agent Readiness",
            value: 48,
            tone: "amber" as const,
            sub: "Catalog is browsable, not buyable by agents.",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-6"
          >
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
              {s.label}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-6xl text-[color:var(--paper-foreground)]">
                {s.value}
              </span>
              <span className="text-sm text-[color:var(--paper-foreground)]/60">
                /100
              </span>
            </div>
            <div className="mt-4 h-1 w-full bg-[color:var(--paper-foreground)]/10">
              <div
                className="h-full"
                style={{
                  width: `${s.value}%`,
                  backgroundColor:
                    s.tone === "red"
                      ? "var(--signal-red)"
                      : "var(--signal-amber)",
                }}
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-[color:var(--paper-foreground)]/70">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-[color:var(--paper-foreground)]/15 bg-white/60">
        <div className="flex items-center justify-between border-b border-[color:var(--paper-foreground)]/15 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
          <span>Competitor analysis</span>
          <span>5 named competitors</span>
        </div>
        <div className="divide-y divide-[color:var(--paper-foreground)]/10 text-sm">
          {[
            { name: "Caffè Nord", score: 78, why: "Buying guides + rich schema" },
            { name: "GrindLab", score: 71, why: "1.2k reviews + comparison tables" },
            { name: "EspressoHQ", score: 66, why: "FAQ + spec sheets" },
            { name: "You", score: 47, why: "Sparse metadata, no buying guide", you: true },
            { name: "BeanWorks", score: 39, why: "Thin product pages" },
          ].map((c) => (
            <div
              key={c.name}
              className={`grid grid-cols-[1fr_auto_2fr_auto] items-center gap-4 px-5 py-3 ${
                c.you ? "bg-[color:var(--signal-red)]/10" : ""
              }`}
            >
              <div className="font-medium">{c.name}</div>
              <div className="font-display text-2xl">{c.score}</div>
              <div className="text-xs text-[color:var(--paper-foreground)]/70">
                {c.why}
              </div>
              <div className="h-1 w-24 bg-[color:var(--paper-foreground)]/10">
                <div
                  className="h-full bg-[color:var(--signal-blue)]"
                  style={{ width: `${c.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PaperPanel>
  );
}

/* ---------- MODULE 2 — Monitor ---------- */

function Module2() {
  const months = [
    { m: "Jan", v: 41 },
    { m: "Feb", v: 44 },
    { m: "Mar", v: 49 },
    { m: "Apr", v: 54 },
    { m: "May", v: 58 },
    { m: "Jun", v: 67 },
  ];
  const max = 80;
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>— Module 02 / AI Visibility Monitor</span>
          <span>02 / 08</span>
        </div>
        <h2 className="font-display text-4xl text-foreground sm:text-6xl md:text-7xl">
          TRACK THE NUMBER{" "}
          <span className="highlight-red">EVERY MONTH.</span>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Panel label="Visibility trend">
            <div className="flex items-baseline gap-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                This month
              </div>
              <div className="font-display text-6xl text-[color:var(--signal-blue)]">
                67
              </div>
              <div className="text-[color:var(--signal-green)] text-sm">+13</div>
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Last month: 54 / six-month baseline: 49
            </div>

            <div className="mt-6 flex h-40 items-end gap-3">
              {months.map((m, i) => (
                <div key={m.m} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full"
                    style={{
                      height: `${(m.v / max) * 100}%`,
                      backgroundColor:
                        i === months.length - 1
                          ? "var(--signal-red)"
                          : "var(--signal-blue)",
                      opacity: i === months.length - 1 ? 1 : 0.55,
                    }}
                  />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {m.m}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel label="Per-model visibility">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {[
                { name: "ChatGPT", cur: 71, prev: 58 },
                { name: "Claude", cur: 64, prev: 51 },
                { name: "Gemini", cur: 66, prev: 53 },
              ].map((p) => (
                <div key={p.name} className="border border-border p-4">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {p.name}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="font-display text-4xl">{p.cur}</div>
                    <div className="text-[color:var(--signal-green)] text-xs">
                      +{p.cur - p.prev}
                    </div>
                  </div>
                  <ScoreBar label="vs last month" value={p.cur} prev={p.prev} />
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-border pt-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Competitor movement (30d)
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {[
                  { n: "GrindLab", d: +6, tone: "red" },
                  { n: "Caffè Nord", d: +2, tone: "amber" },
                  { n: "EspressoHQ", d: -3, tone: "green" },
                ].map((c) => (
                  <div
                    key={c.n}
                    className="flex items-center justify-between border-l-2 border-border pl-3"
                  >
                    <span className="text-muted-foreground">{c.n}</span>
                    <span
                      className={
                        c.d > 0
                          ? "text-[color:var(--signal-red)]"
                          : "text-[color:var(--signal-green)]"
                      }
                    >
                      {c.d > 0 ? "▲" : "▼"} {Math.abs(c.d)} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------- MODULE 3 — Content Optimizer ---------- */

function Module3() {
  const items = [
    { t: "Generate FAQ", sub: "20 questions from real buyer intent", tone: "red" },
    { t: "Generate Comparison Page", sub: "You vs top 3 competitors", tone: "blue" },
    { t: "Generate Buying Guide", sub: "Long-form, model-friendly", tone: "amber" },
    { t: "Generate Product Schema", sub: "JSON-LD per SKU", tone: "green" },
    { t: "Generate Collection Page", sub: "Hub for category intent", tone: "blue" },
    { t: "Generate Spec Sheet", sub: "Structured product attributes", tone: "red" },
  ] as const;
  return (
    <PaperPanel
      label="Module 03 / AI Content Optimizer"
      index="03 / 08"
      title={
        <>
          ONE CLICK.{" "}
          <span className="highlight-red">REAL CONTENT.</span>
        </>
      }
    >
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-[color:var(--paper-foreground)]/70">
        Stop reading "your FAQ is weak." Start shipping FAQs, buying guides, and
        comparison pages the panel actually wants to cite.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <button
            key={i.t}
            className="group flex flex-col items-start gap-3 border border-[color:var(--paper-foreground)]/15 bg-white/60 p-5 text-left transition hover:bg-white"
          >
            <Tag tone={i.tone as any}>AI Generate</Tag>
            <div className="font-display text-2xl text-[color:var(--paper-foreground)]">
              {i.t}
            </div>
            <div className="text-xs text-[color:var(--paper-foreground)]/70">
              {i.sub}
            </div>
            <div className="mt-auto pt-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--signal-red)]">
              ⚡ Run →
            </div>
          </button>
        ))}
      </div>
    </PaperPanel>
  );
}

/* ---------- MODULE 4 — Shopping Feed ---------- */

function Module4() {
  const json = `{
  "product": "Niche Zero — Single Dose Grinder",
  "sku": "NZ-001",
  "price": { "amount": 599, "currency": "EUR" },
  "availability": "in_stock",
  "use_cases": [
    "espresso at home",
    "single-dose workflow",
    "cafe-quality grind"
  ],
  "buyer_personas": ["enthusiast", "barista"],
  "agent_actions": ["add_to_cart", "compare", "reserve"]
}`;
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>— Module 04 / AI Shopping Feed</span>
          <span>04 / 08</span>
        </div>
        <h2 className="font-display text-4xl text-foreground sm:text-6xl md:text-7xl">
          A CATALOG{" "}
          <span className="highlight-red">AGENTS CAN READ.</span>
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Panel label="Feed status">
            <div className="space-y-4">
              {[
                { l: "Shopify products scanned", v: "1,284", t: "blue" as const },
                { l: "Schema coverage", v: "61%", t: "amber" as const },
                { l: "Agent-ready SKUs", v: "742 / 1,284", t: "red" as const },
                { l: "Feed format", v: "JSON-LD + LLMS.txt", t: "green" as const },
              ].map((r) => (
                <div
                  key={r.l}
                  className="flex items-center justify-between border-b border-border pb-3 text-sm"
                >
                  <div className="text-muted-foreground text-xs uppercase tracking-[0.18em]">
                    {r.l}
                  </div>
                  <Tag tone={r.t}>{r.v}</Tag>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full bg-[color:var(--signal-red)] px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-primary-foreground">
              Regenerate AI feed
            </button>
          </Panel>

          <Panel label="Generated example">
            <pre className="overflow-auto bg-background/60 p-4 text-[12px] leading-relaxed text-[color:var(--signal-blue)]">
              <code>{json}</code>
            </pre>
            <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Emitted at /feed.json + /llms.txt
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------- MODULE 5 — Competitor Intelligence ---------- */

function Module5() {
  const mentions = [
    { n: "Competitor A — Caffè Nord", v: 46, tone: "red" as const },
    { n: "Competitor B — GrindLab", v: 28, tone: "amber" as const },
    { n: "Competitor C — EspressoHQ", v: 14, tone: "blue" as const },
    { n: "Your Store", v: 12, tone: "green" as const, you: true },
  ];
  const reasons = [
    { r: "More reviews indexed", weight: "high" },
    { r: "Better product schema", weight: "high" },
    { r: "Comparison + buying guides", weight: "med" },
    { r: "Cited by 4 industry blogs", weight: "med" },
    { r: "Faster shipping signal", weight: "low" },
  ];
  return (
    <PaperPanel
      label="Module 05 / AI Competitor Intelligence"
      index="05 / 08"
      title={
        <>
          WHY THE MODELS{" "}
          <span className="highlight-red">PREFER THEM.</span>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
            ChatGPT mention share (last 30d)
          </div>
          <div className="mt-5 space-y-4">
            {mentions.map((m) => (
              <div key={m.n}>
                <div className="flex items-baseline justify-between text-sm">
                  <span
                    className={
                      m.you
                        ? "font-medium text-[color:var(--signal-red)]"
                        : "text-[color:var(--paper-foreground)]"
                    }
                  >
                    {m.n}
                  </span>
                  <span className="font-display text-2xl">{m.v}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-[color:var(--paper-foreground)]/10">
                  <div
                    className="h-full"
                    style={{
                      width: `${m.v}%`,
                      backgroundColor:
                        m.tone === "red"
                          ? "var(--signal-red)"
                          : m.tone === "amber"
                            ? "var(--signal-amber)"
                            : m.tone === "blue"
                              ? "var(--signal-blue)"
                              : "var(--signal-green)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
            Why competitors win
          </div>
          <ul className="mt-5 divide-y divide-[color:var(--paper-foreground)]/10 text-sm">
            {reasons.map((r) => (
              <li key={r.r} className="flex items-center justify-between py-3">
                <span>{r.r}</span>
                <Tag
                  tone={
                    r.weight === "high"
                      ? "red"
                      : r.weight === "med"
                        ? "amber"
                        : "neutral"
                  }
                >
                  {r.weight}
                </Tag>
              </li>
            ))}
          </ul>
          <button className="mt-6 w-full border border-[color:var(--paper-foreground)]/30 px-4 py-3 text-[11px] uppercase tracking-[0.22em] hover:bg-[color:var(--paper-foreground)] hover:text-[color:var(--paper)]">
            Generate counter-content plan →
          </button>
        </div>
      </div>
    </PaperPanel>
  );
}

/* ---------- MODULE 6 — Buyer Simulation ---------- */

const PERSONAS = [
  {
    id: "budget",
    name: "Budget Shopper",
    emoji: "🪙",
    blurb: "Cheapest acceptable. Hates fluff.",
    prompt: "Find me a decent espresso grinder under €150.",
    winner: "Competitor B",
    reason: "Listed price band + clear specs. You buried price under variants.",
    you: 22,
  },
  {
    id: "premium",
    name: "Premium Shopper",
    emoji: "💎",
    blurb: "Quality first. Brand-aware.",
    prompt: "What's the best single-dose grinder under €700?",
    winner: "Your Store",
    reason: "Strong buying guide + tasting notes that the model could cite.",
    you: 71,
  },
  {
    id: "gift",
    name: "Gift Buyer",
    emoji: "🎁",
    blurb: "Buying for someone else. Needs reassurance.",
    prompt: "A nice espresso starter gift for my partner under €250.",
    winner: "Competitor A",
    reason: "Gift bundles + return policy structured for agents.",
    you: 34,
  },
  {
    id: "researcher",
    name: "Researcher",
    emoji: "🧪",
    blurb: "Specs, charts, evidence.",
    prompt: "Compare burr geometry and retention across top grinders.",
    winner: "Your Store",
    reason: "Spec tables + JSON-LD reviewed by the panel.",
    you: 64,
  },
  {
    id: "impulse",
    name: "Impulse Buyer",
    emoji: "⚡",
    blurb: "Sees, wants, clicks.",
    prompt: "What's a sexy grinder I can buy right now?",
    winner: "Competitor A",
    reason: "Hero imagery + 1-line story. Your PDP starts with shipping.",
    you: 19,
  },
] as const;

function Module6() {
  const [activeId, setActiveId] = useState<(typeof PERSONAS)[number]["id"]>(
    "premium",
  );
  const active = PERSONAS.find((p) => p.id === activeId)!;
  const youWins = active.winner === "Your Store";
  return (
    <section
      id="simulation"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>— Module 06 / Buyer Agent Simulation</span>
          <span>06 / 08</span>
        </div>
        <h2 className="font-display text-4xl text-foreground sm:text-6xl md:text-7xl">
          FIVE BUYER AGENTS.{" "}
          <span className="highlight-red">ONE QUESTION.</span>{" "}
          WHO GETS RECOMMENDED?
        </h2>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          We replay realistic buyer prompts through ChatGPT, Claude, and Gemini
          and capture which store each agent recommends — and exactly why yours
          did or didn't make the shortlist.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* persona list */}
          <div className="space-y-2">
            {PERSONAS.map((p) => {
              const isActive = p.id === activeId;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={`flex w-full items-center gap-3 border px-3 py-3 text-left text-sm transition ${
                    isActive
                      ? "border-[color:var(--signal-red)] bg-[color:var(--signal-red)]/10"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  }`}
                >
                  <span className="text-xl">{p.emoji}</span>
                  <span className="flex-1">
                    <span className="block text-foreground">{p.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {p.blurb}
                    </span>
                  </span>
                  {isActive && (
                    <span className="text-[color:var(--signal-red)]">●</span>
                  )}
                </button>
              );
            })}
          </div>

          <Panel label={`Simulation: ${active.name}`}>
            <div className="border-l-2 border-[color:var(--signal-blue)] pl-4 text-sm italic text-muted-foreground">
              "{active.prompt}"
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                className={`border p-4 ${
                  youWins
                    ? "border-[color:var(--signal-green)] bg-[color:var(--signal-green)]/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Recommended store
                </div>
                <div className="mt-2 font-display text-4xl text-foreground">
                  {active.winner}
                </div>
                <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {active.reason}
                </div>
              </div>
              <div className="border border-border bg-card p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Your relevance score
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className="font-display text-5xl"
                    style={{
                      color: youWins
                        ? "var(--signal-green)"
                        : "var(--signal-red)",
                    }}
                  >
                    {active.you}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <ScoreBar
                  label="vs winning store"
                  value={active.you}
                  tone={youWins ? "green" : "red"}
                />
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Agent transcript
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ["ChatGPT", `Recommends ${active.winner} — clearer signal.`],
                ["Claude", `Concurs. Cites ${youWins ? "your guide" : "competitor reviews"}.`],
                ["Gemini", youWins ? "Cites your spec sheet." : "Has no opinion on your store."],
              ].map(([who, line]) => (
                <div
                  key={who}
                  className="grid grid-cols-[80px_1fr] gap-3 border-l border-border pl-3"
                >
                  <span className="text-[color:var(--signal-blue)]">{who}</span>
                  <span className="text-muted-foreground">{line}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

/* ---------- Roadmap ---------- */

function Roadmap() {
  const columns = [
    {
      when: "Now",
      tone: "red" as const,
      blurb: "Win the recommendation layer. This is where the money is.",
      items: [
        "AI Visibility Audit",
        "Competitor Intelligence",
        "AI Recommendation Score",
        "Buyer Agent Simulation",
        "GEO Optimization",
      ],
    },
    {
      when: "Later",
      tone: "amber" as const,
      blurb: "Make your catalog buyable by agents, not just findable.",
      items: ["AI Commerce Readiness", "Merchant Feeds", "Agent Catalogs"],
    },
    {
      when: "Much Later",
      tone: "blue" as const,
      blurb: "Once agents own the funnel end-to-end.",
      items: ["Autonomous Checkout", "Agent Payments"],
    },
  ];
  const toneColor = (t: "red" | "amber" | "blue") =>
    t === "red"
      ? "var(--signal-red)"
      : t === "amber"
        ? "var(--signal-amber)"
        : "var(--signal-blue)";
  return (
    <section id="roadmap" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>— Roadmap / Where the money is</span>
          <span>R / 03</span>
        </div>
        <h2 className="font-display text-4xl text-foreground sm:text-6xl md:text-7xl">
          WIN THE{" "}
          <span className="highlight-red">RECOMMENDATION LAYER</span>{" "}
          FIRST.
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Agentic checkout is loud. Agentic discovery is where small businesses
          actually lose sales today — because models recommend someone else.
          We sequence the work accordingly.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {columns.map((col) => (
            <div
              key={col.when}
              className="flex flex-col border border-border bg-card"
              style={{ borderTop: `3px solid ${toneColor(col.tone)}` }}
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span style={{ color: toneColor(col.tone) }}>● {col.when}</span>
                <span className="font-mono opacity-50">//</span>
              </div>
              <div className="p-5">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {col.blurb}
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {col.items.map((it, i) => (
                    <li
                      key={it}
                      className="flex items-center gap-3 border-b border-border/60 pb-2 last:border-0"
                    >
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: toneColor(col.tone) }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-foreground">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-border bg-card px-5 py-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-[color:var(--signal-red)]">Thesis ▸</span>{" "}
          The money is in helping small businesses win the recommendation
          layer — before anyone needs agentic checkout.
        </div>
      </div>
    </section>
  );
}

/* ---------- MODULE 7 — Commerce Readiness ---------- */

function Module7() {
  const checks = [
    { k: "llms.txt", s: "fail" },
    { k: "Product schema", s: "warn" },
    { k: "Merchant feed", s: "warn" },
    { k: "Reviews indexed", s: "pass" },
    { k: "FAQs structured", s: "fail" },
    { k: "Shipping policy", s: "pass" },
    { k: "Return policy", s: "warn" },
    { k: "Agent checkout", s: "fail" },
  ] as const;
  const pass = checks.filter((c) => c.s === "pass").length;
  const total = checks.length;
  const score = Math.round((pass / total) * 100);
  return (
    <PaperPanel
      label="Module 07 / AI Commerce Readiness"
      index="07 / 08"
      title={
        <>
          THE AGENT-CHECKOUT{" "}
          <span className="highlight-red">CHECKLIST.</span>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr]">
        <div className="border border-[color:var(--paper-foreground)]/15 bg-white/60 p-6 text-center">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-foreground)]/60">
            Readiness score
          </div>
          <div className="mt-4 font-display text-7xl text-[color:var(--signal-red)]">
            {score}
          </div>
          <div className="mt-1 text-sm text-[color:var(--paper-foreground)]/60">
            / 100
          </div>
          <div className="mt-6 text-xs text-[color:var(--paper-foreground)]/70">
            {pass} of {total} checks pass. Agents will skip checkout on{" "}
            {total - pass} surfaces.
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {checks.map((c) => {
            const tone =
              c.s === "pass" ? "green" : c.s === "warn" ? "amber" : "red";
            const symbol = c.s === "pass" ? "✓" : c.s === "warn" ? "~" : "✕";
            return (
              <li
                key={c.k}
                className="flex items-center justify-between border border-[color:var(--paper-foreground)]/15 bg-white/60 px-4 py-3 text-sm"
              >
                <span>{c.k}</span>
                <Tag tone={tone as any}>
                  {symbol} {c.s}
                </Tag>
              </li>
            );
          })}
        </ul>
      </div>
    </PaperPanel>
  );
}

/* ---------- MODULE 8 — Fix Everything ---------- */

function Module8() {
  const fixes = [
    {
      issue: "Missing FAQ schema",
      action: "Generate FAQ Schema",
      impact: "+8 GEO",
    },
    {
      issue: "Weak category page",
      action: "Generate Optimized Category Page",
      impact: "+5 AI Rec",
    },
    {
      issue: "No buying guide",
      action: "Generate Buying Guide",
      impact: "+11 Mentions",
    },
    {
      issue: "Catalog not agent-readable",
      action: "Regenerate Shopping Feed",
      impact: "+14 Agent",
    },
    {
      issue: "llms.txt not found",
      action: "Generate llms.txt",
      impact: "+6 Crawl",
    },
    {
      issue: "Thin comparison content",
      action: "Generate Comparison Page",
      impact: "+9 Mentions",
    },
  ];
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex items-end justify-between gap-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>— Module 08 / Fix Everything</span>
          <span>08 / 08</span>
        </div>
        <h2 className="font-display text-4xl text-foreground sm:text-6xl md:text-7xl">
          DON'T REPORT.{" "}
          <span className="highlight-red">SHIP THE FIX.</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Every finding ends in a button. The button writes the content,
          schema, or feed. You review, you publish, the score moves.
        </p>

        <div className="mt-10 overflow-hidden border border-border">
          <div className="grid grid-cols-[1.4fr_1.4fr_auto_auto] items-center gap-4 border-b border-border bg-card/60 px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <span>Issue</span>
            <span>Action</span>
            <span>Impact</span>
            <span className="text-right">Run</span>
          </div>
          {fixes.map((f) => (
            <div
              key={f.issue}
              className="grid grid-cols-[1.4fr_1.4fr_auto_auto] items-center gap-4 border-b border-border bg-card px-4 py-4 text-sm last:border-b-0"
            >
              <span className="text-foreground">{f.issue}</span>
              <span className="text-muted-foreground">→ {f.action}</span>
              <Tag tone="green">{f.impact}</Tag>
              <button className="justify-self-end bg-[color:var(--signal-red)] px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-primary-foreground">
                Generate ⚡
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- footer ---------- */

function Footer() {
  return (
    <>
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_auto]">
            <h2 className="font-display text-4xl text-foreground sm:text-5xl md:text-6xl">
              RE-RUN THE AUDIT WITH{" "}
              <span className="highlight-red">THE FIXES SHIPPED</span>
              <br />
              AND WATCH THE SCORE MOVE.
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="bg-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-primary-foreground">
                Book next audit →
              </button>
              <button className="border border-border px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </section>
      <Ticker
        items={[
          "AI VISIBILITY 67/100",
          "AGENT READINESS RISING",
          "GEO 71",
          "CHATGPT MENTIONS 24%",
          "8 MODULES SHIPPED",
          "PRIORITY DEBATER / COMMERCE",
        ]}
      />
      <footer className="bg-background py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:px-8">
          <span>Priority Debater /// AI Commerce v0.1</span>
          <Link to="/" className="hover:text-foreground">
            ← Back to validate
          </Link>
        </div>
      </footer>
    </>
  );
}
