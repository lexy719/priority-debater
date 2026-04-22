"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  Copy,
  CheckCircle2,
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
  buildLogoConceptPrompt,
  buildRefinementPrompt,
  buildMockupPrompt,
  getMockupSize,
} from "@/lib/logo-brief";
import { loadSessionWithStatus } from "@/lib/session";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import { streamDebateMarkdown } from "@/lib/stream-debate-markdown";
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

const MOCKUP_CONTEXTS: { context: string; label: string }[] = [
  { context: "business-card", label: "Business Card" },
  { context: "email-header", label: "Email Header" },
  { context: "app-icon", label: "App Icon" },
  { context: "social-avatar", label: "Social Avatar" },
  { context: "website-hero", label: "Website Hero" },
  { context: "billing-page", label: "Billing Page" },
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

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractColorSwatches(md: string): Array<{ token: string; hex: string; usage: string }> {
  const colors: Array<{ token: string; hex: string; usage: string }> = [];
  const re = /\|\s*([\w\s/&]+?)\s*\|\s*(#[0-9A-Fa-f]{3,8})\s*\|\s*(.*?)\s*\|/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    const token = m[1].trim();
    if (token.toLowerCase() === "token" || token.startsWith("---")) continue;
    colors.push({ token, hex: m[2].trim(), usage: m[3].trim() });
  }
  return colors;
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
  previewBg,
  onSelect,
}: {
  concept: Concept;
  selected: boolean;
  previewBg: PreviewBg;
  onSelect: () => void;
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
      <div className="px-4 py-3 border-t border-white/6 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">{concept.label}</span>
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
}: {
  slot: MockupSlot;
  topicSlug: string;
}) {
  const isWide = ["email-header", "website-hero", "billing-page"].includes(slot.context);

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
  const [conceptError, setConceptError] = useState<string | null>(null);

  // Refine (step 2)
  const [refinements, setRefinements] = useState<Refinement[]>([]);
  const [activeRefinementIdx, setActiveRefinementIdx] = useState(0);
  const [refineGenerating, setRefineGenerating] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [refineError, setRefineError] = useState<string | null>(null);

  // Mockups & brand kit (step 3)
  const [mockups, setMockups] = useState<MockupSlot[]>([]);
  const [brandKitContent, setBrandKitContent] = useState("");
  const [brandKitStreaming, setBrandKitStreaming] = useState("");
  const [brandKitGenerating, setBrandKitGenerating] = useState(false);
  const [brandKitError, setBrandKitError] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);

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

    const labels = ["Concept A", "Concept B", "Concept C"];

    try {
      // Generate 3 concepts in parallel
      const promises = [0, 1, 2].map(async (variantIndex) => {
        const prompt = buildLogoConceptPrompt(topic, position, brief, extraNotes, variantIndex);
        const res = await fetch("/api/generate-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, count: 1 }),
        });
        if (!res.ok) throw new Error(await messageFromFailedResponse(res));
        const data = await res.json();
        const src = data.dataUrl || data.url || data.results?.[0]?.dataUrl;
        if (!src) throw new Error("No image returned");
        return { id: uid(), src, promptUsed: prompt, label: labels[variantIndex] } as Concept;
      });

      const results = await Promise.all(promises);
      setConcepts(results);
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
      setActiveRefinementIdx(0);
      setRefineInput("");
      setRefineError(null);
      setStep("refine");
    },
    [concepts],
  );

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
        const prompt = buildRefinementPrompt(activeRef.promptUsed, instruction.trim());
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
    [refinements, activeRefinementIdx, refineGenerating],
  );

  // ────────────────────────────────────────────────────────
  // Step 3: Brand kit entry
  // ────────────────────────────────────────────────────────

  const proceedToBrandKit = useCallback(() => {
    setStep("brandkit");
  }, []);

  // Auto-trigger mockups and brand kit on entering step 3
  const hasFiredBrandKit = useRef(false);

  useEffect(() => {
    if (step !== "brandkit" || !session || hasFiredBrandKit.current) return;
    hasFiredBrandKit.current = true;

    const activeRef = refinements[activeRefinementIdx];
    if (!activeRef) return;

    // Describe the logo for mockup prompts
    const logoDescription = `Logo for "${topic}" — ${activeRef.promptUsed.slice(0, 200)}`;

    // Generate 6 mockups in parallel
    const initialMockups: MockupSlot[] = MOCKUP_CONTEXTS.map((m) => ({
      ...m,
      src: null,
      generating: true,
      error: null,
    }));
    setMockups(initialMockups);

    MOCKUP_CONTEXTS.forEach(async (m, i) => {
      try {
        const prompt = buildMockupPrompt(topic, logoDescription, m.context);
        const size = getMockupSize(m.context);
        const res = await fetch("/api/generate-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, count: 1, size }),
        });
        if (!res.ok) throw new Error(await messageFromFailedResponse(res));
        const data = await res.json();
        const src = data.dataUrl || data.url || data.results?.[0]?.dataUrl;
        if (!src) throw new Error("No image returned");

        setMockups((prev) =>
          prev.map((slot, si) =>
            si === i ? { ...slot, src, generating: false } : slot,
          ),
        );
      } catch (e) {
        setMockups((prev) =>
          prev.map((slot, si) =>
            si === i
              ? { ...slot, generating: false, error: e instanceof Error ? e.message : "Failed" }
              : slot,
          ),
        );
      }
    });

    // Stream brand kit text
    setBrandKitGenerating(true);
    setBrandKitError(null);
    setBrandKitStreaming("");
    setBrandKitContent("");

    streamDebateMarkdown("logo-brand-kit", session, (acc) => setBrandKitStreaming(acc), {
      logoBrief: brief,
    })
      .then((final) => {
        setBrandKitContent(final);
        setBrandKitStreaming("");
      })
      .catch((e) => {
        setBrandKitError(e instanceof Error ? e.message : "Brand kit generation failed.");
      })
      .finally(() => {
        setBrandKitGenerating(false);
      });
  }, [step, session, refinements, activeRefinementIdx, topic, brief]);

  // ── Derived display values ──
  const displayBrandKit = brandKitContent || brandKitStreaming;
  const colorSwatches = useMemo(
    () => (displayBrandKit ? extractColorSwatches(displayBrandKit) : []),
    [displayBrandKit],
  );
  const activeLogo = refinements[activeRefinementIdx]?.src ?? null;

  // ── Brand kit actions ──
  const handleCopyKit = useCallback(() => {
    if (!displayBrandKit) return;
    navigator.clipboard.writeText(displayBrandKit).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, [displayBrandKit]);

  const handleDownloadKit = useCallback(() => {
    if (!displayBrandKit) return;
    const blob = new Blob([displayBrandKit], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topicSlug}-brand-kit.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [displayBrandKit, topicSlug]);

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
        <div className="mb-4 text-center">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300/55">
            Logo maker
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{topic}</h1>
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
            >
              {/* Design preferences */}
              <div className="mb-6">
                <div className="rounded-2xl border border-white/6 bg-zinc-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBriefOpen(!briefOpen)}
                    className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/3"
                  >
                    <div className="flex items-center gap-3">
                      <Settings2 className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-300">Design preferences</span>
                      {!briefOpen && (
                        <span className="text-[11px] text-zinc-600">
                          Mark, style, colors, personality
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-zinc-600 transition-transform duration-200",
                        briefOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {briefOpen && (
                    <div className="border-t border-white/6 px-5 py-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-zinc-600">
                          Shapes the concept generation prompts.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setBrief(DEFAULT_LOGO_BRIEF);
                            setExtraNotes("");
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 hover:text-white"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      </div>

                      <div>
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                          Notes
                        </span>
                        <input
                          value={extraNotes}
                          onChange={(e) => setExtraNotes(e.target.value)}
                          placeholder="Competitor logos to avoid, exact name spelling..."
                          className="w-full rounded-lg border border-zinc-700/50 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate / Regenerate button */}
              <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={generateConcepts}
                  disabled={conceptsGenerating}
                  className={cn(
                    "flex items-center justify-center gap-2.5 rounded-2xl px-10 py-4 text-sm font-bold text-white shadow-xl transition-all",
                    "bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500",
                    "shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
                      {conceptsGenerating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </span>
                    <span>
                      {conceptsGenerating
                        ? "Generating 3 concepts..."
                        : concepts.length > 0
                          ? "Regenerate concepts"
                          : "Generate 3 Concepts"}
                    </span>
                  </span>
                </button>
              </div>

              {/* Error */}
              {conceptError && (
                <div className="mb-6 mx-auto max-w-2xl flex gap-3 rounded-xl border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-200/95">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-400/90" />
                  <div>
                    <p>{conceptError}</p>
                    <p className="mt-1 text-xs text-red-300/60">Make sure OPENAI_API_KEY is set in your .env.local file.</p>
                  </div>
                </div>
              )}

              {/* Background toggle */}
              {(concepts.length > 0 || conceptsGenerating) && (
                <div className="mb-4 flex justify-end">
                  <BgToggle value={previewBg} onChange={setPreviewBg} />
                </div>
              )}

              {/* Skeleton loading cards */}
              {conceptsGenerating && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {["Concept A", "Concept B", "Concept C"].map((label) => (
                    <SkeletonCard key={label} label={label} />
                  ))}
                </div>
              )}

              {/* Concept cards grid */}
              {!conceptsGenerating && concepts.length > 0 && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {concepts.map((c, i) => (
                    <ConceptCard
                      key={c.id}
                      concept={c}
                      selected={selectedConceptIdx === i}
                      previewBg={previewBg}
                      onSelect={() => selectConceptAndRefine(i)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!conceptsGenerating && concepts.length === 0 && !conceptError && (
                <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 py-20 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/60">
                    <ImageIcon className="h-8 w-8 text-zinc-700" strokeWidth={1.25} />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-400">
                    Your logo concepts will appear here
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-600">
                    Configure your preferences above, then generate 3 unique concepts.
                  </p>
                </div>
              )}
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

              {/* Iterations strip */}
              {refinements.length > 1 && (
                <div className="mt-6">
                  <span className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    Iterations ({refinements.length})
                  </span>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {refinements.map((ref, i) => (
                      <button
                        key={ref.id}
                        type="button"
                        onClick={() => setActiveRefinementIdx(i)}
                        className={cn(
                          "shrink-0 overflow-hidden rounded-xl border transition-all",
                          activeRefinementIdx === i
                            ? "border-indigo-400/50 ring-2 ring-indigo-500/30"
                            : "border-zinc-800 hover:border-zinc-600",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ref.src}
                          alt={i === 0 ? "Original" : `Refinement ${i}`}
                          className="h-20 w-20 object-contain bg-white sm:h-24 sm:w-24 p-1"
                        />
                      </button>
                    ))}
                    {refineGenerating && (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 sm:h-24 sm:w-24">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400/50" />
                      </div>
                    )}
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
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/15">
                    <ImageIcon className="h-4 w-4 text-indigo-300" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Mockups</h2>
                    <p className="text-xs text-zinc-500">
                      Your logo on real-world surfaces
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {mockups.map((slot) => (
                    <MockupCard key={slot.context} slot={slot} topicSlug={topicSlug} />
                  ))}
                </div>
              </div>

              {/* ── Brand Kit (text) ── */}
              {(displayBrandKit || brandKitGenerating) && (
                <div className="mt-10">
                  {/* Section header */}
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/15">
                        <Palette className="h-5 w-5 text-violet-300" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">Brand Kit</h2>
                        <p className="text-xs text-zinc-500">
                          Color palette, typography, logo concepts, and guidelines
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {brandKitGenerating ? (
                        <span className="flex items-center gap-1.5 text-xs text-violet-300">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCopyKit}
                            disabled={!displayBrandKit}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                          >
                            {copyToast ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">
                              {copyToast ? "Copied" : "Copy"}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadKit}
                            disabled={!displayBrandKit}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-40"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">.md</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Brand kit error */}
                  {brandKitError && (
                    <div className="mb-4 flex gap-3 rounded-xl border border-red-500/20 bg-red-950/40 p-4 text-sm text-red-200/95">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-400/90" />
                      {brandKitError}
                    </div>
                  )}

                  {/* Color swatches */}
                  {colorSwatches.length > 0 && (
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
                              style={{ backgroundColor: sw.hex }}
                              className="h-12 w-12 rounded-xl border border-white/10 shadow-lg group-hover:scale-105 transition-transform"
                            />
                            <span className="font-mono text-[10px] text-zinc-400 group-hover:text-zinc-200">
                              {sw.hex}
                            </span>
                            <span className="max-w-[80px] truncate text-[10px] text-zinc-600">
                              {sw.token}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Markdown content */}
                  <div className="rounded-2xl border border-white/7 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 shadow-2xl shadow-black/50 overflow-hidden relative">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent" />
                    <div className="p-6 sm:p-8">
                      <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/6 prose-h2:pb-2 prose-h3:mt-5 prose-h3:mb-2 prose-p:leading-relaxed prose-p:text-zinc-400 prose-strong:text-white/90 prose-li:text-zinc-400 prose-code:rounded-md prose-code:bg-zinc-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-indigo-200/90 prose-code:before:content-[''] prose-code:after:content-[''] prose-table:text-sm prose-th:bg-zinc-800/50 prose-th:text-zinc-300 prose-td:text-zinc-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {displayBrandKit}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
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
