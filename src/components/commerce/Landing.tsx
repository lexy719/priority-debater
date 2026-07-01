"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";

/**
 * /commerce landing — the hook, in the site's design language (paper + ink +
 * signal-blue, Anton display, JetBrains mono, brutalist shadow CTAs — matching
 * the homepage's commerce fork). One job: get the visitor to run a free scan.
 */

const SAMPLES = [
  { tag: "Wedding · Portugal", from: 61, to: 83, line: "Was invisible in ChatGPT for “best wedding store Portugal”. Now ranked #2.", time: "3 weeks · 4 fixes deployed" },
  { tag: "Skincare · UK", from: 48, to: 71, line: "AI named three competitors first. A buying guide flipped two queries.", time: "2 weeks · 3 fixes deployed" },
  { tag: "Coffee · US", from: 55, to: 79, line: "No structured products — agents couldn't compare. Now machine-readable.", time: "10 days · 2 fixes deployed" },
];

const NAMED = [
  { n: "1", name: "Sea Dress", note: "schema + reviews" },
  { n: "2", name: "Amora Bridal", note: "buying guides" },
  { n: "3", name: "Zull Atelier", note: "named in roundups" },
];

export function Landing() {
  const router = useRouter();
  const [url, setUrl] = useState("");

  function run(e?: React.FormEvent) {
    e?.preventDefault();
    const v = url.trim();
    if (!v) return;
    router.push(`/commerce/results?url=${encodeURIComponent(v)}`);
  }

  return (
    <>
      {/* HERO */}
      <section className="border-b border-ink/15 bg-paper grid-paper">
        <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-ink px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-paper">AI Commerce Intelligence</span>
                <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-ink/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-green" /> Live buyer test
                </span>
              </div>

              <h1 className="mt-5 font-display text-[clamp(2rem,4.6vw,4rem)] leading-[0.88] tracking-[-0.01em] text-ink">
                AI is recommending
                <br />
                your competitors.
                <br />
                <span className="hl-blue">Not you</span>
                <span className="text-signal-blue">_</span>
              </h1>

              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink/75">
                We ask ChatGPT, Perplexity &amp; Google AI where to buy in your category. They name your competitors. We show
                you exactly what they said — <strong className="text-ink">and fix it.</strong>
              </p>

              <form onSubmit={run} className="mt-7 flex max-w-xl flex-col gap-3 sm:flex-row">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yourstore.com"
                  inputMode="url"
                  className="h-12 flex-1 border-2 border-ink bg-paper px-4 font-mono text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-signal-blue"
                />
                <button
                  type="submit"
                  className="group inline-flex h-12 items-center justify-center gap-2 bg-signal-blue px-7 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  Run free scan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </form>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="text-signal-green">Free to run</span>
                <span className="text-ink/25">/</span>
                <span>~45 seconds</span>
                <span className="text-ink/25">/</span>
                <span>No card</span>
                <span className="text-ink/25">/</span>
                <span>50 credits on signup</span>
              </div>
            </div>

            {/* dark JSON-style preview card — matches the homepage Hero cards */}
            <div className="border border-ink bg-[#0c0c0c] text-paper shadow-[0_24px_70px_-24px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between border-b border-paper/10 px-4 py-3">
                <span className="flex items-center gap-2 font-mono text-[11px] text-paper/85">
                  <MessageSquare className="h-3.5 w-3.5 text-signal-blue" /> BUYER_TEST.JSON
                </span>
                <span className="bg-signal-blue px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-paper">01 · Scan</span>
              </div>
              <div className="border-b border-paper/10 px-4 py-2.5 font-mono text-[11px] leading-relaxed text-paper/55">
                <span className="text-signal-green">&gt;</span> &quot;best wedding dress store in Portugal?&quot;
              </div>
              <div className="space-y-2 px-4 py-3.5">
                {NAMED.map((r) => (
                  <div key={r.n} className="flex items-center justify-between border-b border-paper/[0.06] py-1.5 last:border-0">
                    <span className="font-mono text-[11px] text-paper/85">
                      <span className="text-signal-blue">{r.n}.</span> {r.name}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/40">{r.note}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-paper/10 px-4 py-3.5">
                <span className="bg-signal-red px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-paper">You — not in results</span>
                <div className="text-right">
                  <div className="font-display text-3xl leading-none text-signal-red">61</div>
                  <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/45">/100 visibility</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF STRIP */}
      <section className="border-b border-ink/15 bg-paper">
        <div className="mx-auto max-w-[1120px] px-6 py-14 lg:px-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">Sample outputs from beta users</div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SAMPLES.map((s, i) => (
              <div key={i} className="border border-ink bg-surface p-5 shadow-[4px_4px_0_0_#000]">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/55">{s.tag}</div>
                <div className="mt-3 flex items-center gap-2 font-display text-3xl tabular-nums">
                  <span className="text-signal-red">{s.from}</span>
                  <ArrowRight className="h-4 w-4 text-ink/30" />
                  <span className="text-signal-green">{s.to}</span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-ink/70">{s.line}</p>
                <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/40">{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-ink text-paper grid-paper-dark">
        <div className="mx-auto max-w-[1120px] px-6 py-20 text-center lg:px-8">
          <h2 className="font-display text-[clamp(1.8rem,4vw,3.4rem)] leading-[0.9] tracking-[-0.01em]">
            Find out what AI <span className="hl-blue">said about you</span>
            <span className="text-signal-blue">_</span>
          </h2>
          <form onSubmit={run} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="yourstore.com"
              inputMode="url"
              className="h-12 flex-1 border-2 border-paper/30 bg-transparent px-4 font-mono text-[15px] text-paper placeholder:text-paper/40 focus:border-signal-blue focus:outline-none"
            />
            <button
              type="submit"
              className="group inline-flex h-12 items-center justify-center gap-2 bg-signal-blue px-7 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Run free scan <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
