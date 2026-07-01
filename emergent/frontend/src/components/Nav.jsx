import { Link } from "react-router-dom";

// The signature red highlight box on headline keywords
export const Box = ({ children, className = "" }) => (
  <span className={`pd-box ${className}`} data-testid="red-box-highlight">
    {children}
  </span>
);

// Minimal nav for landing + scanning pages
export const MinimalNav = () => (
  <nav
    className="w-full border-b border-[#1a1a1a]"
    data-testid="minimal-nav"
  >
    <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center">
      <Link to="/commerce" data-testid="nav-logo-minimal">
        <span className="pd-box font-display text-xl px-2 py-0.5">PD</span>
      </Link>
    </div>
  </nav>
);

// Full nav for verdict / agent / monitor
export const FullNav = ({ active }) => {
  const items = [
    { label: "VERDICT", to: "/commerce/verdict" },
    { label: "AGENT", to: "/commerce/agent" },
    { label: "MONITOR", to: "/commerce/monitor" },
  ];
  return (
    <nav
      className="w-full border-b border-[#1a1a1a] sticky top-0 z-50 bg-black"
      data-testid="full-nav"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/commerce"
          className="flex items-center gap-3 shrink-0"
          data-testid="nav-logo-full"
        >
          <span className="pd-box font-display text-lg px-2 py-0.5">PD</span>
          <span className="font-mono text-[11px] text-[#888888] uppercase tracking-wider hidden sm:inline">
            · AI Commerce
          </span>
        </Link>

        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
          {items.map((it) => (
            <Link
              key={it.label}
              to={it.to}
              data-testid={`nav-link-${it.label.toLowerCase()}`}
              className={`font-mono text-[12px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                active === it.label
                  ? "text-[#2d6bff]"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              {it.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className="font-mono text-[11px] text-[#888888] hidden md:inline"
            data-testid="nav-credits"
          >
            705 CR
          </span>
          <Link to="/commerce">
            <button className="pd-btn-secondary text-[11px] py-2 px-3" data-testid="nav-new-scan">
              NEW SCAN →
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

// Scrolling marquee ticker
export const Marquee = ({ text }) => {
  const unit = ` ${text} `;
  return (
    <div className="pd-marquee" data-testid="marquee-ticker">
      <div className="pd-marquee-track">
        <span>{unit.repeat(2)}</span>
        <span>{unit.repeat(2)}</span>
      </div>
    </div>
  );
};
