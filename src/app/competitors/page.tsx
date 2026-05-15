"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  RefreshCcw,
  Share2,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { Sidebar } from "@/components/v2/sidebar";
import { PageHeader } from "@/components/v2/page-header";
import { Button } from "@/components/v2/button";
import { VerdictPill } from "@/components/v2/verdict-pill";
import { Stat } from "@/components/v2/stat";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// Roster — detailed competitor profiles
// ─────────────────────────────────────────────────────────────────────

type Threat = "HIGH" | "MED" | "LOW";
type Stage = "Incumbent" | "Direct" | "Adjacent" | "Status quo" | "Premium leg" | "Volunteer";

type Competitor = {
  id: string;
  name: string;
  tag: string;
  stage: Stage;
  threat: Threat;
  pricing: string;
  reach: string;
  strength: string;
  gap: string;
  monthsToParity: number;
};

const ROSTER: Competitor[] = [
  {
    id: "01",
    name: "Uber / Lyft",
    tag: "The default app on every phone.",
    stage: "Incumbent",
    threat: "HIGH",
    pricing: "$14–22 / ride",
    reach: "Nationwide",
    strength: "Distribution. Price. Two taps.",
    gap: "Cold UX, untrained drivers, no family billing, can't price senior-auto premium.",
    monthsToParity: 4,
  },
  {
    id: "02",
    name: "GoGoGrandparent",
    tag: "Phone-call layer over Uber.",
    stage: "Direct",
    threat: "MED",
    pricing: "$0.27/min + $0.19 surcharge",
    reach: "US + Canada",
    strength: "Decade-old, trusted by senior phone-only riders.",
    gap: "No native fleet, no family billing, no driver vetting, no app for the daughter.",
    monthsToParity: 9,
  },
  {
    id: "03",
    name: "NEMT fleets",
    tag: "Medicaid-funded medical transport.",
    stage: "Adjacent",
    threat: "LOW",
    pricing: "Reimbursed",
    reach: "State-by-state",
    strength: "Wheelchair-equipped vans, medical credentialing.",
    gap: "Medical-only trips, no daily errands, archaic dispatch software.",
    monthsToParity: 18,
  },
  {
    id: "04",
    name: "Family & friends",
    tag: "The actual #1 alternative.",
    stage: "Status quo",
    threat: "HIGH",
    pricing: "Free (her time)",
    reach: "Universal",
    strength: "Free. Trusted. Familiar.",
    gap: "Burnout, missed work, frayed relationships. Unreliable when it matters.",
    monthsToParity: 0,
  },
  {
    id: "05",
    name: "Taxi · black car",
    tag: "Pre-app luxury rides.",
    stage: "Premium leg",
    threat: "LOW",
    pricing: "$28–48 / ride",
    reach: "Metro hubs",
    strength: "Phone bookable. Senior-comfortable.",
    gap: "Unreliable, no scheduling, no recurring driver, expensive per-trip.",
    monthsToParity: 24,
  },
  {
    id: "06",
    name: "Volunteer transit",
    tag: "Church + nonprofit programs.",
    stage: "Volunteer",
    threat: "LOW",
    pricing: "Free / donation",
    reach: "Hyperlocal",
    strength: "Trusted, free, community-anchored.",
    gap: "Limited hours, advance scheduling required, tiny capacity.",
    monthsToParity: 24,
  },
];

const FEATURES: Array<{
  feature: string;
  us: "yes" | "no" | "partial";
  uber: "yes" | "no" | "partial";
  gogo: "yes" | "no" | "partial";
  nemt: "yes" | "no" | "partial";
  family: "yes" | "no" | "partial";
}> = [
  { feature: "Phone-only booking", us: "yes", uber: "no", gogo: "yes", nemt: "yes", family: "yes" },
  { feature: "Family-pays billing", us: "yes", uber: "no", gogo: "no", nemt: "no", family: "no" },
  { feature: "Same driver, weekly", us: "yes", uber: "no", gogo: "no", nemt: "partial", family: "yes" },
  { feature: "Trained for senior care", us: "yes", uber: "no", gogo: "no", nemt: "yes", family: "no" },
  { feature: "Wheelchair accessible", us: "partial", uber: "partial", gogo: "no", nemt: "yes", family: "no" },
  { feature: "On-demand <15 min", us: "yes", uber: "yes", gogo: "yes", nemt: "no", family: "no" },
  { feature: "Scheduled recurring rides", us: "yes", uber: "no", gogo: "partial", nemt: "yes", family: "yes" },
  { feature: "Real-time route to family", us: "yes", uber: "yes", gogo: "no", nemt: "no", family: "no" },
  { feature: "Healthcare partner integration", us: "yes", uber: "no", gogo: "no", nemt: "yes", family: "no" },
  { feature: "Senior-auto insurance class", us: "yes", uber: "no", gogo: "no", nemt: "yes", family: "no" },
];

// ─────────────────────────────────────────────────────────────────────
// Pricing matrix data — ride length × competitor
// ─────────────────────────────────────────────────────────────────────

const PRICING_DATA = [
  { len: "5 min · grocery", us: 16, uber: 9, gogo: 14, taxi: 18 },
  { len: "12 min · dialysis", us: 22, uber: 15, gogo: 21, taxi: 28 },
  { len: "25 min · cardiology", us: 36, uber: 28, gogo: 38, taxi: 48 },
  { len: "45 min · airport drop", us: 58, uber: 52, gogo: 64, taxi: 84 },
];

// ─────────────────────────────────────────────────────────────────────
// Wedges
// ─────────────────────────────────────────────────────────────────────

type WedgeColor = "accent" | "go" | "caution" | "no-go";
const WEDGES: Array<{
  id: string;
  title: string;
  body: string;
  evidence: string;
  intensity: WedgeColor;
}> = [
  {
    id: "01",
    title: "Family-pays billing",
    body: "Uber and Lyft can't ship a 'someone-else-pays' model without restructuring their card-on-file architecture. We start there.",
    evidence: "Patent search · Stripe billing flow · 27 manual rides without a refund.",
    intensity: "accent",
  },
  {
    id: "02",
    title: "Senior-auto insurance class",
    body: "Senior-passenger commercial auto runs 1.8x baseline. Uber's pricing engine bleeds margin if they price for it. We price for it from day one.",
    evidence: "Underwriter LOI · 3 carrier quotes · risk consultant intake.",
    intensity: "go",
  },
  {
    id: "03",
    title: "Same driver, weekly",
    body: "Algorithmic matching is Uber's whole value prop. Asking it to give Mom 'the same driver every Tuesday' breaks their model. Trivial in ours.",
    evidence: "Phoenix pilot: 71% of riders kept the same driver across 4+ weeks.",
    intensity: "caution",
  },
  {
    id: "04",
    title: "Trained for senior care",
    body: "Driver vetting deeper than Uber's. CPR, fall-risk awareness, dementia-pattern recognition. One wrongful-death suit ends them. Different incentive curve.",
    evidence: "Driver curriculum · 12hr training spec · 2 plaintiff-counsel calls.",
    intensity: "no-go",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────

export default function CompetitorsPage() {
  const [activeId, setActiveId] = useState(ROSTER[0].id);
  const active = ROSTER.find((c) => c.id === activeId) ?? ROSTER[0];

  return (
    <div className="app-page-shell min-h-screen flex text-[--ink-0]">
      <Sidebar
        project={{ title: "Linden — rideshare for elders", verdict: "CAUTION", validatedAt: "26 APR 2026" }}
        user={{ name: "Sarah Chen", email: "sarah@studio.com", initial: "S" }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader
          kicker="COMPETITIVE FIELD · CASE №017"
          title="The room they're already in"
          meta={
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
              {ROSTER.length} mapped
            </span>
          }
          actions={
            <>
              <Button variant="ghost" size="sm">
                <RefreshCcw className="w-3.5 h-3.5" /> Re-run
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
              <Button size="sm">
                <Download className="w-3.5 h-3.5" /> Export
              </Button>
            </>
          }
        />

        <CompetitorsHero />

        <main className="flex-1 px-6 md:px-8 py-12 md:py-16 max-w-[1480px] w-full">
          <div className="space-y-20 md:space-y-24">
            <RosterBlock active={active} setActive={setActiveId} />
            <PositioningBlock />
            <FeatureMatrixBlock />
            <PricingBlock />
            <WedgeBlock />
            <SignatureBlock />
          </div>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────

function CompetitorsHero() {
  const high = ROSTER.filter((c) => c.threat === "HIGH").length;
  const direct = ROSTER.filter((c) => c.stage === "Direct" || c.stage === "Status quo").length;

  return (
    <section className="relative px-6 md:px-8 py-14 md:py-20 border-b border-[--line] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 88% 100%, color-mix(in srgb, var(--no-go) 6%, transparent), transparent 70%)",
        }}
      />
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-end">
        <div className="space-y-5 max-w-[760px]">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
            competitive intelligence · {ROSTER.length} alternatives mapped
          </div>
          <h1 className="font-serif text-[clamp(48px,7vw,112px)] leading-[0.92] tracking-[-0.04em] text-[--ink-0]">
            Map the room.
            <br />
            <em className="not-italic text-[--accent]">Pick the corner</em>
            <br />
            they can't reach.
          </h1>
          <p className="font-serif italic text-[clamp(18px,2vw,24px)] leading-[1.4] text-[--ink-1] max-w-[680px]">
            "Every founder underestimates the status quo. Family & friends is the #1 competitor — free, frayed, faithful."
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 md:gap-10 lg:pl-12 lg:border-l lg:border-[--line]">
          <Stat label="In the room" value={String(ROSTER.length)} size="lg" />
          <Stat
            label="High threat"
            value={<span className="text-[--no-go]">{high}</span>}
            size="lg"
          />
          <Stat label="Direct" value={String(direct)} size="lg" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// §01 Roster — competitor cards + detail panel
// ─────────────────────────────────────────────────────────────────────

function RosterBlock({
  active,
  setActive,
}: {
  active: Competitor;
  setActive: (id: string) => void;
}) {
  const threatColor = (t: Threat) =>
    t === "HIGH" ? "var(--no-go)" : t === "MED" ? "var(--caution)" : "var(--ink-2)";

  return (
    <section className="space-y-8">
      <SectionHeader number="01" title="Roster" right={`${ROSTER.length} alternatives · click to focus`} />
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-px bg-[--line] border border-[--line] rounded-[--radius] overflow-hidden">
        {/* List */}
        <div className="bg-[--bg] divide-y divide-[--line]">
          {ROSTER.map((c) => {
            const isActive = active.id === c.id;
            return (
              <button
                key={c.id}
                data-cursor="snap"
                onClick={() => setActive(c.id)}
                className={cn(
                  "w-full grid grid-cols-[40px_1fr_88px_60px] gap-4 px-7 py-5 items-center text-left transition-colors",
                  isActive ? "bg-[--surface-1]" : "hover:bg-[--surface-1]"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 w-[2px] h-12 bg-[--accent]" />
                )}
                <div className="font-mono text-[12px] tabular-nums text-[--ink-2]">
                  {c.id}
                </div>
                <div className="space-y-1 min-w-0">
                  <div
                    className={cn(
                      "font-serif text-[20px] tracking-[-0.015em] truncate",
                      isActive ? "text-[--ink-0]" : "text-[--ink-1]"
                    )}
                  >
                    {c.name}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">
                    {c.stage}
                  </div>
                </div>
                <div className="font-mono text-[12px] tabular-nums text-[--ink-1] text-right">
                  {c.pricing.split("/")[0].trim()}
                </div>
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-right"
                  style={{ color: threatColor(c.threat) }}
                >
                  {c.threat}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel — sticky */}
        <aside className="bg-[--surface-1] p-7 md:p-9 flex flex-col gap-6 noise relative">
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
              {active.id} · {active.stage.toLowerCase()}
            </div>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.16em]"
              style={{ color: threatColor(active.threat) }}
            >
              ● {active.threat} threat
            </span>
          </div>
          <div>
            <h3 className="font-serif text-[clamp(36px,4vw,56px)] leading-[1.05] tracking-[-0.025em] text-[--ink-0]">
              {active.name}
            </h3>
            <p className="font-serif italic text-[20px] leading-[1.3] text-[--ink-1] mt-3">
              "{active.tag}"
            </p>
          </div>

          <div className="space-y-4 pt-5 border-t border-[--line]">
            <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                pricing
              </span>
              <span className="font-mono text-[14px] text-[--ink-0]">{active.pricing}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                reach
              </span>
              <span className="text-[14px] text-[--ink-0]">{active.reach}</span>
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-4 items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                parity ETA
              </span>
              <span className="font-mono text-[14px] tabular-nums text-[--ink-0]">
                {active.monthsToParity === 0 ? "—" : `${active.monthsToParity} mo`}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-5 border-t border-[--line]">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--go] mb-2">
                ✦ their strength
              </div>
              <p className="font-serif text-[16px] leading-[1.5] text-[--ink-0]">
                {active.strength}
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--no-go] mb-2">
                ✕ their gap
              </div>
              <p className="font-serif text-[16px] leading-[1.5] text-[--ink-0]">
                {active.gap}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// §02 Positioning — 2x2 quadrant
// ─────────────────────────────────────────────────────────────────────

function PositioningBlock() {
  const competitors: Array<{ id: string; x: number; y: number; us?: boolean }> = [
    { id: "Uber / Lyft", x: 0.78, y: 0.18 },
    { id: "GoGoGrandparent", x: 0.55, y: 0.50 },
    { id: "NEMT fleets", x: 0.85, y: 0.78 },
    { id: "Family & friends", x: 0.10, y: 0.90 },
    { id: "Taxi", x: 0.86, y: 0.42 },
    { id: "Volunteers", x: 0.22, y: 0.82 },
    { id: "Linden (us)", x: 0.68, y: 0.86, us: true },
  ];

  const W = 720;
  const H = 460;
  const PAD = 64;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const sx = (v: number) => PAD + v * innerW;
  const sy = (v: number) => H - PAD - v * innerH;
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="space-y-8">
      <SectionHeader number="02" title="Positioning" right="price × personalization" />
      <div className="border border-[--line] rounded-[--radius] p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-10 items-center">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label="Positioning quadrant">
          {[
            { l: "Mass-market premium", x: 0.75, y: 0.25 },
            { l: "Concierge", x: 0.75, y: 0.75 },
            { l: "Commodity", x: 0.25, y: 0.25 },
            { l: "Niche utility", x: 0.25, y: 0.75 },
          ].map((q) => (
            <text
              key={q.l}
              x={sx(q.x)}
              y={sy(q.y)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fontFamily="var(--app-font-mono)"
              fill="var(--ink-3)"
              letterSpacing="0.18em"
              style={{ textTransform: "uppercase" as const }}
            >
              {q.l}
            </text>
          ))}
          <line x1={PAD} x2={W - PAD} y1={H / 2} y2={H / 2} stroke="var(--line)" strokeDasharray="2 4" />
          <line x1={W / 2} x2={W / 2} y1={PAD} y2={H - PAD} stroke="var(--line)" strokeDasharray="2 4" />
          <text x={W - PAD} y={H - 18} textAnchor="end" fontSize="10" fontFamily="var(--app-font-mono)" fill="var(--ink-2)" letterSpacing="0.16em" style={{ textTransform: "uppercase" as const }}>price · high →</text>
          <text x={PAD} y={H - 18} textAnchor="start" fontSize="10" fontFamily="var(--app-font-mono)" fill="var(--ink-2)" letterSpacing="0.16em" style={{ textTransform: "uppercase" as const }}>← low</text>
          <text x={20} y={PAD} fontSize="10" fontFamily="var(--app-font-mono)" fill="var(--ink-2)" letterSpacing="0.16em" style={{ textTransform: "uppercase" as const }}>↑ personal</text>
          <text x={20} y={H - PAD - 6} fontSize="10" fontFamily="var(--app-font-mono)" fill="var(--ink-2)" letterSpacing="0.16em" style={{ textTransform: "uppercase" as const }}>↓ generic</text>
          <rect x={PAD} y={PAD} width={innerW} height={innerH} fill="none" stroke="var(--line-strong)" />

          {competitors.map((c) => {
            const isH = hovered === c.id;
            return (
              <g
                key={c.id}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {c.us && (
                  <circle
                    cx={sx(c.x)}
                    cy={sy(c.y)}
                    r={isH ? 24 : 18}
                    fill="var(--accent-soft)"
                    stroke="var(--accent)"
                    strokeWidth={1}
                    style={{ transition: "r 200ms ease" }}
                  />
                )}
                <circle
                  cx={sx(c.x)}
                  cy={sy(c.y)}
                  r={c.us ? (isH ? 9 : 7) : isH ? 7 : 5}
                  fill={c.us ? "var(--accent)" : "var(--ink-1)"}
                  stroke="var(--bg)"
                  strokeWidth={2}
                  style={{ transition: "r 200ms ease" }}
                />
                <text
                  x={sx(c.x) + 12}
                  y={sy(c.y) + 4}
                  fontSize="11"
                  fontFamily="var(--app-font-sans)"
                  fontWeight={c.us ? 600 : 400}
                  fill={c.us || isH ? "var(--ink-0)" : "var(--ink-1)"}
                  style={{ transition: "fill 150ms ease" }}
                >
                  {c.id}
                </text>
                <circle cx={sx(c.x)} cy={sy(c.y)} r={28} fill="transparent" />
              </g>
            );
          })}
        </svg>

        <div className="space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
            our wedge
          </div>
          <p className="font-serif text-[24px] leading-[1.2] tracking-[-0.015em] text-[--ink-0]">
            High-trust, high-touch service in the corner the giants can't reach without losing margin.
          </p>
          <ul className="space-y-2 pt-4 border-t border-[--line]">
            {[
              ["Concierge", "Trained drivers + manual dispatch beat algorithmic matching."],
              ["Premium price", "Family-pays absorbs the price ceiling that limits Uber/Lyft."],
              ["Niche utility", "We don't compete on commute trips. We own the dialysis trip."],
            ].map(([k, v]) => (
              <li key={k} className="grid grid-cols-[100px_1fr] gap-3 items-baseline">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--accent]">{k}</span>
                <span className="text-[13px] text-[--ink-1]">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// §03 Feature matrix — 10 features × 5 columns
// ─────────────────────────────────────────────────────────────────────

function FeatureMatrixBlock() {
  type Mark = "yes" | "no" | "partial";
  const cellGlyph = (m: Mark) => {
    if (m === "yes") return <Sparkles className="w-3.5 h-3.5 text-[--accent] mx-auto" />;
    if (m === "partial") return <span className="font-mono text-[14px] text-[--caution]">±</span>;
    return <span className="font-mono text-[14px] text-[--ink-3]">—</span>;
  };

  return (
    <section className="space-y-8">
      <SectionHeader
        number="03"
        title="Feature matrix"
        right={`${FEATURES.length} capabilities × 5`}
      />
      <div className="border border-[--line] rounded-[--radius] overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] bg-[--surface-1] border-b border-[--line]">
          <div className="px-5 md:px-7 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]" />
          <div className="px-3 md:px-5 py-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[--accent]">
            Us · Linden
          </div>
          {["Uber", "GoGo", "NEMT", "Family"].map((c) => (
            <div
              key={c}
              className="px-3 md:px-5 py-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]"
            >
              {c}
            </div>
          ))}
        </div>
        {FEATURES.map((f, i) => (
          <div
            key={f.feature}
            className={cn(
              "grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center hover:bg-[--surface-1] transition-colors",
              i > 0 && "border-t border-[--line]"
            )}
          >
            <div className="px-5 md:px-7 py-5 text-[14px] text-[--ink-0]">{f.feature}</div>
            <div className="px-3 md:px-5 py-5 grid place-items-center bg-[--accent-soft]/30">
              {cellGlyph(f.us)}
            </div>
            <div className="px-3 md:px-5 py-5 grid place-items-center">{cellGlyph(f.uber)}</div>
            <div className="px-3 md:px-5 py-5 grid place-items-center">{cellGlyph(f.gogo)}</div>
            <div className="px-3 md:px-5 py-5 grid place-items-center">{cellGlyph(f.nemt)}</div>
            <div className="px-3 md:px-5 py-5 grid place-items-center">{cellGlyph(f.family)}</div>
          </div>
        ))}
        <div className="px-5 md:px-7 py-4 bg-[--surface-1] border-t border-[--line] flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">
          <span className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[--accent]" /> shipped
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[--caution]">±</span> partial
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[--ink-3]">—</span> not present
          </span>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// §04 Pricing dynamics
// ─────────────────────────────────────────────────────────────────────

function PricingBlock() {
  const max = Math.max(
    ...PRICING_DATA.flatMap((d) => [d.us, d.uber, d.gogo, d.taxi])
  );
  const cols = [
    { key: "uber", label: "Uber", color: "var(--ink-2)" },
    { key: "gogo", label: "GoGo", color: "var(--ink-1)" },
    { key: "us", label: "Us", color: "var(--accent)" },
    { key: "taxi", label: "Taxi", color: "var(--ink-2)" },
  ] as const;

  return (
    <section className="space-y-8">
      <SectionHeader
        number="04"
        title="Pricing dynamics"
        right="ride length × $"
      />
      <div className="border border-[--line] rounded-[--radius] overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-6 px-7 py-3 bg-[--surface-1] border-b border-[--line] font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
          <div>scenario</div>
          {cols.map((c) => (
            <div key={c.key} className="text-right" style={{ color: c.key === "us" ? "var(--accent)" : "inherit" }}>
              {c.label}
            </div>
          ))}
        </div>
        {PRICING_DATA.map((row, i) => (
          <div
            key={row.len}
            className={cn(
              "grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-6 px-5 md:px-7 py-6 items-center hover:bg-[--surface-1] transition-colors",
              i > 0 && "border-t border-[--line]"
            )}
          >
            <div className="text-[14px] text-[--ink-0]">{row.len}</div>
            {cols.map((c) => {
              const v = row[c.key];
              const pct = (v / max) * 100;
              return (
                <div key={c.key} className="space-y-1.5">
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className="font-mono text-[15px] tabular-nums"
                      style={{ color: c.key === "us" ? "var(--accent)" : "var(--ink-0)" }}
                    >
                      ${v}
                    </span>
                  </div>
                  <div className="h-[4px] bg-[--line] overflow-hidden rounded-[1px]">
                    <div
                      className="h-full transition-[width] duration-700 ease-out"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// §05 Wedges
// ─────────────────────────────────────────────────────────────────────

function WedgeBlock() {
  const colorOf = (c: WedgeColor) =>
    c === "accent"
      ? "var(--accent)"
      : c === "go"
      ? "var(--go)"
      : c === "caution"
      ? "var(--caution)"
      : "var(--no-go)";

  return (
    <section className="space-y-8">
      <SectionHeader
        number="05"
        title="Wedges"
        right={`${WEDGES.length} reasons we win`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[--line] border border-[--line] rounded-[--radius] overflow-hidden">
        {WEDGES.map((w) => (
          <article
            key={w.id}
            data-cursor="snap"
            className="bg-[--bg] p-7 md:p-9 hover:bg-[--surface-1] transition-colors flex flex-col gap-5 group"
          >
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                wedge {w.id}
              </div>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: colorOf(w.intensity) }}
              />
            </div>
            <h3 className="font-serif text-[clamp(28px,3.2vw,40px)] leading-[1.05] tracking-[-0.02em] text-[--ink-0]">
              {w.title}
            </h3>
            <p className="text-[15px] leading-[1.65] text-[--ink-1]">{w.body}</p>
            <div className="mt-auto pt-5 border-t border-[--line] font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">
              evidence · {w.evidence}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Signature
// ─────────────────────────────────────────────────────────────────────

function SignatureBlock() {
  return (
    <div className="pt-10 border-t border-[--line] flex flex-wrap items-baseline justify-between gap-4">
      <div className="space-y-1">
        <p className="font-serif italic text-[18px] text-[--ink-0]">
          — Competitive intelligence brief
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
          v1 · 03 MAY 2026 · case №017 · {ROSTER.length} alternatives · {FEATURES.length} features · {WEDGES.length} wedges
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/results">
          <Button variant="ghost" size="sm">
            ← Back to verdict
          </Button>
        </Link>
        <Button size="sm">
          Export brief
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SectionHeader({
  number,
  title,
  right,
}: {
  number: string;
  title: string;
  right?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 pb-4 border-b border-[--line]">
      <div className="flex items-baseline gap-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--ink-2]">
          §{number}
        </span>
        <h2 className="font-serif text-[clamp(28px,3vw,40px)] tracking-[-0.02em] text-[--ink-0]">
          {title}
        </h2>
      </div>
      {right && (
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
          {right}
        </div>
      )}
    </div>
  );
}
