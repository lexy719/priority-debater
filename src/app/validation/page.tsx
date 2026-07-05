"use client";

/**
 * Validation fork landing (route `/validation`).
 *
 * Black hero with a mono idea input + the single yellow VALIDATE CTA, a cream
 * "how it works" band (3 mono-numbered steps), a black sample-output preview
 * card, and a cream closing line. Alternates black -> cream -> black -> cream.
 *
 * VALIDATE routes into the existing validation flow at /debate, carrying the
 * typed idea as an ?idea= query param when present. No backend call.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ForkTabBar } from "@/components/fork/ForkTabBar";

const STEPS: ReadonlyArray<{ n: string; h: string; p: string }> = [
  { n: "01", h: "Describe it", p: "One sentence, no pitch deck needed." },
  {
    n: "02",
    h: "We check it",
    p: "Competitors, search demand, timing, existing funded companies doing the same thing.",
  },
  {
    n: "03",
    h: "You get a verdict",
    p: "Worth building, needs a different angle, or already crowded. Plain language, not a score.",
  },
];

const SAMPLE_REASONS: ReadonlyArray<string> = [
  "Chewy Autoship + Amazon Subscribe & Save already own the reorder habit.",
  "Demand is real but retention belongs to the retailer, not a 3rd-party agent.",
  "Timing edge only if you own a data moat on consumption rate.",
];

export default function ValidationLanding() {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  const validate = () => {
    const trimmed = idea.trim();
    router.push(trimmed ? `/debate?idea=${encodeURIComponent(trimmed)}` : "/debate");
  };

  return (
    <main style={{ borderRadius: 0 }}>
      <ForkTabBar active="validation" />

      {/* SECTION 1 — Hero (black) */}
      <section className="bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-36">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-fk-cream/70">
            Before you build it
          </p>

          <h1 className="mt-8 max-w-4xl font-display text-[clamp(2.75rem,8vw,7rem)] uppercase leading-[0.95] tracking-[-0.02em]">
            Is this idea worth building?
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-fk-cream/60">
            Describe it in a sentence. We&apos;ll check for existing competitors, real demand
            signals, and market timing — before you spend a weekend building it.
          </p>

          <div className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") validate();
              }}
              placeholder="e.g. an AI agent that reorders pet food automatically"
              aria-label="Describe your idea in one sentence"
              className="pd-input w-full"
            />
            <button
              type="button"
              onClick={validate}
              className="shrink-0 bg-fk-yellow px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-fk-black"
              style={{ borderRadius: 0 }}
            >
              Validate
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — How it works (cream) */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-fk-black/70">
            How it works
          </p>

          <div className="mt-14 grid gap-px border border-fk-cream-border bg-fk-cream-border md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-fk-cream p-8">
                <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-fk-black/40">
                  {s.n}
                </div>
                <h3 className="mt-5 text-xl font-semibold leading-tight">{s.h}</h3>
                <p className="mt-4 leading-relaxed text-fk-black/60">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — Sample output preview (black) */}
      <section className="bg-fk-black text-fk-cream">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-fk-cream/70">
            Sample output
          </p>

          <div className="mt-12 max-w-2xl border border-fk-ink-border bg-fk-card-dark p-6" style={{ borderRadius: 0 }}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-fk-cream/45">
                Verdict / sample
              </span>
              <span
                className="px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-fk-cream"
                style={{ background: "var(--fk-blue)", borderRadius: 0 }}
              >
                Needs a different angle
              </span>
            </div>

            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-fk-cream/40">
              Idea
            </div>
            <p className="mt-2 text-[15px] leading-snug text-fk-cream/90">
              An AI agent that auto-reorders pet food.
            </p>

            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-fk-cream/40">
              Verdict
            </div>
            <p className="mt-2 text-[15px] font-semibold leading-snug text-fk-cream">
              Real demand, but the reorder habit is already owned. Find a data moat or move on.
            </p>

            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-fk-cream/40">
              Why
            </div>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-fk-cream/70">
              {SAMPLE_REASONS.map((reason) => (
                <li key={reason} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0"
                    style={{ background: "var(--fk-blue)" }}
                  />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Closing line (cream) */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-10 lg:py-24">
          <p className="font-mono text-[13px] uppercase tracking-[0.24em] text-fk-black/70">
            Free to try. No signup required for your first idea.
          </p>
        </div>
      </section>
    </main>
  );
}
