"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  Download,
  AlertTriangle,
  ImageIcon,
  ChevronDown,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Settings2,
  Wand2,
  Palette,
  Send,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LOGO_AVOID,
  LOGO_COLOR_STRATEGIES,
  LOGO_MARK_TYPES,
  LOGO_MUST_HAVES,
  LOGO_PERSONALITIES,
  LOGO_VISUAL_STYLES,
  DEFAULT_LOGO_BRIEF,
  type LogoBrief,
} from "@/lib/logo-brief";
import {
  buildLogoImagePrompt,
  buildRefinementPrompt,
  buildMockupPrompt,
  getMockupSize,
} from "@/lib/logo-brief";
import { loadSessionWithStatus } from "@/lib/session";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import type { ValidationSession } from "@/lib/types";
import { AppShell, AppLogoLink } from "@/components/AppShell";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type Step = "concepts" | "refine" | "brandkit";
type PreviewBg = "dark" | "light" | "checkered";

interface Concept {
  id: string;
  src: string;
  promptUsed: string;
  label: string;
  rationale?: string;
}

interface Refinement {
  id: string;
  src: string;
  promptUsed: string;
}

interface MockupSlot {
  context: string;
  label: string;
  src: string | null;
  generating: boolean;
  error: string | null;
}

interface BrandKitBlueprint {
  designAnchor: string;
  consistencyRules: string[];
  conceptVariants: Array<{
    label: string;
    rationale: string;
    promptDelta: string;
  }>;
  brandKit: {
    audience: string;
    personality: string;
    positioning: string;
    tone: string;
    palette: Array<{ token: string; hex: string; usage: string }>;
    typography: {
      primary: string;
      secondary: string;
      guidance: string;
    };
    logoRules: string[];
    competitorGuardrails: Array<{ risk: string; response: string }>;
    rolloutChecklist: string[];
  };
}

const MOCKUP_CONTEXTS: { context: string; label: string }[] = [
  { context: "business-card", label: "Business Card" },
  { context: "logo-on-dark", label: "Logo on dark" },
  { context: "app-icon", label: "App Icon" },
  { context: "social-avatar", label: "Social Avatar" },
  { context: "logo-on-light", label: "Logo on light" },
  { context: "favicon", label: "Favicon legibility" },
];

const QUICK_CHIPS = [
  "More minimal",
  "Bolder",
  "Try blue",
  "Try red",
  "Monochrome",
  "More playful",
  "More corporate",
  "Bigger icon",
  "Simpler",
] as const;

// ── Live brief summary ──

function BriefSummaryCard({ brief, topic, extraNotes }: { brief: LogoBrief; topic: string; extraNotes: string }) {
  const markLabel = LOGO_MARK_TYPES.find((m) => m.id === brief.markType)?.label ?? brief.markType;
  const styleLabel = LOGO_VISUAL_STYLES.find((s) => s.id === brief.visualStyle)?.label ?? brief.visualStyle;
  const colorLabel = LOGO_COLOR_STRATEGIES.find((c) => c.id === brief.colorStrategy)?.label ?? brief.colorStrategy;
  const personalityLabel = LOGO_PERSONALITIES.find((p) => p.id === brief.personality)?.label ?? brief.personality;
  const mustHaveLabels = brief.mustHaves.map((id) => LOGO_MUST_HAVES.find((m) => m.id === id)?.label ?? id);
  const avoidLabels = brief.avoid.map((id) => LOGO_AVOID.find((a) => a.id === id)?.label ?? id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/8 to-violet-500/5 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20">
          <Sparkles className="h-3 w-3 text-indigo-300" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200/70">Live brief</span>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed mb-2">
        <span className="text-white font-medium">{topic || "Your brand"}</span>{" "}
        — {personalityLabel} {markLabel.toLowerCase()} in {styleLabel.toLowerCase()} style with {colorLabel.toLowerCase()} colors.
      </p>
      {mustHaveLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {mustHaveLabels.map((l) => (
            <span key={l} className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-medium text-emerald-300">
              ✓ {l}
            </span>
          ))}
        </div>
      )}
      {avoidLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {avoidLabels.map((l) => (
            <span key={l} className="rounded-full bg-rose-500/12 border border-rose-500/20 px-2 py-0.5 text-[9px] font-medium text-rose-300">
              ✕ {l}
            </span>
          ))}
        </div>
      )}
      {extraNotes && (
        <p className="mt-2 text-[10px] text-zinc-500 italic">"{extraNotes}"</p>
      )}
    </motion.div>
  );
}

// ── Brand Guidelines Card ──

function BrandGuidelinesCard({ blueprint }: { blueprint: BrandKitBlueprint }) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/8 to-purple-500/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/25">
          <Settings2 className="h-4 w-4 text-violet-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Brand Guidelines</h3>
          <p className="text-[10px] text-zinc-500">Do&apos;s and don&apos;ts for consistent identity</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/70 mb-2">✓ Do</p>
          <ul className="space-y-1.5">
            {blueprint.brandKit.logoRules.slice(0, 4).map((rule, i) => (
              <li key={`do-${i}`} className="text-xs text-emerald-200/75 flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-emerald-400 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-300/70 mb-2">✕ Don&apos;t</p>
          <ul className="space-y-1.5">
            {blueprint.brandKit.competitorGuardrails.slice(0, 4).map((g, i) => (
              <li key={`dont-${i}`} className="text-xs text-rose-200/75 flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-rose-400 shrink-0" />
                {g.risk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureHex(color: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6366F1";
}

const bgClasses: Record<PreviewBg, string> = {
  light: "bg-white",
  dark: "bg-zinc-950",
  checkered:
    "bg-[conic-gradient(#e4e4e7_25%,white_25%,white_50%,#e4e4e7_50%,#e4e4e7_75%,white_75%)] bg-[length:20px_20px]",
};

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function ChipGroup<K extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: K; label: string; hint: string }[];
  value: K;
  onChange: (id: K) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            title={opt.hint}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150",
              value === opt.id
                ? "border-indigo-400/50 bg-indigo-500/20 text-white"
                : "border-zinc-700/50 bg-zinc-900/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleChips<K extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly { id: K; label: string; hint: string }[];
  selected: K[];
  onToggle: (id: K) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              title={opt.hint}
              onClick={() => onToggle(opt.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all",
                on
                  ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-100"
                  : "border-zinc-700/50 bg-zinc-900/35 text-zinc-500 hover:text-zinc-300",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Step indicator ──

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "concepts", label: "Concepts", num: 1 },
  { key: "refine", label: "Refine", num: 2 },
  { key: "brandkit", label: "Brand Kit", num: 3 },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const future = i > currentIdx;
        return (
          <div key={s.key} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 sm:w-14 transition-colors duration-300",
                  done ? "bg-emerald-500/60" : active ? "bg-indigo-500/40" : "bg-zinc-700/40",
                )}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 border",
                  done && "border-emerald-500/50 bg-emerald-500/20 text-emerald-300",
                  active && "border-indigo-400/60 bg-indigo-500/25 text-white ring-2 ring-indigo-500/20",
                  future && "border-zinc-700/50 bg-zinc-800/40 text-zinc-600",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : s.num}
              </div>
              <span
                className={cn(
                  "hidden text-[11px] font-semibold uppercase tracking-wider sm:inline transition-colors",
                  done && "text-emerald-400/70",
                  active && "text-white",
                  future && "text-zinc-600",
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Background toggle ──

function BgToggle({ value, onChange }: { value: PreviewBg; onChange: (v: PreviewBg) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Bg</span>
      <div className="flex rounded-lg border border-white/6 bg-zinc-900/60 p-0.5">
        {(["light", "dark", "checkered"] as PreviewBg[]).map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => onChange(bg)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
              value === bg ? "bg-white/10 text-zinc-200" : "text-zinc-600 hover:text-zinc-400",
            )}
          >
            {bg}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton shimmer card ──

function SkeletonCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
      <div className="aspect-square relative">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/0 via-zinc-700/20 to-zinc-800/0 animate-[shimmer_2s_infinite]" />
        <div className="absolute inset-0 bg-zinc-900/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400/40" />
        </div>
      </div>
      <div className="px-4 py-3 border-t border-white/6">
        <span className="text-xs font-medium text-zinc-500">{label}</span>
      </div>
    </div>
  );
}

// ── Concept card ──

function ConceptCard({
  concept,
  selected,
  compareSelected,
  previewBg,
  onSelect,
  onCompare,
}: {
  concept: Concept;
  selected: boolean;
  compareSelected: boolean;
  previewBg: PreviewBg;
  onSelect: () => void;
  onCompare: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "group rounded-2xl border overflow-hidden transition-all cursor-pointer",
        "bg-white/[0.03] hover:bg-white/[0.05]",
        selected
          ? "border-indigo-400/60 ring-2 ring-indigo-500/25"
          : "border-white/8 hover:border-white/15",
      )}
      onClick={onSelect}
    >
      <div className={cn("aspect-square relative", bgClasses[previewBg])}>
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/80">
            {concept.label}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={concept.src}
          alt={concept.label}
          className="h-full w-full object-contain p-4"
        />
      </div>
      <div className="border-t border-white/6 px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300">{concept.label}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCompare();
            }}
            className={cn(
              "rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors",
              compareSelected
                ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10",
            )}
          >
            {compareSelected ? "Compared" : "Compare"}
          </button>
        </div>
        {concept.rationale && (
          <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">{concept.rationale}</p>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
            "bg-gradient-to-r from-indigo-600 to-violet-600 text-white",
            "hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/20",
          )}
        >
          Select & refine
        </button>
      </div>
    </motion.div>
  );
}

// ── Mockup card ──

function MockupCard({
  slot,
  topicSlug,
  onRetry,
}: {
  slot: MockupSlot;
  topicSlug: string;
  onRetry: (context: string) => void;
}) {
  const isWide = slot.context === "business-card";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden"
    >
      <div className={cn("relative", isWide ? "aspect-video" : "aspect-[3/4]")}>
        {slot.generating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/80">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400/50" />
            <span className="text-[11px] text-zinc-500">Generating...</span>
          </div>
        )}
        {slot.error && !slot.generating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/60 px-4">
            <AlertTriangle className="h-5 w-5 text-red-400/70" />
            <span className="text-[11px] text-red-300/80 text-center">{slot.error}</span>
            <button
              type="button"
              onClick={() => onRetry(slot.context)}
              className="mt-1 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80 hover:bg-white/15"
            >
              Retry
            </button>
          </div>
        )}
        {slot.src && !slot.generating && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slot.src}
            alt={slot.label}
            className="h-full w-full object-cover"
          />
        )}
        {!slot.src && !slot.generating && !slot.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40">
            <ImageIcon className="h-8 w-8 text-zinc-700" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-white/6 px-4 py-2.5">
        <span className="text-xs font-medium text-zinc-400">{slot.label}</span>
        {slot.src && (
          <a
            href={slot.src}
            download={`${topicSlug}-${slot.context}.png`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <Download className="h-3 w-3" /> PNG
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────

function BrandStudioInner() {
  const router = useRouter();

  // Session
  const [session, setSession] = useState<ValidationSession | null>(null);

  // Step
  const [step, setStep] = useState<Step>("concepts");

  // Brief (design preferences)
  const [brief, setBrief] = useState<LogoBrief>(DEFAULT_LOGO_BRIEF);
  const [extraNotes, setExtraNotes] = useState("");
  const [briefOpen, setBriefOpen] = useState(true);

  // Concepts (step 1)
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [conceptsGenerating, setConceptsGenerating] = useState(false);
  const [selectedConceptIdx, setSelectedConceptIdx] = useState<number | null>(null);
  const [compareConceptIdxs, setCompareConceptIdxs] = useState<number[]>([]);
  const [conceptError, setConceptError] = useState<string | null>(null);

  // Refine (step 2)
  const [refinements, setRefinements] = useState<Refinement[]>([]);
  const [activeRefinementIdx, setActiveRefinementIdx] = useState(0);
  const [refineGenerating, setRefineGenerating] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refinementBasePrompt, setRefinementBasePrompt] = useState("");

  // Mockups & brand kit (step 3)
  const [mockups, setMockups] = useState<MockupSlot[]>([]);
  const [brandKitBlueprint, setBrandKitBlueprint] = useState<BrandKitBlueprint | null>(null);
  const [brandKitGenerating, setBrandKitGenerating] = useState(false);
  const [brandKitError, setBrandKitError] = useState<string | null>(null);

  // Preview
  const [previewBg, setPreviewBg] = useState<PreviewBg>("light");

  // ── Session load ──
  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/journey");
      return;
    }
    if (result.status === "none") {
      router.replace("/journey");
      return;
    }
    const s = result.session;
    if (s.setup.template === "generate") {
      router.replace("/validate");
      return;
    }
    setSession(s);
  }, [router]);

  // ── Derived ──
  const topic = session?.setup.topic ?? "";
  const position = session?.setup.position ?? "";
  const topicSlug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);

  // ── Brief helpers ──
  const setBriefField = useCallback(<K extends keyof LogoBrief>(key: K, val: LogoBrief[K]) => {
    setBrief((prev) => ({ ...prev, [key]: val }));
  }, []);

  const toggleMust = useCallback((id: (typeof LOGO_MUST_HAVES)[number]["id"]) => {
    setBrief((prev) => {
      const has = prev.mustHaves.includes(id);
      const next = has ? prev.mustHaves.filter((x) => x !== id) : [...prev.mustHaves, id];
      return { ...prev, mustHaves: next.length ? next : DEFAULT_LOGO_BRIEF.mustHaves };
    });
  }, []);

  const toggleAvoid = useCallback((id: (typeof LOGO_AVOID)[number]["id"]) => {
    setBrief((prev) => {
      const has = prev.avoid.includes(id);
      const next = has ? prev.avoid.filter((x) => x !== id) : [...prev.avoid, id];
      return { ...prev, avoid: next.length ? next : DEFAULT_LOGO_BRIEF.avoid };
    });
  }, []);

  // ────────────────────────────────────────────────────────
  // Step 1: Generate concepts
  // ────────────────────────────────────────────────────────

  const generateConcepts = useCallback(async () => {
    if (!session) return;
    setConceptsGenerating(true);
    setConceptError(null);
    setConcepts([]);
    setSelectedConceptIdx(null);
    setCompareConceptIdxs([]);
    setBrandKitBlueprint(null);
    setBrandKitError(null);

    try {
      const blueprintRes = await fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup: session.setup,
          validationContent: session.validationContent,
          logoBrief: brief,
        }),
      });
      if (!blueprintRes.ok) throw new Error(await messageFromFailedResponse(blueprintRes));
      const blueprint = (await blueprintRes.json()) as BrandKitBlueprint;
      setBrandKitBlueprint(blueprint);

      const basePrompt = buildLogoImagePrompt(topic, position, brief, extraNotes);
      const conceptMeta = [
        ...(blueprint.conceptVariants.length
          ? blueprint.conceptVariants.slice(0, 3)
          : [
              { label: "Concept A", rationale: "Balanced direction", promptDelta: "Stay faithful to the brief." },
              { label: "Concept B", rationale: "Conservative direction", promptDelta: "Favor timeless execution." },
              { label: "Concept C", rationale: "Bold direction", promptDelta: "Increase distinction without clutter." },
            ]),
        {
          label: "Concept D",
          rationale: "Typography-forward wordmark emphasis",
          promptDelta: "Focus on letterform personality and spacing discipline while keeping symbol support minimal.",
        },
        {
          label: "Concept E",
          rationale: "Icon-led compact system for app/social",
          promptDelta: "Prioritize icon memorability and tiny-size legibility before decorative details.",
        },
        {
          label: "Concept F",
          rationale: "Premium restrained variant",
          promptDelta: "Lower visual noise, fewer colors, and higher contrast for a timeless premium feel.",
        },
      ].slice(0, 6);

      const generated: Concept[] = [];
      for (let variantIndex = 0; variantIndex < conceptMeta.length; variantIndex++) {
        const variant = conceptMeta[variantIndex];
        const prompt = [
          basePrompt,
          "",
          `Design anchor: ${blueprint.designAnchor}`,
          `Consistency rules: ${blueprint.consistencyRules.join(" | ")}`,
          "",
          `Variant profile (${variant.label}): ${variant.promptDelta}`,
          `Why this concept exists: ${variant.rationale}`,
        ].join("\n");

        const res = await fetch("/api/generate-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, count: 1 }),
        });
        if (!res.ok) throw new Error(await messageFromFailedResponse(res));
        const data = await res.json();
        const src = data.dataUrl || data.url || data.results?.[0]?.dataUrl;
        if (!src) throw new Error("No image returned");
        generated.push({ id: uid(), src, promptUsed: prompt, label: variant.label, rationale: variant.rationale });
      }
      setConcepts(generated);
    } catch (e) {
      setConceptError(e instanceof Error ? e.message : "Failed to generate concepts.");
    } finally {
      setConceptsGenerating(false);
    }
  }, [session, topic, position, brief, extraNotes]);

  // ────────────────────────────────────────────────────────
  // Step 2: Select concept & go to refine
  // ────────────────────────────────────────────────────────

  const selectConceptAndRefine = useCallback(
    (idx: number) => {
      setSelectedConceptIdx(idx);
      const c = concepts[idx];
      if (!c) return;
      // Initialize refinements with the original concept
      setRefinements([{ id: c.id, src: c.src, promptUsed: c.promptUsed }]);
      setRefinementBasePrompt(c.promptUsed);
      setActiveRefinementIdx(0);
      setRefineInput("");
      setRefineError(null);
      setStep("refine");
    },
    [concepts],
  );

  const toggleCompareConcept = useCallback((idx: number) => {
    setCompareConceptIdxs((prev) => {
      if (prev.includes(idx)) return prev.filter((x) => x !== idx);
      if (prev.length >= 2) return [prev[1], idx];
      return [...prev, idx];
    });
  }, []);

  // ────────────────────────────────────────────────────────
  // Step 2: Generate refinement
  // ────────────────────────────────────────────────────────

  const generateRefinement = useCallback(
    async (instruction: string) => {
      if (!instruction.trim() || refineGenerating) return;
      const activeRef = refinements[activeRefinementIdx];
      if (!activeRef) return;

      setRefineGenerating(true);
      setRefineError(null);
      setRefineInput("");

      try {
        const basePrompt = refinementBasePrompt || activeRef.promptUsed;
        const prompt = buildRefinementPrompt(
          basePrompt,
          `${instruction.trim()}\n\nKeep the same core identity and only apply this requested change.`,
        );
        const res = await fetch("/api/generate-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, count: 1 }),
        });
        if (!res.ok) throw new Error(await messageFromFailedResponse(res));
        const data = await res.json();
        const src = data.dataUrl || data.url || data.results?.[0]?.dataUrl;
        if (!src) throw new Error("No image returned");

        const newRef: Refinement = { id: uid(), src, promptUsed: prompt };
        setRefinements((prev) => [...prev, newRef]);
        setActiveRefinementIdx((prev) => prev + 1);
      } catch (e) {
        setRefineError(e instanceof Error ? e.message : "Refinement failed.");
      } finally {
        setRefineGenerating(false);
      }
    },
    [refinements, activeRefinementIdx, refineGenerating, refinementBasePrompt],
  );

  // ────────────────────────────────────────────────────────
  // Step 3: Brand kit entry
  // ────────────────────────────────────────────────────────

  const proceedToBrandKit = useCallback(() => {
    setStep("brandkit");
  }, []);

  // Auto-trigger mockups and brand kit on entering step 3
  const hasFiredBrandKit = useRef(false);
  const logoDescriptionRef = useRef("");

  const generateMockupForContext = useCallback(
    async (context: string, logoDescription: string) => {
      const idx = MOCKUP_CONTEXTS.findIndex((m) => m.context === context);
      if (idx < 0) return;

      setMockups((prev) =>
        prev.map((slot, si) =>
          si === idx ? { ...slot, generating: true, error: null } : slot,
        ),
      );

      const runAttempt = async (prompt: string, size: string) => {
        const res = await fetch("/api/generate-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, count: 1, size }),
        });
        if (!res.ok) throw new Error(await messageFromFailedResponse(res));
        const data = await res.json();
        const src = data.dataUrl || data.url || data.results?.[0]?.dataUrl;
        if (!src) throw new Error("No image returned");
        return src as string;
      };

      try {
        const size = getMockupSize(context);
        const primaryPrompt = buildMockupPrompt(topic, logoDescription, context);
        let src: string;
        try {
          src = await runAttempt(primaryPrompt, size);
        } catch {
          const fallbackPrompt = [
            `Create a clean branded asset preview for "${topic}".`,
            `Logo description: ${logoDescription}`,
            `Context: ${context}`,
            "Keep only one simple scene and avoid dense UI text.",
            "No long paragraphs. Prioritize clarity and logo readability.",
          ].join("\n");
          src = await runAttempt(fallbackPrompt, size);
        }

        setMockups((prev) =>
          prev.map((slot, si) =>
            si === idx ? { ...slot, src, generating: false, error: null } : slot,
          ),
        );
      } catch (e) {
        setMockups((prev) =>
          prev.map((slot, si) =>
            si === idx
              ? { ...slot, generating: false, error: e instanceof Error ? e.message : "Failed" }
              : slot,
          ),
        );
      }
    },
    [topic],
  );

  useEffect(() => {
    if (step !== "brandkit" || !session || hasFiredBrandKit.current) return;
    hasFiredBrandKit.current = true;

    const activeRef = refinements[activeRefinementIdx];
    if (!activeRef) return;

    // Describe the logo for mockup prompts
    const logoDescription = `Logo for "${topic}" — ${activeRef.promptUsed.slice(0, 200)}`;
    logoDescriptionRef.current = logoDescription;

    // Generate utility-first mockups
    const initialMockups: MockupSlot[] = MOCKUP_CONTEXTS.map((m) => ({
      ...m,
      src: null,
      generating: true,
      error: null,
    }));
    setMockups(initialMockups);
    MOCKUP_CONTEXTS.forEach((m) => void generateMockupForContext(m.context, logoDescription));

    // Build structured brand kit blueprint if missing
    setBrandKitGenerating(true);
    setBrandKitError(null);
    if (!brandKitBlueprint) {
      fetch("/api/brand-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup: session.setup,
          validationContent: session.validationContent,
          logoBrief: brief,
        }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(await messageFromFailedResponse(res));
          const data = (await res.json()) as BrandKitBlueprint;
          setBrandKitBlueprint(data);
        })
        .catch((e) => {
          setBrandKitError(e instanceof Error ? e.message : "Brand kit generation failed.");
        })
        .finally(() => {
          setBrandKitGenerating(false);
        });
    } else {
      setBrandKitGenerating(false);
    }
  }, [step, session, refinements, activeRefinementIdx, topic, brief, brandKitBlueprint, generateMockupForContext]);

  // ── Derived display values ──
  const colorSwatches = useMemo(() => brandKitBlueprint?.brandKit.palette ?? [], [brandKitBlueprint]);
  const activeLogo = refinements[activeRefinementIdx]?.src ?? null;
  const retryMockup = useCallback(
    (context: string) => {
      if (!logoDescriptionRef.current) return;
      void generateMockupForContext(context, logoDescriptionRef.current);
    },
    [generateMockupForContext],
  );

  const regenerateAllMockups = useCallback(() => {
    if (!logoDescriptionRef.current) return;
    MOCKUP_CONTEXTS.forEach((m) => {
      void generateMockupForContext(m.context, logoDescriptionRef.current);
    });
  }, [generateMockupForContext]);

  // ── Loading state ──
  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#08080e]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────

  return (
    <AppShell
      maxWidth="7xl"
      header={
        <>
          <AppLogoLink />
          <div className="flex items-center gap-3">
            <Link
              href="/results"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary hover:text-foreground rounded-lg hover:bg-white/4 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Results</span>
            </Link>
          </div>
        </>
      }
    >
      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Title ── */}
        <div className="mb-6 rounded-3xl border border-white/8 bg-linear-to-br from-indigo-500/10 via-violet-500/6 to-transparent px-5 py-5 text-center shadow-2xl shadow-black/30 sm:px-8">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/70">
            Logo maker
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{topic}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Explore a full concept set, refine the winner, and export practical brand assets.
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="mb-8">
          <StepIndicator current={step} />
        </div>

        {/* ═══════════════════════════════════════════════════
            STEP 1: CONCEPTS
        ═══════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {step === "concepts" && (
            <motion.div
              key="concepts"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/8 bg-[#0b0b14]/85 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-7"
            >
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
                  <div className="rounded-2xl border border-white/8 bg-black/25 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setBriefOpen(!briefOpen)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/4"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings2 className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-semibold text-zinc-200">Design controls</span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-zinc-600 transition-transform duration-200",
                          briefOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {briefOpen && (
                      <div className="space-y-3 border-t border-white/6 px-4 py-4">
                        <ChipGroup
                          label="Mark"
                          options={LOGO_MARK_TYPES}
                          value={brief.markType}
                          onChange={(id) => setBriefField("markType", id)}
                        />
                        <ChipGroup
                          label="Style"
                          options={LOGO_VISUAL_STYLES}
                          value={brief.visualStyle}
                          onChange={(id) => setBriefField("visualStyle", id)}
                        />
                        <ChipGroup
                          label="Colors"
                          options={LOGO_COLOR_STRATEGIES}
                          value={brief.colorStrategy}
                          onChange={(id) => setBriefField("colorStrategy", id)}
                        />
                        <ChipGroup
                          label="Personality"
                          options={LOGO_PERSONALITIES}
                          value={brief.personality}
                          onChange={(id) => setBriefField("personality", id)}
                        />
                        <ToggleChips
                          label="Must-haves"
                          options={LOGO_MUST_HAVES}
                          selected={brief.mustHaves}
                          onToggle={toggleMust}
                        />
                        <ToggleChips
                          label="Avoid"
                          options={LOGO_AVOID}
                          selected={brief.avoid}
                          onToggle={toggleAvoid}
                        />
                        <div>
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                            Notes
                          </span>
                          <input
                            value={extraNotes}
                            onChange={(e) => setExtraNotes(e.target.value)}
                            placeholder="Exact spelling, symbols to avoid, etc..."
                            className="w-full rounded-lg border border-zinc-700/50 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBrief(DEFAULT_LOGO_BRIEF);
                            setExtraNotes("");
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-white"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset controls
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Live brief summary */}
                  <BriefSummaryCard brief={brief} topic={topic} extraNotes={extraNotes} />

                  <button
                    type="button"
                    onClick={generateConcepts}
                    disabled={conceptsGenerating}
                    className={cn(
                      "flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl transition-all",
                      "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500",
                      "shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.01] active:scale-[0.99]",
                      "disabled:pointer-events-none disabled:opacity-40",
                    )}
                  >
                    {conceptsGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {concepts.length > 0 ? "Regenerate concept set" : "Generate concept set"}
                  </button>
                </aside>

                <section className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/8 bg-black/20 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-white">Concept gallery</p>
                      <p className="text-xs text-zinc-500">Pick one to refine. Compare up to two variants side-by-side.</p>
                    </div>
                    <BgToggle value={previewBg} onChange={setPreviewBg} />
                  </div>

                  {compareConceptIdxs.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {compareConceptIdxs.map((idx) => {
                        const concept = concepts[idx];
                        if (!concept) return null;
                        return (
                          <div key={`compare-${concept.id}`} className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/80">
                              Compare • {concept.label}
                            </p>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={concept.src} alt={`Compare ${concept.label}`} className={cn("h-52 w-full rounded-lg object-contain p-3", bgClasses[previewBg])} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {conceptError && (
                    <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-200/95">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-400/90" />
                      <div>
                        <p>{conceptError}</p>
                        <p className="mt-1 text-xs text-red-300/60">Make sure OPENAI_API_KEY is set in your .env.local file.</p>
                      </div>
                    </div>
                  )}

                  {conceptsGenerating && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {["Concept A", "Concept B", "Concept C", "Concept D", "Concept E", "Concept F"].map((label) => (
                        <SkeletonCard key={label} label={label} />
                      ))}
                    </div>
                  )}

                  {!conceptsGenerating && concepts.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {concepts.map((c, i) => (
                        <ConceptCard
                          key={c.id}
                          concept={c}
                          selected={selectedConceptIdx === i}
                          compareSelected={compareConceptIdxs.includes(i)}
                          previewBg={previewBg}
                          onSelect={() => selectConceptAndRefine(i)}
                          onCompare={() => toggleCompareConcept(i)}
                        />
                      ))}
                    </div>
                  )}

                  {!conceptsGenerating && concepts.length === 0 && !conceptError && (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 py-20 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
                        <ImageIcon className="h-8 w-8 text-zinc-700" strokeWidth={1.25} />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-300">
                        Your logo concepts will appear here
                      </h3>
                      <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
                        Use the controls on the left and generate a full concept gallery.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2: REFINE
          ═══════════════════════════════════════════════════ */}
          {step === "refine" && (
            <motion.div
              key="refine"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/8 bg-[#0b0b14]/85 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-7"
            >
              {/* Back link */}
              <button
                type="button"
                onClick={() => setStep("concepts")}
                className="mb-6 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to concepts
              </button>

              {/* Main refine layout */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
                {/* Left: large active preview */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Active version
                    </span>
                    <BgToggle value={previewBg} onChange={setPreviewBg} />
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl border border-zinc-800/60 shadow-2xl shadow-black/40 overflow-hidden transition-colors duration-200",
                      bgClasses[previewBg],
                    )}
                  >
                    {activeLogo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={activeLogo}
                        alt="Active refinement"
                        className="w-full h-auto max-h-[560px] object-contain p-6"
                      />
                    ) : (
                      <div className="flex items-center justify-center py-32">
                        <ImageIcon className="h-12 w-12 text-zinc-700" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: refinement panel */}
                <div className="flex flex-col gap-4">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <h3 className="mb-3 text-sm font-semibold text-white">Refine this concept</h3>

                    {/* Natural language input */}
                    <div className="relative mb-4">
                      <input
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            generateRefinement(refineInput);
                          }
                        }}
                        placeholder="Make it more minimal, try blue colors..."
                        disabled={refineGenerating}
                        className="w-full rounded-xl border border-zinc-700/50 bg-zinc-950/80 pl-4 pr-12 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => generateRefinement(refineInput)}
                        disabled={!refineInput.trim() || refineGenerating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {refineGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Quick chips */}
                    <div className="mb-4">
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                        Quick adjustments
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            disabled={refineGenerating}
                            onClick={() => generateRefinement(chip)}
                            className="rounded-full border border-zinc-700/50 bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Refine error */}
                    {refineError && (
                      <div className="mb-3 flex gap-2 rounded-lg border border-red-500/20 bg-red-950/30 p-3 text-xs text-red-200/90">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-400/80" />
                        {refineError}
                      </div>
                    )}
                  </div>

                  {/* CTA: proceed to brand kit */}
                  <button
                    type="button"
                    onClick={proceedToBrandKit}
                    disabled={refineGenerating}
                    className={cn(
                      "flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-xl transition-all",
                      "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500",
                      "shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]",
                      "disabled:pointer-events-none disabled:opacity-40",
                    )}
                  >
                    <Wand2 className="h-4 w-4" />
                    Use this logo &rarr; Generate brand kit
                  </button>
                </div>
              </div>

              {/* Refinement timeline */}
              {refinements.length > 1 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/20">
                      <RotateCcw className="h-3 w-3 text-indigo-300" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Refinement timeline ({refinements.length} versions)
                    </span>
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[39px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-violet-500/20 to-transparent sm:left-[47px]" />
                    <div className="flex flex-col gap-3">
                      {refinements.map((ref, i) => (
                        <button
                          key={ref.id}
                          type="button"
                          onClick={() => setActiveRefinementIdx(i)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl p-2 transition-all text-left group",
                            activeRefinementIdx === i
                              ? "bg-indigo-500/10 border border-indigo-500/25"
                              : "hover:bg-white/[0.03] border border-transparent",
                          )}
                        >
                          {/* Step number */}
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold z-10",
                            activeRefinementIdx === i
                              ? "bg-indigo-500 text-white ring-2 ring-indigo-500/30"
                              : "bg-zinc-800 text-zinc-500 border border-zinc-700 group-hover:border-zinc-600",
                          )}>
                            {i + 1}
                          </div>
                          {/* Thumbnail */}
                          <div className={cn(
                            "shrink-0 overflow-hidden rounded-lg border transition-all",
                            activeRefinementIdx === i
                              ? "border-indigo-400/50 ring-1 ring-indigo-500/20"
                              : "border-zinc-800 group-hover:border-zinc-600",
                          )}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ref.src}
                              alt={i === 0 ? "Original" : `Refinement ${i}`}
                              className="h-14 w-14 object-contain bg-white sm:h-16 sm:w-16 p-0.5"
                            />
                          </div>
                          {/* Label */}
                          <div className="min-w-0">
                            <p className={cn(
                              "text-xs font-semibold truncate",
                              activeRefinementIdx === i ? "text-white" : "text-zinc-400",
                            )}>
                              {i === 0 ? "Original concept" : `Refinement #${i}`}
                            </p>
                            <p className="text-[10px] text-zinc-600 truncate">
                              {i === 0 ? "Base design" : "Adjusted from feedback"}
                            </p>
                          </div>
                        </button>
                      ))}
                      {refineGenerating && (
                        <div className="flex items-center gap-3 rounded-xl p-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 z-10">
                            <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                          </div>
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 sm:h-16 sm:w-16">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-400/40" />
                          </div>
                          <p className="text-xs text-zinc-500">Generating...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3: BRAND KIT & MOCKUPS
          ═══════════════════════════════════════════════════ */}
          {step === "brandkit" && (
            <motion.div
              key="brandkit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/8 bg-[#0b0b14]/85 p-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-7"
            >
              {/* Back link */}
              <button
                type="button"
                onClick={() => {
                  hasFiredBrandKit.current = false;
                  setStep("refine");
                }}
                className="mb-6 flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to refine
              </button>

              {/* Final logo */}
              {activeLogo && (
                <div className="mb-8">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      Final logo
                    </span>
                    <a
                      href={activeLogo}
                      download={`${topicSlug}-logo.png`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download logo
                    </a>
                  </div>
                  <div className="mx-auto max-w-sm rounded-2xl border border-white/8 bg-white overflow-hidden shadow-2xl shadow-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeLogo}
                      alt={`Final logo for ${topic}`}
                      className="w-full h-auto max-h-80 object-contain p-8"
                    />
                  </div>
                </div>
              )}

              {/* ── Mockups grid ── */}
              <div className="mb-10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/15">
                      <ImageIcon className="h-4 w-4 text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Brand asset previews</h2>
                      <p className="text-xs text-zinc-500">
                        Utility-focused outputs like app icon, avatar, favicon, and light/dark lockups
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={regenerateAllMockups}
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/75 hover:bg-white/10"
                  >
                    Regenerate all
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mockups.map((slot) => (
                    <MockupCard key={slot.context} slot={slot} topicSlug={topicSlug} onRetry={retryMockup} />
                  ))}
                </div>
              </div>

              {/* ── Brand Kit (structured) ── */}
              {(brandKitBlueprint || brandKitGenerating) && (
                <div className="mt-10">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15">
                        <Palette className="h-5 w-5 text-violet-300" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Brand Kit</h2>
                        <p className="text-xs text-zinc-500">
                          Structured identity system with positioning guardrails
                        </p>
                      </div>
                    </div>
                    {brandKitGenerating && (
                      <span className="flex items-center gap-1.5 text-xs text-violet-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building system...
                      </span>
                    )}
                  </div>

                  {brandKitError && (
                    <div className="mb-4 flex gap-3 rounded-xl border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-200/95">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-400/90" />
                      {brandKitError}
                    </div>
                  )}

                  {brandKitBlueprint && (
                    <>
                      <div className="mb-6 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Audience
                          </p>
                          <p className="text-sm text-zinc-300">{brandKitBlueprint.brandKit.audience}</p>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Positioning
                          </p>
                          <p className="text-sm text-zinc-300">{brandKitBlueprint.brandKit.positioning}</p>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Personality
                          </p>
                          <p className="text-sm text-zinc-300">{brandKitBlueprint.brandKit.personality}</p>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Tone
                          </p>
                          <p className="text-sm text-zinc-300">{brandKitBlueprint.brandKit.tone}</p>
                        </div>
                      </div>

                      <div className="mb-6 rounded-xl border border-white/6 bg-zinc-950/40 p-4">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Color palette
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {colorSwatches.map((sw, i) => (
                            <button
                              key={`${sw.hex}-${i}`}
                              type="button"
                              onClick={() => navigator.clipboard.writeText(sw.hex)}
                              title={`Copy ${sw.hex} — ${sw.usage}`}
                              className="group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-white/4"
                            >
                              <div
                                style={{ backgroundColor: ensureHex(sw.hex) }}
                                className="h-12 w-12 rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform"
                              />
                              <span className="font-mono text-[10px] text-zinc-300 group-hover:text-white">
                                {sw.hex}
                              </span>
                              <span className="max-w-[120px] truncate text-[10px] text-zinc-500">{sw.token}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6 grid gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Typography
                          </p>
                          <p className="text-sm text-zinc-300">Primary: {brandKitBlueprint.brandKit.typography.primary}</p>
                          <p className="mt-1 text-sm text-zinc-300">Secondary: {brandKitBlueprint.brandKit.typography.secondary}</p>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                            {brandKitBlueprint.brandKit.typography.guidance}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Competitor guardrails
                          </p>
                          <div className="space-y-2">
                            {brandKitBlueprint.brandKit.competitorGuardrails.map((g, i) => (
                              <div key={`${g.risk}-${i}`} className="rounded-lg border border-white/8 bg-white/2 p-2.5">
                                <p className="text-xs font-semibold text-white/85">{g.risk}</p>
                                <p className="mt-1 text-xs text-zinc-400">{g.response}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Brand guidelines do's/don'ts */}
                      <BrandGuidelinesCard blueprint={brandKitBlueprint} />

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Logo rules
                          </p>
                          <ul className="space-y-1.5 text-xs text-zinc-300">
                            {brandKitBlueprint.brandKit.logoRules.map((rule, i) => (
                              <li key={`${rule}-${i}`}>- {rule}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-zinc-950/40 p-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                            Rollout checklist
                          </p>
                          <ul className="space-y-1.5 text-xs text-zinc-300">
                            {brandKitBlueprint.brandKit.rolloutChecklist.map((item, i) => (
                              <li key={`${item}-${i}`}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AppShell>
  );
}

// ────────────────────────────────────────────────────────────
// Page wrapper with Suspense
// ────────────────────────────────────────────────────────────

export default function BrandStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-[#08080e]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500/50" />
        </div>
      }
    >
      <BrandStudioInner />
    </Suspense>
  );
}
