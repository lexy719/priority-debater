"use client";

import { useState } from "react";
import StudioTopNav from "@/components/studio/StudioTopNav";
import TickerTape from "@/components/dashboard/TickerTape";
import Footer from "@/components/dashboard/Footer";
import { Wordmark } from "@/components/brand/LogoMark";
import {
  project,
  landingThemes,
  landingHeroVariants,
  landingSections,
  landingFeatures,
  landingMetrics,
  landingQuote,
  exportTargets,
} from "@/data/studioData";
import {
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Download,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Pencil,
  Lock,
  Palette,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";

const PRESET_ACCENTS = ["#7dd3fc", "#38bdf8", "#ffe600", "#ff3b30", "#14b870", "#ff2d87"];

type SectionRow = (typeof landingSections)[number] & { enabled: boolean };

type HeroEdit = { title: string; sub: string; kicker: string };

function PreviewFrame({
  theme,
  hero,
  sections,
  device,
  accent,
}: {
  theme: (typeof landingThemes)[number];
  hero: (typeof landingHeroVariants)[number] & Partial<HeroEdit>;
  sections: SectionRow[];
  device: string;
  accent: string;
}) {
  const isInk = theme.id === "ink";
  const accentText = isInk ? "#0a0a0a" : "#fff";

  const visible = sections.filter((s) => s.enabled);

  return (
    <div
      className={`mx-auto border-2 border-black transition-all ${
        device === "mobile" ? "max-w-[420px]" : "w-full"
      }`}
      style={{ background: theme.bg, color: theme.fg }}
      data-testid="landing-preview-frame"
    >
      <div className="flex items-center gap-2 border-b-2 border-black bg-black px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff3b30]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff8a00]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#14b870]" />
        <div className="ml-3 flex-1 truncate font-mono text-[10px] text-white/60">{project.domain}</div>
        <div className="font-mono text-[9px] tracking-wider text-[var(--c-green)]">● LIVE</div>
      </div>

      <div className="flex items-center justify-between border-b border-current/15 px-5 py-3">
        <div className="font-display text-base">
          <Wordmark color={theme.fg} accent={accent} />
        </div>
        <div className="hidden gap-5 font-mono text-[9px] tracking-wider opacity-70 sm:flex">
          <span>PRODUCT</span>
          <span>PILOTS</span>
          <span>PRICING</span>
          <span>CONTACT</span>
        </div>
        <button
          type="button"
          className="border px-3 py-1 font-mono text-[9px] tracking-wider"
          style={{ borderColor: theme.fg }}
        >
          {hero.cta}
        </button>
      </div>

      {visible.map((s) => {
        if (s.id === "hero")
          return (
            <div key="hero" className="border-b border-current/10 px-5 py-12 sm:px-10 sm:py-20 lg:py-24">
              <div
                className="inline-block border px-2 py-0.5 font-mono text-[10px] tracking-wider opacity-80"
                style={{ borderColor: theme.fg }}
              >
                {hero.kicker}
              </div>
              <h1
                className={`mt-6 font-display leading-[0.85] tracking-tight ${
                  device === "mobile" ? "text-5xl" : "text-6xl sm:text-7xl lg:text-[112px]"
                }`}
              >
                {hero.title.split(". ").map((seg, i, arr) => (
                  <span key={i} className="block">
                    {i === arr.length - 2 ? (
                      <span
                        style={{
                          background: accent,
                          color: accentText,
                          padding: "0 0.08em",
                          boxDecorationBreak: "clone",
                        }}
                      >
                        {seg}.
                      </span>
                    ) : (
                      seg + (i < arr.length - 1 ? "." : "")
                    )}
                  </span>
                ))}
              </h1>
              <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed opacity-70 sm:text-base">{hero.sub}</p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="border-2 border-current px-6 py-3 font-mono text-xs tracking-wider"
                  style={{ background: theme.fg, color: theme.bg }}
                >
                  {hero.cta} →
                </button>
                <button type="button" className="border-2 border-current px-6 py-3 font-mono text-xs tracking-wider">
                  SEE THE NUMBERS
                </button>
                <span className="ml-2 inline-flex items-center gap-2 font-mono text-[10px] tracking-wider opacity-60">
                  ● 5/5 PERSONAS DEBATED · 99.2% UPTIME
                </span>
              </div>
            </div>
          );

        if (s.id === "logos")
          return (
            <div
              key="logos"
              className="border-y border-current/10 px-5 py-6 text-center font-mono text-[10px] tracking-wider opacity-60"
            >
              <span className="mr-3 opacity-50">TRUSTED BY OPERATORS AT</span>
              DHL · POSTNL · MIROR · COLIS PRIVÉ · FEDEX EU · +3 IN PILOT
            </div>
          );

        if (s.id === "problem")
          return (
            <div key="problem" className="border-t border-current/10 px-5 py-12 sm:px-10 sm:py-16">
              <div className="font-mono text-[10px] tracking-wider opacity-60">§01 / THE PROBLEM</div>
              <div className="mt-3 grid gap-6 lg:grid-cols-3">
                <h2 className="font-display text-3xl leading-[0.95] sm:text-4xl lg:text-5xl">
                  DIESEL DELIVERY <br />
                  <span style={{ background: accent, color: accentText, padding: "0 0.08em" }}>BREAKS IN 2027.</span>
                </h2>
                <p className="font-mono text-sm leading-relaxed opacity-75 lg:col-span-2">
                  EU ICE bans hit 18 city centres by 2027. Same-day expectations are now baseline. Diesel TCO is up 34%
                  YoY. The economics of last-mile have already inverted — and incumbents are stuck on three-year refresh
                  cycles.
                </p>
              </div>
            </div>
          );

        if (s.id === "product")
          return (
            <div key="product" className="border-t border-current/10 px-5 py-12 sm:px-10 sm:py-16">
              <div className="font-mono text-[10px] tracking-wider opacity-60">§02 / PRODUCT</div>
              <h2 className="mt-3 font-display text-3xl leading-[0.95] sm:text-4xl lg:text-5xl">
                ONE STACK.{" "}
                <span style={{ background: accent, color: accentText, padding: "0 0.08em" }}>SIX MOVING PARTS.</span>
              </h2>
              <div className="mt-8 grid gap-px border border-current/20 bg-current/10 sm:grid-cols-2 lg:grid-cols-3">
                {landingFeatures.map((f) => (
                  <div key={f.title} className="p-5" style={{ background: theme.bg }}>
                    <div className="flex items-center justify-between">
                      <span className="border px-2 py-0.5 font-mono text-[9px] tracking-wider" style={{ borderColor: theme.fg }}>
                        {f.kicker}
                      </span>
                      <span className="font-mono text-[9px] opacity-50">→</span>
                    </div>
                    <div className="mt-4 font-display text-xl">{f.title}</div>
                    <p className="mt-2 font-mono text-[11px] leading-relaxed opacity-70">{f.body}</p>
                  </div>
                ))}
              </div>
            </div>
          );

        if (s.id === "metrics")
          return (
            <div
              key="metrics"
              className="border-t border-current/10 px-5 py-12 sm:px-10 sm:py-16"
              style={{ background: "#0a0a0a", color: "#fff" }}
            >
              <div className="font-mono text-[10px] tracking-wider text-white/50">§03 / TRACTION</div>
              <h2 className="mt-3 font-display text-3xl leading-[0.95] sm:text-4xl">
                THE NUMBERS <span style={{ background: accent, color: "#0a0a0a", padding: "0 0.08em" }}>WE SHIP.</span>
              </h2>
              <div className="mt-7 grid grid-cols-2 gap-px border border-white/20 bg-white/15 lg:grid-cols-4">
                {landingMetrics.map((m) => (
                  <div key={m.l} className="bg-black p-5">
                    <div className="font-display text-5xl" style={{ color: accent }}>
                      {m.v}
                    </div>
                    <div className="mt-2 font-mono text-[10px] tracking-wider text-white/60">{m.l}</div>
                  </div>
                ))}
              </div>
            </div>
          );

        if (s.id === "quote")
          return (
            <div key="quote" className="border-t border-current/10 px-5 py-12 sm:px-10 sm:py-16">
              <div className="font-mono text-[10px] tracking-wider opacity-60">§04 / FROM AN OPERATOR</div>
              <div className="mt-4 font-display text-3xl leading-[0.95] sm:text-4xl lg:text-5xl">&ldquo;{landingQuote.body}&rdquo;</div>
              <div className="mt-5 font-mono text-xs">
                <span style={{ background: accent, color: accentText, padding: "0 0.25em" }}>{landingQuote.author}</span>
                <span className="ml-2 opacity-60">· {landingQuote.role}</span>
              </div>
            </div>
          );

        if (s.id === "pricing")
          return (
            <div key="pricing" className="border-t border-current/10 px-5 py-12 sm:px-10 sm:py-16">
              <div className="font-mono text-[10px] tracking-wider opacity-60">§05 / PRICING</div>
              <h2 className="mt-3 font-display text-3xl leading-[0.95] sm:text-4xl">
                PAY PER FLEET.{" "}
                <span style={{ background: accent, color: accentText, padding: "0 0.08em" }}>NO LOCK-IN.</span>
              </h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { p: "PILOT", v: "€2,400", t: "/MO · 1 VEHICLE" },
                  { p: "FLEET", v: "€11,800", t: "/MO · 10 VEHICLES · ★ POPULAR" },
                  { p: "ENTERPRISE", v: "CUSTOM", t: "100+ VEHICLES · SLA" },
                ].map((tier, i) => (
                  <div
                    key={tier.p}
                    className="border-2 p-5"
                    style={{
                      borderColor: theme.fg,
                      background: i === 1 ? theme.fg : "transparent",
                      color: i === 1 ? theme.bg : theme.fg,
                    }}
                  >
                    <div className="font-display text-2xl">{tier.p}</div>
                    <div className="mt-3 font-display text-3xl">{tier.v}</div>
                    <div className="mt-2 font-mono text-[10px] tracking-wider opacity-70">{tier.t}</div>
                  </div>
                ))}
              </div>
            </div>
          );

        if (s.id === "cta")
          return (
            <div key="cta" className="px-5 py-14 sm:px-10 sm:py-20" style={{ background: accent, color: accentText }}>
              <div className="font-mono text-[10px] tracking-wider opacity-65">§06 / CALL TO ACTION</div>
              <h2 className="mt-3 font-display text-4xl leading-[0.92] sm:text-5xl lg:text-7xl">
                BOOK A 30-MIN <br /> PILOT CALL.
              </h2>
              <p className="mt-5 max-w-xl font-mono text-sm leading-relaxed opacity-80">
                No deck. No slides. We map your three highest-volume routes against a Cargobyte fleet, then send you the
                cost diff in writing.
              </p>
              <button
                type="button"
                className="mt-8 border-2 px-7 py-3.5 font-mono text-xs tracking-wider"
                style={{ borderColor: accentText, color: accentText }}
              >
                REQUEST PILOT MAPPING →
              </button>
            </div>
          );

        return null;
      })}

      <div className="border-t-2 border-current px-5 py-4 text-center font-mono text-[9px] tracking-wider opacity-60">
        © 2026 CARGOBYTE MOBILITY · MADE WITH IDEA DEBATER
      </div>
    </div>
  );
}

export default function LandingBuilderPage() {
  const [themeId, setThemeId] = useState("editorial");
  const [heroId, setHeroId] = useState("cost");
  const [device, setDevice] = useState("desktop");
  const [accent, setAccent] = useState("#7dd3fc");
  const [accentInput, setAccentInput] = useState("#7dd3fc");
  const [editingHero, setEditingHero] = useState<HeroEdit | null>(null);
  const [sections, setSections] = useState<SectionRow[]>(() => landingSections.map((s) => ({ ...s, enabled: true })));

  const theme = landingThemes.find((t) => t.id === themeId) ?? landingThemes[0];
  const baseHero = landingHeroVariants.find((h) => h.id === heroId) ?? landingHeroVariants[0];
  const hero = editingHero ? { ...baseHero, ...editingHero } : baseHero;

  const toggleSection = (id: string, required: boolean) => {
    if (required) return;
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const moveSection = (idx: number, delta: number) => {
    setSections((prev) => {
      const next = [...prev];
      const target = idx + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const applyAccent = (hex: string) => {
    const valid = /^#[0-9a-fA-F]{6}$/.test(hex);
    if (valid) {
      setAccent(hex);
      setAccentInput(hex);
    } else {
      toast.error("INVALID HEX — USE #RRGGBB");
    }
  };

  const triggerExport = (target: (typeof exportTargets)[number]) => {
    if (target.tier === "STARTER") {
      toast.success(`EXPORTING TO ${target.label}...`, { duration: 1600 });
    } else {
      toast.message(`UPGRADE TO ${target.tier} TO UNLOCK ${target.label}`, { duration: 1800 });
    }
  };

  return (
    <div data-testid="landing-builder-page" className="min-h-screen bg-[var(--paper)] text-black">
      <StudioTopNav />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#0a0a0a",
            color: "#fff",
            border: "1px solid #fff",
            borderRadius: 0,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
          },
        }}
      />
      <TickerTape />

      <section className="relative overflow-hidden border-b border-black bg-[var(--bone)] py-14">
        <div className="absolute inset-0 bg-grid opacity-100" />
        <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
          <div className="font-mono text-[10px] tracking-wider text-neutral-500">§B / LANDING PAGE BUILDER</div>
          <div className="mt-3 grid gap-8 lg:grid-cols-12">
            <h1 className="font-display text-[52px] leading-[0.9] sm:text-[72px] lg:col-span-8 lg:text-[96px]">
              SHIP A LANDING. <br />
              <span className="hl-strip">IN 12 SECONDS.</span>
            </h1>
            <p className="max-w-md self-end font-mono text-sm leading-relaxed text-neutral-600 lg:col-span-4">
              Reorder sections. Edit copy inline. Pick an accent. Then push to Figma, Framer or Webflow with one click.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-black bg-[var(--paper)] py-10">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-12">
            <aside className="space-y-6 lg:col-span-3">
              <div className="border-2 border-black bg-white">
                <div className="flex items-center justify-between border-b-2 border-black bg-black px-4 py-2">
                  <span className="font-mono text-[10px] tracking-wider text-white/70">HERO COPY</span>
                  <button
                    type="button"
                    data-testid="edit-hero-toggle"
                    onClick={() =>
                      setEditingHero(
                        editingHero ? null : { title: baseHero.title, sub: baseHero.sub, kicker: baseHero.kicker }
                      )
                    }
                    className="inline-flex items-center gap-1 border border-white/30 px-2 py-0.5 font-mono text-[9px] tracking-wider text-white hover:bg-white hover:text-black"
                  >
                    {editingHero ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                    {editingHero ? "CLOSE" : "EDIT"}
                  </button>
                </div>
                {!editingHero ? (
                  <div className="space-y-2 p-3">
                    {landingHeroVariants.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        data-testid={`hero-variant-${h.id}`}
                        onClick={() => setHeroId(h.id)}
                        className={`block w-full border border-black px-3 py-2 text-left transition ${
                          heroId === h.id ? "bg-[var(--hi)]" : "bg-white hover:bg-[var(--hi-soft)]"
                        }`}
                      >
                        <div className="font-mono text-[9px] tracking-wider text-neutral-500">{h.kicker}</div>
                        <div className="mt-1 font-display text-sm leading-tight">{h.title}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 p-3">
                    <div>
                      <div className="mb-1 font-mono text-[9px] tracking-wider text-neutral-500">KICKER</div>
                      <input
                        data-testid="edit-kicker"
                        value={editingHero.kicker}
                        onChange={(e) => setEditingHero({ ...editingHero, kicker: e.target.value })}
                        className="block w-full border border-black bg-[var(--paper)] px-2 py-1.5 font-mono text-[11px] focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[9px] tracking-wider text-neutral-500">HEADLINE</div>
                      <textarea
                        data-testid="edit-title"
                        rows={3}
                        value={editingHero.title}
                        onChange={(e) => setEditingHero({ ...editingHero, title: e.target.value })}
                        className="block w-full resize-none border border-black bg-[var(--paper)] px-2 py-1.5 font-display text-sm leading-tight focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[9px] tracking-wider text-neutral-500">SUB-COPY</div>
                      <textarea
                        data-testid="edit-sub"
                        rows={4}
                        value={editingHero.sub}
                        onChange={(e) => setEditingHero({ ...editingHero, sub: e.target.value })}
                        className="block w-full resize-none border border-black bg-[var(--paper)] px-2 py-1.5 font-mono text-[11px] leading-relaxed focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-2 border-black bg-white">
                <div className="border-b-2 border-black bg-black px-4 py-2 font-mono text-[10px] tracking-wider text-white/70">
                  THEME
                </div>
                <div className="space-y-2 p-3">
                  {landingThemes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      data-testid={`theme-${t.id}`}
                      onClick={() => setThemeId(t.id)}
                      className={`flex w-full items-center justify-between border border-black px-3 py-2 transition ${
                        themeId === t.id ? "bg-[var(--hi)]" : "bg-white hover:bg-[var(--hi-soft)]"
                      }`}
                    >
                      <span className="font-display text-sm">{t.label}</span>
                      <span className="flex items-center gap-1">
                        <span className="h-4 w-4 border border-black" style={{ background: t.bg }} />
                        <span className="h-4 w-4 border border-black" style={{ background: t.fg }} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-2 border-black bg-white">
                <div className="flex items-center justify-between border-b-2 border-black bg-black px-4 py-2 font-mono text-[10px] tracking-wider text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <Palette className="h-3 w-3" />
                    ACCENT
                  </span>
                  <span className="text-white/40">CUSTOM HEX</span>
                </div>
                <div className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ACCENTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        data-testid={`accent-${c.replace("#", "")}`}
                        onClick={() => applyAccent(c)}
                        className={`h-8 w-8 border-2 transition ${
                          accent.toLowerCase() === c.toLowerCase()
                            ? "border-black shadow-brutal-sm"
                            : "border-black/30 hover:border-black"
                        }`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      data-testid="accent-input"
                      value={accentInput}
                      onChange={(e) => setAccentInput(e.target.value)}
                      onBlur={() => applyAccent(accentInput)}
                      onKeyDown={(e) => e.key === "Enter" && applyAccent(accentInput)}
                      className="block w-full border border-black bg-[var(--paper)] px-2 py-1.5 font-mono text-[11px] uppercase focus:bg-white focus:outline-none"
                      placeholder="#7DD3FC"
                    />
                    <input
                      type="color"
                      data-testid="accent-color-picker"
                      value={accent}
                      onChange={(e) => applyAccent(e.target.value)}
                      className="h-9 w-9 cursor-pointer border-2 border-black bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-black bg-white">
                <div className="border-b-2 border-black bg-black px-4 py-2 font-mono text-[10px] tracking-wider text-white/70">
                  SECTIONS · REORDER & TOGGLE
                </div>
                <ul>
                  {sections.map((s, idx) => (
                    <li key={s.id} className="border-b border-black/10 last:border-b-0">
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <span className="w-6 font-mono text-[10px] tracking-wider text-neutral-400">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={`flex-1 font-mono text-[11px] tracking-wider ${
                            s.enabled ? "text-black" : "text-neutral-400 line-through"
                          }`}
                        >
                          {s.label}
                        </span>
                        {s.required && (
                          <span className="border border-black px-1 py-0.5 font-mono text-[8px]">REQ</span>
                        )}
                        <button
                          type="button"
                          data-testid={`section-up-${s.id}`}
                          onClick={() => moveSection(idx, -1)}
                          disabled={idx === 0}
                          className="border border-black/20 p-1 transition hover:border-black disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          data-testid={`section-down-${s.id}`}
                          onClick={() => moveSection(idx, 1)}
                          disabled={idx === sections.length - 1}
                          className="border border-black/20 p-1 transition hover:border-black disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          data-testid={`section-toggle-${s.id}`}
                          onClick={() => toggleSection(s.id, s.required)}
                          disabled={s.required}
                          className="border border-black/20 p-1 transition hover:border-black disabled:opacity-30"
                        >
                          {s.enabled ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-neutral-400" />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="lg:col-span-9">
              <div className="flex items-center justify-between border-2 border-b-0 border-black bg-black px-4 py-2">
                <div className="flex items-center gap-3 font-mono text-[10px] tracking-wider text-white/60">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
                  LIVE PREVIEW · {theme.label} · {hero.id?.toUpperCase() || "CUSTOM"}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-[10px] tracking-wider text-white/40">
                    ACCENT <span className="text-white">{accent.toUpperCase()}</span>
                  </div>
                  <div className="flex border border-white/30">
                    <button
                      type="button"
                      data-testid="device-desktop"
                      onClick={() => setDevice("desktop")}
                      className={`px-3 py-1 ${device === "desktop" ? "bg-white text-black" : "text-white/60"}`}
                    >
                      <Monitor className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      data-testid="device-mobile"
                      onClick={() => setDevice("mobile")}
                      className={`px-3 py-1 ${device === "mobile" ? "bg-white text-black" : "text-white/60"}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="max-h-[1600px] overflow-y-auto border-2 border-black bg-black/5 p-3">
                <PreviewFrame theme={theme} hero={hero} sections={sections} device={device} accent={accent} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-black bg-black py-16 text-white">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[10px] tracking-wider text-white/50">§B2 / EXPORT BAY</div>
              <h2 className="mt-3 font-display text-[44px] leading-[0.92] lg:text-[64px]">
                ONE-CLICK <span className="bg-[var(--hi)] px-1 text-black">SHIP.</span>
              </h2>
              <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-white/55">
                Push the live preview to Figma, Framer or Webflow with all sections, accent token and copy intact.
                Tier-gated.
              </p>
            </div>
            <button
              type="button"
              data-testid="download-react"
              className="inline-flex items-center gap-2 border-2 border-white bg-white px-5 py-3 font-mono text-xs tracking-wider text-black shadow-brutal-inv hover-lift"
            >
              <Download className="h-3.5 w-3.5" />
              DOWNLOAD REACT + TAILWIND
            </button>
          </div>

          <div className="grid grid-cols-1 gap-px border-2 border-white bg-white/15 sm:grid-cols-2 lg:grid-cols-3">
            {exportTargets.map((t, i) => {
              const locked = t.tier !== "STARTER";
              return (
                <button
                  key={t.id}
                  type="button"
                  data-testid={`landing-export-${t.id}`}
                  onClick={() => triggerExport(t)}
                  className="group relative flex items-stretch gap-4 bg-black p-5 text-left transition hover:bg-white hover:text-black"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-current font-display text-lg">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base">{t.label}</span>
                      {locked ? (
                        <span className="inline-flex items-center gap-1 border border-current px-2 py-0.5 font-mono text-[9px]">
                          <Lock className="h-2.5 w-2.5" />
                          {t.tier}
                        </span>
                      ) : (
                        <span className="border border-[var(--c-green)] bg-[var(--c-green)] px-2 py-0.5 font-mono text-[9px] text-black">
                          FREE
                        </span>
                      )}
                    </div>
                    <div className="mt-2 font-mono text-[11px] leading-relaxed opacity-60 group-hover:opacity-80">
                      {t.note}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <TickerTape />
      <Footer />
    </div>
  );
}
