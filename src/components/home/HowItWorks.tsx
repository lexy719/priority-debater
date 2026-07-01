/**
 * HowItWorks — "Idea in. Verdict out." Matches the Emergent print: cream band,
 * header, then three flat steps separated by rules, each with a big index, an
 * icon, title and description. Every step links to the real surface.
 */

"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, Gavel, PenLine, Search, ShoppingBag, Wrench } from "lucide-react";
import { Eyebrow } from "@/components/primitives";
import { useFork } from "@/components/home/ForkContext";

const VALIDATE_STEPS = [
  {
    n: "01",
    icon: PenLine,
    title: "Pitch it",
    body: "One dense paragraph: what you're building, who pays, why now. 120+ characters is enough for the panel to argue with.",
    meta: "~30 seconds",
    href: "#validate",
  },
  {
    n: "02",
    icon: Gavel,
    title: "Survive the Chamber",
    body: "Five agents attack from five axes — and speak. Defend, concede, or shield. Every exchange is judged and logged.",
    meta: "7 rounds · optional",
    href: "#chamber",
  },
  {
    n: "03",
    icon: FileText,
    title: "Get the dossier",
    body: "An audited score plus eight generated sections. Share it, improve it, re-score it as the evidence lands.",
    meta: "Shareable + scorecard",
    href: "/results",
  },
];

const COMMERCE_STEPS = [
  {
    n: "01",
    icon: ShoppingBag,
    title: "Drop your URL",
    body: "Paste your store link. We read your real catalogue, schema and signals — no setup, no plugin.",
    meta: "~10 seconds",
    href: "/commerce",
  },
  {
    n: "02",
    icon: Search,
    title: "The AI shops you",
    body: "We ask ChatGPT, Claude & Gemini where to buy — and show, verbatim, whether they name you or a competitor.",
    meta: "Live buyer test",
    href: "/commerce",
  },
  {
    n: "03",
    icon: Wrench,
    title: "Ship the fix",
    body: "Generate llms.txt, product schema, an agent feed and an outreach kit from your real store. Copy, paste, re-check.",
    meta: "Fix Toolkit",
    href: "/commerce",
  },
];

export function HowItWorks() {
  const { fork } = useFork();
  const commerce = fork === "commerce";
  const STEPS = commerce ? COMMERCE_STEPS : VALIDATE_STEPS;

  return (
    <section id="how" className="scroll-mt-20 border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow index="— 05" label="How it works" className="mb-6" />
            <h2 className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-[0.92] tracking-[-0.02em] text-ink">
              {commerce ? (
                <>Store in. <span className="hl-blue">Visibility out.</span></>
              ) : (
                <>Idea in. <span className="hl-red">Verdict out.</span></>
              )}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/65">
            {commerce
              ? "AI agents already recommend someone in your category. We find out who — and ship the fixes that make it you."
              : "The debate is optional — but founders who survive it ship a sharper dossier. The transcript folds straight into your report."}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 border-t-2 border-ink md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.n}
                href={s.href}
                className={`group flex flex-col px-0 py-8 md:px-8 ${i > 0 ? "border-t border-ink/15 md:border-l md:border-t-0" : ""} transition-colors hover:bg-paper-2`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-5xl leading-none text-ink/20 transition-colors group-hover:text-signal-red">{s.n}</span>
                  <span className="grid h-9 w-9 place-items-center border border-ink/30 text-ink/70 transition-colors group-hover:border-ink group-hover:text-ink">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-6 font-display text-2xl uppercase text-ink">{s.title}</div>
                <p className="mt-3 text-[13px] leading-relaxed text-ink/65">{s.body}</p>
                <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>{s.meta}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
