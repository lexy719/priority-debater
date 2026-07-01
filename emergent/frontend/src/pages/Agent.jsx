import { useState } from "react";
import { ChevronRight, Copy, Check } from "lucide-react";
import { Box, FullNav } from "../components/Nav";
import { Section, Meta } from "../components/Blocks";

const fixes = [
  {
    state: "done",
    name: "AI crawlers are blocked from reading your store",
    meaning: "ChatGPT literally cannot see your products right now.",
    file: "llms.txt",
    note: "llms.txt generated — copy and paste to your store root.",
    code: "# llms.txt — colchaoemma.pt\nUser-Agent: *\nAllow: /\nSitemap: https://colchaoemma.pt/sitemap.xml\nCatalog: https://colchaoemma.pt/llms-catalog.json",
    pts: 20,
  },
  {
    state: "done",
    name: "Your products are invisible to AI",
    meaning: "AI can't read prices, titles or stock without product schema.",
    file: "product.jsonld",
    note: "Product schema generated — add to each product page.",
    code: '{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Emma Original Colchão",\n  "offers": { "@type": "Offer", "price": "499.00", "priceCurrency": "EUR" }\n}',
    pts: 18,
  },
  {
    state: "done",
    name: "Search bots are being turned away",
    meaning: "Your robots.txt blocks the exact agents that recommend stores.",
    file: "robots.txt",
    note: "robots.txt updated — GPTBot and Google-Extended now allowed.",
    code: "User-agent: GPTBot\nAllow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /",
    pts: 12,
  },
  {
    state: "progress",
    name: "Your reviews are invisible to AI",
    meaning: "AI can't quote your ratings when buyers ask for the best.",
    file: "aggregaterating",
    note: "Review markup generating...",
    code: "[generating]... [verifying domain]... [checking crawlers]...",
    pts: 14,
  },
  {
    state: "pending",
    name: "Common buyer questions go unanswered",
    meaning: "AI skips you when shoppers ask about delivery, trials or firmness.",
    file: "faq.schema",
    note: "FAQ schema queued.",
    pts: 9,
  },
  {
    state: "pending",
    name: "Nothing compares you to rivals",
    meaning: "AI cites comparison pages — you don't have a single one.",
    file: "compare.md",
    note: "Comparison content queued.",
    pts: 11,
  },
  {
    state: "pending",
    name: "No one else vouches for you",
    meaning: "AI trusts stores that other sites link to. Nobody links to you.",
    file: "outreach.csv",
    note: "Off-site citation outreach queued.",
    pts: 14,
  },
];

const ScoreWidget = () => (
  <div className="pd-card p-6 w-full max-w-sm" data-testid="agent-score-widget">
    <div className="flex items-start justify-between mb-4">
      <span className="w-4 h-4 inline-block bg-[#2d6bff]" />
      <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider">LIVE</span>
    </div>
    <div className="pd-label mb-4">AI VISIBILITY SCORE</div>
    <div className="flex items-center gap-3 font-display text-6xl leading-none">
      <span className="text-[#555555]">22</span>
      <span className="text-[#2d6bff] text-3xl">→</span>
      <span className="text-[#2d6bff]">47</span>
    </div>
    <div className="pd-progress-track mt-6">
      <div className="pd-progress-fill" style={{ width: "47%" }} />
    </div>
    <div className="font-mono text-[11px] text-[#888888] mt-4">
      3 of 7 fixes shipped · score <span className="text-[#22c55e]">+25 points</span>
    </div>
  </div>
);

const FixCard = ({ fix }) => {
  const done = fix.state === "done";
  const prog = fix.state === "progress";
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const doCopy = () => {
    Promise.resolve(navigator.clipboard?.writeText(fix.code || "")).catch(
      () => {},
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const status = done ? (
    <span className="text-[#22c55e]">✓</span>
  ) : prog ? (
    <span className="text-[#2d6bff] pd-pulse">→</span>
  ) : (
    <span className="text-[#e8272a]">✕</span>
  );

  return (
    <div
      className={`bg-white border p-5 ${prog ? "border-[#2d6bff]" : "border-black/20"}`}
      data-testid={`fix-card-${fix.state}`}
    >
      <div className="flex items-start gap-4">
        <span className="font-mono text-lg w-4 shrink-0">{status}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold uppercase text-[15px] tracking-wide text-black">{fix.name}</div>
          <div className="text-[13px] text-black/55 mt-1">{fix.meaning}</div>
        </div>
        <span className={`font-mono text-[12px] shrink-0 ${done ? "text-[#22c55e]" : "text-black/40"}`}>
          +{fix.pts} PTS
        </span>
      </div>

      {prog && (
        <div className="ml-8 mt-4">
          <div className="pd-progress-track bg-black/10">
            <div className="pd-progress-fill" style={{ width: "55%" }} />
          </div>
          <div className="font-mono text-[11px] text-[#2d6bff] mt-2 truncate">{fix.code}</div>
        </div>
      )}

      {done && (
        <div className="ml-8 mt-4 border-t border-black/10 pt-3">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 font-mono text-[11px] text-black/60 hover:text-black"
            data-testid={`fix-file-toggle-${fix.file}`}
          >
            <ChevronRight size={13} className={`transition-transform ${open ? "rotate-90" : ""}`} />
            {fix.note}
          </button>
          {open && (
            <div className="mt-3 bg-[#0a0a0a] border border-[#1a1a1a] p-4 relative">
              <pre className="font-mono text-[11px] text-[#888888] whitespace-pre-wrap break-words pr-16">{fix.code}</pre>
              <button
                onClick={doCopy}
                className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[10px] uppercase text-white bg-[#2d6bff] px-2 py-1"
                data-testid={`fix-copy-${fix.file}`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function Agent() {
  return (
    <div className="min-h-screen bg-black">
      <FullNav active="AGENT" />

      {/* Hero (BLACK) */}
      <Section variant="black" testid="agent-hero">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
          <div>
            <Meta>→ 01 / AGENT / FIXING YOUR STORE NOW</Meta>
            <h1 className="font-display uppercase text-white leading-[0.95] text-[clamp(2.4rem,7vw,5.5rem)] mt-5">
              Shipping the <Box>fix.</Box>
            </h1>
            <p className="text-white text-base sm:text-lg mt-6 max-w-xl">
              Here's what's blocking AI agents from recommending you. The agent
              is fixing them now — in plain English. You just watch.
            </p>
          </div>
          <ScoreWidget />
        </div>
      </Section>

      {/* Fix queue (CREAM) */}
      <Section variant="cream" testid="agent-queue">
        <Meta variant="cream">→ 02 / RESOLVING ISSUES / 7 FOUND</Meta>
        <h2 className="font-display uppercase text-black leading-[0.95] text-[clamp(1.8rem,5vw,3.5rem)] mt-4 mb-10">
          Red X to <Box>green check.</Box>
        </h2>
        <div className="space-y-3" data-testid="fix-queue">
          {fixes.slice(0, 3).map((f, i) => (
            <FixCard key={i} fix={f} />
          ))}

          {/* Email capture — appears at halfway */}
          <div
            className="my-6 bg-[#0a0a0a] border-t-2 border-[#2d6bff] border-x border-b border-x-[#1a1a1a] border-b-[#1a1a1a] p-6"
            data-testid="halfway-banner"
          >
            <Meta className="mb-3">→ HALFWAY THERE</Meta>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <p className="text-white text-base max-w-md">
                Want to know when your score moves? Drop your email — we'll tell
                you when AI starts naming you.
              </p>
              <div className="flex gap-3 w-full md:w-auto">
                <input className="pd-input flex-1 md:w-64" placeholder="you@store.com" data-testid="halfway-email-input" />
                <button className="pd-btn-yellow" data-testid="halfway-submit">SUBMIT</button>
              </div>
            </div>
          </div>

          {fixes.slice(3).map((f, i) => (
            <FixCard key={i + 3} fix={f} />
          ))}
        </div>
      </Section>

      {/* Projected outcomes (CREAM continues -> use BLACK for rhythm) */}
      <Section variant="black" testid="agent-projected">
        <Meta>→ 03 / WHEN ALL FIXES SHIP / WHAT CHANGES</Meta>
        <div className="grid sm:grid-cols-3 gap-4 mt-6" data-testid="projected-stats">
          {[
            { label: "INDEX 01", color: "#2d6bff", title: "Score", value: "22 → 71" },
            { label: "INDEX 02", color: "#22c55e", title: "AI mentions", value: "0/5 → 3/5" },
            { label: "INDEX 03", color: "#f5c842", title: "Est. monthly recovery", value: "€14,000" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <div className="flex items-start justify-between mb-5">
                <span className="w-4 h-4 inline-block" style={{ background: s.color }} />
                <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="font-display text-3xl sm:text-4xl text-white">{s.value}</div>
              <div className="font-mono text-[11px] text-[#888888] uppercase mt-3">{s.title}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
