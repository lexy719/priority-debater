import type { DashboardViewModel } from "@/lib/dashboard-view-model";

/** Matches `deck` entries in `studioData.ts`. */
export type DeckSlide = {
  no: string;
  kicker: string;
  title: string;
  body: string;
  stat: { v: string; l: string };
};

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function slugCode(title: string): string {
  const alnum = title.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return alnum.slice(0, 12) || "IDEA";
}

export function buildPitchProjectFromViewModel(vm: DashboardViewModel): {
  code: string;
  fullName: string;
  descriptor: string;
  domain: string;
} {
  return {
    code: slugCode(vm.idea.title),
    fullName: clip(vm.idea.title, 72),
    descriptor: clip(vm.yourIdeaStrapline || vm.idea.title, 220),
    domain: "validation.local",
  };
}

export function buildPitchDeckTalkTrack(vm: DashboardViewModel): { objection: string; answer: string } {
  const r0 = vm.riskBreakdown[0];
  if (vm.live && r0) {
    return {
      objection: clip(r0.title, 220),
      answer: clip(r0.mitigation, 360),
    };
  }
  return {
    objection: 'Show me the second logo before I take the next meeting.',
    answer:
      "We've signed 1 LOI with DHL Express plus 4 verbal commits in active legal review. Two convert to paper before seed close.",
  };
}

/** Ten investor slides synthesized from the same dossier as the results dashboard. */
export function buildDeckFromViewModel(vm: DashboardViewModel): DeckSlide[] {
  const topic = vm.idea.title.trim() || "Your idea";
  const strap = vm.yourIdeaStrapline.trim() || topic;
  const score = vm.overallScore.score;
  const verdict = vm.idea.verdict;
  const tam = vm.coldMetrics.find((m) => m.label === "TAM")?.value ?? "—";
  const sam = vm.coldMetrics.find((m) => m.label === "SAM")?.value ?? "—";
  const som = vm.coldMetrics.find((m) => m.label === "SOM")?.value ?? "—";
  const compCount = vm.coldMetrics.find((m) => m.label === "COMPETITORS")?.value ?? "0";
  const firstRec = vm.recommendations[0]?.title ?? "Run a tight pilot and bring back one chart that falsifies your riskiest assumption.";
  const secondRec = vm.recommendations[1]?.title ?? "Interview five buyers with a scripted discovery script.";
  const topRisk = vm.riskBreakdown[0]?.title ?? "Unvalidated demand and unclear wedge vs incumbents.";
  const compLead = clip(vm.competitionIntro, 380);
  const revLine = clip(vm.revenueNarrative, 360);
  const personaLead =
    vm.personaVerdicts[0]?.quote != null ? clip(vm.personaVerdicts[0].quote, 320) : clip(strap, 320);

  return [
    {
      no: "01",
      kicker: "PROBLEM",
      title: clip(`WHY ${topic.slice(0, 36).toUpperCase()} MATTERS NOW.`, 52),
      body: clip(vm.riskIntro || topRisk, 420),
      stat: { v: String(score), l: "VIABILITY / 100" },
    },
    {
      no: "02",
      kicker: "SOLUTION",
      title: clip(topic.toUpperCase(), 48),
      body: clip(strap, 420),
      stat: { v: clip(verdict, 14), l: "PANEL VERDICT" },
    },
    {
      no: "03",
      kicker: "MARKET",
      title: clip(`${tam} · ${sam} · ${som}`.toUpperCase(), 52),
      body: clip(vm.marketIntro, 420),
      stat: { v: clip(tam, 12), l: "TAM (FROM REPORT)" },
    },
    {
      no: "04",
      kicker: "PRODUCT",
      title: "WHAT YOU SHIP FIRST.",
      body: clip(revLine || strap, 420),
      stat: { v: clip(vm.revenueHeadline, 14), l: "REVENUE ANCHOR" },
    },
    {
      no: "05",
      kicker: "TRACTION",
      title: clip(`${verdict} · ${score}/100 · PANEL SYNTH.`, 52),
      body: clip(
        `Consensus ${vm.panelConsensusScore}/100 across ${vm.personaVerdicts.length || 5} voices. Aggregate: ${vm.panelAggregateVerdict}.`,
        420,
      ),
      stat: { v: String(vm.panelConsensusScore), l: "PANEL MEAN" },
    },
    {
      no: "06",
      kicker: "MODEL",
      title: clip(vm.revenueHeadline.toUpperCase(), 44),
      body: clip(vm.revenueNarrative, 420),
      stat: { v: clip(vm.pricingModels[0]?.price ?? "—", 16), l: "PRICING SIGNAL" },
    },
    {
      no: "07",
      kicker: "GTM",
      title: "NEXT MOVES THE REPORT DEMANDS.",
      body: clip(`${firstRec} ${secondRec}`, 420),
      stat: { v: String(vm.recommendations.length || 0), l: "ACTION ROWS" },
    },
    {
      no: "08",
      kicker: "COMPETITION",
      title: clip(`${compCount} NAMED · YOUR POSITION.`, 48),
      body: clip(compLead, 420),
      stat: { v: String(compCount), l: "NAMED RIVALS" },
    },
    {
      no: "09",
      kicker: "TEAM",
      title: "FOUNDER READ + PANEL VOICE.",
      body: clip(personaLead, 420),
      stat: { v: String(vm.personaVerdicts.length || 5), l: "PERSONAS" },
    },
    {
      no: "10",
      kicker: "ASK",
      title: clip(`USE THIS DECK AFTER ${verdict}.`, 48),
      body: clip(
        `${firstRec} Close with the evidence gaps in your risk register — investors fund de-risking, not hope.`,
        420,
      ),
      stat: { v: String(score), l: "SCORE TO DEFEND" },
    },
  ];
}
