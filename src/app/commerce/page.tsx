import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ForkTabBar } from "@/components/fork/ForkTabBar";

export const metadata: Metadata = {
  title: "AI Commerce — Is your store visible to AI shoppers?",
  description:
    "AI-originated shopping orders are growing fast. Scan your store free and find out whether ChatGPT, Gemini and Perplexity can even see your products — then fix what's missing.",
};

const SCAN_HREF = "/scan";

/* Brief Page 2 §2 — four short steps, exact copy. */
const STEPS = [
  { n: "01", h: "Scan", p: "We check what ChatGPT, Gemini, and Perplexity say about your products." },
  { n: "02", h: "Verdict", p: "Plain language, not a score: invisible, at risk, or winning." },
  { n: "03", h: "Fix", p: "We rewrite what's missing and push it live. You approve every change." },
  { n: "04", h: "Recover", p: "Every euro traced back to a real order in your own store." },
];

/* Brief Page 2 §4 — three pricing cards, exact copy. Growth is recommended. */
const PRICING = [
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
      <ForkTabBar active="commerce" />

      {/* SECTION 1 — Hero (black) */}
      <section className="bg-[--fk-black] text-[--fk-cream]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-36">
          <h1 className="max-w-4xl font-display text-[clamp(2.75rem,8vw,7rem)] uppercase leading-[0.9] tracking-[-0.02em]">
            Your store is{" "}
            <span style={{ color: "var(--fk-yellow)" }}>invisible</span> to AI shoppers.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60">
            AI-originated shopping orders have grown sharply in 2026 — most small stores have no idea
            if they show up at all.
          </p>

          {/* Real, sourced stat (design §4.1) */}
          <p className="mt-8 max-w-xl border-l-2 pl-4 font-mono text-[12px] leading-relaxed text-white/70" style={{ borderColor: "var(--fk-blue)" }}>
            AI-driven traffic to Shopify stores grew 8× year-over-year, with AI-search orders up
            roughly 13× since January 2025.
            <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-white/35">
              Source: Shopify Q1 2026 earnings
            </span>
          </p>

          {/* Single yellow CTA */}
          <div className="mt-12">
            <Link
              href={SCAN_HREF}
              className="group inline-flex items-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] no-underline"
              style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
            >
              Scan your store — free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mono metadata strip — live counter (aspirational pre-launch) */}
          <div className="mt-16 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
            € 128,400 recovered for merchants this month
          </div>
        </div>
      </section>

      {/* SECTION 2 — How it works (cream) */}
      <section className="bg-[--fk-cream] text-[--fk-black]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/45">
            How it works
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            Scan. Verdict. Fix. Recover.
          </h2>
          <div className="mt-14 grid gap-px border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[--fk-cream] p-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-black/40">
                  {s.n}
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-tight">{s.h}</h3>
                <p className="mt-4 font-mono text-[12px] leading-relaxed text-black/60">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Social proof / leaderboard teaser (black) */}
      <section className="bg-[--fk-black] text-[--fk-cream]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 text-center lg:px-10 lg:py-32">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Leaderboard
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-[clamp(2rem,5.5vw,4.5rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            See how your category&apos;s brands rank
          </h2>
          <p className="mx-auto mt-6 max-w-lg font-mono text-[12px] leading-relaxed text-white/55">
            We&apos;re building a public leaderboard of who AI actually recommends, by category.
          </p>
          <div className="mt-10">
            <span className="inline-flex items-center gap-2 border border-white/20 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
              Leaderboard — coming soon
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Pricing teaser (cream) */}
      <section className="bg-[--fk-cream] text-[--fk-black]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/45">
            Pricing
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            Start free. Pay when it pays you back.
          </h2>
          <div className="mt-14 grid gap-px border border-black/10 bg-black/10 md:grid-cols-3">
            {PRICING.map((tier) => {
              const featured = "featured" in tier && tier.featured;
              return (
                <Link
                  key={tier.name}
                  href="/pricing"
                  className={`block p-8 no-underline ${
                    featured ? "bg-[--fk-black] text-[--fk-cream]" : "bg-[--fk-cream] text-[--fk-black]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.24em] ${
                        featured ? "text-white/45" : "text-black/40"
                      }`}
                    >
                      {featured ? "Recommended" : "Plan"}
                    </span>
                    {featured && (
                      <span
                        className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                        style={{ background: "var(--fk-yellow)", color: "var(--fk-black)" }}
                      >
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-6 font-display text-2xl uppercase leading-tight">{tier.name}</div>
                  <div
                    className={`mt-2 font-mono text-[13px] ${featured ? "text-white/70" : "text-black/60"}`}
                  >
                    {tier.price}
                  </div>
                  <p
                    className={`mt-4 font-mono text-[12px] leading-relaxed ${
                      featured ? "text-white/55" : "text-black/55"
                    }`}
                  >
                    {tier.note}
                  </p>
                  {featured ? (
                    <span
                      className="mt-6 inline-flex items-center gap-2 px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em]"
                      style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
                    >
                      Choose Growth
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-black/60">
                      See pricing
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer — minimal, mono */}
      <footer className="bg-[--fk-black] text-white/50">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.22em] lg:px-10">
          <span>© 2026 Priority Debater</span>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="no-underline hover:text-white">Pricing</Link>
            <Link href="/faq" className="no-underline hover:text-white">Docs</Link>
            <Link href="/validation" className="no-underline hover:text-white">Validation</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
