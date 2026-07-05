"use client";

/**
 * Validation landing (brief Page 3). Hero with an idea input + VALIDATE CTA,
 * three steps, a sample-output preview card, and a closing line.
 *
 * VALIDATE routes into the EXISTING validation flow: /debate renders the
 * DebateChamber (the live five-persona tribunal). The Chamber accepts a cold
 * entry — its idea composer prefills from a ?idea= query param (added to the
 * Chamber's boot effect) or any saved session, and does not require one — so
 * it is the canonical validation entry now that the old /#validate home
 * section is gone.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ForkTabBar } from "@/components/fork/ForkTabBar";

const STEPS = [
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
      <section className="bg-[--fk-black] text-[--fk-cream]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-36">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Before you build it
          </div>
          <h1 className="mt-8 max-w-4xl font-display text-[clamp(2.75rem,8vw,7rem)] uppercase leading-[0.9] tracking-[-0.02em]">
            Is this idea worth building?
          </h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/60">
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
              className="w-full border border-white/20 bg-[--fk-black] px-4 py-4 font-mono text-[13px] text-white placeholder:text-white/35 focus:outline-none"
              style={{ borderRadius: 0 }}
            />
            <button
              type="button"
              onClick={validate}
              className="group inline-flex shrink-0 items-center justify-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em]"
              style={{ background: "var(--fk-red)", color: "#ffffff", borderRadius: 0 }}
            >
              Validate
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — How it works, 3 steps (cream) */}
      <section className="bg-[--fk-cream] text-[--fk-black]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/45">
            How it works
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            Describe it. We check it. You decide.
          </h2>
          <div className="mt-14 grid gap-px border border-black/10 bg-black/10 md:grid-cols-3">
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

      {/* SECTION 3 — Sample output preview (black) */}
      <section className="bg-[--fk-black] text-[--fk-cream]">
        <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
            Sample output
          </div>
          <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.95] tracking-[-0.01em]">
            What a verdict looks like
          </h2>

          <div className="mt-12 max-w-2xl border border-white/15 bg-[#0f0f0f]" style={{ borderRadius: 0 }}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                verdict / example
              </span>
              <span
                className="px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ background: "var(--fk-yellow)", color: "var(--fk-black)" }}
              >
                Example
              </span>
            </div>

            <div className="px-6 py-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Idea
              </div>
              <p className="mt-2 text-[15px] leading-snug text-white/90">
                An AI agent that reorders pet food automatically.
              </p>

              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Verdict
              </div>
              <p className="mt-2 text-[15px] font-semibold" style={{ color: "var(--fk-red)" }}>
                Already crowded — needs a sharper angle.
              </p>

              <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Why
              </div>
              <ul className="mt-3 space-y-2.5 font-mono text-[12px] leading-relaxed text-white/70">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ background: "var(--fk-blue)" }} />
                  Amazon Subscribe &amp; Save and Chewy autoship already own the default reorder habit.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ background: "var(--fk-blue)" }} />
                  Search demand is flat; the pain is &quot;mild&quot;, not &quot;urgent&quot; — weak pull.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0" style={{ background: "var(--fk-blue)" }} />
                  A wedge exists in multi-pet households with mixed diets no incumbent handles well.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Closing line (cream) */}
      <section className="bg-[--fk-cream] text-[--fk-black]">
        <div className="mx-auto max-w-[1120px] px-6 py-28 text-center lg:px-10 lg:py-40">
          <h2 className="mx-auto max-w-4xl font-display text-[clamp(2.25rem,6vw,5rem)] uppercase leading-[0.95] tracking-[-0.02em]">
            Free to try. No signup required for your first idea.
          </h2>
          <div className="mt-12">
            <button
              type="button"
              onClick={validate}
              className="group inline-flex items-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em]"
              style={{ background: "var(--fk-red)", color: "#ffffff", borderRadius: 0 }}
            >
              Validate
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="mt-6">
            <Link
              href="/commerce"
              className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/50 no-underline hover:text-black"
            >
              or switch to Commerce →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
