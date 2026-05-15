import {
  FINANCE_ANALYST_ROLE,
  FINANCIAL_OUTPUT_CONTRACT,
} from "@/lib/agents/finance-analyst";
import { revenueProjectionFromFinancialRows } from "@/lib/chart-data";
import { extractDashboardData } from "@/lib/parse";
import type { DebateSetup } from "@/lib/types";
import type OpenAI from "openai";

export const FINANCE_PASS_SYSTEM_PROMPT = `You are **The Finance Analyst** — a dedicated second-pass specialist on startup validation reports.

${FINANCE_ANALYST_ROLE}

You receive a draft report. Your ONLY job is to output three replacement sections with numbers that are:
- Internally consistent (customers × ARPU × 12 ≈ ARR, LTV math shown, burn × runway ≈ funding)
- Aligned with the idea's business model and market sizing from the draft
- Formatted exactly for the parser contract below

Output **ONLY** these sections — no preamble, no other headers:

${FINANCIAL_OUTPUT_CONTRACT}`;

export function buildFinancePassUserPrompt(setup: DebateSetup, report: string): string {
  const excerpt = report.length > 18_000 ? report.slice(-18_000) : report;
  return `Rewrite the **financial block** for this validation report. Your output will **replace** the existing ### Financial Projections, ### Unit Economics, and ### Break-Even Analysis sections.

**Idea:** ${setup.topic}

**Founder reasoning:**
${setup.position}

${setup.context ? `**Context:**\n${setup.context}\n` : ""}
Use pricing, TAM/SAM/SOM, and business model from the draft below. Do **not** change category scores or viability — only financial sections.

--- DRAFT REPORT (for context) ---
${excerpt}`;
}

/** Insert or replace the three financial ### sections in a validation report. */
export function mergeFinancialSectionsIntoReport(report: string, financeBlock: string): string {
  const trimmed = financeBlock.trim();
  if (!/###\s*Financial Projections/i.test(trimmed)) return report;

  const blockPattern =
    /### Financial Projections[\s\S]*?(?=\n### (?:Go\/No-Go|Top 5 Validation Steps Before Building|Lean Canvas|One-Line Verdict|Key Assumptions to Validate)|\n---\s*\n\*\*Then add|$)/i;

  if (blockPattern.test(report)) {
    return report.replace(blockPattern, `${trimmed}\n\n`);
  }

  const insertBefore = [
    "### Go/No-Go Recommendation",
    "### Top 5 Validation Steps Before Building",
    "### Lean Canvas",
    "### One-Line Verdict",
  ];
  for (const header of insertBefore) {
    const idx = report.search(new RegExp(`\n${header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i"));
    if (idx >= 0) {
      return `${report.slice(0, idx)}\n\n${trimmed}\n${report.slice(idx)}`;
    }
  }

  return `${report}\n\n${trimmed}`;
}

/** True when charts would be empty or ARR series is too thin — always run pass for validate anyway. */
export function financialChartsUnderSpecified(report: string): boolean {
  const dm = extractDashboardData(report);
  const bundle = revenueProjectionFromFinancialRows(dm.financialProjections);
  if (!bundle) return true;
  if (bundle.points.length < 2) return true;
  if (!bundle.points.some((p) => p.total > 0)) return true;
  const hasArrRow = dm.financialProjections.some((r) => /\barr\b/i.test(r.metric));
  return !hasArrRow;
}

export async function runFinanceEnrichmentPass(
  openai: OpenAI,
  setup: DebateSetup,
  report: string,
  seed: number,
): Promise<string | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: FINANCE_PASS_SYSTEM_PROMPT },
      { role: "user", content: buildFinancePassUserPrompt(setup, report) },
    ],
    temperature: 0.1,
    seed,
    max_completion_tokens: 2800,
  });

  const financeBlock = completion.choices[0]?.message?.content?.trim();
  if (!financeBlock) return null;

  const merged = mergeFinancialSectionsIntoReport(report, financeBlock);
  return merged === report ? null : merged;
}
