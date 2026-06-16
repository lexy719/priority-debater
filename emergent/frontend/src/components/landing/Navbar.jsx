import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "The Chamber", href: "#chamber" },
  { label: "The Dossier", href: "#dossier" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled ? "bg-[#0a0a0a]" : "bg-[#0a0a0a]/90 backdrop-blur"
      } border-b border-white/15`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <a href="#top" data-testid="logo" className="flex items-center gap-3 group">
          <span className="grid place-items-center w-8 h-8 bg-[#ff3b30] text-white font-display text-lg leading-none pt-0.5">
            PD
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-white hidden sm:block">
            Priority&nbsp;Debater
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/60 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/brand-kit"
            data-testid="nav-cta"
            className="hidden sm:inline-flex font-mono text-[11px] uppercase tracking-[0.18em] bg-[#ff3b30] text-white px-4 py-2.5 hover:bg-white hover:text-black transition-colors"
          >
            See the build flow →
          </a>
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-white p-1"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/15 px-6 py-4 flex flex-col gap-4">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-mono text-xs uppercase tracking-[0.18em] text-white/70 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/brand-kit"
            onClick={() => setOpen(false)}
            className="font-mono text-xs uppercase tracking-[0.18em] bg-[#ff3b30] text-white px-4 py-3 text-center"
          >
            See the build flow →
          </a>
        </div>
      )}
    </header>
  );
};
