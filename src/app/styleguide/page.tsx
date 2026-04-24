import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Copy, Search, AlertTriangle, CircleCheck, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

// ── Section wrapper ─────────────────────────────────────────────
function Section({
  id,
  kicker,
  title,
  description,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-[--line] pt-16 pb-4">
      <div className="mb-8 max-w-2xl">
        <p className="caption mb-3">{kicker}</p>
        <h2 className="h1 mb-3">{title}</h2>
        {description && <p className="body">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ── Swatch tile ─────────────────────────────────────────────────
function Swatch({
  label,
  token,
  value,
  swatch,
  dark = false,
}: {
  label: string;
  token: string;
  value: string;
  swatch: React.CSSProperties;
  dark?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[--r] border border-[--line]">
      <div
        className="h-20 border-b border-[--line]"
        style={swatch}
        aria-label={`${label} — ${value}`}
      />
      <div className="space-y-1 p-3" style={{ background: dark ? "var(--surface-1)" : "var(--bg)" }}>
        <p className="text-[13px] font-medium text-[--ink-0]">{label}</p>
        <p className="font-mono text-[11px] text-[--ink-2]">{token}</p>
        <p className="font-mono text-[11px] text-[--ink-1]">{value}</p>
      </div>
    </div>
  );
}

// ── Spec row ────────────────────────────────────────────────────
function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[--line-soft] py-2 last:border-0">
      <span className="caption">{label}</span>
      <code className="font-mono text-[12px] text-[--ink-1]">{value}</code>
    </div>
  );
}

export default function StyleGuidePage() {
  const sections = [
    ["identity", "Identity"],
    ["colour", "Colour"],
    ["typography", "Typography"],
    ["signature", "Signature — serif numbers"],
    ["buttons", "Buttons"],
    ["inputs", "Inputs"],
    ["cards", "Cards & surfaces"],
    ["badges", "Badges"],
    ["dividers", "Dividers"],
    ["motion", "Motion"],
  ] as const;

  return (
    <div className="min-h-screen bg-[--bg] text-[--ink-0]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 border-b border-[--line] bg-[--bg]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="caption">Priority Debater</span>
            <span className="text-[--ink-2]">/</span>
            <span className="text-[13px] font-medium text-[--ink-0]">Styleguide</span>
          </div>
          <Link
            href="/"
            className="text-[13px] text-[--ink-1] hover:text-[--ink-0] transition-colors"
          >
            Back to site
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-[220px_minmax(0,1fr)] gap-12 px-6 py-16 lg:gap-16">
        {/* ── Side nav ── */}
        <nav className="sticky top-24 hidden h-fit lg:block">
          <p className="caption mb-3">On this page</p>
          <ul className="space-y-1.5">
            {sections.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="block text-[13px] text-[--ink-1] hover:text-[--ink-0] transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Content ── */}
        <div className="col-span-full lg:col-span-1">
          {/* Hero */}
          <div id="identity" className="mb-16 scroll-mt-24">
            <p className="caption mb-5">Editorial Dossier · v1</p>
            <h1 className="display mb-6">A system, not a palette.</h1>
            <p className="body max-w-xl">
              Priority Debater's visual identity is an editorial one. Numbers are set in serif.
              Interface is set in sans. Colour appears only for status, hierarchy, and data — never
              decoration. This page is the reference.
            </p>

            {/* Signature tease: a big serif number */}
            <div className="mt-10 flex items-end gap-6 rounded-[--r] border border-[--line] bg-[--surface-1] p-8">
              <div>
                <p className="caption mb-2">Viability score</p>
                <div className="flex items-baseline gap-2">
                  <span className="num-xl">72</span>
                  <span className="text-[--ink-2]">/ 100</span>
                </div>
              </div>
              <div className="flex-1 border-l border-[--line] pl-6">
                <p className="caption mb-2">Signature</p>
                <p className="body">
                  Every numeric value on the site is typeset in{" "}
                  <em className="font-serif italic text-[--ink-0]">Instrument Serif</em>. Interface
                  stays in Geist Sans. Violate this rule and the signature disappears.
                </p>
              </div>
            </div>
          </div>

          {/* ── Colour ── */}
          <Section
            id="colour"
            kicker="§ 01"
            title="Colour"
            description="Four ink shades, four surface tones, one accent, three semantic states. That's the palette. If something is coloured, answer: is this signalling status, hierarchy, or data? If not, remove the colour."
          >
            <p className="caption mb-3">Surfaces</p>
            <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Swatch label="Background" token="--bg" value="#0D0D0F" swatch={{ background: "var(--bg)" }} dark />
              <Swatch label="Surface 1" token="--surface-1" value="#16161A" swatch={{ background: "var(--surface-1)" }} dark />
              <Swatch label="Surface 2" token="--surface-2" value="#1C1C20" swatch={{ background: "var(--surface-2)" }} dark />
              <Swatch label="Surface 3" token="--surface-3" value="#23232A" swatch={{ background: "var(--surface-3)" }} dark />
            </div>

            <p className="caption mb-3">Ink (neutral family)</p>
            <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Swatch label="Ink 0 — primary" token="--ink-0" value="#F4F4F5" swatch={{ background: "var(--ink-0)" }} dark />
              <Swatch label="Ink 1 — secondary" token="--ink-1" value="#A1A1AA" swatch={{ background: "var(--ink-1)" }} dark />
              <Swatch label="Ink 2 — tertiary" token="--ink-2" value="#52525B" swatch={{ background: "var(--ink-2)" }} dark />
              <Swatch label="Ink 3 — muted" token="--ink-3" value="#27272A" swatch={{ background: "var(--ink-3)" }} dark />
            </div>

            <p className="caption mb-3">Accent (the only decorative colour)</p>
            <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Swatch label="Accent — document gold" token="--accent" value="#E8C547" swatch={{ background: "var(--accent)" }} dark />
              <Swatch label="Accent soft" token="--accent-soft" value="rgba(232,197,71,.12)" swatch={{ background: "var(--accent-soft)" }} dark />
              <Swatch label="Accent strong" token="--accent-strong" value="rgba(232,197,71,.35)" swatch={{ background: "var(--accent-strong)" }} dark />
            </div>

            <p className="caption mb-3">Semantic (status only)</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Swatch label="Success — GO" token="--success" value="#5CB88A" swatch={{ background: "var(--success)" }} dark />
              <Swatch label="Warning — CAUTION" token="--warning" value="#E8A54B" swatch={{ background: "var(--warning)" }} dark />
              <Swatch label="Error — NO-GO" token="--error" value="#D46F5C" swatch={{ background: "var(--error)" }} dark />
            </div>
          </Section>

          {/* ── Typography ── */}
          <Section
            id="typography"
            kicker="§ 02"
            title="Typography"
            description="Geist Sans for interface. Instrument Serif for numbers and display. Geist Mono for code. Nothing else."
          >
            <div className="space-y-10">
              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.display</p>
                <div>
                  <p className="display">A system, not a palette.</p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Instrument Serif · 44–64px · 1.02 · -0.025em</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.h1</p>
                <div>
                  <p className="h1">Stress-test your startup idea.</p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Sans · 28–36px · 600 · 1.15 · -0.02em</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.h2</p>
                <div>
                  <p className="h2">Market & competition</p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Sans · 22px · 600 · 1.3 · -0.015em</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.h3</p>
                <div>
                  <p className="h3">Customer segments</p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Sans · 16px · 600 · 1.4 · -0.01em</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.body</p>
                <div>
                  <p className="body max-w-prose">
                    Five AI personas stress-test your startup idea — investor, customer, operator,
                    mentor, adversary. Get a 0–100 viability rubric and an action plan in about two
                    minutes.
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Sans · 14px · 400 · 1.55</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.small</p>
                <div>
                  <p className="small max-w-prose">
                    Typical run finishes in 60–120 seconds. Report opens automatically.
                  </p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Sans · 13px · 400 · 1.5</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6 border-b border-[--line] pb-6">
                <p className="caption">.caption</p>
                <div>
                  <p className="caption">Idea validation</p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Sans · 11px · 500 · 1.4 · +0.08em · uppercase</p>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-6">
                <p className="caption">.mono</p>
                <div>
                  <p className="mono">GET /api/validate → 200 ok</p>
                  <p className="mt-3 font-mono text-[11px] text-[--ink-2]">Geist Mono · 13px · 400 · 1.5</p>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Signature move: serif numbers ── */}
          <Section
            id="signature"
            kicker="§ 03"
            title="The signature move"
            description="Every numeric value on the site is set in Instrument Serif. Interface stays in Geist Sans. This is the most important rule in the system — it's what makes the brand recognisable."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                <p className="caption mb-3">.num-xl — hero</p>
                <div className="flex items-baseline gap-2">
                  <span className="num-xl">68</span>
                  <span className="text-[--ink-2]">/ 100</span>
                </div>
                <p className="small mt-4 text-[--ink-2]">Viability score, TAM, headline stat.</p>
              </div>

              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                <p className="caption mb-3">.num-lg — tile</p>
                <p className="num-lg">$2.4B</p>
                <p className="small mt-4 text-[--ink-2]">Stat tiles, dashboard metrics.</p>
              </div>

              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                <p className="caption mb-3">.num — card</p>
                <p className="num">4.2 mo</p>
                <p className="small mt-4 text-[--ink-2]">Payback, CAC, category score.</p>
              </div>

              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                <p className="caption mb-3">.num-sm — inline</p>
                <p className="body">
                  Retention sits at <span className="num-sm">78%</span> through month six, which
                  beats the category median of <span className="num-sm">62%</span>.
                </p>
                <p className="small mt-4 text-[--ink-2]">Numbers inside prose.</p>
              </div>
            </div>

            <div className="mt-6 rounded-[--r] border border-[--line-strong] bg-[--surface-1] p-6">
              <p className="caption mb-3">Rule of thumb</p>
              <p className="body">
                If a value is a <em className="italic text-[--ink-0]">number</em> — score, price,
                date, duration, count — it's serif. If it's a <em className="italic text-[--ink-0]">label</em> or{" "}
                <em className="italic text-[--ink-0]">description</em>, it's sans. No in-between.
              </p>
            </div>
          </Section>

          {/* ── Buttons ── */}
          <Section
            id="buttons"
            kicker="§ 04"
            title="Buttons"
            description="One primary per visible region. Secondary and ghost do the rest. No gradients, no shimmer, no shadow."
          >
            <div className="space-y-8">
              <div>
                <p className="caption mb-3">Primary</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] bg-[--accent] px-5 py-3 text-sm font-medium text-[--bg] transition-[filter] hover:brightness-95">
                    Run validation
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] bg-[--accent] px-4 py-2.5 text-[13px] font-medium text-[--bg] transition-[filter] hover:brightness-95">
                    Save
                  </button>
                  <button type="button" disabled className="inline-flex items-center gap-2 rounded-[--r] bg-[--accent] px-5 py-3 text-sm font-medium text-[--bg] opacity-40">
                    Disabled
                  </button>
                </div>
              </div>

              <div>
                <p className="caption mb-3">Secondary</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] border border-[--line-strong] bg-transparent px-5 py-3 text-sm font-medium text-[--ink-0] transition-colors hover:bg-[--surface-2]">
                    Edit & re-run
                  </button>
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] border border-[--line-strong] bg-transparent px-4 py-2.5 text-[13px] font-medium text-[--ink-0] transition-colors hover:bg-[--surface-2]">
                    Download report
                  </button>
                </div>
              </div>

              <div>
                <p className="caption mb-3">Ghost</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] bg-transparent px-3 py-2 text-[13px] font-medium text-[--ink-1] transition-colors hover:bg-[--surface-2] hover:text-[--ink-0]">
                    Cancel
                  </button>
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] bg-transparent px-3 py-2 text-[13px] text-[--ink-1] transition-colors hover:bg-[--surface-2] hover:text-[--ink-0]">
                    <Copy className="h-3.5 w-3.5" />
                    Copy markdown
                  </button>
                </div>
              </div>

              <div>
                <p className="caption mb-3">Destructive</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" className="inline-flex items-center gap-2 rounded-[--r] border border-[--error]/40 bg-[--error-soft] px-4 py-2.5 text-[13px] font-medium text-[--error] transition-colors hover:bg-[--error]/20">
                    Delete session
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Inputs ── */}
          <Section
            id="inputs"
            kicker="§ 05"
            title="Inputs"
            description="14px text, surface-1 background, hairline border. Focus uses the single focus-ring token — no custom glows."
          >
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <label htmlFor="sg-text" className="mb-2 block text-[13px] font-medium text-[--ink-0]">
                  Text input
                </label>
                <input
                  id="sg-text"
                  type="text"
                  placeholder="e.g. AsyncStand — voice standups for remote teams"
                  className="w-full rounded-[--r] border border-[--line] bg-[--surface-1] px-3.5 py-2.5 text-sm text-[--ink-0] placeholder:text-[--ink-2]"
                />
                <p className="mt-2 text-[12px] text-[--ink-2]">
                  Field help sits in ink-2, 12px.
                </p>
              </div>

              <div>
                <label htmlFor="sg-search" className="mb-2 block text-[13px] font-medium text-[--ink-0]">
                  With icon
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[--ink-2]" />
                  <input
                    id="sg-search"
                    type="text"
                    placeholder="Search competitors…"
                    className="w-full rounded-[--r] border border-[--line] bg-[--surface-1] py-2.5 pl-9 pr-3.5 text-sm text-[--ink-0] placeholder:text-[--ink-2]"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="sg-textarea" className="mb-2 block text-[13px] font-medium text-[--ink-0]">
                  Textarea
                </label>
                <textarea
                  id="sg-textarea"
                  rows={4}
                  placeholder="Include problem, who it's for, and why you can win."
                  className="w-full resize-y rounded-[--r] border border-[--line] bg-[--surface-1] px-3.5 py-2.5 text-sm text-[--ink-0] placeholder:text-[--ink-2]"
                />
              </div>

              <div>
                <label htmlFor="sg-error" className="mb-2 block text-[13px] font-medium text-[--ink-0]">
                  Error state
                </label>
                <input
                  id="sg-error"
                  type="text"
                  defaultValue="x"
                  className="w-full rounded-[--r] border border-[--error]/40 bg-[--surface-1] px-3.5 py-2.5 text-sm text-[--ink-0]"
                />
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[--error]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Idea needs at least 3 characters.
                </p>
              </div>

              <div>
                <p className="mb-2 block text-[13px] font-medium text-[--ink-0]">Checkbox</p>
                <label className="flex cursor-pointer items-start gap-3 rounded-[--r] border border-[--line] bg-[--surface-1] p-4 transition-colors hover:border-[--line-strong]">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-0.5 rounded border-[--line-strong] bg-[--surface-2] accent-[--accent]"
                  />
                  <span className="text-[13px] text-[--ink-1]">
                    I confirm this idea is mine and I'm not a bot.
                  </span>
                </label>
              </div>
            </div>
          </Section>

          {/* ── Cards & surfaces ── */}
          <Section
            id="cards"
            kicker="§ 06"
            title="Cards & surfaces"
            description="A card is a surface-1 background with a hairline border. No drop shadow. Never more than one border weight per card."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                <p className="caption mb-3">Default card</p>
                <h3 className="h3 mb-2">Problem–solution fit</h3>
                <p className="body">
                  Daily standups waste distributed engineering time and interrupt deep work.
                </p>
              </div>

              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6 transition-colors hover:bg-[--surface-2]">
                <p className="caption mb-3">Interactive card</p>
                <h3 className="h3 mb-2">Competitive matrix →</h3>
                <p className="body">Hovers to surface-2. No shadow, no lift.</p>
              </div>

              <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                <p className="caption mb-3">Stat tile</p>
                <p className="num-lg">$140K</p>
                <p className="small mt-2 text-[--ink-2]">Year-1 ARR projection</p>
              </div>

              <div className="rounded-[--r] border border-[--accent-strong] bg-[--surface-1] p-6 sm:col-span-2">
                <p className="caption mb-3" style={{ color: "var(--accent)" }}>Accent border — featured</p>
                <h3 className="h3 mb-2">Recommendation</h3>
                <p className="body">
                  Accent border used sparingly: the single most important card in the view.
                </p>
              </div>

              <div className="rounded-[--r] border border-[--line] bg-[--surface-2] p-6">
                <p className="caption mb-3">Elevated</p>
                <p className="body">
                  Surface-2 background. Popovers, sticky chrome, the top of a nav bar.
                </p>
              </div>
            </div>
          </Section>

          {/* ── Badges ── */}
          <Section
            id="badges"
            kicker="§ 07"
            title="Badges"
            description="Status badges use a semantic token + soft fill + hairline border. 11px, uppercase, tracked."
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-[--r-sm] border border-[--success]/30 bg-[--success-soft] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[--success]">
                <CircleCheck className="h-3 w-3" />
                Go
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[--r-sm] border border-[--warning]/30 bg-[--warning-soft] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[--warning]">
                <AlertTriangle className="h-3 w-3" />
                Caution
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[--r-sm] border border-[--error]/30 bg-[--error-soft] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[--error]">
                <XCircle className="h-3 w-3" />
                No-Go
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[--ink-1]">
                B2B SaaS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[--r-sm] border border-[--accent-strong] bg-[--accent-soft] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[--accent]">
                Featured
              </span>
            </div>
          </Section>

          {/* ── Dividers ── */}
          <Section
            id="dividers"
            kicker="§ 08"
            title="Dividers"
            description="A single 1px hairline. Prefer a rule under a section title to a bordered card. Depth comes from tone, not shadow."
          >
            <div className="space-y-8">
              <div>
                <p className="caption mb-3">Hairline rule</p>
                <div className="rounded-[--r] border border-[--line] bg-[--surface-1] p-6">
                  <p className="h3">Category scores</p>
                  <hr className="rule my-4" />
                  <ul className="space-y-2 text-[13px] text-[--ink-1]">
                    <li className="flex justify-between"><span>Problem–solution fit</span><span className="num-sm">76</span></li>
                    <li className="flex justify-between"><span>Market opportunity</span><span className="num-sm">62</span></li>
                    <li className="flex justify-between"><span>Competitive edge</span><span className="num-sm">54</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          {/* ── Motion ── */}
          <Section
            id="motion"
            kicker="§ 09"
            title="Motion"
            description="Subtle and earned. No bouncy springs, no floating backgrounds, no shimmer on text. Reduced-motion is respected."
          >
            <div className="space-y-6">
              <SpecRow label="Interactive — colour change" value="120ms ease" />
              <SpecRow label="Mount — fade + 8px translate" value="300ms ease-out" />
              <SpecRow label="Accordion — expand / collapse" value="200ms ease-out" />
              <SpecRow label="Hover translate (if used)" value="≤ 2px, 150ms" />
              <SpecRow label="No auto-running background" value="animation: none" />
            </div>
          </Section>

          {/* Footer */}
          <div className="mt-16 border-t border-[--line] pt-8 pb-16 flex items-center justify-between">
            <p className="small text-[--ink-2]">
              Editorial Dossier — tokens in{" "}
              <code className="mono">src/app/globals.css</code>. Docs in{" "}
              <code className="mono">DESIGN.md</code>.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 text-[13px] text-[--ink-1] hover:text-[--ink-0] transition-colors">
              Home
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
