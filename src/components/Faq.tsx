"use client";

import { Eyebrow } from "./primitives";
import { useFork } from "@/components/home/ForkContext";

const VALIDATE_FAQS = [
  { q: "Is this really useful before I have a product?", a: "Yes — it's built for the pre-product stage. The panel pressure-tests the assumptions you'd otherwise discover during a failed seed round." },
  { q: "How adversarial is 'adversarial', exactly?", a: "About as friendly as a Tier-1 partner meeting on a Monday. Five separate agents, each with its own system prompt, attack axis and scoring bias — no consensus mandate." },
  { q: "How is the score calculated?", a: "A dedicated scoring engine grades eight weighted dimensions against anchored rubrics, enriched with live web search where it helps. The headline is the deterministic weighted sum — the narrative can never change the number." },
  { q: "Is any of the data faked?", a: "No. If there's no validated idea on file, the report shows an honest empty state — no placeholder scores, no invented charts. Sources are cited when web search is used, and assumptions are labeled as assumptions." },
  { q: "Can I share or export the report?", a: "Every dossier gets a stable share link and a downloadable scorecard image. Debate sessions export as Markdown or a verdict card." },
  { q: "What happens to my pitch?", a: "It lives in your browser session and powers your report. We don't train on it." },
];

const COMMERCE_FAQS = [
  { q: "Does this work if I'm not on Shopify?", a: "Yes. We read any store's live pages — catalogue, schema, llms.txt and feeds. Shopify gets deeper product data via its public API, but every platform is supported." },
  { q: "How do you know what the AI recommends?", a: "We replay realistic buyer questions through ChatGPT, Claude and Gemini and capture, verbatim, which stores they name — and whether you're one of them." },
  { q: "Is the audit data real or simulated?", a: "The technical audit — schema, llms.txt, feeds — is read live from your store. The buyer test is live when AI keys are funded; otherwise it's clearly labelled as a simulated preview, never faked as real." },
  { q: "What does the Fix Toolkit actually give me?", a: "Installable files generated from your real catalogue: llms.txt, product & Organization schema, AI-crawler robots rules, an agent feed and outreach templates. Copy, paste, re-check until it's live." },
  { q: "Will fixing this actually get me recommended?", a: "Being machine-readable on-site plus cited off-site is how AI picks stores. We fix the on-site half and hand you the off-site plan — then re-run the audit to watch your visibility move." },
  { q: "What does it cost?", a: "It runs on credits like everything else — the audit and each generated fix spend credits. Start with 50 free, top up anytime." },
];

export function Faq() {
  const { fork } = useFork();
  const commerce = fork === "commerce";
  const faqs = commerce ? COMMERCE_FAQS : VALIDATE_FAQS;
  return (
    <section id="faq" className="border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow index="— 07" label="Common Objections" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
              {commerce ? (
                <>The agents <br /> debate <br /> <span className="hl-blue">your store, too.</span></>
              ) : (
                <>The panel <br /> debates <br /> <span className="hl-yellow">itself, too.</span></>
              )}
            </h2>
          </div>
          <div className="lg:col-span-7">
            <div className="border-t border-ink/15">
              {faqs.map((f, i) => (
                <details key={i} className="group border-b border-ink/15 py-6 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-start justify-between gap-6">
                    <span className="flex items-baseline gap-4">
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal-red">
                        Q.0{i + 1}
                      </span>
                      <span className="font-display text-lg uppercase leading-snug text-ink lg:text-xl">
                        {f.q}
                      </span>
                    </span>
                    <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center border border-ink/30 font-mono text-base text-ink transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl pl-[5.5rem] text-[14px] leading-relaxed text-ink/75">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}