import { Eyebrow } from "./primitives";

const faqs = [
  { q: "Is this really useful before I have a product?", a: "Yes — it's built for the pre-product stage. The panel pressure-tests the assumptions you'd otherwise discover during a failed seed round." },
  { q: "How adversarial is 'adversarial', exactly?", a: "About as friendly as a Tier-1 partner meeting on a Monday. Five voices, each scoring against their own thesis, with no consensus mandate." },
  { q: "What model is behind the panel?", a: "Claude Sonnet 4.5 with a structured persona harness, evidence prompts, and a forced scoring schema. No vibes-based responses." },
  { q: "Can I export the report?", a: "Every session ships as a PDF dossier — score model, persona arguments, risk radar, and proof sprint included." },
  { q: "What happens to my pitch?", a: "Stored encrypted, scoped to your account. We never train on it. Delete with one click." },
];

export function Faq() {
  return (
    <section id="faq" className="border-b border-ink/15 bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow index="06" label="/ Common Objections" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
              The panel <br /> debates <br /> <span className="hl-yellow">itself, too.</span>
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