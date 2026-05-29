import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Dot } from "./primitives";

export function Cta() {
  return (
    <section id="cta" className="relative overflow-hidden border-b border-paper/10 bg-ink text-paper grid-paper-dark">
      <div className="mx-auto max-w-[1400px] px-6 py-28 text-center lg:px-10 lg:py-40">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-paper/50">
          — Final · The Verdict Loop
        </div>
        <h2 className="mx-auto mt-8 max-w-5xl font-display text-[clamp(3rem,9vw,8rem)] leading-[0.92] tracking-[-0.03em]">
          Ship the <br /> idea that <br />
          <span className="hl-red">survives</span>
          <span className="text-signal-red">.</span>
        </h2>
        <p className="mx-auto mt-10 max-w-xl text-base leading-relaxed text-paper/70">
          Most founders confirm their bias. The honest ones run the debate first. Take 120 seconds and find out which one you are.
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#validate"
            className="group inline-flex items-center gap-3 border border-signal-red bg-signal-red px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-ink transition-all hover:bg-paper hover:border-paper"
          >
            Run the debate
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#features"
            className="group inline-flex items-center gap-3 border border-paper/30 px-7 py-4 font-mono text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Tour the panel
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper/45">
          <span className="flex items-center gap-2"><Dot color="red" /> No card</span>
          <span>·</span>
          <span>120s session</span>
          <span>·</span>
          <span>Cancel after one debate</span>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper/70">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-12 md:grid-cols-4 lg:px-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-paper/40 bg-paper font-display text-sm text-ink">
              ID
            </span>
            <span className="font-display text-sm uppercase tracking-[0.12em] text-paper">
              Idea Debater
            </span>
          </div>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-paper/55">
            A 120-second decision panel for founders who'd rather lose an argument than a year.
          </p>
        </div>
        {[
          { h: "Product", links: ["Features", "Personas", "Pricing", "Sample report"] },
          { h: "Company", links: ["About", "Manifesto", "Changelog", "Contact"] },
          { h: "Legal", links: ["Terms", "Privacy", "Security", "DPA"] },
        ].map((c) => (
          <div key={c.h}>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40">{c.h}</div>
            <ul className="mt-4 space-y-2">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-paper/80 transition-colors hover:text-signal-red">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-6 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-paper/40 lg:px-10">
          <span>© 2026 Idea Debater · v.1.0</span>
          <span>Built to disagree · Claude Sonnet 4.5</span>
        </div>
      </div>
    </footer>
  );
}