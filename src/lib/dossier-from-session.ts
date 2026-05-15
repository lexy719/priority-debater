import { exampleDossier, type DossierPersona, type DossierRisk, type DossierScore, type ExampleDossier, type Verdict } from "@/lib/example-dossier";
import { classifyIdeaCategory } from "@/lib/idea-category";
import { cleanMarkdownText, extractDashboardData, type CategoryScores } from "@/lib/parse";
import { panelSlugFromPersonaName, type PanelPersonaSlug } from "@/lib/personas/personality-profiles";
import { scoreToGoNoGoType } from "@/lib/scoring-scale";
import type { ValidationSession } from "@/lib/types";

const PERSONA_SCORE_KEYS: Record<PanelPersonaSlug, (keyof CategoryScores)[]> = {
  investor: ["businessModel", "marketOpportunity", "timingTrends"],
  customer: ["problemSolutionFit", "businessModel"],
  operator: ["teamExecution", "businessModel", "problemSolutionFit"],
  adversary: ["competitiveEdge", "problemSolutionFit", "marketOpportunity"],
  mentor: ["problemSolutionFit", "teamExecution", "timingTrends"],
};

function avgCategory(cat: CategoryScores, keys: (keyof CategoryScores)[]): number | null {
  const vals = keys.map((k) => cat[k]).filter((v): v is number => v != null && Number.isFinite(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function verdictFromPersonaScore(s: number): Verdict {
  if (s >= 72) return "GO";
  if (s < 52) return "NO-GO";
  return "CAUTION";
}

function pullQuoteForVerdict(v: Verdict): string {
  if (v === "GO") return "Enough signal to sharpen the wedge.";
  if (v === "NO-GO") return "Kill shots still on the table.";
  return "Worth probing before you romanticize traction.";
}

function personasFromSession(
  session: ValidationSession,
  cat: CategoryScores,
  headlineScore: number,
  briefSnippet: string,
): DossierPersona[] {
  return exampleDossier.personas.map((template) => {
    const slug = panelSlugFromPersonaName(template.persona);
    const personaScore = avgCategory(cat, PERSONA_SCORE_KEYS[slug]) ?? headlineScore;
    const rounded = Math.round(personaScore);
    const verdict = verdictFromPersonaScore(rounded);

    const chat = session.interviewChats?.[slug];
    const lastPanel = [...(chat ?? [])].reverse().find((m) => m.role === "opponent")?.content?.trim();
    const quoteBody = lastPanel || briefSnippet.slice(0, 420);

    return {
      ...template,
      verdict,
      confidence: Math.min(0.94, Math.max(0.48, rounded / 100)),
      quote: lastPanel
        ? `${template.archetype} on your filing:\n"${cleanMarkdownText(quoteBody).slice(0, 480)}${quoteBody.length > 480 ? "…" : ""}"`
        : `${template.archetype} read on your filing:\n"${briefSnippet.slice(0, 420)}${briefSnippet.length > 420 ? "…" : ""}"\n\nScores: ${rounded}/100 on their rubric dimensions.`,
      pullQuote: pullQuoteForVerdict(verdict),
    };
  });
}

/** Map streamed markdown + brief into the dashboard dossier shape. */
export function dossierFromSession(session: ValidationSession): ExampleDossier {
  const dm = extractDashboardData(session.validationContent);
  const score = dm.score ?? 55;
  const scoreGoNoGoType = scoreToGoNoGoType(score);
  const v: Verdict =
    scoreGoNoGoType === "go" ? "GO" : scoreGoNoGoType === "nogo" ? "NO-GO" : "CAUTION";

  const brief = `${session.setup.topic}\n${session.setup.position}`;

  const cat = dm.categoryScores;
  const dims: Array<{ label: string; score: number | null; filler: string }> = [
    { label: "Problem fit", score: cat.problemSolutionFit, filler: dm.problemSolution?.slice(0, 420) ?? "—" },
    { label: "Market pull", score: cat.marketOpportunity, filler: dm.marketSummary?.slice(0, 420) ?? "—" },
    { label: "Timing", score: cat.timingTrends, filler: dm.marketSummary?.slice(0, 240) ?? "—" },
    { label: "Business model", score: cat.businessModel, filler: dm.businessModel?.slice(0, 420) ?? "—" },
    { label: "Competition", score: cat.competitiveEdge, filler: dm.competitiveSummary?.slice(0, 420) ?? "—" },
    { label: "Execution edge", score: cat.teamExecution, filler: session.setup.context?.slice(0, 420) ?? "—" },
  ];

  const scores: DossierScore[] = dims.map((row) => ({
    label: row.label,
    score: typeof row.score === "number" && Number.isFinite(row.score) ? Math.round(row.score) : Math.max(35, score - 6),
    note: row.filler.trim() || `Derived from streamed report · headline ${score}/100.`,
  }));

  const riskTitles = dm.risks.length > 0 ? dm.risks : ["Evidence gaps flagged in dossier · open each assumption with customers."];
  const risks: DossierRisk[] = riskTitles.slice(0, 8).map((title, idx) => ({
    id: String(idx + 1).padStart(2, "0"),
    title: title.replace(/^\d+\.\s*/, "").slice(0, 220),
    severity: idx === 0 ? "HIGH" : idx < 3 ? ("MED" as const) : ("LOW" as const),
    evidenceGap: 0.42,
    nextStep: "Validate with signal, not opinion · see Top 5 list in dossier.",
  }));

  const nextActions = dm.recommendations.slice(0, 5).map((text, idx) => ({
    id: String(idx + 1).padStart(2, "0"),
    text: text.replace(/^\d+\.\s*/, "").slice(0, 220),
    eta: `${4 + idx * 2}w`,
  }));

  const padActions =
    nextActions.length > 0
      ? nextActions
      : [
          {
            id: "01",
            text: "Re-read risks in dossier · pick falsifiable tests for week one.",
            eta: "4w",
          },
        ];

  const caseLabel = () => {
    try {
      return `Live · ${new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(session.createdAt))}`;
    } catch {
      return "Live dossier";
    }
  };

  return {
    caseId: caseLabel(),
    title: session.setup.topic.slice(0, 280),
    oneLiner: dm.summary?.trim() ?? session.setup.topic,
    date: "",
    time: "",
    verdict: v,
    score,
    thesis: dm.verdict?.trim().slice(0, 420) ?? dm.summary?.trim().slice(0, 320) ?? session.setup.position.slice(0, 240),
    recommendation: dm.goNoGo?.trim().slice(0, 500) ?? dm.recommendations[0]?.slice(0, 500) ?? session.setup.topic,
    scores,
    personas: personasFromSession(session, cat, score, brief),
    risks,
    nextActions: padActions,
  };
}

export function sessionMatchesDossierShape(session: ValidationSession | null | undefined): session is ValidationSession {
  return !!(session?.setup?.topic?.trim() && session.validationContent?.trim().length && session.createdAt);
}

/** Category ref for persisted session parity with streaming UI */
export function ideaCategoryFromSetup(session: ValidationSession): NonNullable<ValidationSession["ideaCategory"]> | undefined {
  const c = classifyIdeaCategory(session.setup.topic, session.setup.position);
  return { id: c.id, label: c.label };
}
