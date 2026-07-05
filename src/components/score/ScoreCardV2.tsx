"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  ExternalLink,
  Globe,
  RefreshCw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import type { IdeaScoreV2, Band, Recommendation } from "@/lib/agents/idea-scoring-v2";

const CACHE_KEY = "priority-debater-score-v2";

const BAND_STYLES: Record<Band, { bg: string; fg: string; label: string }> = {
  weak: { bg: "var(--fk-red)", fg: "#fff", label: "WEAK" },
  interesting: { bg: "var(--fk-amber)", fg: "#000", label: "INTERESTING" },
  viable: { bg: "var(--fk-yellow)", fg: "#000", label: "VIABLE" },
  strong: { bg: "var(--fk-green)", fg: "#000", label: "STRONG" },
  exceptional: { bg: "var(--fk-blue)", fg: "#fff", label: "EXCEPTIONAL" },
};

const RECOMMENDATION_STYLES: Record<Recommendation, { bg: string; fg: string; label: string }> = {
  proceed: { bg: "var(--fk-green)", fg: "#000", label: "PROCEED" },
  "proceed-cautiously": { bg: "var(--fk-yellow)", fg: "#000", label: "PROCEED CAUTIOUSLY" },
  refine: { bg: "var(--fk-blue)", fg: "#fff", label: "REFINE" },
  pivot: { bg: "var(--fk-amber)", fg: "#000", label: "PIVOT" },
  reject: { bg: "var(--fk-red)", fg: "#fff", label: "REJECT" },
};

const RELIANCE_STYLES: Record<
  IdeaScoreV2["enrichmentReliance"],
  { label: string; className: string }
> = {
  none: {
    label: "USER-PROVIDED / 0 ASSUMPTIONS",
    className: "border-[#16B364] text-[#16B364]",
  },
  low: {
    label: "MOSTLY USER-PROVIDED / 1-2 ASSUMPTIONS",
    className: "border-black text-black",
  },
  medium: {
    label: "BLENDED / 3-5 ASSUMPTIONS USED",
    className: "border-black text-black",
  },
  high: {
    label: "RESEARCH-HEAVY / ADD EVIDENCE TO LOCK",
    className: "border-[#FF2B2B] text-[#FF2B2B]",
  },
};

interface ScoreCardV2Props {
  topic: string;
  position?: string;
  context?: string;
  payload?: IdeaScoreV2;
  className?: string;
}

function hashString(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function readCache(key: string): IdeaScoreV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)?.[key] ?? null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: IdeaScoreV2): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[key] = value;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage can be unavailable or full.
  }
}

function deleteCache(key: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    delete cache[key];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache failures; rescoring still works.
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function ScoreCardV2({
  topic,
  position,
  context,
  payload,
  className = "",
}: ScoreCardV2Props) {
  const cacheKey = useMemo(
    () => hashString(`${topic}::${position ?? ""}::${context ?? ""}`),
    [context, position, topic],
  );
  const [data, setData] = useState<IdeaScoreV2 | null>(payload ?? null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    payload ? "ready" : "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  const fetchScore = useCallback(async () => {
    if (!topic) return;
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, position, context }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || `HTTP ${response.status}`);
      }

      const nextData = (await response.json()) as IdeaScoreV2;
      setData(nextData);
      writeCache(cacheKey, nextData);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Scoring failed.");
      setStatus("error");
    }
  }, [cacheKey, context, position, topic]);

  useEffect(() => {
    if (payload) {
      setData(payload);
      setStatus("ready");
      return;
    }

    if (!topic) return;
    const cached = readCache(cacheKey);
    if (cached) {
      setData(cached);
      setStatus("ready");
      return;
    }

    void fetchScore();
  }, [cacheKey, fetchScore, payload, topic]);

  const regenerate = () => {
    deleteCache(cacheKey);
    void fetchScore();
  };

  if (status === "loading") {
    return (
      <div className={`border-2 border-black bg-white p-10 text-center ${className}`}>
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-black" />
        <div className="mt-3 font-mono text-[11px] font-semibold tracking-widest text-neutral-700">
          SEARCHING THE WEB / ENRICHING CATEGORY / SCORING 8 DIMENSIONS
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`border-2 border-[#FF2B2B] bg-black p-6 text-white ${className}`}>
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-[#FF2B2B]">
          <AlertTriangle className="h-4 w-4" /> SCORING FAILED
        </div>
        <p className="mt-2 text-sm">{errorMessage}</p>
        <button
          type="button"
          onClick={regenerate}
          className="mt-4 inline-flex items-center gap-2 border-2 border-white bg-white px-4 py-2 font-mono text-xs font-semibold tracking-widest text-black"
        >
          <RefreshCw className="h-3.5 w-3.5" /> RETRY
        </button>
      </div>
    );
  }

  if (!data) return null;

  const band = BAND_STYLES[data.band];
  const recommendation = RECOMMENDATION_STYLES[data.recommendation];
  const reliance = RELIANCE_STYLES[data.enrichmentReliance];
  const enrichedCount = data.dimensions.filter((dimension) => dimension.enriched).length;
  const distinctSources = [
    ...data.sourcesConsulted,
    ...data.assumptions
      .filter((assumption) => assumption.sourceUrl)
      .map((assumption) => ({
        url: assumption.sourceUrl as string,
        title: assumption.sourceTitle,
      })),
  ].reduce<Array<{ url: string; title?: string }>>((acc, source) => {
    if (!source.url || acc.some((item) => item.url === source.url)) return acc;
    acc.push(source);
    return acc;
  }, []);

  return (
    <div className={`border-2 border-black bg-white ${className}`} data-testid="score-card-v2">
      <div className="grid grid-cols-1 gap-px border-b-2 border-black bg-black md:grid-cols-[1fr_auto]">
        <div className="bg-white p-6 lg:p-8">
          <div className="flex items-center justify-between gap-4 font-mono text-[10px] font-semibold tracking-widest text-neutral-600">
            <span>V2.2 VIABILITY SCORE / WEIGHTED COMPOSITE</span>
            <button
              type="button"
              onClick={regenerate}
              title="Re-run scoring"
              className="inline-flex items-center gap-1 border border-black bg-white px-2 py-1 text-[10px] hover:bg-black hover:text-white"
            >
              <RefreshCw className="h-3 w-3" /> RESCORE
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-4">
            <span className="font-display text-[76px] leading-none tracking-tight text-black sm:text-[88px]">
              {data.overall}
            </span>
            <span className="pb-2 font-mono text-[12px] text-neutral-500">/ 100</span>
            <span
              className="mb-2 inline-flex items-center px-2 py-1 font-mono text-[11px] font-bold tracking-widest"
              style={{ background: band.bg, color: band.fg }}
            >
              {band.label}
            </span>
          </div>

          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-neutral-800">
            {data.headlineRationale}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-2 border-2 px-2 py-1 font-mono text-[10px] font-semibold tracking-widest ${reliance.className}`}
            >
              <Search className="h-3 w-3" /> {reliance.label}
            </span>
            {data.webSearchUsed && (
              <span className="inline-flex items-center gap-2 border-2 border-[#06b6d4] bg-[#06b6d4]/10 px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-[#0e7490]">
                <Globe className="h-3 w-3" /> LIVE WEB SEARCH / {distinctSources.length} SOURCES
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 bg-black p-6 text-white lg:min-w-[280px] lg:p-8">
          <div>
            <div className="font-mono text-[10px] font-semibold tracking-widest text-white/75">
              RECOMMENDATION
            </div>
            <div
              className="mt-2 inline-block px-3 py-1.5 font-mono text-[12px] font-bold tracking-widest"
              style={{ background: recommendation.bg, color: recommendation.fg }}
            >
              {recommendation.label}
            </div>
          </div>

          <div className="font-mono text-[10px] tracking-widest text-white/75">
            CONFIDENCE: <span className="text-white">{data.confidence.toUpperCase()}</span>
            <br />
            EVIDENCE: <span className="text-white">{data.evidenceLevel.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {data.enrichmentReliance !== "none" && (
        <div className="flex items-start gap-3 border-b-2 border-black bg-[#facc15] p-5 text-black">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">
            <div className="font-mono text-[10px] font-bold tracking-widest">
              ONE ASK / WOULD LOCK THE BIGGEST SCORE UPLIFT
            </div>
            <p className="mt-1 text-[15px] font-medium leading-relaxed">{data.oneAskFromFounder}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-px border-b-2 border-black bg-black sm:grid-cols-3">
        <SignalTile label="IDEA QUALITY" value={`${data.ideaQuality}/100`} note="If a top operator built it" />
        <SignalTile
          label="EXECUTION DIFFICULTY"
          value={`${data.executionDifficulty}/100`}
          note="Higher means harder to ship"
        />
        <SignalTile
          label="FOUNDER ADVANTAGE NEEDED"
          value={data.founderAdvantageNeeded.toUpperCase()}
          note="Required unfair advantage"
        />
      </div>

      <div className="border-b-2 border-black">
        <div className="flex items-center justify-between gap-4 border-b-2 border-black bg-black px-5 py-3 text-white">
          <div className="font-mono text-[10px] font-semibold tracking-widest">
            WEIGHTED DIMENSIONS / 8 AXES / {enrichedCount} ENRICHED{" "}
            {data.webSearchUsed ? "VIA LIVE SEARCH" : "FROM CATEGORY KNOWLEDGE"}
          </div>
          <div className="hidden font-mono text-[10px] tracking-widest text-white/70 sm:block">
            SUM OF WEIGHTS = 100
          </div>
        </div>

        <ul className="divide-y divide-black/10">
          {data.dimensions.map((dimension) => {
            const dimensionBand = BAND_STYLES[dimension.band];
            return (
              <li
                key={dimension.id}
                data-testid={`dim-${dimension.id}`}
                className="grid grid-cols-12 items-center gap-3 px-5 py-4"
              >
                <div className="col-span-12 sm:col-span-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-neutral-500">
                    WEIGHT / {dimension.weight}%
                    {dimension.enriched && (
                      <span className="inline-flex items-center gap-1 border border-black bg-[#facc15] px-1 py-0.5 text-[9px] font-bold text-black">
                        {data.webSearchUsed ? <Globe className="h-2.5 w-2.5" /> : <Search className="h-2.5 w-2.5" />}
                        ENRICHED
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-display text-[18px] uppercase tracking-tight">
                    {dimension.label}
                  </div>
                </div>

                <div className="col-span-6 flex items-center gap-2 sm:col-span-2">
                  <span className="font-display text-[36px] leading-none tracking-tight text-black">
                    {dimension.score}
                  </span>
                  <span
                    className="px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest"
                    style={{ background: dimensionBand.bg, color: dimensionBand.fg }}
                  >
                    {dimensionBand.label}
                  </span>
                </div>

                <div className="col-span-6 font-mono text-[12px] leading-relaxed text-neutral-700 sm:col-span-3">
                  {dimension.why}
                </div>

                <div className="col-span-12 border-l-2 border-[#FF2B2B]/40 pl-3 font-mono text-[12px] leading-relaxed text-neutral-800 sm:col-span-3">
                  <span className="block text-[9px] font-bold tracking-widest text-[#FF2B2B]">
                    TOP GAP
                  </span>
                  {dimension.topGap}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {data.assumptions.length > 0 && (
        <div className="border-b-2 border-black bg-[#fef3c7]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/20 px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest text-black">
              {data.webSearchUsed ? <Globe className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              {data.assumptions.length} {data.webSearchUsed ? "WEB-VERIFIED" : "RESEARCHED"} ASSUMPTIONS
            </div>
            <div className="font-mono text-[10px] tracking-widest text-black/60">
              ADD YOUR EVIDENCE TO LOCK THE NUMBER
            </div>
          </div>
          <ul className="divide-y divide-black/10">
            {data.assumptions.map((assumption, index) => (
              <li key={`${assumption.area}-${index}`} className="grid grid-cols-12 items-start gap-3 px-5 py-4">
                <div className="col-span-12 font-mono text-[10px] font-bold tracking-widest text-black sm:col-span-2">
                  {assumption.area.toUpperCase()}
                </div>
                <div className="col-span-12 text-[13px] leading-relaxed text-black sm:col-span-5">
                  <span className="font-mono text-[9px] font-bold tracking-widest text-neutral-500">
                    CLAIM
                  </span>
                  <br />
                  {assumption.claim}
                  {assumption.sourceUrl && (
                    <a
                      href={assumption.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-black hover:bg-black hover:text-white"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      {assumption.sourceTitle || hostnameOf(assumption.sourceUrl)}
                    </a>
                  )}
                </div>
                <div className="col-span-12 border-l-2 border-black/20 pl-3 text-[13px] leading-relaxed text-neutral-800 sm:col-span-5">
                  <span className="font-mono text-[9px] font-bold tracking-widest text-[#FF2B2B]">
                    EVIDENCE TO LOCK
                  </span>
                  <br />
                  {assumption.evidenceToLock}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-px border-b-2 border-black bg-black md:grid-cols-2">
        <ListPanel
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="TOP STRENGTHS"
          color="#16B364"
          empty="No clear strengths surfaced from the text."
          items={data.topStrengths}
        />
        <ListPanel
          icon={<AlertTriangle className="h-4 w-4" />}
          title="TOP RISKS"
          color="#FF2B2B"
          empty="No clear risks surfaced from the text."
          items={data.topRisks}
        />
      </div>

      <div className="border-b-2 border-black bg-[#f4f3ef] p-6">
        <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-widest text-neutral-700">
          <Target className="h-4 w-4" /> NEXT 3 MOVES / 7, 30, 60 DAYS
        </div>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {data.nextThreeMoves.slice(0, 3).map((move, index) => (
            <li key={`${move}-${index}`} className="border-2 border-black bg-white p-4">
              <div className="font-mono text-[10px] font-bold tracking-widest text-[#FF2B2B]">
                MOVE {String(index + 1).padStart(2, "0")}
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-black">{move}</p>
            </li>
          ))}
        </ol>
      </div>

      {distinctSources.length > 0 && (
        <div className="bg-black p-5 text-white">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-white/70">
            <Globe className="h-4 w-4" /> SOURCES CONSULTED / {distinctSources.length}
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {distinctSources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border border-white/40 bg-black px-2 py-1 font-mono text-[10px] tracking-widest text-white hover:border-white hover:bg-white hover:text-black"
                >
                  <ExternalLink className="h-2.5 w-2.5" />
                  {source.title || hostnameOf(source.url)}
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
      <div className="mt-2 font-display text-[30px] leading-none tracking-tight text-black sm:text-[34px]">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] text-neutral-500">{note}</div>
    </div>
  );
}

function ListPanel({
  icon,
  title,
  color,
  empty,
  items,
}: {
  icon: ReactNode;
  title: string;
  color: string;
  empty: string;
  items: string[];
}) {
  return (
    <div className="bg-white p-6">
      <div className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-widest" style={{ color }}>
        {icon} {title}
      </div>
      <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-neutral-800">
        {items.length === 0 ? (
          <li className="text-neutral-500">{empty}</li>
        ) : (
          items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2">
              <span style={{ color }}>+</span>
              <span>{item}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
