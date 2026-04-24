"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Circle,
  Download,
  FileText,
  Flag,
  LineChart as LineChartIcon,
  Lock,
  Plus,
  RefreshCcw,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { classifyIdeaCategory } from "@/lib/idea-category";
import {
  extractDashboardData,
  getCategoryScoreAggregate,
  getValidationReportCompleteness,
} from "@/lib/parse";
import { SCORE_MAX } from "@/lib/scoring-scale";
import { clearSession, loadSessionWithStatus, saveSession } from "@/lib/session";
import type { ValidationSession } from "@/lib/types";

/* =============================================================
   Results Dashboard — Priority Debater
   Sidebar + journey progression + tabbed dashboard.
   Monochrome base. Red/green only for directional signal.
   Numbers in Instrument Serif. All charts are inline SVG.
   ============================================================= */

// ───────────────────────────────────────────────────────────────
// Share / PDF / Markdown
// ───────────────────────────────────────────────────────────────

const MAX_SHARE_PARAM_CHARS = 45_000;

function parseSharePayload(encoded: string): ValidationSession | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const d = JSON.parse(json) as { t?: string; p?: string; c?: string; v?: string };
    if (!d.v || typeof d.v !== "string") return null;
    return {
      setup: { template: "validate", topic: d.t || "Shared idea", position: d.p || "", context: d.c || "", lens: "investor" },
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
      JSON.stringify({ t: session.setup.topic, p: session.setup.position, c: session.setup.context, v: session.validationContent }),
    ),
  );
}

function downloadAsMarkdown(setup: ValidationSession["setup"], content: string) {
  const header = `# Validation Report: ${setup.topic}\n\n**Premise:** ${setup.position}\n${setup.context ? `**Context:** ${setup.context}\n` : ""}\n---\n\n`;
  const blob = new Blob([header + content.trim()], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `validation-${(setup.topic || "idea").slice(0, 40).replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadAsPDF(setup: ValidationSession["setup"], content: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const styles = `
    @page { margin: 24mm 20mm; }
    body { font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; color: #111; line-height: 1.55; max-width: 720px; margin: 0 auto; }
    h1 { font-family: Georgia, serif; font-size: 28pt; font-weight: 400; letter-spacing: -0.02em; margin: 0 0 6pt; }
    h2 { font-size: 10pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin: 24pt 0 8pt; padding-bottom: 4pt; border-bottom: 1px solid #ddd; }
    h3 { font-size: 12pt; font-weight: 600; margin: 16pt 0 6pt; }
    p, li { font-size: 10.5pt; }
    table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 10pt; }
    th, td { text-align: left; padding: 5pt 7pt; border-bottom: 1px solid #ddd; }
    th { font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9pt; color: #666; }
    .kicker { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #888; margin-bottom: 6pt; }
    .meta { font-size: 9pt; color: #888; margin-top: 32pt; padding-top: 8pt; border-top: 1px solid #ddd; }
  `;
  w.document.write(
    `<!DOCTYPE html><html><head><title>${setup.topic} — Validation Report</title><style>${styles}</style></head><body>` +
      `<div class="kicker">Priority Debater · Validation Dossier</div>` +
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

// ───────────────────────────────────────────────────────────────
// Tone + score helpers
// ───────────────────────────────────────────────────────────────

type Tone = "bull" | "bear" | "neutral";

function scoreTone(value: number | null | undefined, goThreshold = 70, nogoThreshold = 50): Tone {
  if (value == null) return "neutral";
  if (value >= goThreshold) return "bull";
  if (value < nogoThreshold) return "bear";
  return "neutral";
}

const toneText = (t: Tone) => (t === "bull" ? "text-[--success]" : t === "bear" ? "text-[--error]" : "text-[--ink-0]");
const toneBg = (t: Tone) => (t === "bull" ? "bg-[--success]" : t === "bear" ? "bg-[--error]" : "bg-[--ink-1]");
const toneStroke = (t: Tone) =>
  t === "bull" ? "var(--success)" : t === "bear" ? "var(--error)" : "var(--ink-0)";

// ───────────────────────────────────────────────────────────────
// SVG primitives
// ───────────────────────────────────────────────────────────────

function Ring({
  value,
  size = 72,
  stroke = 6,
  label,
  sub,
  big = false,
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  label: string;
  sub?: string;
  big?: boolean;
}) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const tone = scoreTone(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color = toneStroke(tone);
  return (
    <div className={cn("flex items-center gap-3", big && "gap-4")}>
      <svg width={size} height={size} className="shrink-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={value == null ? c : offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="-ml-[calc(var(--sz)_*_0.5_+_12px)] flex min-w-[52px] flex-col items-start" style={{ ["--sz" as string]: `${size}px` } as React.CSSProperties}>
        <span className={cn(big ? "num-lg" : "num", toneText(tone))}>{value == null ? "—" : Math.round(value)}</span>
        <span className="caption mt-0.5 text-[--ink-2]">{label}</span>
        {sub && <span className="small mt-0.5 text-[--ink-2]">{sub}</span>}
      </div>
    </div>
  );
}

/** Score ring variant with number centered inside. */
function RingCentered({ value, size = 96, stroke = 7, label }: { value: number | null; size?: number; stroke?: number; label?: string }) {
  const v = value == null ? 0 : Math.max(0, Math.min(100, value));
  const tone = scoreTone(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color = toneStroke(tone);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={value == null ? c : offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("num-lg leading-none", toneText(tone))}>{value == null ? "—" : Math.round(value)}</span>
        {label && <span className="caption mt-1 text-[--ink-2]">{label}</span>}
      </div>
    </div>
  );
}

/** 6-axis radar chart for category scores. */
function Radar({ scores }: { scores: Array<{ label: string; value: number | null }> }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 40;
  const n = scores.length;

  const point = (i: number, pct: number) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = R * pct;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const rings = [0.25, 0.5, 0.75, 1];
  const valuePoints = scores.map((s, i) => point(i, (s.value ?? 0) / 100));
  const axisPoints = scores.map((_, i) => point(i, 1));
  const labelPoints = scores.map((_, i) => point(i, 1.14));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[340px]">
      {rings.map((p, i) => (
        <polygon
          key={i}
          points={scores.map((_, idx) => point(idx, p).join(",")).join(" ")}
          fill="none"
          stroke="var(--line)"
          strokeWidth={1}
        />
      ))}
      {axisPoints.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
      ))}
      <polygon
        points={valuePoints.map((p) => p.join(",")).join(" ")}
        fill="color-mix(in srgb, var(--ink-0) 14%, transparent)"
        stroke="var(--ink-0)"
        strokeWidth={1.5}
      />
      {valuePoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill="var(--ink-0)" />
      ))}
      {labelPoints.map(([x, y], i) => {
        const s = scores[i];
        const tone = scoreTone(s.value);
        const anchor = Math.abs(x - cx) < 1 ? "middle" : x > cx ? "start" : "end";
        return (
          <g key={i}>
            <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="fill-[--ink-2]" style={{ fontSize: 10, fontFamily: "var(--app-font-sans)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {s.label}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor={anchor}
              dominantBaseline="middle"
              style={{
                fontSize: 13,
                fontFamily: "var(--app-font-serif)",
                fill: tone === "bull" ? "var(--success)" : tone === "bear" ? "var(--error)" : "var(--ink-0)",
              }}
            >
              {s.value == null ? "—" : Math.round(s.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Horizontal bar list. */
function BarList({ items }: { items: Array<{ label: string; value: number | null; tone?: Tone }> }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const tone = it.tone ?? scoreTone(it.value);
        const pct = it.value == null ? 0 : Math.max(4, (it.value / SCORE_MAX) * 100);
        return (
          <li key={i} className="grid grid-cols-[1fr_auto] items-center gap-3">
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="small text-[--ink-0]">{it.label}</span>
                <span className={cn("num-sm", toneText(tone))}>{it.value == null ? "—" : it.value}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[--surface-2]">
                <div className={cn("h-full rounded-full transition-[width] duration-700", toneBg(tone))} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Two-series line chart over Y1/Y2/Y3. */
function LineChart({
  series,
  labels = ["Year 1", "Year 2", "Year 3"],
}: {
  series: Array<{ name: string; values: number[]; tone: Tone }>;
  labels?: string[];
}) {
  const w = 520;
  const h = 200;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  const max = all.length ? Math.max(...all) : 1;
  const min = 0;
  const xFor = (i: number) => padL + (plotW * i) / (labels.length - 1);
  const yFor = (v: number) => padT + plotH - ((v - min) / (max - min || 1)) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full">
      {ticks.map((t, i) => (
        <line key={i} x1={padL} x2={w - padR} y1={padT + plotH * (1 - t)} y2={padT + plotH * (1 - t)} stroke="var(--line-soft)" strokeWidth={1} />
      ))}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={padL - 8}
          y={padT + plotH * (1 - t) + 3}
          textAnchor="end"
          className="fill-[--ink-2]"
          style={{ fontSize: 10, fontFamily: "var(--app-font-serif)" }}
        >
          {formatNumAbbrev(min + (max - min) * t)}
        </text>
      ))}
      {labels.map((lab, i) => (
        <text
          key={i}
          x={xFor(i)}
          y={h - 8}
          textAnchor="middle"
          className="fill-[--ink-2]"
          style={{ fontSize: 10, fontFamily: "var(--app-font-sans)", letterSpacing: "0.05em", textTransform: "uppercase" }}
        >
          {lab}
        </text>
      ))}
      {series.map((s, si) => {
        const color = toneStroke(s.tone);
        const d = s.values
          .map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`)
          .join(" ");
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={color} strokeWidth={2} />
            {s.values.map((v, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(v)} r={3} fill={color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function formatNumAbbrev(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${Math.round(n)}`;
}

/** Parse a currency/number string like "$1.2M", "€450K", "2,100" into a number. */
function parseCurrency(s: string | null | undefined): number {
  if (!s) return 0;
  const str = s.replace(/[^0-9.KkMmBb]/g, "");
  const num = parseFloat(str) || 0;
  if (/b/i.test(s)) return num * 1e9;
  if (/m/i.test(s)) return num * 1e6;
  if (/k/i.test(s)) return num * 1e3;
  return num;
}

/** TAM > SAM > SOM funnel as nested bars. */
function MarketFunnel({ tam, sam, som }: { tam: string | null; sam: string | null; som: string | null }) {
  const items = [
    { label: "TAM", raw: tam, note: "Total addressable" },
    { label: "SAM", raw: sam, note: "Serviceable available" },
    { label: "SOM", raw: som, note: "Serviceable obtainable" },
  ];
  const tamNum = parseCurrency(tam);
  return (
    <div className="space-y-4">
      {items.map((it) => {
        const n = parseCurrency(it.raw);
        const pct = tamNum > 0 ? Math.max(4, (n / tamNum) * 100) : it.label === "TAM" ? 100 : it.label === "SAM" ? 40 : 12;
        return (
          <div key={it.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="caption text-[--ink-2]">{it.label}</span>
                <span className="small text-[--ink-1]">{it.note}</span>
              </div>
              <span className="num text-[--ink-0]">{it.raw || "—"}</span>
            </div>
            <div className="relative h-8 overflow-hidden rounded-[--r-sm] bg-[--surface-2]">
              <div
                className="absolute inset-y-0 left-0 border-r border-[--ink-0]/20 bg-[--ink-0]/10"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Markdown (for long-form prose within tabs)
// ───────────────────────────────────────────────────────────────

function Prose({ children }: { children: string }) {
  return (
    <div>
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
          tr: ({ children }) => <tr className="border-b border-[--line]">{children}</tr>,
          th: ({ children }) => <th className="caption px-3 py-2.5 text-left text-[--ink-2]">{children}</th>,
          td: ({ children }) => <td className="body px-3 py-2.5 align-top text-[--ink-1]">{children}</td>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l border-[--ink-2] pl-4 italic text-[--ink-1]">{children}</blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Sidebar + journey
// ───────────────────────────────────────────────────────────────

type JourneyStatus = "done" | "ready" | "locked";

interface JourneyStep {
  id: string;
  label: string;
  href: string | null;
  status: JourneyStatus;
  icon: React.ReactNode;
}

function Sidebar({
  topic,
  createdAt,
  journey,
  completeness,
}: {
  topic: string;
  createdAt: number;
  journey: JourneyStep[];
  completeness: number;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[--line] bg-[--surface-1] md:flex md:flex-col">
      <div className="flex h-14 items-center border-b border-[--line] px-5">
        <Link href="/" className="flex items-center gap-2 text-[--ink-0]">
          <div className="grid h-7 w-7 place-items-center rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2]">
            <span className="text-[10px] font-semibold tracking-wider">PD</span>
          </div>
          <span className="text-sm font-semibold">Priority Debater</span>
        </Link>
      </div>

      <div className="border-b border-[--line] p-4">
        <Link
          href="/validate"
          className="flex w-full items-center justify-center gap-2 rounded-[--r] bg-[--ink-0] px-3 py-2.5 text-sm font-medium text-[--bg] transition hover:brightness-95"
        >
          <Plus className="h-4 w-4" />
          New validation
        </Link>
      </div>

      <div className="border-b border-[--line] p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="caption text-[--ink-2]">Journey</span>
          <span className="num-sm text-[--ink-1]">
            {journey.filter((s) => s.status === "done").length}
            <span className="small text-[--ink-2]">/{journey.length}</span>
          </span>
        </div>
        <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[--surface-3]">
          <div
            className="h-full rounded-full bg-[--ink-0] transition-[width] duration-700"
            style={{ width: `${(journey.filter((s) => s.status === "done").length / journey.length) * 100}%` }}
          />
        </div>
        <ul className="space-y-1">
          {journey.map((step) => {
            const clickable = step.status !== "locked" && step.href;
            const El: React.ElementType = clickable ? Link : "div";
            return (
              <li key={step.id}>
                <El
                  {...(clickable ? { href: step.href! } : {})}
                  className={cn(
                    "group flex items-center gap-3 rounded-[--r] border px-3 py-2 transition",
                    step.status === "done" && "border-[--line] bg-[--surface-2] text-[--ink-0]",
                    step.status === "ready" && "border-[--line-strong] bg-[--surface-2] text-[--ink-0] hover:bg-[--surface-3]",
                    step.status === "locked" && "border-transparent text-[--ink-2]",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                      step.status === "done" && "border-[--success]/40 bg-[--success-soft] text-[--success]",
                      step.status === "ready" && "border-[--line-strong] text-[--ink-0]",
                      step.status === "locked" && "border-[--line] text-[--ink-2]",
                    )}
                  >
                    {step.status === "done" ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    ) : step.status === "locked" ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      step.icon
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{step.label}</span>
                    <span
                      className={cn(
                        "caption block",
                        step.status === "done" && "text-[--success]",
                        step.status === "ready" && "text-[--ink-2]",
                        step.status === "locked" && "text-[--ink-2]",
                      )}
                    >
                      {step.status === "done" ? "Complete" : step.status === "ready" ? "Ready" : "Locked"}
                    </span>
                  </div>
                  {step.status === "ready" && <ArrowRight className="h-3.5 w-3.5 text-[--ink-2] transition group-hover:translate-x-0.5 group-hover:text-[--ink-0]" />}
                </El>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="border-b border-[--line] p-5">
        <span className="caption mb-3 block text-[--ink-2]">Current idea</span>
        <div className="rounded-[--r] border border-[--line] bg-[--surface-2] p-3">
          <p className="small mb-1 line-clamp-2 font-medium text-[--ink-0]">{topic}</p>
          <p className="caption text-[--ink-2]">{formatDateShort(createdAt)}</p>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="caption text-[--ink-2]">Report completeness</span>
          <span className="num-sm text-[--ink-1]">
            {completeness}
            <span className="small text-[--ink-2]">%</span>
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[--surface-3]">
          <div className="h-full rounded-full bg-[--ink-1]" style={{ width: `${completeness}%` }} />
        </div>
      </div>

      <div className="mt-auto p-5">
        <Link href="/" className="caption text-[--ink-2] transition hover:text-[--ink-0]">
          ← Home
        </Link>
      </div>
    </aside>
  );
}

// ───────────────────────────────────────────────────────────────
// Main page
// ───────────────────────────────────────────────────────────────

type TabId = "overview" | "scores" | "market" | "competition" | "financials" | "plan";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: "scores", label: "Scores", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: "market", label: "Market", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "competition", label: "Competition", icon: <Target className="h-3.5 w-3.5" /> },
  { id: "financials", label: "Financials", icon: <LineChartIcon className="h-3.5 w-3.5" /> },
  { id: "plan", label: "Plan", icon: <Flag className="h-3.5 w-3.5" /> },
];

const CATEGORY_LABELS: Array<{ key: keyof NonNullable<ReturnType<typeof extractDashboardData>["categoryScores"]>; label: string; short: string }> = [
  { key: "problemSolutionFit", label: "Problem–solution fit", short: "P/S FIT" },
  { key: "marketOpportunity", label: "Market opportunity", short: "MARKET" },
  { key: "competitiveEdge", label: "Competitive edge", short: "MOAT" },
  { key: "businessModel", label: "Business model", short: "MODEL" },
  { key: "teamExecution", label: "Team & execution", short: "EXEC" },
  { key: "timingTrends", label: "Timing & trends", short: "TIMING" },
];

function ResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "expired">("loading");
  const [shareToast, setShareToast] = useState<"idle" | "copied" | "tooLarge">("idle");
  const [tab, setTab] = useState<TabId>("overview");

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
    router.push("/validate");
  }, [router]);

  const data = useMemo(() => {
    if (!session) return null;
    const dashboard = extractDashboardData(session.validationContent);
    const completeness = getValidationReportCompleteness(session.validationContent);
    const rubricAgg = getCategoryScoreAggregate(dashboard.categoryScores);
    const category = session.ideaCategory?.label ?? classifyIdeaCategory(session.setup.topic, session.setup.position).label;
    return { dashboard, completeness, rubricAgg, category };
  }, [session]);

  if (loadState === "loading" || !session || !data) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[--bg]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[--line-strong] border-t-[--ink-0]" />
          <p className="small text-[--ink-2]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (loadState === "expired") {
    return (
      <div className="grid min-h-dvh place-items-center bg-[--bg] px-4">
        <div className="w-full max-w-md rounded-[--r] border border-[--line] bg-[--surface-1] p-8">
          <p className="caption mb-3 text-[--ink-2]">Session expired</p>
          <h1 className="h1 mb-3 text-[--ink-0]">This dashboard is no longer available.</h1>
          <p className="body mb-6 text-[--ink-1]">Validation reports are kept for 24 hours in this browser. Start a new run to stress-test your idea again.</p>
          <Link href="/validate" className="inline-flex items-center justify-center rounded-[--r] bg-[--ink-0] px-5 py-3 text-sm font-medium text-[--bg] transition hover:brightness-90">
            New validation
          </Link>
        </div>
      </div>
    );
  }

  const { setup, validationContent, createdAt } = session;
  const { dashboard, completeness, rubricAgg, category } = data;
  const { score, goNoGoType, strengths, risks, recommendations, tamSamSom, categoryScores } = dashboard;

  // Derived ring values
  const psF = categoryScores.problemSolutionFit;
  const market = categoryScores.marketOpportunity;
  const moat = categoryScores.competitiveEdge;
  const exec = categoryScores.teamExecution;
  const avgCat = rubricAgg.mean ?? null;

  const shareLabel = shareToast === "copied" ? "Link copied" : shareToast === "tooLarge" ? "Report too large to share by URL — use PDF instead" : "Share";

  // Journey config
  const journey: JourneyStep[] = [
    { id: "validate", label: "Validation", href: "/results", status: "done", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    { id: "competitors", label: "Competitors", href: "/competitors", status: "ready", icon: <Target className="h-3 w-3" /> },
    { id: "brand", label: "Brand studio", href: "/brand", status: "ready", icon: <Sparkles className="h-3 w-3" /> },
    { id: "pitch", label: "Pitch deck", href: "/pitch", status: "ready", icon: <TrendingUp className="h-3 w-3" /> },
    { id: "marketing", label: "Go-to-market", href: "/marketing", status: "locked", icon: <Flag className="h-3 w-3" /> },
    { id: "toolkit", label: "Launch toolkit", href: "/toolkit", status: "locked", icon: <Wallet className="h-3 w-3" /> },
  ];

  const timeToMarket = dashboard.timelineToLaunch?.match(/\d+[^.\n]{0,30}(month|week|quarter|day)s?/i)?.[0] ?? "3–6 months";

  // ── Financial series (best-effort parse) ──
  const projRows = dashboard.financialProjections;
  const findRow = (key: RegExp) => projRows.find((r) => key.test(r.metric));
  const arrRow = findRow(/ARR|Revenue/i);
  const burnRow = findRow(/Burn|Cost/i);
  const arrSeries = arrRow ? [parseCurrency(arrRow.year1), parseCurrency(arrRow.year2), parseCurrency(arrRow.year3)] : null;
  const burnSeries = burnRow ? [parseCurrency(burnRow.year1 ?? ""), parseCurrency(burnRow.year2 ?? ""), parseCurrency(burnRow.year3 ?? "")] : null;

  return (
    <div className="flex min-h-dvh bg-[--bg] text-[--ink-0]">
      <Sidebar topic={setup.topic} createdAt={createdAt} journey={journey} completeness={completeness.percent} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[--line] bg-[--bg]/95 px-5 backdrop-blur-sm sm:px-8">
          <span className="caption hidden text-[--ink-2] md:inline">Dashboard</span>
          <span className="caption hidden text-[--ink-3] md:inline" aria-hidden>/</span>
          <span className="small min-w-0 flex-1 truncate text-[--ink-1]">{setup.topic}</span>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleCopyShareLink}
              title={shareLabel}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-[--r] border border-transparent px-3 text-xs font-medium transition",
                shareToast === "tooLarge" ? "text-[--error]" : "text-[--ink-1] hover:border-[--line-strong] hover:bg-[--surface-2] hover:text-[--ink-0]",
              )}
            >
              {shareToast === "copied" ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{shareToast === "copied" ? "Copied" : "Share"}</span>
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
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Revise</span>
            </button>
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex h-9 items-center gap-2 rounded-[--r] bg-[--ink-0] px-3 text-xs font-medium text-[--bg] transition hover:brightness-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
          </div>
        </header>

        {/* ── Banner ── */}
        <div className="radial-hero border-b border-[--line]">
          <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="caption rounded-[--r-sm] border border-[--line-strong] bg-[--surface-2] px-2 py-1 text-[--ink-1]">{category}</span>
              <VerdictPill verdict={goNoGoType} />
              <span className="caption inline-flex items-center gap-1.5 rounded-[--r-sm] border border-[--line] bg-[--surface-2] px-2 py-1 text-[--ink-1]">
                <Circle className="h-2 w-2 fill-current" /> {timeToMarket}
              </span>
              <span className="caption ml-auto text-[--ink-2]">Generated {formatDateShort(createdAt)}</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h1 className="h1 mb-3 text-[--ink-0]">{setup.topic}</h1>
                {dashboard.verdict && <p className="body max-w-2xl text-[--ink-1]">{dashboard.verdict}</p>}
              </div>
              <div className="grid grid-cols-4 gap-x-6 gap-y-4 border-t border-[--line] pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 lg:gap-x-8">
                <BannerScore label="Viability" value={score} />
                <BannerScore label="Market" value={market} />
                <BannerScore label="Moat" value={moat} />
                <BannerScore label="Execution" value={exec} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="sticky top-14 z-20 border-b border-[--line] bg-[--bg]/95 backdrop-blur-sm">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
            <nav className="flex gap-1 overflow-x-auto" aria-label="Report sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "relative inline-flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm font-medium transition",
                    tab === t.id ? "text-[--ink-0]" : "text-[--ink-2] hover:text-[--ink-0]",
                  )}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  <span
                    className={cn(
                      "absolute inset-x-2 -bottom-px h-px transition",
                      tab === t.id ? "bg-[--ink-0]" : "bg-transparent",
                    )}
                  />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Tab content ── */}
        <main className="flex-1 overflow-visible">
          <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10">
            {tab === "overview" && (
              <OverviewTab dashboard={dashboard} strengths={strengths} risks={risks} avgCat={avgCat} />
            )}
            {tab === "scores" && <ScoresTab categoryScores={categoryScores} score={score} avg={avgCat} />}
            {tab === "market" && (
              <MarketTab
                tamSamSom={tamSamSom}
                marketSummary={dashboard.marketSummary}
                targetCustomer={dashboard.targetCustomer}
                valueProposition={dashboard.valueProposition}
                marketScore={market}
              />
            )}
            {tab === "competition" && (
              <CompetitionTab
                competitiveMatrix={dashboard.competitiveMatrix}
                summary={dashboard.competitiveSummary}
                moat={moat}
              />
            )}
            {tab === "financials" && (
              <FinancialsTab
                projections={projRows}
                arrSeries={arrSeries}
                burnSeries={burnSeries}
                unitEconomics={dashboard.unitEconomics}
                breakEven={dashboard.breakEven}
                financialSummary={dashboard.financialSummary}
              />
            )}
            {tab === "plan" && (
              <PlanTab
                recommendations={recommendations}
                keyAssumptions={dashboard.keyAssumptions}
                timelineToLaunch={dashboard.timelineToLaunch}
                strengths={strengths}
                risks={risks}
                leanCanvas={dashboard.leanCanvas}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Banner score cell
// ───────────────────────────────────────────────────────────────

function BannerScore({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center">
      <RingCentered value={value} size={76} stroke={6} />
      <span className="caption mt-2 text-[--ink-2]">{label}</span>
    </div>
  );
}

function VerdictPill({ verdict }: { verdict: "go" | "caution" | "nogo" | null }) {
  if (!verdict) return null;
  const config = {
    go: { label: "GO", icon: <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />, cls: "border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[--success-soft] text-[--success]" },
    caution: { label: "CAUTION", icon: null, cls: "border-[--line-strong] bg-[--surface-2] text-[--ink-0]" },
    nogo: { label: "NO-GO", icon: <ArrowDownRight className="h-3 w-3" strokeWidth={2.5} />, cls: "border-[color-mix(in_srgb,var(--error)_35%,transparent)] bg-[--error-soft] text-[--error]" },
  }[verdict];
  return (
    <span className={cn("caption inline-flex items-center gap-1 rounded-[--r-sm] border px-2 py-1 font-semibold", config.cls)}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab: Overview
// ───────────────────────────────────────────────────────────────

function OverviewTab({
  dashboard,
  strengths,
  risks,
  avgCat,
}: {
  dashboard: ReturnType<typeof extractDashboardData>;
  strengths: string[];
  risks: string[];
  avgCat: number | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Executive summary" kicker="Snapshot">
          {dashboard.summary ? (
            <Prose>{dashboard.summary}</Prose>
          ) : (
            <p className="body text-[--ink-1]">No summary extracted.</p>
          )}
        </Card>

        {dashboard.goNoGo && (
          <Card title="Go / No-go rationale" kicker="Verdict">
            <Prose>{dashboard.goNoGo}</Prose>
          </Card>
        )}

        {dashboard.problemSolution && (
          <Card title="Problem & solution" kicker="Fit">
            <Prose>{dashboard.problemSolution}</Prose>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <Card title="Rubric average" kicker="6-category mean">
          <div className="flex items-center justify-between">
            <RingCentered value={avgCat} size={100} stroke={7} label="AVG" />
            <div className="flex-1 pl-6 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="caption text-[--ink-2]">Viability</span>
                <span className={cn("num-sm", toneText(scoreTone(dashboard.score)))}>{dashboard.score ?? "—"}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="caption text-[--ink-2]">Category mean</span>
                <span className={cn("num-sm", toneText(scoreTone(avgCat)))}>{avgCat == null ? "—" : Math.round(avgCat)}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Green lights" kicker="Working for you" accent="success">
          {strengths.length === 0 ? (
            <p className="small text-[--ink-2]">No strengths listed.</p>
          ) : (
            <ul className="space-y-2.5">
              {strengths.slice(0, 6).map((s, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[--success]" strokeWidth={2.25} />
                  <span className="small text-[--ink-1]">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Red flags" kicker="Working against you" accent="error">
          {risks.length === 0 ? (
            <p className="small text-[--ink-2]">No risks listed.</p>
          ) : (
            <ul className="space-y-2.5">
              {risks.slice(0, 6).map((r, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <ArrowDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[--error]" strokeWidth={2.25} />
                  <span className="small text-[--ink-1]">{r}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab: Scores
// ───────────────────────────────────────────────────────────────

function ScoresTab({
  categoryScores,
  score,
  avg,
}: {
  categoryScores: NonNullable<ReturnType<typeof extractDashboardData>["categoryScores"]>;
  score: number | null;
  avg: number | null;
}) {
  const radar = CATEGORY_LABELS.map((c) => ({ label: c.short, value: categoryScores[c.key] }));
  const bars = CATEGORY_LABELS.map((c) => ({ label: c.label, value: categoryScores[c.key] }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Category radar" kicker="Six-axis rubric" className="lg:col-span-2">
        <div className="flex flex-col items-center gap-6 py-4 md:flex-row md:items-center md:justify-around">
          <Radar scores={radar} />
          <div className="w-full max-w-sm">
            <BarList items={bars} />
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="Headline scores" kicker="At a glance">
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Viability" value={score} big />
            <StatTile label="Avg category" value={avg == null ? null : Math.round(avg)} big />
          </div>
          <p className="small mt-4 text-[--ink-2]">
            Viability is the headline score from a dedicated rubric. Avg category is the mean of the six-axis radar — watch for divergence ≥10pts.
          </p>
        </Card>
        <Card title="Reading the scores" kicker="Thresholds">
          <ul className="space-y-2.5">
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[--success]" />
              <span className="small text-[--ink-1]">70+ — investment-grade signal</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[--ink-1]" />
              <span className="small text-[--ink-1]">50–69 — work required</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[--error]" />
              <span className="small text-[--ink-1]">&lt;50 — red flag, needs pivot</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab: Market
// ───────────────────────────────────────────────────────────────

function MarketTab({
  tamSamSom,
  marketSummary,
  targetCustomer,
  valueProposition,
  marketScore,
}: {
  tamSamSom: { tam: string | null; sam: string | null; som: string | null };
  marketSummary: string | null;
  targetCustomer: string | null;
  valueProposition: string | null;
  marketScore: number | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Market sizing" kicker="TAM / SAM / SOM" className="lg:col-span-2">
        <MarketFunnel tam={tamSamSom.tam} sam={tamSamSom.sam} som={tamSamSom.som} />
      </Card>
      <Card title="Market score" kicker="From rubric">
        <div className="grid place-items-center py-4">
          <RingCentered value={marketScore} size={140} stroke={9} label="/100" />
        </div>
      </Card>

      {valueProposition && (
        <Card title="Value proposition" kicker="The pitch" className="lg:col-span-2">
          <Prose>{valueProposition}</Prose>
        </Card>
      )}
      {targetCustomer && (
        <Card title="Target customer" kicker="ICP">
          <Prose>{targetCustomer}</Prose>
        </Card>
      )}

      {marketSummary && (
        <Card title="Market analysis" kicker="Context" className="lg:col-span-3">
          <Prose>{marketSummary}</Prose>
        </Card>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab: Competition
// ───────────────────────────────────────────────────────────────

function CompetitionTab({
  competitiveMatrix,
  summary,
  moat,
}: {
  competitiveMatrix: ReturnType<typeof extractDashboardData>["competitiveMatrix"];
  summary: string | null;
  moat: number | null;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Competitive moat" kicker="Edge score">
        <div className="grid place-items-center py-4">
          <RingCentered value={moat} size={140} stroke={9} label="/100" />
        </div>
        <p className="small mt-2 text-[--ink-2]">
          Moat measures how defensible your position is. Below 50 means incumbents can copy you faster than you can grow.
        </p>
      </Card>

      <Card title="Direct competitors" kicker="Who else is in this ring" className="lg:col-span-2">
        {competitiveMatrix.length === 0 ? (
          <p className="small text-[--ink-2]">No competitors listed.</p>
        ) : (
          <div className="divide-y divide-[--line]">
            {competitiveMatrix.map((c, i) => (
              <div key={i} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[140px_1fr_1fr]">
                <div>
                  <span className="caption mb-1 block text-[--ink-2]">#{String(i + 1).padStart(2, "0")}</span>
                  <span className="body block font-semibold text-[--ink-0]">{c.name}</span>
                </div>
                <div>
                  <span className="caption mb-1 block text-[--ink-2]">Approach</span>
                  <span className="small text-[--ink-1]">{c.approach}</span>
                </div>
                <div>
                  <span className="caption mb-1 block text-[--ink-2]">Weakness</span>
                  <span className="small text-[--ink-1]">{c.weakness}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {summary && (
        <Card title="Competitive landscape" kicker="Summary" className="lg:col-span-3">
          <Prose>{summary}</Prose>
        </Card>
      )}

      <Card title="Next step" kicker="Go deeper" className="lg:col-span-3" accent="ink">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="body text-[--ink-1]">
            Run a dedicated competitor teardown — pricing, positioning, messaging, and a detailed teardown of their weak flank.
          </p>
          <Link href="/competitors" className="inline-flex items-center gap-2 rounded-[--r] border border-[--line-strong] bg-[--surface-2] px-4 py-2.5 text-sm font-medium text-[--ink-0] transition hover:bg-[--surface-3]">
            Open competitor analysis
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab: Financials
// ───────────────────────────────────────────────────────────────

function FinancialsTab({
  projections,
  arrSeries,
  burnSeries,
  unitEconomics,
  breakEven,
  financialSummary,
}: {
  projections: ReturnType<typeof extractDashboardData>["financialProjections"];
  arrSeries: number[] | null;
  burnSeries: number[] | null;
  unitEconomics: ReturnType<typeof extractDashboardData>["unitEconomics"];
  breakEven: ReturnType<typeof extractDashboardData>["breakEven"];
  financialSummary: string | null;
}) {
  const hasChart = arrSeries || burnSeries;
  const chartSeries = [
    ...(arrSeries ? [{ name: "Revenue", values: arrSeries, tone: "bull" as const }] : []),
    ...(burnSeries ? [{ name: "Burn", values: burnSeries, tone: "bear" as const }] : []),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {hasChart && (
        <Card title="3-year projection" kicker="Revenue vs burn" className="lg:col-span-2">
          <LineChart series={chartSeries} />
          <div className="mt-4 flex flex-wrap items-center gap-5">
            {chartSeries.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className={cn("h-2 w-6 rounded-full", s.tone === "bull" ? "bg-[--success]" : "bg-[--error]")} />
                <span className="small text-[--ink-1]">{s.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Unit economics" kicker="Per customer" className={hasChart ? "" : "lg:col-span-3"}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <UE label="CAC" v={unitEconomics.cac} />
          <UE label="LTV" v={unitEconomics.ltv} />
          <UE label="LTV:CAC" v={unitEconomics.ltvCacRatio} tone="bull" />
          <UE label="Payback" v={unitEconomics.paybackPeriod} />
          <UE label="Gross margin" v={unitEconomics.grossMargin} />
          <UE label="Churn" v={unitEconomics.churnRate} tone="bear" />
          <UE label="ARPU" v={unitEconomics.arpu} />
        </dl>
      </Card>

      {projections.length > 0 && (
        <Card title="Projection table" kicker="Year over year" className="lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[--line]">
                  <th className="caption py-2.5 pr-4 text-[--ink-2]">Metric</th>
                  <th className="caption py-2.5 pr-4 text-right text-[--ink-2]">Year 1</th>
                  <th className="caption py-2.5 pr-4 text-right text-[--ink-2]">Year 2</th>
                  <th className="caption py-2.5 text-right text-[--ink-2]">Year 3</th>
                </tr>
              </thead>
              <tbody>
                {projections.map((p, i) => (
                  <tr key={i} className="border-b border-[--line] last:border-b-0">
                    <td className="body py-3 pr-4 text-[--ink-0]">{p.metric}</td>
                    <td className="num-sm py-3 pr-4 text-right text-[--ink-1]">{p.year1}</td>
                    <td className="num-sm py-3 pr-4 text-right text-[--ink-1]">{p.year2}</td>
                    <td className="num-sm py-3 text-right text-[--ink-0]">{p.year3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {(breakEven.point || breakEven.timeline || breakEven.fundingNeed) && (
        <Card title="Break-even" kicker="Cash flow" className="lg:col-span-2">
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {breakEven.point && <BE label="Break-even point" v={breakEven.point} />}
            {breakEven.timeline && <BE label="Timeline" v={breakEven.timeline} />}
            {breakEven.milestone && <BE label="Key milestone" v={breakEven.milestone} />}
            {breakEven.fundingNeed && <BE label="Funding need" v={breakEven.fundingNeed} />}
          </dl>
        </Card>
      )}

      {financialSummary && (
        <Card title="Financial context" kicker="Notes" className="lg:col-span-3">
          <Prose>{financialSummary}</Prose>
        </Card>
      )}
    </div>
  );
}

function UE({ label, v, tone }: { label: string; v: string | null; tone?: Tone }) {
  return (
    <div>
      <dt className="caption mb-1 text-[--ink-2]">{label}</dt>
      <dd className={cn("num", tone ? toneText(tone) : "text-[--ink-0]")}>{v ?? "—"}</dd>
    </div>
  );
}

function BE({ label, v }: { label: string; v: string }) {
  return (
    <div>
      <dt className="caption mb-1 text-[--ink-2]">{label}</dt>
      <dd className="body text-[--ink-0]">{v}</dd>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Tab: Plan
// ───────────────────────────────────────────────────────────────

function PlanTab({
  recommendations,
  keyAssumptions,
  timelineToLaunch,
  strengths,
  risks,
  leanCanvas,
}: {
  recommendations: string[];
  keyAssumptions: string | null;
  timelineToLaunch: string | null;
  strengths: string[];
  risks: string[];
  leanCanvas: ReturnType<typeof extractDashboardData>["leanCanvas"];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card title="Validation plan" kicker="Top 5 next steps" className="lg:col-span-2">
        {recommendations.length === 0 ? (
          <p className="small text-[--ink-2]">No recommendations listed.</p>
        ) : (
          <ol className="space-y-4">
            {recommendations.slice(0, 5).map((r, i) => (
              <li key={i} className="flex items-start gap-4 border-b border-[--line] pb-4 last:border-b-0 last:pb-0">
                <span className="num text-[--ink-2]">{String(i + 1).padStart(2, "0")}</span>
                <span className="body text-[--ink-0]">{r}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="Timeline" kicker="Months to launch">
        <p className="num-lg text-[--ink-0]">{timelineToLaunch?.match(/\d+[^.\n]{0,30}(month|week|quarter|day)s?/i)?.[0] ?? "—"}</p>
        {timelineToLaunch && <p className="body mt-3 text-[--ink-1]">{timelineToLaunch}</p>}
      </Card>

      <Card title="Key assumptions" kicker="Must be true" className="lg:col-span-3">
        {keyAssumptions ? (
          <Prose>{keyAssumptions}</Prose>
        ) : (
          <p className="small text-[--ink-2]">No assumptions listed.</p>
        )}
      </Card>

      <Card title="Strengths" kicker="Build on these" accent="success">
        {strengths.length === 0 ? (
          <p className="small text-[--ink-2]">—</p>
        ) : (
          <ul className="space-y-2.5">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[--success]" strokeWidth={2.25} />
                <span className="small text-[--ink-1]">{s}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Risks" kicker="Mitigate these" accent="error" className="lg:col-span-2">
        {risks.length === 0 ? (
          <p className="small text-[--ink-2]">—</p>
        ) : (
          <ul className="space-y-2.5">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <ArrowDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[--error]" strokeWidth={2.25} />
                <span className="small text-[--ink-1]">{r}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {leanCanvas && (
        <Card title="Lean canvas" kicker="One-page plan" className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[--r-sm] bg-[--line] md:grid-cols-5">
            <LC label="Problem" v={leanCanvas.problem} className="md:row-span-2" />
            <LC label="Solution" v={leanCanvas.solution} />
            <LC label="UVP" v={leanCanvas.uvp} className="md:row-span-2" />
            <LC label="Unfair advantage" v={leanCanvas.unfairAdvantage} />
            <LC label="Customer" v={leanCanvas.customerSegments} className="md:row-span-2" />
            <LC label="Key metrics" v={leanCanvas.keyMetrics} />
            <LC label="Channels" v={leanCanvas.channels} />
            <LC label="Cost structure" v={leanCanvas.costStructure} className="md:col-span-3" />
            <LC label="Revenue streams" v={leanCanvas.revenueStreams} className="md:col-span-2" />
          </div>
        </Card>
      )}
    </div>
  );
}

function LC({ label, v, className }: { label: string; v: string; className?: string }) {
  return (
    <div className={cn("bg-[--surface-1] p-4", className)}>
      <span className="caption mb-2 block text-[--ink-2]">{label}</span>
      <span className="small text-[--ink-1]">{v || "—"}</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Generic card
// ───────────────────────────────────────────────────────────────

function Card({
  title,
  kicker,
  children,
  className,
  accent,
}: {
  title: string;
  kicker?: string;
  children: React.ReactNode;
  className?: string;
  accent?: "success" | "error" | "ink";
}) {
  const accentCls =
    accent === "success"
      ? "before:bg-[--success]"
      : accent === "error"
        ? "before:bg-[--error]"
        : accent === "ink"
          ? "before:bg-[--ink-0]"
          : "";
  return (
    <section
      className={cn(
        "card-premium relative p-6",
        accent && "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:rounded-l-[--r] before:z-[1]",
        accentCls,
        className,
      )}
    >
      <header className="mb-4 flex items-baseline gap-3 border-b border-[--line] pb-3">
        <div className="flex-1">
          {kicker && <span className="caption mb-1 block text-[--ink-2]">{kicker}</span>}
          <h2 className="h3 text-[--ink-0]">{title}</h2>
        </div>
      </header>
      {children}
    </section>
  );
}

function StatTile({ label, value, big = false }: { label: string; value: number | null; big?: boolean }) {
  const tone = scoreTone(value);
  return (
    <div className="rounded-[--r] border border-[--line] bg-[--surface-2] p-4">
      <span className="caption mb-1 block text-[--ink-2]">{label}</span>
      <span className={cn(big ? "num-lg" : "num", toneText(tone))}>{value == null ? "—" : value}</span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────

export default function ResultsPage() {
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
