/**
 * FlowShowcase — "After the verdict, build the business."
 *
 * Surfaces the post-validation flow (Brand → Launch → Campaign → Landing →
 * Ship) on the landing page so the studio is discoverable. Styled with the
 * live design tokens to sit naturally after HowItWorks. Each card links into
 * the real flow page; the section CTA opens the studio at /brand-kit.
 */

import Link from "next/link";
import { ArrowUpRight, Lock, Palette, Rocket, Clapperboard, MonitorSmartphone, Ship } from "lucide-react";
import { Eyebrow } from "@/components/primitives";

const STAGES = [
  { n: "04", icon: Palette, title: "Brand", body: "A name they can say, a palette, type and voice — generated from your idea.", accent: "var(--color-signal-red)", href: "/brand-kit" },
  { n: "05", icon: Rocket, title: "Launch", body: "Product-page copy, 3 acquisition channels and a 30-asset outreach pack.", accent: "var(--color-signal-blue)", href: "/launch-kit" },
  { n: "06", icon: Clapperboard, title: "Campaign", body: "Four platform-specific video ad cuts — scripted and storyboarded.", accent: "var(--color-signal-green)", href: "/campaign" },
  { n: "07", icon: MonitorSmartphone, title: "Landing", body: "A conversion page you can preview live and export to WordPress or Shopify.", accent: "var(--color-signal-amber)", href: "/landing-builder" },
  { n: "08", icon: Ship, title: "Ship", body: "A 24-hour launch checklist that turns the dossier into a running business.", accent: "var(--ink-0)", href: "/ship" },
];

export function FlowShowcase() {
  return (
    <section id="studio" className="scroll-mt-20 border-b border-ink/15 bg-paper-2">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow index="— 06" label="The founder studio" className="mb-6" />
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.92] tracking-[-0.02em] text-ink">
              The verdict isn&apos;t the end. <span className="hl-blue">It&apos;s the brief.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/65">
            Once your idea survives the panel, the studio turns the dossier into everything you need
            to launch — brand, copy, ads, a live page and a checklist. All generated from your idea.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 border-t-2 border-ink sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                data-testid={`studio-stage-${s.title.toLowerCase()}`}
                className={`flex flex-col px-0 py-8 lg:px-6 ${
                  i > 0 ? "border-t border-ink/15 sm:border-l sm:border-t-0" : ""
                } ${i === 2 ? "border-t lg:border-t-0" : ""}`}
              >
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
                  <Lock className="h-3 w-3" /> Locked
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/#validate"
            data-testid="open-studio-cta"
            className="group inline-flex items-center gap-2 border-2 border-ink bg-ink px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-paper shadow-brutal-sm transition hover:-translate-y-0.5"
          >
            Validate to unlock the studio
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/40">
            5 stages · unlocked once your idea is validated
          </span>
        </div>
      </div>
    </section>
  );
}
