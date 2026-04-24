"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Download,
  FileText,
  RefreshCcw,
  Share2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyIdeaCategory } from "@/lib/idea-category";
import {
  extractDashboardData,
  getCategoryScoreAggregate,
  getValidationReportCompleteness,
  viabilityHeadlineDivergence,
} from "@/lib/parse";
import { SCORE_MAX } from "@/lib/scoring-scale";
import { clearSession, loadSessionWithStatus, saveSession } from "@/lib/session";
import type { ValidationSession } from "@/lib/types";

/* =============================================================
   Priority Debater — Results (Editorial Dossier)
   Monochrome base. Red/green only on directional signal (GO/NO-GO,
   score thresholds, bull/bear markers). Every number in Instrument
   Serif via .num-* classes. No decorative colour, gradients, or
   particles.
   ============================================================= */

const SECTIONS = [
  { id: "verdict", label: "Verdict" },
  { id: "scores", label: "Category scores" },
  { id: "problem", label: "Problem & solution" },
  { id: "customer", label: "Target customer" },
  { id: "value", label: "Value proposition" },
  { id: "market", label: "Market opportunity" },
  { id: "competition", label: "Competitive landscape" },
  { id: "model", label: "Business model" },
  { id: "financials", label: "Financials" },
  { id: "strengths-risks", label: "Strengths & risks" },
  { id: "canvas", label: "Lean canvas" },
  { id: "plan", label: "Action plan" },
] as const;

const CATEGORY_LABELS: Array<{ key: keyof NonNullable<ReturnType<typeof extractDashboardData>["categoryScores"]>; label: string }> = [
  { key: "problemSolutionFit", label: "Problem–solution fit" },
  { key: "marketOpportunity", label: "Market opportunity" },
  { key: "competitiveEdge", label: "Competitive edge" },
  { key: "businessModel", label: "Business model" },
  { key: "teamExecution", label: "Team & execution" },
  { key: "timingTrends", label: "Timing & trends" },
];

const MAX_SHARE_PARAM_CHARS = 45_000;

function parseSharePayload(encoded: string): ValidationSession | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const d = JSON.parse(json) as { t?: string; p?: string; c?: string; v?: string };
    if (!d.v || typeof d.v !== "string") return null;
    return {
      setup: {
        template: "validate",
        topic: d.t || "Shared idea",
        position: d.p || "",
        context: d.c || "",
        lens: "investor",
      },
      validationContent: d.v,
      messages: [{ id: "shared", role: "opponent", content: d.v }],
      createdAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function generateShareData(session: ValidationSession): string {
  return btoa(
    encodeURIComponent(
      JSON.stringify({
        t: session.setup.topic,
        p: session.setup.position,
        c: session.setup.context,
        v: session.validationContent,
      }),
    ),
  );
}

function downloadAsMarkdown(setup: ValidationSession["setup"], content: string) {
  const header = `# Validation Report: ${setup.topic}\n\n**Your case:** ${setup.position}\n${
    setup.context ? `**Context:** ${setup.context}\n` : ""
  }\n---\n\n`;
  const blob = new Blob([header + content.trim()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `validation-${(setup.topic || "idea")
    .slice(0, 40)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAsPDF(setup: ValidationSession["setup"], content: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const styles = `
    @page { margin: 28mm 22mm; }
    body { font-family: Georgia, "Iowan Old Style", serif; color: #111; line-height: 1.55; max-width: 720px; margin: 0 auto; }
    h1 { font-family: Georgia, serif; font-size: 32pt; font-weight: 400; letter-spacing: -0.02em; margin: 0 0 8pt; }
    h2 { font-family: -apple-system, "Helvetica Neue", sans-serif; font-size: 11pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin: 28pt 0 10pt; padding-bottom: 6pt; border-bottom: 1px solid #ddd; }
    h3 { font-family: -apple-system, sans-serif; font-size: 12pt; font-weight: 600; margin: 18pt 0 6pt; }
    p, li { font-size: 11pt; }
    p { margin: 0 0 8pt; }
    ul, ol { margin: 0 0 10pt 18pt; }
    table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-family: -apple-system, sans-serif; font-size: 10pt; }
    th, td { text-align: left; padding: 6pt 8pt; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9pt; color: #666; }
    strong { color: #000; }
    .kicker { font-family: -apple-system, sans-serif; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 8pt; }
    .meta { font-family: -apple-system, sans-serif; font-size: 9pt; color: #888; margin-top: 40pt; padding-top: 10pt; border-top: 1px solid #ddd; }
  `;
  w.document.write(
    `<!DOCTYPE html><html><head><title>${setup.topic} — Validation Report</title><style>${styles}</style></head><body>` +
      `<div class="kicker">Priority Debater · Editorial Dossier</div>` +
      `<h1>${setup.topic}</h1>` +
      (setup.position ? `<p><strong>Premise.</strong> ${setup.position}</p>` : "") +
      (setup.context ? `<p><strong>Context.</strong> ${setup.context}</p>` : "") +
      `<div id="c"></div>` +
      `<p class="meta">Generated ${new Date().toLocaleDateString()} · priority-debater.vercel.app</p>` +
      `<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>` +
      `<script>document.getElementById('c').innerHTML = marked.parse(${JSON.stringify(content)}); setTimeout(()=>window.print(), 500);<\/script>` +
      `</body></html>`,
  );
  w.document.close();
}

function formatDateShort(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Verdict badge — the one place GO/NO-GO colour lives ── */
function VerdictBadge({ verdict }: { verdict: "go" | "caution" | "nogo" | null }) {
  if (!verdict) return null;
  const config = {
    go: {
      label: "GO",
      icon: <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.25} />,
      className: "border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[--success-soft] text-[--success]",
    },
    caution: {
      label: "CAUTION",
      icon: null,
      className: "border-[--line-strong] bg-[--surface-2] text-[--ink-0]",
    },
    nogo: {
      label: "NO-GO",
      icon: <ArrowDownRight className="h-3.5 w-3.5" strokeWidth={2.25} />,
      className: "border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[--error-soft] text-[--error]",
    },
  }[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[--r-sm] border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        config.className,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

/* ── Score colour: green ≥ threshold, red below, ink otherwise ── */
function scoreTone(value: number | null | undefined, goThreshold = 70, nogoThreshold = 50) {
  if (value == null) return "neutral" as const;
  if (value >= goThreshold) return "bull" as const;
  if (value < nogoThreshold) return "bear" as const;
  return "neutral" as const;
}

function scoreToneClass(tone: "bull" | "bear" | "neutral") {
  if (tone === "bull") return "text-[--success]";
  if (tone === "bear") return "text-[--error]";
  return "text-[--ink-0]";
}

/* ── Editorial section wrapper ── */
function Section({
  id,
  kicker,
  title,
  children,
  index,
}: {
  id: string;
  kicker?: string;
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-[--line] pt-10 first:border-t-0 first:pt-0">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="caption text-[--ink-2]">§ {String(index).padStart(2, "0")}</span>
        <h2 className="h2 text-[--ink-0]">{title}</h2>
      </div>
      {kicker && <p className="small mb-4 text-[--ink-2]">{kicker}</p>}
      {children}
    </section>
  );
}

/* ── Markdown — Editorial styling. Used for all prose blocks. ── */
function Prose({ children }: { children: string }) {
  return (
    <div className="markdown-editorial">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="body mb-3 text-[--ink-1] last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-0 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => (
            <li className="body relative pl-5 text-[--ink-1] before:absolute before:left-0 before:top-[0.65em] before:h-px before:w-3 before:bg-[--line-strong]">
              {children}
            </li>
          ),
          strong: ({ children }) => <strong className="font-semibold text-[--ink-0]">{children}</strong>,
          em: ({ children }) => <em className="italic text-[--ink-0]">{children}</em>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tr: ({ children }) => <tr className="border-b border-[--line]">{children}</tr>,
          th: ({ children }) => (
            <th className="caption px-3 py-2.5 text-left text-[--ink-2]">{children}</th>
          ),
          td: ({ children }) => <td className="body px-3 py-2.5 align-top text-[--ink-1]">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l border-[--ink-2] pl-4 italic text-[--ink-1]" style={{ fontFamily: "var(--app-font-serif)" }}>
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="mono rounded-[--r-sm] bg-[--surface-2] px-1.5 py-0.5 text-[--ink-0]">{children}</code>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-[--ink-0] underline decoration-[--line-strong] underline-offset-4 hover:decoration-[--accent]">
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

/* ── Category score row ── */
function ScoreRow({
  label,
  value,
  index,
}: {
  label: string;
  value: number | null;
  index: number;
}) {
  const tone = scoreTone(value);
  const pct = value == null ? 0 : Math.max(4, (value / SCORE_MAX) * 100);
  return (
    <tr className="border-b border-[--line] last:border-b-0">
      <td className="caption py-3 pr-4 text-[--ink-2]">{String(index).padStart(2, "0")}</td>
      <td className="body py-3 pr-4 text-[--ink-0]">{label}</td>
      <td className="py-3 pr-4">
        <div className="relative h-[6px] w-full min-w-[120px] overflow-hidden bg-[--surface-2]">
          <div
            className={cn(
              "absolute inset-y-0 left-0",
              tone === "bull" && "bg-[--success]",
              tone === "bear" && "bg-[--error]",
              tone === "neutral" && "bg-[--ink-1]",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </td>
      <td className="py-3 pr-0 text-right">
        {value == null ? (
          <span className="small text-[--ink-2]">—</span>
        ) : (
          <span className={cn("num-sm", scoreToneClass(tone))}>{value}</span>
        )}
      </td>
      <td className="caption py-3 pl-3 text-[--ink-2]">/ {SCORE_MAX}</td>
    </tr>
  );
}

/* ── Main ── */
function ResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "expired">("loading");
  const [shareToast, setShareToast] = useState<"idle" | "copied" | "tooLarge">("idle");

  useEffect(() => {
    const fromShare = searchParams.get("s");
    if (fromShare) {
      const parsed = parseSharePayload(fromShare);
      if (parsed) {
        saveSession(parsed);
        setSession(parsed);
        setLoadState("ready");
        router.replace("/results", { scroll: false });
        return;
      }
      router.replace("/journey");
      return;
    }
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      setLoadState("expired");
      return;
    }
    if (result.status === "none") {
      router.replace("/journey");
      return;
    }
    setSession(result.session);
    setLoadState("ready");
  }, [router, searchParams]);

  const handleCopyShareLink = useCallback(() => {
    if (!session) return;
    const param = generateShareData(session);
    if (param.length > MAX_SHARE_PARAM_CHARS) {
      setShareToast("tooLarge");
      setTimeout(() => setShareToast("idle"), 3000);
      return;
    }
    const url = `${window.location.origin}/results?s=${param}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareToast("copied");
      setTimeout(() => setShareToast("idle"), 2000);
    });
  }, [session]);

  const handleRevise = useCallback(() => {
    if (!session) return;
    sessionStorage.setItem("revalidate", JSON.stringify(session.setup));
    router.push(session.setup.template === "generate" ? "/validate?mode=generate" : "/journey");
  }, [router, session]);

  const handleNew = useCallback(() => {
    clearSession();
    router.push("/journey");
  }, [router]);

  const data = useMemo(() => {
    if (!session) return null;
    const dashboard = extractDashboardData(session.validationContent);
    const completeness = getValidationReportCompleteness(session.validationContent);
    const rubricAgg = getCategoryScoreAggregate(dashboard.categoryScores);
    const divergence =
      session.setup.template === "validate"
        ? viabilityHeadlineDivergence(dashboard.score, dashboard.categoryScores)
        : null;
    const category =
      session.ideaCategory?.label ??
      classifyIdeaCategory(session.setup.topic, session.setup.position).label;
    return { dashboard, completeness, rubricAgg, divergence, category };
  }, [session]);

  if (loadState === "loading" || !session || !data) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[--bg]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--line-strong] border-t-[--ink-0]" />
          <p className="small text-[--ink-2]">Loading dossier…</p>
        </div>
      </div>
    );
  }

  if (loadState === "expired") {
    return (
      <div className="grid min-h-dvh place-items-center bg-[--bg] px-4">
        <div className="w-full max-w-md border border-[--line] bg-[--surface-1] p-8 rounded-[--r]">
          <p className="caption mb-3 text-[--ink-2]">Session expired</p>
          <h1 className="h1 mb-3 text-[--ink-0]">This dossier is no longer available.</h1>
          <p className="body mb-6 text-[--ink-1]">
            Validation reports are kept for 24 hours in this browser. Start a new run to stress-test your idea again.
          </p>
          <Link
            href="/journey"
            className="inline-flex items-center justify-center rounded-[--r] bg-[--ink-0] px-5 py-3 text-sm font-medium text-[--bg] transition hover:brightness-90"
          >
            New validation
          </Link>
        </div>
      </div>
    );
  }

  const { setup, validationContent, createdAt } = session;
  const { dashboard, completeness, divergence, category } = data;
  const { score, goNoGoType, strengths, risks, recommendations, tamSamSom } = dashboard;

  const shareLabel =
    shareToast === "copied"
      ? "Link copied"
      : shareToast === "tooLarge"
        ? "Report too large to share by URL — use PDF instead"
        : "Share";

  const headlineTone = scoreTone(score);

  const hasMarket = !!(
    dashboard.marketSummary ||
    tamSamSom.tam ||
    tamSamSom.sam ||
    tamSamSom.som
  );
  const hasCompetition = !!(dashboard.competitiveSummary || dashboard.competitiveMatrix.length);
  const hasFinancials = !!(
    dashboard.financialProjections.length ||
    dashboard.unitEconomics.cac ||
    dashboard.unitEconomics.ltv ||
    dashboard.breakEven.point ||
    dashboard.financialSummary
  );
  const hasCanvas = !!dashboard.leanCanvas;
  const hasPlan = !!(
    recommendations.length ||
    dashboard.keyAssumptions ||
    dashboard.timelineToLaunch
  );
  const hasStrengthsRisks = strengths.length > 0 || risks.length > 0;

  return (
    <div className="min-h-dvh bg-[--bg] text-[--ink-0]">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 border-b border-[--line] bg-[--bg]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-5 sm:gap-6 sm:px-8">
          <Link href="/" className="caption shrink-0 text-[--ink-2] transition hover:text-[--ink-0]">
            Priority Debater
          </Link>
          <span className="caption text-[--ink-3]" aria-hidden>/</span>
          <span className="caption truncate text-[--ink-1]">Dossier</span>
          <span className="caption hidden text-[--ink-3] md:inline" aria-hidden>/</span>
          <span className="small hidden min-w-0 flex-1 truncate text-[--ink-1] md:block">
            {setup.topic}
          </span>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleCopyShareLink}
              title={shareLabel}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-[--r] border border-transparent px-3 text-xs font-medium transition",
                shareToast === "tooLarge"
                  ? "text-[--error]"
                  : "text-[--ink-1] hover:border-[--line-strong] hover:bg-[--surface-2] hover:text-[--ink-0]",
              )}
            >
              {shareToast === "copied" ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">
                {shareToast === "copied" ? "Copied" : "Share"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => downloadAsPDF(setup, validationContent)}
              className="inline-flex h-9 items-center gap-2 rounded-[--r] border border-transparent px-3 text-xs font-medium text-[--ink-1] transition hover:border-[--line-strong] hover:bg-[--surface-2] hover:text-[--ink-0]"
              title="Print-friendly brief"
            >
              <FileText className="h-3.5 w-3.5" />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={() => downloadAsMarkdown(setup, validationContent)}
              className="inline-flex h-9 items-center gap-2 rounded-[--r] border border-transparent px-3 text-xs font-medium text-[--ink-1] transition hover:border-[--line-strong] hover:bg-[--surface-2] hover:text-[--ink-0]"
              title="Download Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">MD</span>
            </button>
            <span className="mx-1 hidden h-4 w-px bg-[--line] sm:inline-block" aria-hidden />
            <button
              type="button"
              onClick={handleRevise}
              className="inline-flex h-9 items-center gap-2 rounded-[--r] border border-transparent px-3 text-xs font-medium text-[--ink-1] transition hover:border-[--line-strong] hover:bg-[--surface-2] hover:text-[--ink-0]"
              title="Edit inputs and re-run"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Revise</span>
            </button>
            <button
              type="button"
              onClick={handleNew}
              className="ml-1 inline-flex h-9 items-center rounded-[--r] bg-[--ink-0] px-4 text-xs font-semibold text-[--bg] transition hover:brightness-90"
            >
              New idea
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="mx-auto flex max-w-[1400px] gap-10 px-5 py-10 sm:px-8 sm:py-14">
        {/* Left rail */}
        <aside className="sticky top-20 hidden h-[calc(100dvh-6rem)] w-56 shrink-0 self-start overflow-y-auto lg:block">
          <p className="caption mb-4 text-[--ink-2]">Contents</p>
          <nav className="space-y-1">
            {SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-baseline gap-3 rounded-[--r-sm] py-1.5 pr-2 text-sm text-[--ink-1] transition hover:text-[--ink-0]"
              >
                <span className="caption shrink-0 text-[--ink-3] group-hover:text-[--ink-2]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-8 border-t border-[--line] pt-6">
            <p className="caption mb-2 text-[--ink-2]">Report status</p>
            <div className="flex items-baseline gap-1.5">
              <span className="num-sm text-[--ink-0]">{completeness.present}</span>
              <span className="small text-[--ink-2]">/ {completeness.total} sections</span>
            </div>
            <div className="mt-2 h-px w-full bg-[--surface-2]">
              <div
                className="h-full bg-[--ink-1]"
                style={{ width: `${completeness.percent}%` }}
              />
            </div>
            {completeness.percent < 100 && (
              <p className="small mt-3 text-[--ink-2]">
                Some sections are thin. Revise your inputs for a denser report.
              </p>
            )}
          </div>
        </aside>

        {/* Main document */}
        <main className="min-w-0 flex-1">
          {/* ── Masthead ── */}
          <div className="mb-12 border-b border-[--line] pb-10">
            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="caption text-[--ink-2]">Editorial Dossier</span>
              <span className="caption text-[--ink-3]" aria-hidden>·</span>
              <span className="caption text-[--ink-2]">{category}</span>
              <span className="caption text-[--ink-3]" aria-hidden>·</span>
              <span className="caption text-[--ink-2]">{formatDateShort(createdAt)}</span>
            </div>

            <h1 className="display mb-6 text-[--ink-0]">{setup.topic}</h1>

            {dashboard.verdict && (
              <p
                className="mb-8 max-w-[52ch] text-[20px] leading-[1.4] text-[--ink-1]"
                style={{ fontFamily: "var(--app-font-serif)" }}
              >
                {dashboard.verdict}
              </p>
            )}

            <div className="grid grid-cols-1 gap-8 md:grid-cols-[auto_1fr] md:items-end">
              {/* Score tile */}
              <div className="flex items-end gap-3">
                <span
                  className={cn("text-[96px] leading-[0.85] tracking-[-0.04em]", scoreToneClass(headlineTone))}
                  style={{ fontFamily: "var(--app-font-serif)", fontVariantNumeric: "lining-nums tabular-nums" }}
                >
                  {score ?? "—"}
                </span>
                <div className="pb-2">
                  <div className="caption text-[--ink-2]">/ {SCORE_MAX}</div>
                  <div className="caption mt-1 text-[--ink-2]">Viability</div>
                </div>
              </div>

              {/* Meta & verdict */}
              <div className="flex flex-col items-start gap-4 md:items-end md:text-right">
                <VerdictBadge verdict={goNoGoType ?? (score != null ? (score >= 70 ? "go" : score >= 50 ? "caution" : "nogo") : null)} />
                {setup.position.trim().length > 0 && (
                  <p className="body max-w-md text-[--ink-1] md:text-right">
                    <span className="caption mb-1 block text-[--ink-2]">Premise</span>
                    {setup.position.length > 200 ? `${setup.position.slice(0, 200)}…` : setup.position}
                  </p>
                )}
              </div>
            </div>

            {divergence?.severity === "strong" && (
              <div className="mt-8 flex items-start gap-3 border-l-2 border-[--ink-2] pl-4">
                <div>
                  <p className="caption mb-1 text-[--ink-2]">Score note</p>
                  <p className="small text-[--ink-1]">
                    Headline score {score}/{SCORE_MAX} diverges from the rubric average of {divergence.mean}.
                    Weakest dimension: {divergence.minCat.label} ({divergence.minCat.value}).
                    Read the category scores below before weighting the headline.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sections ── */}
          <div className="space-y-14">
            {/* § 01 Verdict */}
            {dashboard.goNoGo && (
              <Section id="verdict" index={1} title="Verdict">
                <Prose>{dashboard.goNoGo}</Prose>
              </Section>
            )}

            {/* § 02 Category scores */}
            {CATEGORY_LABELS.some(({ key }) => dashboard.categoryScores[key] != null) && (
              <Section
                id="scores"
                index={2}
                title="Category scores"
                kicker="Six dimensions, each scored independently. Cross-check these against the headline number."
              >
                <table className="w-full">
                  <tbody>
                    {CATEGORY_LABELS.map(({ key, label }, i) => (
                      <ScoreRow key={key} label={label} value={dashboard.categoryScores[key]} index={i + 1} />
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* § 03 Problem & solution */}
            {dashboard.problemSolution && (
              <Section id="problem" index={3} title="Problem & solution">
                <Prose>{dashboard.problemSolution}</Prose>
              </Section>
            )}

            {/* § 04 Target customer */}
            {dashboard.targetCustomer && (
              <Section id="customer" index={4} title="Target customer">
                <Prose>{dashboard.targetCustomer}</Prose>
              </Section>
            )}

            {/* § 05 Value proposition */}
            {dashboard.valueProposition && (
              <Section id="value" index={5} title="Value proposition">
                <Prose>{dashboard.valueProposition}</Prose>
              </Section>
            )}

            {/* § 06 Market opportunity */}
            {hasMarket && (
              <Section id="market" index={6} title="Market opportunity">
                {(tamSamSom.tam || tamSamSom.sam || tamSamSom.som) && (
                  <div className="mb-6 grid grid-cols-3 divide-x divide-[--line] border border-[--line] rounded-[--r]">
                    {[
                      { label: "TAM", value: tamSamSom.tam, note: "Total addressable" },
                      { label: "SAM", value: tamSamSom.sam, note: "Serviceable" },
                      { label: "SOM", value: tamSamSom.som, note: "Obtainable" },
                    ].map((m) => (
                      <div key={m.label} className="px-4 py-4 sm:px-6 sm:py-5">
                        <div className="caption mb-1 text-[--ink-2]">{m.label}</div>
                        <div className="num-lg text-[--ink-0]">{m.value ?? "—"}</div>
                        <div className="caption mt-1 text-[--ink-2]">{m.note}</div>
                      </div>
                    ))}
                  </div>
                )}
                {dashboard.marketSummary && <Prose>{dashboard.marketSummary}</Prose>}
              </Section>
            )}

            {/* § 07 Competitive landscape */}
            {hasCompetition && (
              <Section id="competition" index={7} title="Competitive landscape">
                {dashboard.competitiveMatrix.length > 0 && (
                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[--line-strong]">
                          <th className="caption py-3 pr-4 text-[--ink-2]">Player</th>
                          <th className="caption py-3 pr-4 text-[--ink-2]">Approach</th>
                          <th className="caption py-3 text-[--ink-2]">Weakness</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.competitiveMatrix.map((c, i) => (
                          <tr key={i} className="border-b border-[--line] last:border-b-0">
                            <td className="body py-3 pr-4 align-top font-medium text-[--ink-0]">{c.name}</td>
                            <td className="body py-3 pr-4 align-top text-[--ink-1]">{c.approach}</td>
                            <td className="body py-3 align-top text-[--ink-1]">{c.weakness}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {dashboard.competitiveSummary && <Prose>{dashboard.competitiveSummary}</Prose>}
              </Section>
            )}

            {/* § 08 Business model */}
            {dashboard.businessModel && (
              <Section id="model" index={8} title="Business model">
                <Prose>{dashboard.businessModel}</Prose>
              </Section>
            )}

            {/* § 09 Financials */}
            {hasFinancials && (
              <Section id="financials" index={9} title="Financials">
                {dashboard.financialProjections.length > 0 && (
                  <div className="mb-6 overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-[--line-strong]">
                          <th className="caption py-3 pr-4 text-[--ink-2]">Metric</th>
                          <th className="caption py-3 pr-4 text-right text-[--ink-2]">Year 1</th>
                          <th className="caption py-3 pr-4 text-right text-[--ink-2]">Year 2</th>
                          <th className="caption py-3 text-right text-[--ink-2]">Year 3</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.financialProjections.map((row, i) => (
                          <tr key={i} className="border-b border-[--line] last:border-b-0">
                            <td className="body py-3 pr-4 text-[--ink-0]">{row.metric}</td>
                            <td className="num-sm py-3 pr-4 text-right text-[--ink-1]">{row.year1}</td>
                            <td className="num-sm py-3 pr-4 text-right text-[--ink-1]">{row.year2}</td>
                            <td className="num-sm py-3 text-right text-[--ink-0]">{row.year3}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {(() => {
                  const ue = dashboard.unitEconomics;
                  const unit = [
                    { label: "CAC", value: ue.cac },
                    { label: "LTV", value: ue.ltv },
                    { label: "LTV : CAC", value: ue.ltvCacRatio },
                    { label: "Payback", value: ue.paybackPeriod },
                    { label: "Gross margin", value: ue.grossMargin },
                    { label: "Churn", value: ue.churnRate },
                    { label: "ARPU", value: ue.arpu },
                  ].filter((m) => m.value);
                  if (unit.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <p className="caption mb-3 text-[--ink-2]">Unit economics</p>
                      <div className="grid grid-cols-2 gap-px bg-[--line] border border-[--line] md:grid-cols-4">
                        {unit.map((m) => (
                          <div key={m.label} className="bg-[--bg] px-4 py-4">
                            <div className="caption mb-1 text-[--ink-2]">{m.label}</div>
                            <div className="num-sm text-[--ink-0]">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const be = dashboard.breakEven;
                  const items = [
                    { label: "Break-even", value: be.point },
                    { label: "Timeline", value: be.timeline },
                    { label: "Milestone", value: be.milestone },
                    { label: "Funding need", value: be.fundingNeed },
                  ].filter((m) => m.value);
                  if (items.length === 0) return null;
                  return (
                    <div className="mb-6">
                      <p className="caption mb-3 text-[--ink-2]">Break-even</p>
                      <dl className="grid grid-cols-1 gap-y-2 md:grid-cols-2">
                        {items.map((m) => (
                          <div key={m.label} className="flex items-baseline justify-between gap-4 border-b border-[--line] py-2">
                            <dt className="small text-[--ink-2]">{m.label}</dt>
                            <dd className="body text-right text-[--ink-0]">{m.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  );
                })()}
                {dashboard.financialSummary && <Prose>{dashboard.financialSummary}</Prose>}
              </Section>
            )}

            {/* § 10 Strengths & risks */}
            {hasStrengthsRisks && (
              <Section id="strengths-risks" index={10} title="Strengths & risks">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-[--success]" strokeWidth={2.25} />
                      <span className="caption text-[--success]">Strengths</span>
                      <span className="caption ml-auto text-[--ink-2]">{strengths.length}</span>
                    </div>
                    {strengths.length === 0 ? (
                      <p className="small italic text-[--ink-2]">None identified.</p>
                    ) : (
                      <ul className="space-y-3">
                        {strengths.map((s, i) => (
                          <li key={i} className="flex gap-3 border-b border-[--line] pb-3 last:border-b-0 last:pb-0">
                            <span className="caption shrink-0 text-[--ink-2]">{String(i + 1).padStart(2, "0")}</span>
                            <span className="body text-[--ink-1]">{s}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="mb-4 flex items-center gap-2">
                      <ArrowDownRight className="h-4 w-4 text-[--error]" strokeWidth={2.25} />
                      <span className="caption text-[--error]">Risks</span>
                      <span className="caption ml-auto text-[--ink-2]">{risks.length}</span>
                    </div>
                    {risks.length === 0 ? (
                      <p className="small italic text-[--ink-2]">None identified.</p>
                    ) : (
                      <ul className="space-y-3">
                        {risks.map((r, i) => (
                          <li key={i} className="flex gap-3 border-b border-[--line] pb-3 last:border-b-0 last:pb-0">
                            <span className="caption shrink-0 text-[--ink-2]">{String(i + 1).padStart(2, "0")}</span>
                            <span className="body text-[--ink-1]">{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* § 11 Lean canvas */}
            {hasCanvas && dashboard.leanCanvas && (
              <Section
                id="canvas"
                index={11}
                title="Lean canvas"
                kicker="Nine blocks. Read top-left down — problem, solution, metrics — then right for channels and customers."
              >
                <div className="grid grid-cols-1 gap-px bg-[--line] border border-[--line] md:grid-cols-5">
                  {(
                    [
                      { key: "problem", label: "Problem", span: "md:col-span-1 md:row-span-2" },
                      { key: "solution", label: "Solution", span: "md:col-span-1 md:row-span-1" },
                      { key: "uvp", label: "Unique value prop", span: "md:col-span-1 md:row-span-2" },
                      { key: "unfairAdvantage", label: "Unfair advantage", span: "md:col-span-1 md:row-span-1" },
                      { key: "customerSegments", label: "Customer segments", span: "md:col-span-1 md:row-span-2" },
                      { key: "keyMetrics", label: "Key metrics", span: "md:col-span-1 md:row-span-1" },
                      { key: "channels", label: "Channels", span: "md:col-span-1 md:row-span-1" },
                      { key: "costStructure", label: "Cost structure", span: "md:col-span-3 md:row-span-1" },
                      { key: "revenueStreams", label: "Revenue streams", span: "md:col-span-2 md:row-span-1" },
                    ] as Array<{ key: keyof typeof dashboard.leanCanvas; label: string; span: string }>
                  ).map(({ key, label, span }) => {
                    const val = dashboard.leanCanvas?.[key];
                    if (!val) return null;
                    return (
                      <div key={key} className={cn("bg-[--bg] p-4", span)}>
                        <p className="caption mb-2 text-[--ink-2]">{label}</p>
                        <p className="small leading-relaxed text-[--ink-1]">{val}</p>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* § 12 Action plan */}
            {hasPlan && (
              <Section id="plan" index={12} title="Action plan">
                {recommendations.length > 0 && (
                  <div className="mb-6">
                    <p className="caption mb-3 text-[--ink-2]">Top {recommendations.length} validation steps</p>
                    <ol className="space-y-4">
                      {recommendations.map((r, i) => (
                        <li key={i} className="flex gap-4 border-b border-[--line] pb-4 last:border-b-0 last:pb-0">
                          <span className="num-sm shrink-0 text-[--ink-0]">{i + 1}</span>
                          <span className="body text-[--ink-1]">{r}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {dashboard.keyAssumptions && (
                  <div className="mb-6">
                    <p className="caption mb-3 text-[--ink-2]">Key assumptions to validate</p>
                    <Prose>{dashboard.keyAssumptions}</Prose>
                  </div>
                )}
                {dashboard.timelineToLaunch && (
                  <div>
                    <p className="caption mb-3 text-[--ink-2]">Timeline to launch</p>
                    <Prose>{dashboard.timelineToLaunch}</Prose>
                  </div>
                )}
              </Section>
            )}
          </div>

          {/* ── Colophon ── */}
          <footer className="mt-20 border-t border-[--line] pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <p className="caption text-[--ink-2]">
                Priority Debater · Editorial Dossier · Generated {formatDateShort(createdAt)}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRevise}
                  className="small text-[--ink-1] underline decoration-[--line-strong] underline-offset-4 hover:decoration-[--ink-0] hover:text-[--ink-0]"
                >
                  Revise inputs and re-run
                </button>
                <span className="text-[--ink-3]" aria-hidden>·</span>
                <button
                  type="button"
                  onClick={handleNew}
                  className="small text-[--ink-1] underline decoration-[--line-strong] underline-offset-4 hover:decoration-[--ink-0] hover:text-[--ink-0]"
                >
                  Start a new dossier
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default function Results() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center bg-[--bg]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--line-strong] border-t-[--ink-0]" />
        </div>
      }
    >
      <ResultsInner />
    </Suspense>
  );
}
