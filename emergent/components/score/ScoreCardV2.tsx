"use client";

/**
 * ScoreCardV2.tsx — v2.2 (web-grounded edition)
 * ─────────────────────────────────────────────────────────────────────────
 * Additions over v2.1:
 *   • Small "🛰 LIVE WEB SEARCH" badge on the headline when the agent
 *     used the web_search tool to ground the score.
 *   • Each Assumption row now renders its sourceUrl as a clickable link
 *     when present (the model's live citation).
 *   • A small "SOURCES CONSULTED" footer lists all distinct URLs the
 *     model cited across the run, with publisher titles.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Compass, RefreshCw, Target,
  Search, Sparkles, Globe, ExternalLink,
} from "lucide-react";

type Band = "weak" | "interesting" | "viable" | "strong" | "exceptional";
type Recommendation = "proceed" | "proceed-cautiously" | "refine" | "pivot" | "reject";

interface Dim {
  id: string; label: string; weight: number; score: number;
  band: Band; why: string; topGap: string; enriched: boolean;
}
interface Assumption {
  area: "market"|"competition"|"pricing"|"regulatory"|"distribution"|"channels";
  claim: string; evidenceToLock: string;
  sourceUrl?: string; sourceTitle?: string;
}
interface IdeaScoreV2 {
  overall: number; band: Band; recommendation: Recommendation;
  ideaQuality: number; executionDifficulty: number;
  founderAdvantageNeeded: "low"|"medium"|"high";
  dimensions: Dim[];
  headlineRationale: string;
  topStrengths: string[]; topRisks: string[]; nextThreeMoves: string[];
  confidence: "low"|"medium"|"high"; evidenceLevel: "thin"|"moderate"|"rich";
  assumptions: Assumption[];
  enrichmentReliance: "none"|"low"|"medium"|"high";
  oneAskFromFounder: string;
  webSearchUsed?: boolean;
  sourcesConsulted?: Array<{ url: string; title?: string }>;
  schemaVersion: number;
}

const CACHE_KEY = "priority-debater-score-v2";

const BAND_COLORS: Record<Band, { bg: string; fg: string; label: string }> = {
  weak:        { bg: "#ef4444", fg: "#fff", label: "WEAK" },
  interesting: { bg: "#f59e0b", fg: "#000", label: "INTERESTING" },
  viable:      { bg: "#facc15", fg: "#000", label: "VIABLE" },
  strong:      { bg: "#22c55e", fg: "#000", label: "STRONG" },
  exceptional: { bg: "#06b6d4", fg: "#000", label: "EXCEPTIONAL" },
};

const REC_COPY: Record<Recommendation, { label: string; bg: string; fg: string }> = {
  "proceed":            { label: "PROCEED",              bg: "#22c55e", fg: "#000" },
  "proceed-cautiously": { label: "PROCEED · CAUTIOUSLY", bg: "#facc15", fg: "#000" },
  "refine":             { label: "REFINE",               bg: "#7dd3fc", fg: "#000" },
  "pivot":              { label: "PIVOT",                bg: "#f59e0b", fg: "#000" },
  "reject":             { label: "REJECT",               bg: "#ef4444", fg: "#fff" },
};

const RELIANCE_COPY: Record<IdeaScoreV2["enrichmentReliance"], { label: string; tone: "good"|"info"|"warn" }> = {
  none:   { label: "USER-PROVIDED · 0 ASSUMPTIONS",          tone: "good" },
  low:    { label: "MOSTLY USER-PROVIDED · 1-2 ASSUMPTIONS", tone: "info" },
  medium: { label: "BLENDED · 3-5 ASSUMPTIONS USED",         tone: "info" },
  high:   { label: "RESEARCH-HEAVY · ADD EVIDENCE TO LOCK",  tone: "warn" },
};

function hashStr(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}
function hostnameOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
function readCache(k: string): IdeaScoreV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return obj?.[k] ?? null;
  } catch { return null; }
}
function writeCache(k: string, v: IdeaScoreV2) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[k] = v;
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

interface Props {
  topic: string;
  position?: string;
  context?: string;
  payload?: IdeaScoreV2;
  className?: string;
}

export default function ScoreCardV2({ topic, position, context, payload, className = "" }: Props) {
  const cacheKey = useMemo(
    () => hashStr(`${topic}::${position || ""}::${context || ""}`),
    [topic, position, context]
  );
  const [data, setData] = useState<IdeaScoreV2 | null>(payload ?? null);
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error">(payload ? "ready" : "idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (payload) { setData(payload); setStatus("ready"); return; }
    if (!topic) return;
    const cached = readCache(cacheKey);
    if (cached) { setData(cached); setStatus("ready"); return; }
    void fetchScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, payload]);

  async function fetchScore() {
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, position, context }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as IdeaScoreV2;
      setData(json); writeCache(cacheKey, json); setStatus("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Scoring failed.");
      setStatus("error");
    }
  }

  function regenerate() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        delete obj[cacheKey];
        localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
      }
    } catch {}
    void fetchScore();
  }

  if (status === "loading") {
    return (
      <div className={`border-2 border-black bg-white p-10 text-center ${className}`}>
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-black" />
        <div className="mt-3 font-mono text-[11px] font-semibold tracking-widest text-neutral-700">
          SEARCHING THE WEB · ENRICHING CATEGORY · SCORING 8 DIMENSIONS
        </div>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className={`border-2 border-[#ef4444] bg-black p-6 text-white ${className}`}>
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-[#ef4444]">
          <AlertTriangle className="h-4 w-4" /> SCORING FAILED
        </div>
        <p className="mt-2 text-sm">{errorMsg}</p>
        <button onClick={regenerate}
                className="mt-4 inline-flex items-center gap-2 border-2 border-white bg-white px-4 py-2 font-mono text-xs font-semibold tracking-widest text-black">
          <RefreshCw className="h-3.5 w-3.5" /> RETRY
        </button>
      </div>
    );
  }
  if (!data) return null;

  const band = BAND_COLORS[data.band];
  const rec  = REC_COPY[data.recommendation];
  const rel  = RELIANCE_COPY[data.enrichmentReliance];
  const enrichedCount = data.dimensions.filter((d) => d.enriched).length;
  const distinctSources = (data.sourcesConsulted || [])
    .concat(data.assumptions.filter((a) => a.sourceUrl).map((a) => ({ url: a.sourceUrl!, title: a.sourceTitle })))
    .reduce<Array<{ url: string; title?: string }>>((acc, s) => {
      if (!acc.find((x) => x.url === s.url)) acc.push(s);
      return acc;
    }, []);

  return (
    <div className={`space-y-0 border-2 border-black bg-white ${className}`} data-testid="score-card-v2">

      {/* ── Headline strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border-b-2 border-black bg-black md:grid-cols-[1fr_auto]">
        <div className="bg-white p-6 lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] font-semibold tracking-widest text-neutral-600">
            <span>VIABILITY SCORE · WEIGHTED COMPOSITE</span>
            <button onClick={regenerate} title="Re-run scoring"
                    className="inline-flex items-center gap-1 border border-black bg-white px-2 py-1 text-[10px] hover:bg-black hover:text-white">
              <RefreshCw className="h-3 w-3" /> RESCORE
            </button>
          </div>
          <div className="mt-3 flex items-end gap-5">
            <span className="font-display text-[88px] leading-none tracking-tighter text-black">{data.overall}</span>
            <span className="pb-2 font-mono text-[12px] text-neutral-500">/ 100</span>
            <span className="ml-2 inline-flex items-center px-2 py-1 font-mono text-[11px] font-bold tracking-widest"
                  style={{ background: band.bg, color: band.fg }}>
              {band.label}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {/* enrichment-reliance tag */}
            <span className={`inline-flex items-center gap-2 border-2 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest ${
                rel.tone === "good" ? "border-[#22c55e] text-[#22c55e]"
                : rel.tone === "warn" ? "border-[#ef4444] text-[#ef4444]"
                : "border-black text-black"
            }`}>
              <Search className="h-3 w-3" /> {rel.label}
            </span>
            {/* live web search badge */}
            {data.webSearchUsed && (
              <span className="inline-flex items-center gap-2 border-2 border-[#06b6d4] bg-[#06b6d4]/10 px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-[#0e7490]">
                <Globe className="h-3 w-3" /> LIVE WEB SEARCH · {distinctSources.length} SOURCES
              </span>
            )}
          </div>

          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-neutral-800">
            {data.headlineRationale}
          </p>
        </div>

        <div className="flex flex-col justify-between gap-4 bg-black p-6 text-white lg:p-8 lg:min-w-[280px]">
          <div>
            <div className="font-mono text-[10px] font-semibold tracking-widest text-white/75">RECOMMENDATION</div>
            <div className="mt-2 inline-block px-3 py-1.5 font-mono text-[12px] font-bold tracking-widest"
                 style={{ background: rec.bg, color: rec.fg }}>
              {rec.label}
            </div>
          </div>
          <div className="font-mono text-[10px] tracking-widest text-white/75">
            CONFIDENCE: <span className="text-white">{data.confidence.toUpperCase()}</span><br />
            EVIDENCE:   <span className="text-white">{data.evidenceLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ── ONE ASK BANNER ─────────────────────────────────────────── */}
      {data.enrichmentReliance !== "none" && (
        <div className="flex items-start gap-3 border-b-2 border-black bg-[#facc15] p-5 text-black">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="font-mono text-[10px] font-bold tracking-widest">
              ONE ASK · WOULD LOCK THE BIGGEST SCORE UPLIFT
            </div>
            <p className="mt-1 text-[15px] font-medium leading-relaxed">{data.oneAskFromFounder}</p>
          </div>
        </div>
      )}

      {/* ── 3 decoupled signals ───────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border-b-2 border-black bg-black sm:grid-cols-3">
        <SignalTile label="IDEA QUALITY"             value={`${data.ideaQuality}/100`} note="If a top operator built it" />
        <SignalTile label="EXECUTION DIFFICULTY"     value={`${data.executionDifficulty}/100`} note="Higher = harder to ship" />
        <SignalTile label="FOUNDER ADVANTAGE NEEDED" value={data.founderAdvantageNeeded.toUpperCase()} note="To beat clone risk" />
      </div>

      {/* ── 8-dimension table ────────────────────────────────────── */}
      <div className="border-b-2 border-black">
        <div className="flex items-center justify-between border-b-2 border-black bg-black px-5 py-3 text-white">
          <div className="font-mono text-[10px] font-semibold tracking-widest">
            WEIGHTED DIMENSIONS · 8 AXES · {enrichedCount} ENRICHED {data.webSearchUsed ? "VIA LIVE SEARCH" : "FROM CATEGORY KNOWLEDGE"}
          </div>
          <div className="font-mono text-[10px] tracking-widest text-white/70">SUM OF WEIGHTS = 100</div>
        </div>
        <ul className="divide-y divide-black/10">
          {data.dimensions.map((d) => {
            const dBand = BAND_COLORS[d.band];
            return (
              <li key={d.id} data-testid={`dim-${d.id}`} className="grid grid-cols-12 items-center gap-3 px-5 py-4">
                <div className="col-span-12 sm:col-span-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-neutral-500">
                    WEIGHT · {d.weight}%
                    {d.enriched && (
                      <span className="inline-flex items-center gap-1 border border-black bg-[#facc15] px-1 py-0.5 text-[9px] font-bold text-black">
                        {data.webSearchUsed ? <Globe className="h-2.5 w-2.5" /> : <Search className="h-2.5 w-2.5" />}
                        ENRICHED
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-display text-[18px] uppercase tracking-tight">{d.label}</div>
                </div>
                <div className="col-span-6 sm:col-span-2 flex items-center gap-2">
                  <span className="font-display text-[36px] leading-none tracking-tighter text-black">{d.score}</span>
                  <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest"
                        style={{ background: dBand.bg, color: dBand.fg }}>
                    {dBand.label}
                  </span>
                </div>
                <div className="col-span-6 sm:col-span-3 font-mono text-[12px] leading-relaxed text-neutral-700">
                  {d.why}
                </div>
                <div className="col-span-12 sm:col-span-3 border-l-2 border-[#ef4444]/40 pl-3 font-mono text-[12px] leading-relaxed text-neutral-800">
                  <span className="block text-[9px] font-bold tracking-widest text-[#ef4444]">TOP GAP</span>
                  {d.topGap}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Assumptions panel ──────────────────────────────────────── */}
      {data.assumptions.length > 0 && (
        <div className="border-b-2 border-black bg-[#fef3c7]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/20 px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest text-black">
              {data.webSearchUsed ? <Globe className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {data.assumptions.length} {data.webSearchUsed ? "WEB-VERIFIED" : "RESEARCHED"} ASSUMPTIONS IN THIS SCORE
            </div>
            <div className="font-mono text-[10px] tracking-widest text-black/60">
              CLICK A SOURCE TO READ · ADD YOUR EVIDENCE TO LOCK THE NUMBER
            </div>
          </div>
          <ul className="divide-y divide-black/10">
            {data.assumptions.map((a, i) => (
              <li key={i} className="grid grid-cols-12 items-start gap-3 px-5 py-4">
                <div className="col-span-12 sm:col-span-2 font-mono text-[10px] font-bold tracking-widest text-black">
                  {a.area.toUpperCase()}
                </div>
                <div className="col-span-12 sm:col-span-5 text-[13px] leading-relaxed text-black">
                  <span className="font-mono text-[9px] font-bold tracking-widest text-neutral-500">CLAIM</span><br/>
                  {a.claim}
                  {a.sourceUrl && (
                    <a
                      href={a.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-black hover:bg-black hover:text-white"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      {a.sourceTitle || hostnameOf(a.sourceUrl)}
                    </a>
                  )}
                </div>
                <div className="col-span-12 sm:col-span-5 border-l-2 border-black/20 pl-3 text-[13px] leading-relaxed text-neutral-800">
                  <span className="font-mono text-[9px] font-bold tracking-widest text-[#ef4444]">EVIDENCE TO LOCK</span><br/>
                  {a.evidenceToLock}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Strengths + Risks ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-px border-b-2 border-black bg-black md:grid-cols-2">
        <div className="bg-white p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-widest text-[#22c55e]">
            <CheckCircle2 className="h-4 w-4" /> TOP STRENGTHS
          </div>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-neutral-800">
            {data.topStrengths.length === 0
              ? <li className="text-neutral-500">— none surfaced from the text</li>
              : data.topStrengths.map((s, i) => <li key={i} className="flex gap-2"><span className="text-[#22c55e]">▸</span>{s}</li>)}
          </ul>
        </div>
        <div className="bg-white p-6">
          <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-widest text-[#ef4444]">
            <AlertTriangle className="h-4 w-4" /> TOP RISKS
          </div>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-neutral-800">
            {data.topRisks.length === 0
              ? <li className="text-neutral-500">— none surfaced from the text</li>
              : data.topRisks.map((s, i) => <li key={i} className="flex gap-2"><span className="text-[#ef4444]">▸</span>{s}</li>)}
          </ul>
        </div>
      </div>

      {/* ── Next 3 moves ─────────────────────────────────────────── */}
      <div className="border-b-2 border-black bg-[#f4f3ef] p-6">
        <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-widest text-neutral-700">
          <Target className="h-4 w-4" /> NEXT 3 MOVES · 7 / 30 / 60 DAYS
        </div>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {data.nextThreeMoves.slice(0, 3).map((m, i) => (
            <li key={i} className="border-2 border-black bg-white p-4">
              <div className="font-mono text-[10px] font-bold tracking-widest text-[#ef4444]">
                MOVE {String(i + 1).padStart(2, "0")}
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-black">{m}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Sources consulted footer ─────────────────────────────── */}
      {distinctSources.length > 0 && (
        <div className="bg-black p-5 text-white">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-white/70">
            <Globe className="h-4 w-4" /> SOURCES CONSULTED · {distinctSources.length}
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {distinctSources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-white/40 bg-black px-2 py-1 font-mono text-[10px] tracking-widest text-white hover:border-white hover:bg-white hover:text-black"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {s.title || hostnameOf(s.url)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SignalTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-white p-5">
      <div className="font-mono text-[10px] font-semibold tracking-widest text-neutral-500">
        <Compass className="mr-1 inline h-3 w-3" /> {label}
      </div>
      <div className="mt-2 font-display text-[34px] leading-none tracking-tighter text-black">{value}</div>
      <div className="mt-1 font-mono text-[11px] text-neutral-500">{note}</div>
    </div>
  );
}
