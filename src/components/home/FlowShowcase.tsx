"use client";

/**
 * FlowShowcase — the back half of each path, fork-aware.
 *  - validate: the post-validation studio (Brand → Ship), locked until you validate.
 *  - commerce: the audit → fix-toolkit flow, which runs on credits (no lock).
 */

import Link from "next/link";
import {
  ArrowUpRight,
  Lock,
  Palette,
  Rocket,
  Clapperboard,
  MonitorSmartphone,
  Ship,
  Target,
  Search,
  FileJson,
  Mail,
  RefreshCw,
} from "lucide-react";
import { Eyebrow } from "@/components/primitives";
import { useFork } from "@/components/home/ForkContext";

const VALIDATE_STAGES = [
  { n: "04", icon: Palette, title: "Brand", body: "A name they can say, a palette, type and voice — generated from your idea.", accent: "var(--color-signal-red)", href: "/brand-kit" },
  { n: "05", icon: Rocket, title: "Launch", body: "Product-page copy, 3 acquisition channels and a 30-asset outreach pack.", accent: "var(--color-signal-blue)", href: "/launch-kit" },
  { n: "06", icon: Clapperboard, title: "Campaign", body: "Four platform-specific video ad cuts — scripted, storyboarded and rendered.", accent: "var(--color-signal-green)", href: "/campaign" },
  { n: "07", icon: MonitorSmartphone, title: "Landing", body: "A conversion page you can preview live and export to WordPress or Shopify.", accent: "var(--color-signal-amber)", href: "/landing-builder" },
  { n: "08", icon: Ship, title: "Ship", body: "A 24-hour launch checklist that turns the dossier into a running business.", accent: "var(--ink-0)", href: "/ship" },
];

const COMMERCE_STAGES = [
  { n: "04", icon: Target, title: "Audit", body: "Score your store's AI visibility — schema, feed, content and agent-readiness.", accent: "var(--color-signal-blue)", href: "/commerce" },
  { n: "05", icon: Search, title: "Buyer test", body: "See, verbatim, which stores ChatGPT, Claude & Gemini recommend — and whether it's you.", accent: "var(--color-signal-red)", href: "/commerce" },
  { n: "06", icon: FileJson, title: "Fix files", body: "Generate llms.txt, product schema, an agent feed and crawler rules from your catalogue.", accent: "var(--color-signal-green)", href: "/commerce" },
  { n: "07", icon: Mail, title: "Outreach", body: "Review-request and press emails to build the off-site authority AI trusts.", accent: "var(--color-signal-amber)", href: "/commerce" },
  { n: "08", icon: RefreshCw, title: "Re-check", body: "Re-run the audit after publishing and watch your AI visibility climb.", accent: "var(--ink-0)", href: "/commerce" },
];

export function FlowShowcase() {
  const { fork } = useFork();
  const commerce = fork === "commerce";
  const stages = commerce ? COMMERCE_STAGES : VALIDATE_STAGES;

  return (
    <section id="studio" className="scroll-mt-20 border-b border-ink/15 bg-paper-2">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow index="— 06" label={commerce ? "The fix studio" : "The founder studio"} className="mb-6" />
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.92] tracking-[-0.02em] text-ink">
              {commerce ? (
                <>The audit isn&apos;t the end. <span className="hl-blue">It&apos;s the toolkit.</span></>
              ) : (
                <>The verdict isn&apos;t the end. <span className="hl-blue">It&apos;s the brief.</span></>
              )}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/65">
            {commerce
              ? "Once we find where AI ignores your store, the toolkit ships the exact files and outreach to fix it — all generated from your real catalogue."
              : "Once your idea survives the panel, the studio turns the dossier into everything you need to launch — brand, copy, ads, a live page and a checklist. All generated from your idea."}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-5">
          {stages.map((s, i) => {
            const Icon = s.icon;
            const cls = `group flex flex-col px-0 py-8 lg:px-6 ${
              i > 0 ? "border-t border-ink/15 sm:border-l sm:border-t-0" : ""
            } ${i === 2 ? "border-t lg:border-t-0" : ""} ${commerce ? "transition-colors hover:bg-paper" : ""}`;
            const testid = `studio-stage-${s.title.toLowerCase().replace(/\s+/g, "-")}`;
            const inner = (
              <>
                <div className="flex items-start justify-between">
                  <span className="font-display text-4xl leading-none text-ink/20">{s.n}</span>
                  <span
                    className="grid h-9 w-9 place-items-center border border-ink/30 text-ink/70"
                    style={{ borderColor: s.accent }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-6 font-display text-2xl uppercase text-ink">{s.title}</div>
                <p className="mt-3 text-[13px] leading-relaxed text-ink/65">{s.body}</p>
                <div className="mt-6 flex items-center gap-1.5 border-t border-ink/10 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35">
                  {commerce ? (
                    <><ArrowUpRight className="h-3 w-3" /> Open</>
                  ) : (
                    <><Lock className="h-3 w-3" /> Locked</>
                  )}
                </div>
              </>
            );
            return commerce ? (
              <Link key={s.n} href={s.href} data-testid={testid} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={s.n} data-testid={testid} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href={commerce ? "/commerce" : "/#validate"}
            data-testid="open-studio-cta"
            className="group inline-flex items-center gap-2 border-2 border-ink bg-ink px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-paper shadow-brutal-sm transition hover:-translate-y-0.5"
          >
            {commerce ? "Audit my store now" : "Validate to unlock the studio"}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
            {commerce ? "Audit + fixes run on credits" : "5 stages · unlocked once your idea is validated"}
          </span>
        </div>
      </div>
    </section>
  );
}
