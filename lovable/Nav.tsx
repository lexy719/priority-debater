import { ArrowUpRight } from "lucide-react";

const links = ["Features", "Personas", "Pricing", "FAQ"];

export function Nav() {
  return (
    <header className="border-b border-ink/20 bg-paper">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-5 lg:px-10">
        <a href="#top" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-ink bg-ink font-display text-sm text-paper">
            ID
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm uppercase tracking-[0.12em] text-ink">
              Idea Debater
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              v.1.0 / 2026
            </span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink/80 transition-colors hover:text-signal-red"
            >
              {l}
            </a>
          ))}
        </nav>
        <a
          href="#validate"
          className="group inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-all hover:bg-signal-red hover:border-signal-red"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-signal-red group-hover:bg-paper" />
          Validate Idea
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}