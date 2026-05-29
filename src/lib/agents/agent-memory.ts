import { promises as fs } from "node:fs";
import path from "node:path";
import { classifyIdeaCategory } from "@/lib/idea-category";
import { extractDashboardData, listCategoryScoreValues } from "@/lib/parse";
import type { DebateSetup } from "@/lib/types";

type MemoryScores = {
  viability: number | null;
  minCategory: number | null;
  meanCategory: number | null;
};

type AgentMemoryEntry = {
  id: string;
  createdAt: string;
  topic: string;
  verticalId: string;
  verticalLabel: string;
  tokens: string[];
  scores: MemoryScores;
  verdict: string | null;
  risks: string[];
  assumptions: string[];
  finance: {
    revenueHeadline: string | null;
    unitEconomics: string[];
    breakEven: string[];
  };
};

type AgentMemoryStore = {
  version: 1;
  entries: AgentMemoryEntry[];
};

const MAX_ENTRIES = 250;
const MAX_CONTEXT_MATCHES = 5;
const STOP_WORDS = new Set([
  "about",
  "after",
  "against",
  "also",
  "and",
  "are",
  "business",
  "for",
  "from",
  "have",
  "idea",
  "into",
  "that",
  "the",
  "their",
  "this",
  "with",
  "would",
]);

function memoryPath(): string {
  return process.env.AGENT_MEMORY_PATH?.trim() || path.join(process.cwd(), ".agent-memory", "idea-learnings.json");
}

function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function tokenize(...parts: string[]): string[] {
  const tokens = parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  return Array.from(new Set(tokens)).slice(0, 80);
}

async function readStore(): Promise<AgentMemoryStore> {
  try {
    const raw = await fs.readFile(memoryPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<AgentMemoryStore>;
    return { version: 1, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch {
    return { version: 1, entries: [] };
  }
}

async function writeStore(store: AgentMemoryStore): Promise<void> {
  const file = memoryPath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function pickLines(text: string | null | undefined, maxItems: number): string[] {
  if (!text) return [];
  return text
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*]|\d+\.)\s*/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter((line) => line.length > 12)
    .slice(0, maxItems);
}

function similarity(queryTokens: string[], entry: AgentMemoryEntry): number {
  const query = new Set(queryTokens);
  const prior = new Set(entry.tokens);
  const overlap = [...query].filter((token) => prior.has(token)).length;
  const verticalBoost = query.has(entry.verticalId) ? 0.15 : 0;
  return overlap / Math.max(8, Math.min(query.size, prior.size)) + verticalBoost;
}

export async function buildAgentLearningContext(setup: Pick<DebateSetup, "topic" | "position" | "context">): Promise<string> {
  const ideaCat = classifyIdeaCategory(setup.topic, setup.position);
  const queryTokens = tokenize(setup.topic, setup.position, setup.context, ideaCat.id);
  const store = await readStore();
  const matches = store.entries
    .map((entry) => ({ entry, score: similarity(queryTokens, entry) }))
    .filter((match) => match.score >= 0.18)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_MATCHES)
    .map((match) => match.entry);

  if (matches.length === 0) {
    return `### Agent Learning Context
No prior similar idea tests found in local memory. Treat this as unvalidated: use conservative base-case financials and require proof before GO.`;
  }

  const lines = matches.map((entry, index) => {
    const scoreText =
      entry.scores.viability == null
        ? "score unavailable"
        : `${entry.scores.viability}/100 viability; category floor ${entry.scores.minCategory ?? "n/a"}`;
    const risks = entry.risks.slice(0, 2).join(" | ") || "No stored risk pattern.";
    const assumptions = entry.assumptions.slice(0, 2).join(" | ") || "No stored assumption pattern.";
    const finance = entry.finance.revenueHeadline || entry.finance.unitEconomics[0] || "No stored finance pattern.";
    return `${index + 1}. Prior ${entry.verticalLabel} idea "${entry.topic.slice(0, 90)}": ${scoreText}. Risks: ${risks}. Assumptions: ${assumptions}. Finance: ${finance}`;
  });

  return `### Agent Learning Context
Use these local prior test patterns as calibration, not as facts about the new idea.
${lines.join("\n")}

Calibration rule: if this idea repeats an unresolved prior risk, keep the relevant score at or below the prior score until the founder supplies stronger proof.`;
}

export async function recordValidationLearning(
  setup: Pick<DebateSetup, "topic" | "position" | "context">,
  report: string,
): Promise<void> {
  if (process.env.AGENT_MEMORY_DISABLED === "1" || report.length < 500) return;

  const parsed = extractDashboardData(report);
  const categoryValues = listCategoryScoreValues(parsed.categoryScores);
  const meanCategory =
    categoryValues.length > 0
      ? Math.round((categoryValues.reduce((sum, score) => sum + score, 0) / categoryValues.length) * 10) / 10
      : null;
  const minCategory = categoryValues.length > 0 ? Math.min(...categoryValues) : null;
  const ideaCat = classifyIdeaCategory(setup.topic, setup.position);
  const id = simpleHash(`${setup.topic}|${setup.position}|${setup.context}`);

  const revenueRow = parsed.financialProjections.find((row) => /\b(arr|revenue|mrr)\b/i.test(row.metric));
  const revenueHeadline = revenueRow
    ? `${revenueRow.metric}: ${revenueRow.years.map((year) => `${year.label} ${year.value}`).join(", ")}`
    : null;

  const entry: AgentMemoryEntry = {
    id,
    createdAt: new Date().toISOString(),
    topic: setup.topic.slice(0, 180),
    verticalId: ideaCat.id,
    verticalLabel: ideaCat.label,
    tokens: tokenize(setup.topic, setup.position, setup.context, ideaCat.id, ideaCat.label),
    scores: {
      viability: parsed.score,
      minCategory,
      meanCategory,
    },
    verdict: parsed.goNoGoType ?? null,
    risks: pickLines(parsed.risks.join("\n"), 4),
    assumptions: pickLines(parsed.keyAssumptions, 4),
    finance: {
      revenueHeadline,
      unitEconomics: pickLines(
        [
          parsed.unitEconomics.cac ? `CAC ${parsed.unitEconomics.cac}` : "",
          parsed.unitEconomics.ltv ? `LTV ${parsed.unitEconomics.ltv}` : "",
          parsed.unitEconomics.ltvCacRatio ? `LTV:CAC ${parsed.unitEconomics.ltvCacRatio}` : "",
          parsed.unitEconomics.paybackPeriod ? `Payback ${parsed.unitEconomics.paybackPeriod}` : "",
        ].join("\n"),
        4,
      ),
      breakEven: pickLines(
        [
          parsed.breakEven.point ? `Break-even ${parsed.breakEven.point}` : "",
          parsed.breakEven.timeline ? `Timeline ${parsed.breakEven.timeline}` : "",
          parsed.breakEven.fundingNeed ? `Funding ${parsed.breakEven.fundingNeed}` : "",
        ].join("\n"),
        3,
      ),
    },
  };

  const store = await readStore();
  const entries = [entry, ...store.entries.filter((item) => item.id !== id)].slice(0, MAX_ENTRIES);
  await writeStore({ version: 1, entries });
}
