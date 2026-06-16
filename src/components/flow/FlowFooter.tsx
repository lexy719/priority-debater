import Link from "next/link";

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Journey",
    links: [
      { label: "Validate an idea", href: "/#validate" },
      { label: "The Chamber", href: "/debate" },
      { label: "Your report", href: "/results" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Brand Kit", href: "/brand-kit" },
      { label: "Launch Kit", href: "/launch-kit" },
      { label: "Landing builder", href: "/landing-builder" },
      { label: "Pitch deck", href: "/pitch" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "The Dossier", href: "/#report" },
      { label: "FAQ", href: "/#faq" },
      { label: "Five adversarial agents", href: "/#chamber" },
    ],
  },
];

export function FlowFooter() {
  return (
    <footer data-testid="flow-footer" className="bg-[#0a0a0a] text-white border-t-[1.5px] border-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-9 h-9 bg-[#ff3b30] text-white font-display text-lg leading-none pt-0.5">
                PD
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.25em]">Priority Debater</span>
            </div>
            <p className="mt-5 text-sm text-white/50 font-body leading-relaxed max-w-xs">
              Validation built for founders who&apos;d rather hear it now than learn it after launch.
            </p>
            <span className="mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff3b30]">
              Built to disagree
            </span>
          </div>

          {COLS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="font-body text-sm text-white/65 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            © {new Date().getFullYear()} Priority Debater — All verdicts final.
          </p>
          <div className="flex gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
