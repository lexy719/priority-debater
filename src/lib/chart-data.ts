import type { CategoryScores, CompetitorEntry, FinancialProjectionRow } from "@/lib/parse";

/** Parsed money string like `$2.1B` or `$420M` → numeric value in billions (TAM) or millions (SAM/SOM). */
export function parseMoneyToken(s: string | null | undefined): { n: number; scale: "B" | "M" } | null {
  if (!s) return null;
  const t = s.replace(/,/g, "").trim();
  const m = t.match(/\$?\s*([\d.]+)\s*(B|bn|billion|M|mn|million)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  const u = m[2].toUpperCase();
  if (u.startsWith("B")) return { n, scale: "B" };
  return { n, scale: "M" };
}

export type ScoreHistoryPoint = { v: string; score: number };
export type MarketGrowthPoint = { year: string; tam: number; sam: number; som: number };
export type RevenuePoint = { year: string; subs: number; hardware: number; total: number; raw?: string };

export type RevenueChartBundle = {
  points: RevenuePoint[];
  sourceMetric: string;
  isMrr: boolean;
};
export type ScatterPoint = { x: number; y: number; name: string; you?: boolean };

/** Parse $140K, $3.1M, $2.1B → millions (EUR/USD agnostic). */
export function parseMoneyToMillions(cell: string, opts?: { annualizeMrr?: boolean }): number | null {
  const cleaned = cell.replace(/,/g, "").trim();
  const m = cleaned.match(/[$€£]?\s*([\d.]+)\s*(B|bn|billion|M|mn|million|K|k|thousand)?/i);
  if (!m) return null;
  const raw = parseFloat(m[1]);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const unit = (m[2] || "").toLowerCase();
  let millions: number;
  if (unit === "b" || unit === "bn" || unit === "billion") millions = raw * 1000;
  else if (unit === "k" || unit === "thousand") millions = raw / 1000;
  else if (unit === "m" || unit === "mn" || unit === "million") millions = raw;
  else if (raw >= 1_000_000) millions = raw / 1_000_000;
  else if (raw >= 10_000) millions = raw / 1_000_000;
  else millions = raw / 1000;

  if (opts?.annualizeMrr) millions *= 12;
  return millions;
}

export function formatEurMillions(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value >= 100) return `€${Math.round(value)}M`;
  if (value >= 10) return `€${Math.round(value * 10) / 10}M`;
  if (value >= 1) return `€${Math.round(value * 100) / 100}M`;
  return `€${Math.round(value * 1000)}K`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Category rubric points only — no synthetic lerp curve. */
export function scoreHistoryFromCategories(
  finalScore: number,
  cat: CategoryScores,
): ScoreHistoryPoint[] {
  const pts: { label: string; v: number }[] = [];
  const add = (label: string, v: number | null) => {
    if (v != null && Number.isFinite(v)) pts.push({ label, v });
  };
  add("FIT", cat.problemSolutionFit);
  add("MKT", cat.marketOpportunity);
  add("TIME", cat.timingTrends);
  add("MODEL", cat.businessModel);
  add("EDGE", cat.competitiveEdge);
  add("TEAM", cat.teamExecution);
  if (pts.length === 0) {
    return [{ v: "FINAL", score: Math.round(finalScore) }];
  }
  const hist = pts.map((p) => ({ v: p.label, score: Math.round(p.v) }));
  hist.push({ v: "FINAL", score: Math.round(finalScore) });
  return hist;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * TAM/SAM/SOM endpoints + optional CAGR → year series (no arbitrary score-based curve).
 */
export function marketGrowthFromSizing(
  tam: string | null,
  sam: string | null,
  som: string | null,
  cagrPct: number | null,
): MarketGrowthPoint[] {
  const tamP = parseMoneyToken(tam);
  const samP = parseMoneyToken(sam);
  const somP = parseMoneyToken(som);
  if (!tamP && !samP && !somP) return [];

  const tamEndB = tamP?.scale === "B" ? tamP.n : tamP ? tamP.n / 1000 : samP ? (samP.scale === "B" ? samP.n * 3 : (samP.n / 1000) * 3) : 1;
  const samEndM = samP?.scale === "M" ? samP.n : samP ? samP.n * 1000 : Math.max(1, tamEndB * 1000 * 0.12);
  const somEndM = somP?.scale === "M" ? somP.n : somP ? somP.n * 1000 : Math.max(0.5, samEndM * 0.08);

  const startYear = new Date().getFullYear();
  const span = 6;
  const years = Array.from({ length: span }, (_, i) => String(startYear + i));
  const rate = cagrPct != null && cagrPct > 0 && cagrPct < 80 ? cagrPct / 100 : null;

  return years.map((year, i) => {
    const t = i / (span - 1);
    let tamB: number;
    let samM: number;
    let somM: number;
    if (rate != null) {
      const growthFromStart = Math.pow(1 + rate, i);
      const growthToEnd = Math.pow(1 + rate, span - 1);
      tamB = (tamEndB / growthToEnd) * growthFromStart;
      samM = (samEndM / growthToEnd) * growthFromStart;
      somM = (somEndM / growthToEnd) * growthFromStart;
    } else {
      tamB = tamEndB * (0.55 + t * 0.45);
      samM = samEndM * (0.55 + t * 0.45);
      somM = somEndM * (0.55 + t * 0.45);
    }
    return { year, tam: round1(tamB), sam: round1(samM), som: round1(somM) };
  });
}

const REVENUE_METRIC = /^(arr|annual recurring revenue|revenue|mrr|sales|income|gmv)\b/i;
const STREAM_METRIC = /(subscription|recurring|saas|services|hardware|product revenue|one.?time)/i;
const NON_REVENUE = /customer|user|team|headcount|burn|margin|paying teams/i;

function pickRevenueRow(rows: FinancialProjectionRow[]): FinancialProjectionRow | null {
  const candidates = rows.filter((r) => REVENUE_METRIC.test(r.metric) && !NON_REVENUE.test(r.metric));
  if (candidates.length === 0) return null;
  return (
    candidates.find((r) => /^arr\b/i.test(r.metric)) ??
    candidates.find((r) => /^revenue\b/i.test(r.metric)) ??
    candidates.find((r) => /^mrr\b/i.test(r.metric)) ??
    candidates[0]
  );
}

/** Build revenue bars only from explicit financial table rows — never invent Y4/Y5 or SOM ramps. */
export function revenueProjectionFromFinancialRows(rows: FinancialProjectionRow[]): RevenueChartBundle | null {
  const revRow = pickRevenueRow(rows);
  if (!revRow || revRow.years.length < 2) return null;
  const isMrr = /\bmrr\b/i.test(revRow.metric);

  const streamRow = rows.find(
    (r) => r !== revRow && STREAM_METRIC.test(r.metric) && !NON_REVENUE.test(r.metric),
  );
  const expansionRow = rows.find(
    (r) =>
      r !== revRow &&
      r !== streamRow &&
      /expansion|upsell|add.?on/i.test(r.metric) &&
      r.years.length >= revRow.years.length,
  );

  const totals = revRow.years
    .map((y) => {
      const total = parseMoneyToMillions(y.value, { annualizeMrr: isMrr });
      if (total == null || total <= 0) return null;
      const label = /year|y\s*\d/i.test(y.label) ? y.label.replace(/\s+/g, " ") : y.label;
      const year = /^y\d/i.test(label.trim()) ? label.trim().toUpperCase() : label.trim();
      return { year, total: round1(total), raw: y.value.trim() };
    })
    .filter((p): p is { year: string; total: number; raw: string } => p != null);

  if (totals.length < 2) return null;

  const points = totals.map((point, i) => {
    let subs = 0;
    let hardware = point.total;
    if (streamRow?.years[i]) {
      const stream = parseMoneyToMillions(streamRow.years[i].value, { annualizeMrr: /\bmrr\b/i.test(streamRow.metric) });
      if (stream != null && stream > 0 && stream <= point.total) {
        hardware = round1(stream);
        subs = round1(point.total - stream);
      }
    }
    if (expansionRow?.years[i]) {
      const exp = parseMoneyToMillions(expansionRow.years[i].value);
      if (exp != null && exp > 0) subs = round1(exp);
    }
    return { year: point.year, subs, hardware, total: point.total, raw: point.raw };
  });

  return {
    points,
    sourceMetric: isMrr ? `${revRow.metric} (annualized ×12)` : revRow.metric,
    isMrr,
  };
}

export function threatTractionScore(weakness: string, approach: string): number {
  const w = `${weakness} ${approach}`.toLowerCase();
  if (/\b(leader|dominant|incumbent|strong|high|84|90)\b/.test(w)) return clamp(78 + (w.length % 12), 72, 94);
  if (/\b(med|moderate|mid|growing|steady)\b/.test(w)) return clamp(52 + (w.length % 14), 48, 72);
  if (/\b(low|weak|limited|small|niche|pilot|no |lacks|poor)\b/.test(w)) return clamp(28 + (w.length % 16), 22, 48);
  return clamp(44 + (w.length % 20), 35, 65);
}

export function autonomyAxisScore(approach: string): number {
  const a = approach.toLowerCase();
  if (/\b(ai|autonom|platform|software|saas|api|ml)\b/.test(a)) return clamp(68 + (a.length % 18), 55, 88);
  if (/\b(hardware|fleet|vehicle|manual|ops|service)\b/.test(a)) return clamp(18 + (a.length % 14), 12, 38);
  return clamp(32 + Math.min(42, Math.round(a.length / 5)), 20, 72);
}

export function competitorScatterFromMatrix(
  matrix: CompetitorEntry[],
  yourViabilityScore: number,
): ScatterPoint[] {
  if (matrix.length === 0) return [{ x: 50, y: clamp(yourViabilityScore, 40, 94), name: "YOU", you: true }];
  const base = matrix.map((c) => ({
    x: autonomyAxisScore(c.approach),
    y: threatTractionScore(c.weakness, c.approach),
    name: c.name.length > 14 ? `${c.name.slice(0, 12)}…` : c.name,
  }));
  return [
    ...base,
    {
      x: clamp(86, 50, 92),
      y: clamp(Math.round(yourViabilityScore), 45, 94),
      name: "YOU",
      you: true,
    },
  ];
}

export type AudienceSegment = { name: string; value: number; color: string };

const AUDIENCE_PALETTE = ["#7dd3fc", "#0a0a0a", "#38bdf8", "#cfe9ff", "#9CFF6E", "#FF5C88"];

export function audienceSegmentsFromParsed(
  parsed: { name: string; share: number }[],
  fallbackLines: string[],
): AudienceSegment[] {
  if (parsed.length > 0) {
    const sum = parsed.reduce((a, s) => a + s.share, 0);
    const norm = sum > 0 && Math.abs(sum - 100) > 2 ? parsed.map((s) => ({ ...s, share: (s.share / sum) * 100 })) : parsed;
    return norm.slice(0, 4).map((s, i) => ({
      name: s.name.slice(0, 42),
      value: Math.round(s.share),
      color: AUDIENCE_PALETTE[i % AUDIENCE_PALETTE.length],
    }));
  }
  const lines = fallbackLines.filter(Boolean).slice(0, 4);
  if (lines.length === 0) return [{ name: "Buyer segment not specified", value: 100, color: AUDIENCE_PALETTE[0] }];
  const even = Math.round(100 / lines.length);
  const remainder = 100 - even * (lines.length - 1);
  return lines.map((name, i) => ({
    name: name.slice(0, 42),
    value: i === lines.length - 1 ? remainder : even,
    color: AUDIENCE_PALETTE[i % AUDIENCE_PALETTE.length],
  }));
}
