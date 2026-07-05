import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Lock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Commerce pricing — you don't pay until we make you money",
  description:
    "Free scan, €19/mo Starter, or Growth at 0% base + 8% of AI-attributed revenue capped at €300/mo. Connectivity is free on every platform, permanently.",
};

/**
 * /commerce/pricing — §1.2 tiers + the §1.6 environment-depth unlock table.
 * The single yellow CTA belongs to the recommended Growth card. Connectivity
 * is stated as free/bundled everywhere — never a paid line item (§1.3).
 */

const TIERS = [
  {
    name: "Free Scan",
    price: "€0",
    note: "One-time audit, no card needed",
    features: ["Full store audit", "Which products are invisible to AI", "Estimated €/month lost", "Top 3 fixes (locked until connect)"],
    cta: { label: "Scan your store", href: "/scan", featured: false },
  },
  {
    name: "Starter",
    price: "€19/mo",
    note: "Solo shops, <100 SKUs",
    features: ["Full dashboard + Command Center", "Weekly re-scan", "Unlimited manual fixes, review-before-push", "Attribution ledger (layers 1–2)", "Email digest"],
    cta: { label: "Start with a free scan", href: "/scan", featured: false },
  },
  {
    name: "Growth",
    price: "0% base + 8% of AI-attributed revenue",
    note: "Capped at €300/mo — you don't pay until we make you money",
    features: ["Everything in Starter", "Auto-push fixes (logged, reversible)", "Competitor watch", "Content generation + Studio triggers", "Daily re-scan", "Restock + Return-Risk modules as data unlocks them"],
    cta: { label: "Scan your store — free", href: "/scan", featured: true },
  },
];

/** §1.6 unlock-threshold table — the "environment depth" proof. */
const UNLOCKS = [
  { module: "Recovery Engine", when: "Immediately, first scan" },
  { module: "Agent-Ready Spec Check", when: "Immediately, same scan" },
  { module: "Return-Risk", when: "30 days connected + 10 recorded returns" },
  { module: "Restock / Demand Signals", when: "14 days of attributed sales, 5+ orders" },
  { module: "Competitor Watch", when: "Growth tier + 3 comparable stores in your category benchmark" },
  { module: "Content Hub", when: "Growth tier, immediate" },
];

export default function CommercePricing() {
  return (
    <main className="min-h-[100dvh] bg-fk-black text-fk-cream" style={{ borderRadius: 0 }}>
      <SiteNav subtitle="AI Commerce" />

      {/* Hero — black */}
      <section className="bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Commerce pricing
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.25rem,6vw,5rem)] uppercase leading-[0.92]">
            You don&apos;t pay until we make you money
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60">
            Connecting your store — Shopify, WooCommerce, or anything else — is free and bundled,
            permanently. The only paid layer is the recovery engine that earns it back.
          </p>
        </div>
      </section>

      {/* Tiers — cream */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid gap-px bg-black/15 md:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.name} className={`flex flex-col p-6 ${t.cta.featured ? "bg-fk-black text-fk-cream" : "bg-fk-cream"}`}>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.24em] opacity-60">{t.name}</div>
                  {t.cta.featured && (
                    <span className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]" style={{ background: "var(--fk-blue)", color: "#fff" }}>
                      Recommended
                    </span>
                  )}
                </div>
                <div className="mt-4 font-display text-2xl uppercase leading-tight">{t.price}</div>
                <div className="mt-2 font-mono text-[11px] leading-relaxed opacity-60">{t.note}</div>
                <ul className="mt-6 flex-1 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm leading-snug">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--fk-green)" }} /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.cta.href}
                  className={`mt-8 inline-flex items-center justify-center gap-2 px-5 py-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] no-underline ${
                    t.cta.featured ? "" : "border border-black/25 text-fk-black hover:border-black"
                  }`}
                  style={t.cta.featured ? { background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 } : { transition: "none", borderRadius: 0 }}
                >
                  {t.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-black/45">
            Only attribution layers 1–2 are ever billed · every billed euro traces to a real order
            id in your own store admin
          </p>
        </div>
      </section>

      {/* Environment depth — black */}
      <section className="bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Not a tool — an environment that grows with your data
          </div>
          <h2 className="mt-6 max-w-2xl font-display text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95]">
            Modules unlock themselves
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60">
            You never buy a module. Each one switches on inside the same dashboard the moment your
            data can support it — these are the exact thresholds:
          </p>
          <div className="mt-8 space-y-px bg-fk-ink-border">
            {UNLOCKS.map((u) => (
              <div key={u.module} className="flex flex-wrap items-center justify-between gap-2 bg-fk-card-dark p-4">
                <span className="flex items-center gap-2 font-mono text-[12px] text-fk-cream">
                  <Lock className="h-3 w-3 text-white/30" /> {u.module}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">{u.when}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer strip — cream */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-6 py-8 font-mono text-[10px] uppercase tracking-[0.2em] text-black/50 lg:px-10">
          <span>Connectivity free on every platform, permanently (§1.3)</span>
          <Link href="/commerce" className="text-black/70 no-underline hover:text-black">← Commerce home</Link>
        </div>
      </section>
    </main>
  );
}
