import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ForkTabBar } from "@/components/fork/ForkTabBar";

export const metadata: Metadata = {
  title: "AI Commerce — Is your store visible to AI shoppers?",
  description:
    "AI-originated shopping orders are growing fast. Scan your store free and find out whether ChatGPT, Gemini and Perplexity can even see your products — then fix what's missing.",
};

/* Route: the free scan lives at /scan (see CLAUDE.md — Commerce owns /scan). */
const SCAN_HREF = "/scan";
/* Commerce pricing is its own fork route — never the validation /pricing page. */
const PRICING_HREF = "/commerce/pricing";

/* docs/pd-commerce-full-design.md §4.1 — four steps, verbatim copy. */
const STEPS = [
  { n: "01", title: "Scan", line: "We check what ChatGPT, Gemini, and Perplexity say about your products." },
  { n: "02", title: "Verdict", line: "Plain language, not a score: invisible, at risk, or winning." },
  { n: "03", title: "Fix", line: "We rewrite what's missing and push it live. You approve every change." },
  { n: "04", title: "Recover", line: "Every euro traced back to a real order in your own store." },
] as const;

/* §4.1 — three pricing tiers, verbatim copy. Growth is the recommended card. */
type Tier = {
  name: string;
  price: string;
  note: string;
  featured?: boolean;
};

const PRICING: Tier[] = [
  { name: "Free Scan", price: "€0", note: "One-time audit, no card needed" },
  { name: "Starter", price: "€19/mo", note: "Full dashboard, weekly re-scan, manual fixes" },
  {
    name: "Growth",
    price: "0% base + performance fee",
    note: "Auto-push, competitor watch, content generation",
    featured: true,
  },
];

export default function CommerceLanding() {
  return (
    <main style={{ borderRadius: 0 }}>
      {/* Sticky cross-fork switch — always the first element on both landings. */}
      <ForkTabBar active="commerce" />

      {/* ── SECTION 1 · HERO — BLACK band (fixes the invisible cream-hero defect) ── */}
      <section className="grid-paper-dark bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-36">
          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,8vw,7rem)] uppercase leading-[0.95] tracking-[-0.02em]">
            Your store is <span className="text-fk-yellow">INVISIBLE</span> to AI shoppers.
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60">
            AI-originated shopping orders have grown sharply in 2026 — most small stores have no
            idea if they show up at all.
          </p>

          {/* Sourced stat block — blue left rule marks it as real data. */}
          <div className="mt-8 max-w-xl border-l-2 border-fk-blue pl-4">
            <p className="font-mono text-[12px] leading-relaxed text-white/75">
              AI-driven traffic to Shopify stores grew 8x year-over-year, with AI-search orders up
              roughly 13x since January 2025.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fk-muted">
              Source: Shopify Q1 2026 earnings
            </p>
          </div>

          {/* THE single yellow element on the entire page. */}
          <div className="mt-12">
            <Link
              href={SCAN_HREF}
              className="group inline-flex items-center gap-3 bg-fk-yellow px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-fk-black no-underline"
              style={{ borderRadius: 0 }}
            >
              Scan your store — free
              <ArrowRight
                className="h-4 w-4 group-hover:translate-x-1"
                style={{ transition: "transform 150ms" }}
              />
            </Link>
          </div>

          {/* Mono metadata counter strip — the one sanctioned placeholder. */}
          <div className="mt-16 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-fk-muted">
            €128,400 recovered for merchants this month
          </div>
        </div>
      </section>

      {/* ── SECTION 2 · HOW IT WORKS — CREAM band ── */}
      <section className="grid-paper bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/45">
            How it works
          </p>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            Scan. Verdict. Fix. Recover.
          </h2>

          {/* gap-px over a hairline-tinted grid draws the dividers — no icons. */}
          <div className="mt-12 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="bg-fk-cream p-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-black/40">
                  {step.n}
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-tight">{step.title}</h3>
                <p className="mt-4 font-mono text-[12px] leading-relaxed text-black/60">
                  {step.line}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 · SOCIAL PROOF / LEADERBOARD TEASER — BLACK band ── */}
      {/* NOTE: the public leaderboard route is not built yet — this only teases it. */}
      <section className="grid-paper-dark bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-16 text-center lg:px-10 lg:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Leaderboard
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(2rem,5.5vw,4.5rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            See how skincare brands rank.
          </h2>
          <p className="mx-auto mt-6 max-w-lg font-mono text-[12px] leading-relaxed text-white/55">
            A public leaderboard of who AI actually recommends, by category — going live soon.
          </p>

          {/* Ghost / disabled-looking secondary link — deliberately NOT yellow. */}
          <div className="mt-10">
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-2 border border-white/20 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45"
            >
              Leaderboard — coming soon
            </span>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 · PRICING TEASER — CREAM band ── */}
      <section className="grid-paper bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/45">
            Pricing
          </p>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            Start free. Pay when it pays you back.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRICING.map((tier) => {
              const featured = tier.featured ?? false;
              return (
                <div
                  key={tier.name}
                  className={
                    featured
                      ? "shadow-hard flex flex-col border border-fk-black bg-fk-black p-8 text-fk-cream"
                      : "shadow-hard flex flex-col border border-black/15 bg-fk-cream p-8 text-fk-black"
                  }
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.24em] ${
                        featured ? "text-white/50" : "text-black/40"
                      }`}
                    >
                      {featured ? "Recommended" : "Plan"}
                    </span>
                    {featured && (
                      /* Accent is BLUE, not yellow — yellow is reserved for the hero CTA. */
                      <span className="border border-fk-blue px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-fk-blue">
                        Best value
                      </span>
                    )}
                  </div>

                  <div className="mt-6 font-display text-2xl uppercase leading-tight">
                    {tier.name}
                  </div>
                  <div
                    className={`mt-2 font-mono text-[13px] ${
                      featured ? "text-white/75" : "text-black/65"
                    }`}
                  >
                    {tier.price}
                  </div>
                  <p
                    className={`mt-4 flex-1 font-mono text-[12px] leading-relaxed ${
                      featured ? "text-white/55" : "text-black/55"
                    }`}
                  >
                    {tier.note}
                  </p>

                  {/* Card CTAs are ghost/blue links — never yellow. */}
                  <Link
                    href={PRICING_HREF}
                    className={`group mt-8 inline-flex items-center gap-2 self-start border px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] no-underline ${
                      featured
                        ? "border-white/30 text-fk-cream hover:border-white"
                        : "border-fk-blue text-fk-blue hover:bg-fk-blue hover:text-fk-cream"
                    }`}
                    style={{ borderRadius: 0, transition: "background-color 150ms, border-color 150ms, color 150ms" }}
                  >
                    {featured ? "Choose Growth" : `Choose ${tier.name}`}
                    <ArrowRight
                      className="h-3.5 w-3.5 group-hover:translate-x-1"
                      style={{ transition: "transform 150ms" }}
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER — minimal, mono ── */}
      <footer className="bg-fk-black text-white/50">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.22em] lg:px-10">
          <span>© 2026 Priority Debater</span>
          <div className="flex items-center gap-6">
            <Link href={PRICING_HREF} className="no-underline hover:text-white" style={{ transition: "color 150ms" }}>
              Pricing
            </Link>
            {/* Docs route not built yet — placeholder anchor per spec. */}
            <Link href="#" className="no-underline hover:text-white" style={{ transition: "color 150ms" }}>
              Docs
            </Link>
            <Link href="/validation" className="no-underline hover:text-white" style={{ transition: "color 150ms" }}>
              Validation
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
