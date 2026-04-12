/** Guided Idea Validator journey — structured evaluation (not chat). */

export type RiskLevel = "Low" | "Medium" | "High";

export type TaggedIssue =
  | "Weak Assumption"
  | "Market Risk"
  | "Execution Risk"
  | "Differentiation Gap";

export interface DebateRound {
  title: string;
  riskLevel: RiskLevel;
  insights: string[];
  taggedIssue: TaggedIssue;
  /** Which analytical lens produced this round (for transparency). */
  personaId: "customer" | "competitor" | "operator" | "investor" | "adversary";
}

export type VerdictLabel = "Kill" | "Pivot" | "Proceed";

export interface Verdict {
  finalScore: number;
  verdict: VerdictLabel;
  reasoning: string[];
  requiredFixes: string[];
}

export interface LandingAsset {
  hero: string;
  valueBullets: string[];
  structure: string[];
  biggestObjectionAddressed: string;
  strongestPain: string;
}

export interface PitchDeckOutline {
  slides: { title: string; bullets: string[] }[];
}

export interface BuildAssets {
  landing: LandingAsset;
  pitchDeck: PitchDeckOutline;
  launchStatement: string;
}

export interface RealityCheck {
  score: number;
  summary: string;
}

export type JourneyWizardStep = "idea" | "reality" | "debate" | "verdict" | "improve" | "build";

export interface JourneyState {
  version: 1;
  updatedAt: number;
  idea: string;
  iteration: number;
  wizardStep: JourneyWizardStep;
  realityCheck: RealityCheck | null;
  realityViewed: boolean;
  rounds: DebateRound[];
  /** Index of next round to fetch (0–3). When 4, all rounds exist. */
  nextRoundIndex: number;
  roundsGenerationComplete: boolean;
  allRoundsViewed: boolean;
  verdict: Verdict | null;
  verdictViewed: boolean;
  buildAssets: BuildAssets | null;
}

export const ROUND_DEFINITIONS: readonly {
  index: number;
  title: string;
  focus: string;
  personaId: DebateRound["personaId"];
}[] = [
  {
    index: 0,
    title: "Round 1: Problem Reality",
    focus: "Is this a real, frequent pain? Who urgently needs it?",
    personaId: "customer",
  },
  {
    index: 1,
    title: "Round 2: Competition & Alternatives",
    focus: "Why doesn't something already dominate? What makes this not just a feature?",
    personaId: "competitor",
  },
  {
    index: 2,
    title: "Round 3: Execution Risk",
    focus: "What breaks first? What's hardest to build or distribute?",
    personaId: "operator",
  },
  {
    index: 3,
    title: "Round 4: Blind Spots",
    focus: "What is the user missing? What are the hidden assumptions?",
    personaId: "adversary",
  },
] as const;

export function createInitialJourneyState(): JourneyState {
  return {
    version: 1,
    updatedAt: Date.now(),
    idea: "",
    iteration: 0,
    wizardStep: "idea",
    realityCheck: null,
    realityViewed: false,
    rounds: [],
    nextRoundIndex: 0,
    roundsGenerationComplete: false,
    allRoundsViewed: false,
    verdict: null,
    verdictViewed: false,
    buildAssets: null,
  };
}

export function canAccessBuild(v: Verdict | null): boolean {
  if (!v) return false;
  return v.verdict === "Proceed" || v.verdict === "Pivot";
}
