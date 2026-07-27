import type { Metadata } from "next";
import Link from "next/link";
import ScanHero from "./scan-hero";

/**
 * PDR Commerce — landing (`/commerce`).
 * One question: "What happens after your business launches?"
 * Validation proves it · Studio builds it · Commerce runs it.
 * Swiss Editorial Ledger (docs/pdr-commerce-design.md v3): warm paper, 2px ink
 * rules, numbered sections, Anton figures, one LIVE blue for measured data.
 * Server-rendered, zero client JS.
 */

export const metadata: Metadata = {
  title: "PDR Commerce — The operating system for AI-native businesses",
  description:
    "Validation proves the business. Studio builds it. Commerce runs it — autonomous marketing, social, operations, finance and AI-agent commerce under one operating system. Every number measured.",
};

const PAPER = "#F5F3ED", INKB = "#111111", HAIRB = "#CFC9BC", DIMB = "#6B6659", FAINTB = "#9B968A";
const LIVE = "#0047FF", OKB = "#1F7A44", WARNB = "#B45309", INSETB = "#ECE8DE";
const MONO = "var(--app-font-mono), ui-monospace, monospace";
const MICRO: React.CSSProperties = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINTB };

function Sec({ n, title, right, children }: { n: string; title: string; right?: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <div style={{ height: 2, backgroundColor: INKB }} />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: LIVE, fontWeight: 700 }}>№{n}</span>
        <h2 className="text-balance font-display text-[clamp(1.4rem,3vw,2rem)] uppercase leading-[0.98]">{title}</h2>
        {right && <span className="ml-auto" style={MICRO}>{right}</span>}
      </div>
      {children}
    </section>
  );
}

export default function CommerceLanding() {
  return (
    <main style={{ backgroundColor: PAPER, color: INKB, fontFamily: "var(--app-font-sans), system-ui, sans-serif" }}>
      <div className="mx-auto max-w-[1040px] px-6 pb-24">
        {/* masthead */}
        <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2 py-5" style={{ borderBottom: `1px solid ${HAIRB}` }}>
          <Link href="/" className="font-display text-[1.2rem] uppercase leading-none no-underline" style={{ color: INKB }}>PDR</Link>
          <span className="text-[13px] font-semibold" style={{ color: LIVE }}>Commerce</span>
          <span style={MICRO}>THE OPERATING SYSTEM FOR AI-NATIVE BUSINESSES</span>
          <Link href="/commerce/visibility" className="ml-auto text-[12px] font-semibold no-underline" style={{ color: LIVE }}>Free AI-visibility audit</Link>
          <Link href="/commerce/command" className="px-4 py-2 text-[12px] font-semibold no-underline" style={{ backgroundColor: INKB, color: PAPER }}>OPEN THE OS →</Link>
        </header>

        {/* ── HERO ── */}
        <section className="pt-14">
          <div style={MICRO}>PRECISION DYNAMICS · VOLUME III</div>
          <h1 className="mt-4 max-w-[18ch] text-balance font-display text-[clamp(2.6rem,8vw,5.4rem)] uppercase leading-[0.9]">
            What happens after your business launches?
          </h1>
          <p className="mt-7 max-w-[54ch] text-pretty text-[16px] leading-[1.65]" style={{ color: DIMB }}>
            Validation proves the business. Studio builds it. <b style={{ color: INKB }}>Commerce runs it</b> — an
            operating system closer to an AI COO than a dashboard: it watches every measurable part of the company,
            explains what is happening, recommends improvements, executes approved work through specialised AI
            workers, and gets smarter from every outcome.
          </p>
          {/* The audit is the only thing here that works on someone who has
              never heard of PDR, so it gets the input rather than a button
              promising an input on the next page. */}
          <ScanHero />
          <div className="mt-5">
            <Link href="/commerce/command" className="inline-block px-6 py-3.5 text-[12.5px] font-semibold no-underline" style={{ border: `1px solid ${HAIRB}`, color: DIMB }}>Open the operating system ↗</Link>
          </div>
          <div className="mt-12 grid gap-y-6" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", borderTop: `1px solid ${HAIRB}`, borderBottom: `1px solid ${HAIRB}`, paddingTop: 18, paddingBottom: 18 }}>
            {[["VALIDATION", "CONFIDENCE", DIMB], ["STUDIO", "ASSETS", DIMB], ["COMMERCE", "RESULTS", LIVE]].map(([a, b, c]) => (
              <div key={a}>
                <div style={MICRO}>{a}</div>
                <div className="mt-1 font-display text-[clamp(1.5rem,3vw,2.1rem)] uppercase leading-none" style={{ color: c as string }}>{b}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 01 LOOP ── */}
        <Sec n="01" title="The autonomous operating loop" right="OBSERVE → ANALYSE → DECIDE → EXECUTE → LEARN">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
            {[
              ["OBSERVE", "Revenue, orders, stock, customers, and every AI-agent read of your storefront.", OKB],
              ["ANALYSE", "A situational read that cites its numbers and refuses to conclude from thin data.", LIVE],
              ["DECIDE", "Workers propose; nothing ships without your review or a limit you set.", WARNB],
              ["EXECUTE", "One click — or an automation you armed, inside bounds you defined.", LIVE],
              ["LEARN", "Outcomes become rules in the Business Brain. The company remembers.", OKB],
            ].map(([t, d, c], i) => (
              <div key={t} className="py-4 pr-6" style={{ borderTop: i > 0 ? "none" : "none", borderLeft: i === 0 ? "none" : `1px solid ${HAIRB}`, paddingLeft: i === 0 ? 0 : 18 }}>
                <div className="text-[12.5px] font-bold uppercase tracking-[0.06em]" style={{ color: c as string }}>{t}</div>
                <p className="mt-2 text-pretty text-[12.5px] leading-[1.6]" style={{ color: DIMB }}>{d}</p>
              </div>
            ))}
          </div>
        </Sec>

        {/* ── 02 CAPABILITIES ── */}
        <Sec n="02" title="What Commerce does" right="ONE SYSTEM · NOT A STACK OF TOOLS">
          <div className="grid gap-x-10" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
            {[
              ["Autonomous marketing", "Measures performance across every connected channel and drafts campaigns, creatives, landing pages, videos and advertisements grounded in business knowledge and measured results — approved manually or executed automatically within predefined limits."],
              ["Social presence", "Continuous content generation, short-form video specs and a maintained posting cadence — the same brand brain governing every word."],
              ["Operations & inventory", "Orders through their full lifecycle; stock that decrements with every sale and flips availability so agents and humans are never misled; replenishment on your approval or a rule you armed."],
              ["Financial intelligence", "Revenue, COGS, margin per product, inventory value, recurring versus one-off, average order value. Unit costs are yours to enter — Commerce will never estimate them."],
              ["Website management", "Commerce operates the storefront: pricing, availability, policies, products and content. Every change appears instantly in the live pages, structured data and product feed."],
              ["AI commerce", "The agent funnel — crawls, product retrievals, feed pulls, agent orders — plus a readiness score and per-product visibility. The instrument nobody else has."],
            ].map(([t, d]) => (
              <div key={t} className="py-5" style={{ borderTop: `1px solid ${HAIRB}` }}>
                <h3 className="text-[14.5px] font-semibold">{t}</h3>
                <p className="mt-2 text-pretty text-[13px] leading-[1.65]" style={{ color: DIMB }}>{d}</p>
              </div>
            ))}
          </div>
        </Sec>

        {/* ── 03 WORKFORCE ── */}
        <Sec n="03" title="An AI workforce, not a dashboard" right="YOU SUPERVISE · THEY OPERATE">
          <div className="grid gap-x-10" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
            {[
              ["MARKETING", "Campaigns, creatives, copy, audience learning", LIVE, true],
              ["OPERATIONS", "Orders, inventory, fulfilment, store health", OKB, true],
              ["FINANCE", "Margin, COGS, inventory value, pricing signals", INKB, true],
              ["SALES · SUPPORT · ADVERTISING · ANALYTICS · MERCHANDISING · LOGISTICS", "Designed for — each plugs into the same intelligence and the same review discipline", FAINTB, false],
            ].map(([t, d, c, active]) => (
              <div key={t as string} className="py-4" style={{ borderTop: `1px solid ${HAIRB}` }}>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-[2px]" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", fontWeight: 700, border: `1px solid ${c as string}`, color: active ? PAPER : (c as string), backgroundColor: active ? (c as string) : "transparent" }}>
                    {active ? "ACTIVE" : "PLANNED"}
                  </span>
                  <span className="text-[12.5px] font-bold uppercase tracking-[0.04em]" style={{ color: active ? INKB : FAINTB }}>{t}</span>
                </div>
                <p className="mt-2 text-pretty text-[12.5px] leading-[1.6]" style={{ color: DIMB }}>{d}</p>
              </div>
            ))}
          </div>
        </Sec>

        {/* ── 04 TELEMETRY ── */}
        <Sec n="04" title="A real day in the ledger" right="EVENTS FROM AN OPERATED BUSINESS">
          <div style={{ backgroundColor: INSETB }}>
            {[
              ["09:14", "MARKETING", "Draft written through 13 brain rules — sells Stoneware Dinner Plate Set at €96", LIVE],
              ["09:42", "OPERATIONS", "Order ORD-63303324 → SHIPPED · Alpha Plan ×3 · stock 21", OKB],
              ["10:01", "OPERATIONS", "AUT-01 auto-restocked 2 low SKUs +12 each · availability reopened", OKB],
              ["10:33", "AGENT", "PerplexityBot read the product feed · GPTBot placed an order, €25", LIVE],
              ["11:05", "FINANCE", "Margin recomputed on new unit costs — gross 59% on €75 revenue", INKB],
              ["11:20", "SYSTEM", "Situational analysis: posture GROW — agent conversion improving", DIMB],
            ].map(([t, w, d, c]) => (
              <div key={t as string} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5" style={{ borderBottom: `1px solid ${HAIRB}` }}>
                <span className="tabular-nums" style={{ fontFamily: MONO, fontSize: 11, color: FAINTB }}>{t}</span>
                <span className="px-1.5 py-[2px]" style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.12em", fontWeight: 700, border: `1px solid ${c as string}`, color: c as string }}>{w}</span>
                <span className="min-w-0 text-pretty text-[12.5px]" style={{ color: DIMB }}>{d}</span>
              </div>
            ))}
          </div>
          <div className="mt-3" style={MICRO}>EVERY NUMBER ON A COMMERCE SURFACE IS MEASURED · NOTHING IS SIMULATED</div>
        </Sec>

        {/* ── 05 AI COMMERCE ── */}
        <Sec n="05" title="Your next customer might not be human" right="BUT HUMANS STILL MATTER">
          <div className="grid gap-x-12" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}>
            <div className="py-5" style={{ borderTop: `1px solid ${HAIRB}` }}>
              <p className="max-w-[46ch] text-pretty text-[13.5px] leading-[1.7]" style={{ color: DIMB }}>
                AI assistants already discover products, compare specifications, read policies and place orders.
                Commerce measures that entire funnel per agent and per product — and keeps the storefront legible
                to them. It serves both surfaces: structured information that AI systems and humans can both
                understand, rather than search-engine tricks or vanity metrics.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["GPTBot", "ClaudeBot", "PerplexityBot", "Gemini", "Google-Extended", "Human visitors"].map((a) => (
                  <span key={a} className="px-2 py-1" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", border: `1px solid ${HAIRB}`, color: a === "Human visitors" ? DIMB : LIVE }}>{a}</span>
                ))}
              </div>
            </div>
            <div className="py-5" style={{ borderTop: `1px solid ${HAIRB}` }}>
              <div style={MICRO}>READINESS · CHECKED CONTINUOUSLY</div>
              <div className="mt-3 flex flex-col gap-2 text-[12.5px]" style={{ color: DIMB }}>
                {["Server-rendered pages with complete structured data", "Merchant-grade product feed", "llms.txt and machine-readable catalog", "robots that welcome AI agents", "Guest checkout an agent can complete", "Structured order-intent API"].map((c) => (
                  <div key={c} className="flex items-baseline gap-2"><span style={{ color: OKB, fontFamily: MONO }}>✓</span>{c}</div>
                ))}
              </div>
            </div>
          </div>
        </Sec>

        {/* ── CTA ── */}
        <section className="mt-16">
          <div style={{ height: 2, backgroundColor: INKB }} />
          <div className="py-12 text-center">
            <div style={MICRO}>IDEA → VALIDATION → STUDIO → COMMERCE</div>
            <h2 className="mx-auto mt-4 max-w-[22ch] text-balance font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.94]">
              From a single idea to a self-operating company
            </h2>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link href="/commerce/command" className="px-7 py-3.5 text-[12.5px] font-semibold no-underline" style={{ backgroundColor: INKB, color: PAPER }}>OPEN THE OPERATING SYSTEM →</Link>
              <Link href="/studio" className="px-7 py-3.5 text-[12.5px] font-semibold no-underline" style={{ border: `1px solid ${HAIRB}`, color: DIMB }}>Fabricate a business ↗</Link>
            </div>
          </div>
          <div className="flex flex-wrap justify-between gap-4 pt-4" style={{ borderTop: `1px solid ${HAIRB}` }}>
            <span style={MICRO}>PDR COMMERCE · PRECISION DYNAMICS</span>
            <span style={MICRO}>MEASURED ONLY · REVIEW BEFORE PUBLISH</span>
          </div>
        </section>
      </div>
    </main>
  );
}
