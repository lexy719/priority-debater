/**
 * Chamber grounding — turns the audited validation report (dashboardData) into
 * a compact evidence brief the five persona agents can attack FROM. This is how
 * the Chamber stops being a clever improv act and starts citing the founder's
 * REAL competitors, risks, market numbers and weakest categories.
 *
 * Built client-side from the session's dashboardData (no extra model call), then
 * passed to /api/chamber/* and injected into each agent's user prompt. The module
 * is pure TS (no server-only imports) so both sides can use it.
 */

import type { DashboardData } from "@/lib/types";

export interface ChamberGrounding {
  /** Audited viability score, 0-100. Seeds survival + pressure. */
  score?: number;
  verdict?: string;
  /** Real competitors surfaced by the report. */
  competitors?: { name: string; focus?: string; weakness?: string }[];
  /** Risk titles the report already flagged. */
  risks?: string[];
  /** Market sizing strings. */
  market?: { tam?: string; sam?: string; som?: string };
  /** SWOT weaknesses — the panel's best ammunition. */
  weaknesses?: string[];
  /** Weakest rubric rows (label + score) — where the idea is thinnest. */
  weakestAxes?: { label: string; score: number }[];
}

/** Build grounding from the session dashboardData. Returns null when nothing useful exists. */
export function groundingFromDashboard(d?: DashboardData | null): ChamberGrounding | null {
  if (!d) return null;
  const competitors = (d.competition?.competitors ?? [])
    .slice(0, 5)
    .map((c) => ({ name: c.name, focus: c.focus, weakness: c.weakness }))
    .filter((c) => c.name);
  const risks = (d.risk?.breakdown ?? [])
    .slice(0, 6)
    .map((r) => (r.title ? `${r.title}${r.severity ? ` (${r.severity})` : ""}` : ""))
    .filter(Boolean);
  const weaknesses = (d.swot?.weaknesses ?? []).slice(0, 5).filter(Boolean);
  const weakestAxes = Object.entries(d.categoryScores ?? {})
    .map(([key, score]) => ({ label: prettyAxis(key), score: Number(score) || 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const g: ChamberGrounding = {
    score: typeof d.score === "number" ? d.score : undefined,
    verdict: d.verdict,
    competitors: competitors.length ? competitors : undefined,
    risks: risks.length ? risks : undefined,
    market: d.market ? { tam: d.market.tam, sam: d.market.sam, som: d.market.som } : undefined,
    weaknesses: weaknesses.length ? weaknesses : undefined,
    weakestAxes: weakestAxes.length ? weakestAxes : undefined,
  };
  // Nothing worth sending? signal absence.
  const hasContent = g.competitors || g.risks || g.weaknesses || g.market || typeof g.score === "number";
  return hasContent ? g : null;
}

function prettyAxis(key: string): string {
  const map: Record<string, string> = {
    problemSolutionFit: "Problem-Solution Fit",
    marketOpportunity: "Market Opportunity",
    competitiveEdge: "Competitive Edge",
    businessModel: "Business Model",
    teamExecution: "Team & Execution",
    timingTrends: "Timing & Trends",
  };
  return map[key] ?? key;
}

/** Clamp + coerce an untrusted grounding payload arriving at an API route. */
export function sanitizeGrounding(input: unknown): ChamberGrounding | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  const str = (v: unknown, n: number) => String(v ?? "").slice(0, n).trim();
  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

  const g: ChamberGrounding = {
    score: typeof o.score === "number" && o.score >= 0 && o.score <= 100 ? o.score : undefined,
    verdict: o.verdict ? str(o.verdict, 24) : undefined,
    competitors: arr<Record<string, unknown>>(o.competitors)
      .slice(0, 5)
      .map((c) => ({ name: str(c?.name, 80), focus: str(c?.focus, 120) || undefined, weakness: str(c?.weakness, 160) || undefined }))
      .filter((c) => c.name),
    risks: arr<unknown>(o.risks).slice(0, 6).map((r) => str(r, 160)).filter(Boolean),
    weaknesses: arr<unknown>(o.weaknesses).slice(0, 5).map((w) => str(w, 160)).filter(Boolean),
    weakestAxes: arr<Record<string, unknown>>(o.weakestAxes)
      .slice(0, 3)
      .map((a) => ({ label: str(a?.label, 60), score: Math.max(0, Math.min(100, Number(a?.score) || 0)) }))
      .filter((a) => a.label),
    market:
      o.market && typeof o.market === "object"
        ? {
            tam: str((o.market as Record<string, unknown>).tam, 40) || undefined,
            sam: str((o.market as Record<string, unknown>).sam, 40) || undefined,
            som: str((o.market as Record<string, unknown>).som, 40) || undefined,
          }
        : undefined,
  };
  const hasContent =
    (g.competitors && g.competitors.length) ||
    (g.risks && g.risks.length) ||
    (g.weaknesses && g.weaknesses.length) ||
    g.market ||
    typeof g.score === "number";
  return hasContent ? g : null;
}

/** Render grounding into a prompt block the persona agents attack from. */
export function formatGrounding(g: ChamberGrounding | null): string {
  if (!g) return "";
  const lines: string[] = ["", "AUDITED REPORT ON THIS IDEA — attack from these REAL findings, never invent counter-facts:"];
  if (typeof g.score === "number") lines.push(`- Viability score: ${g.score}/100${g.verdict ? ` (${g.verdict})` : ""}.`);
  if (g.weakestAxes?.length) lines.push(`- Weakest scored axes: ${g.weakestAxes.map((a) => `${a.label} ${a.score}/100`).join(", ")}.`);
  if (g.competitors?.length) {
    lines.push("- Known competitors (name them, force a differentiation answer):");
    for (const c of g.competitors) lines.push(`    • ${c.name}${c.focus ? ` — ${c.focus}` : ""}${c.weakness ? ` (gap: ${c.weakness})` : ""}`);
  }
  if (g.market && (g.market.tam || g.market.sam || g.market.som)) {
    lines.push(`- Market sizing on record: TAM ${g.market.tam ?? "?"} / SAM ${g.market.sam ?? "?"} / SOM ${g.market.som ?? "?"}. Pressure-test the reachable wedge, not the headline TAM.`);
  }
  if (g.risks?.length) lines.push(`- Flagged risks: ${g.risks.join("; ")}.`);
  if (g.weaknesses?.length) lines.push(`- Known weaknesses: ${g.weaknesses.join("; ")}.`);
  lines.push("Use these specifics where they fit YOUR axis. Make the founder defend against the real landscape, not a generic one.");
  return lines.join("\n");
}
