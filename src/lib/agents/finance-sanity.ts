import { parseMoneyToMillions } from "@/lib/chart-data";
import { extractDashboardData } from "@/lib/parse";
import type { DebateSetup } from "@/lib/types";

export type FinanceSanitySeverity = "info" | "warn" | "fail";

export type FinanceSanityIssue = {
  severity: FinanceSanitySeverity;
  code: string;
  message: string;
  fix: string;
};

export type FinanceSanityAudit = {
  passed: boolean;
  score: number;
  issues: FinanceSanityIssue[];
  repairBrief: string;
};

type YearSeries = { label: string; raw: string; value: number }[];

const MONEY_RE = /[$€£]?\s*([\d,.]+)\s*(B|bn|billion|M|mn|million|K|k|thousand)?/i;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function parseMoneyDollars(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(MONEY_RE);
  if (!match) return null;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw)) return null;
  const unit = (match[2] || "").toLowerCase();
  if (unit === "b" || unit === "bn" || unit === "billion") return raw * 1_000_000_000;
  if (unit === "m" || unit === "mn" || unit === "million") return raw * 1_000_000;
  if (unit === "k" || unit === "thousand") return raw * 1_000;
  return raw;
}

function parsePercent(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = parseNumber(value);
  if (n == null) return null;
  return n > 1 ? n / 100 : n;
}

function parseRatio(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+(?:\.\d+)?)\s*:?\s*1?/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function parseBreakEvenMrrMillions(value: string | null | undefined): number | null {
  if (!value) return null;
  const explicitMrr = value.match(/[$€£]\s*[\d,.]+\s*(?:B|bn|billion|M|mn|million|K|k|thousand)?\s*MRR/i);
  const money = explicitMrr?.[0] ?? value.match(/[$€£]\s*[\d,.]+\s*(?:B|bn|billion|M|mn|million|K|k|thousand)?/i)?.[0];
  return money ? parseMoneyToMillions(money) : null;
}

function findSeries(report: string, metricPattern: RegExp, asMoney = false): YearSeries {
  const rows = extractDashboardData(report).financialProjections;
  const row = rows.find((r) => metricPattern.test(r.metric));
  if (!row) return [];

  return row.years
    .map((year) => {
      const value = asMoney ? parseMoneyToMillions(year.value) : parseNumber(year.value);
      return value == null ? null : { label: year.label, raw: year.value, value };
    })
    .filter((year): year is YearSeries[number] => year != null);
}

function hasFounderTraction(setup: Pick<DebateSetup, "position" | "context">): boolean {
  const text = `${setup.position}\n${setup.context}`.toLowerCase();
  return /\b(paying customers?|revenue|mrr|arr|loi|letter of intent|signed|contract|pilot customers?|active users?|waitlist|preorder|pre-order|beta users?)\b/.test(
    text,
  );
}

function addIssue(
  issues: FinanceSanityIssue[],
  severity: FinanceSanitySeverity,
  code: string,
  message: string,
  fix: string,
): void {
  issues.push({ severity, code, message, fix });
}

function pctDelta(a: number, b: number): number {
  return Math.abs(a - b) / Math.max(Math.abs(b), 0.000001);
}

function formatMoneyM(millions: number): string {
  if (millions >= 1) return `$${Math.round(millions * 10) / 10}M`;
  return `$${Math.round(millions * 1000)}K`;
}

export function auditFinanceSanity(
  setup: Pick<DebateSetup, "topic" | "position" | "context">,
  report: string,
): FinanceSanityAudit {
  const dm = extractDashboardData(report);
  const issues: FinanceSanityIssue[] = [];
  const hasTraction = hasFounderTraction(setup);

  const customers = findSeries(report, /^(paying\s+)?(customers|users|accounts|teams|clients)\b/i);
  const arr = findSeries(report, /^(arr|annual recurring revenue|revenue)\b/i, true);
  const mrr = findSeries(report, /^mrr\b/i, true);
  const burn = findSeries(report, /monthly burn/i, true);
  const grossMargin = findSeries(report, /gross margin/i);

  if (dm.financialProjections.length === 0) {
    addIssue(
      issues,
      "fail",
      "missing_financial_table",
      "Financial projection table could not be parsed.",
      "Regenerate the financial block with the exact Metric | Year 1 | Year 2 | Year 3 table.",
    );
  }

  if (arr.length < 2) {
    addIssue(
      issues,
      "fail",
      "missing_arr",
      "ARR/revenue series is missing or too thin for charts and sanity checks.",
      "Include an ARR row with Year 1, Year 2, and Year 3 values using K/M suffixes.",
    );
  }

  for (let i = 0; i < Math.min(arr.length, mrr.length); i++) {
    const annualizedMrr = mrr[i].value * 12;
    if (pctDelta(annualizedMrr, arr[i].value) > 0.2) {
      addIssue(
        issues,
        "fail",
        "arr_mrr_mismatch",
        `${arr[i].label}: MRR annualizes to ${formatMoneyM(annualizedMrr)}, but ARR is ${arr[i].raw}.`,
        "Revise ARR or MRR so MRR x 12 is within 15-20% of ARR.",
      );
    }
  }

  const arpu = parseMoneyDollars(dm.unitEconomics.arpu);
  if (arpu != null && arpu > 0 && customers.length > 0 && arr.length > 0) {
    for (let i = 0; i < Math.min(customers.length, arr.length); i++) {
      const expectedArrM = (customers[i].value * arpu * 12) / 1_000_000;
      if (expectedArrM > 0 && pctDelta(arr[i].value, expectedArrM) > 0.35) {
        addIssue(
          issues,
          "fail",
          "customer_arpu_arr_mismatch",
          `${arr[i].label}: ${Math.round(customers[i].value)} customers at $${Math.round(arpu)}/mo implies ${formatMoneyM(expectedArrM)} ARR, not ${arr[i].raw}.`,
          "Align paying customers, ARPU, and ARR, or explicitly state a non-subscription pricing model.",
        );
      }
    }
  }

  const cac = parseMoneyDollars(dm.unitEconomics.cac);
  const ltv = parseMoneyDollars(dm.unitEconomics.ltv);
  const ratio = parseRatio(dm.unitEconomics.ltvCacRatio);
  const churn = parsePercent(dm.unitEconomics.churnRate);
  const unitGrossMargin = parsePercent(dm.unitEconomics.grossMargin);
  const margin = unitGrossMargin ?? (grossMargin[0]?.value != null ? grossMargin[0].value / 100 : null);

  if (cac != null && ltv != null && cac > 0) {
    const expectedRatio = ltv / cac;
    if (ratio != null && Math.abs(ratio - expectedRatio) > 1) {
      addIssue(
        issues,
        "warn",
        "ltv_cac_ratio_mismatch",
        `Reported LTV:CAC is ${ratio}:1, but LTV/CAC math implies ${Math.round(expectedRatio * 10) / 10}:1.`,
        "Recalculate LTV:CAC from the stated CAC and LTV.",
      );
    }
    if (!hasTraction && expectedRatio > 5) {
      addIssue(
        issues,
        "fail",
        "unproven_ltv_cac_too_high",
        `LTV:CAC of ${Math.round(expectedRatio * 10) / 10}:1 is too optimistic for an unvalidated idea.`,
        "Use a conservative base case at or below 3-5:1 unless founder traction proves otherwise.",
      );
    }
  }

  if (arpu != null && ltv != null && churn != null && margin != null && churn > 0) {
    const expectedLtv = (arpu * margin) / churn;
    if (pctDelta(ltv, expectedLtv) > 0.35) {
      addIssue(
        issues,
        "warn",
        "ltv_formula_mismatch",
        `LTV should be about $${Math.round(expectedLtv)} from ARPU x gross margin / monthly churn, but report says $${Math.round(ltv)}.`,
        "Recompute LTV from ARPU, gross margin, and monthly churn.",
      );
    }
  }

  if (!hasTraction && arr.length >= 3) {
    const year3Arr = arr[2].value;
    const lowerTopic = `${setup.topic} ${setup.position}`.toLowerCase();
    const likelyConsumer = /\b(consumer|b2c|personal|families|students|creator|fitness|wellness)\b/.test(lowerTopic);
    const likelyEnterprise = /\b(enterprise|mid-market|compliance|security|fintech|healthcare|bank|insurance)\b/.test(
      lowerTopic,
    );
    const capM = likelyConsumer ? 1.5 : likelyEnterprise ? 6 : 3;
    if (year3Arr > capM) {
      addIssue(
        issues,
        "fail",
        "unproven_year3_arr_cap",
        `Year 3 ARR of ${arr[2].raw} exceeds the conservative ${formatMoneyM(capM)} base-case cap for an unvalidated idea.`,
        "Lower Year 3 ARR or add explicit distribution capacity, signed demand, or conversion proof.",
      );
    }
  }

  if (arr.length >= 3 && arr[0].value > 0) {
    const growthMultiple = arr[2].value / arr[0].value;
    if (growthMultiple > 20 && !hasTraction) {
      addIssue(
        issues,
        "warn",
        "hockey_stick_growth",
        `Revenue grows ${Math.round(growthMultiple)}x from Year 1 to Year 3 without founder traction proof.`,
        "Add a sales/channel capacity bridge or reduce the Year 3 customer count.",
      );
    }
  }

  const latestBurn = burn[burn.length - 1]?.value ?? burn[0]?.value;
  const latestMargin = margin ?? (grossMargin[grossMargin.length - 1]?.value != null ? grossMargin[grossMargin.length - 1].value / 100 : null);
  if (latestBurn != null && latestMargin != null && latestMargin > 0 && dm.breakEven.point) {
    const breakEvenMrr = parseBreakEvenMrrMillions(dm.breakEven.point);
    if (breakEvenMrr != null) {
      const requiredMrr = latestBurn / latestMargin;
      if (pctDelta(breakEvenMrr, requiredMrr) > 0.4) {
        addIssue(
          issues,
          "warn",
          "break_even_mrr_mismatch",
          `Break-even MRR appears to be ${formatMoneyM(breakEvenMrr)}, but burn/gross margin implies about ${formatMoneyM(requiredMrr)} MRR.`,
          "Recalculate break-even from monthly burn divided by gross margin.",
        );
      }
    }
  }

  const gmRow = dm.financialProjections.find((row) => /^gmv\b/i.test(row.metric));
  const revenueRow = dm.financialProjections.find((row) => /^(arr|revenue)\b/i.test(row.metric));
  if (gmRow && revenueRow) {
    addIssue(
      issues,
      "info",
      "gmv_revenue_separation",
      "Marketplace-style model includes GMV and revenue rows.",
      "Confirm charts use net revenue / take-rate revenue, not GMV.",
    );
  }

  const penalty = issues.reduce((sum, issue) => {
    if (issue.severity === "fail") return sum + 22;
    if (issue.severity === "warn") return sum + 10;
    return sum + 2;
  }, 0);
  const score = clamp(100 - penalty, 0, 100);
  const failed = issues.some((issue) => issue.severity === "fail");
  const repairBrief =
    issues.length === 0
      ? "Finance sanity audit passed."
      : issues
          .map((issue, index) => `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message} Fix: ${issue.fix}`)
          .join("\n");

  return {
    passed: !failed,
    score,
    issues,
    repairBrief,
  };
}

export function insertFinanceSanityCheck(report: string, audit: FinanceSanityAudit): string {
  const existingPattern = /\n### Finance Sanity Check[\s\S]*?(?=\n### |\n---\n|$)/i;
  const status = audit.passed ? "PASS" : "REPAIR REQUIRED";
  const topIssues = audit.issues
    .filter((issue) => issue.severity !== "info")
    .slice(0, 5)
    .map((issue) => `- **${issue.severity.toUpperCase()}:** ${issue.message} ${issue.fix}`)
    .join("\n");
  const body = [
    "### Finance Sanity Check",
    `- **Status:** ${status} (${audit.score}/100)`,
    topIssues || "- **Status detail:** No hard math contradictions detected.",
  ].join("\n");

  const withoutExisting = report.replace(existingPattern, "");
  const insertBefore = withoutExisting.search(/\n### Go\/No-Go Recommendation/i);
  if (insertBefore >= 0) {
    return `${withoutExisting.slice(0, insertBefore).trimEnd()}\n\n${body}\n${withoutExisting.slice(insertBefore)}`;
  }
  return `${withoutExisting.trimEnd()}\n\n${body}`;
}
