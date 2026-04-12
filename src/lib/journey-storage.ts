import type { JourneyState } from "./journey-types";
import { createInitialJourneyState } from "./journey-types";

const STORAGE_KEY = "priority-debater-guided-journey-v1";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function reviveState(raw: unknown): JourneyState | null {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const idea = typeof raw.idea === "string" ? raw.idea : "";
  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
    idea,
    iteration: typeof raw.iteration === "number" ? raw.iteration : 0,
    wizardStep:
      raw.wizardStep === "idea" ||
      raw.wizardStep === "reality" ||
      raw.wizardStep === "debate" ||
      raw.wizardStep === "verdict" ||
      raw.wizardStep === "improve" ||
      raw.wizardStep === "build"
        ? raw.wizardStep
        : "idea",
    realityCheck:
      raw.realityCheck &&
      isRecord(raw.realityCheck) &&
      typeof raw.realityCheck.score === "number" &&
      typeof raw.realityCheck.summary === "string"
        ? { score: raw.realityCheck.score, summary: raw.realityCheck.summary }
        : null,
    realityViewed: Boolean(raw.realityViewed),
    rounds: Array.isArray(raw.rounds) ? (raw.rounds as JourneyState["rounds"]) : [],
    nextRoundIndex: typeof raw.nextRoundIndex === "number" ? raw.nextRoundIndex : 0,
    roundsGenerationComplete: Boolean(raw.roundsGenerationComplete),
    allRoundsViewed: Boolean(raw.allRoundsViewed),
    verdict: raw.verdict && isRecord(raw.verdict) ? (raw.verdict as unknown as JourneyState["verdict"]) : null,
    verdictViewed: Boolean(raw.verdictViewed),
    buildAssets:
      raw.buildAssets && isRecord(raw.buildAssets)
        ? (raw.buildAssets as unknown as JourneyState["buildAssets"])
        : null,
  };
}

export function loadJourneyState(): JourneyState {
  if (typeof window === "undefined") return createInitialJourneyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialJourneyState();
    const parsed = JSON.parse(raw) as unknown;
    const revived = reviveState(parsed);
    return revived ?? createInitialJourneyState();
  } catch {
    return createInitialJourneyState();
  }
}

export function saveJourneyState(state: JourneyState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {
    // quota/full
  }
}

export function clearJourneyState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
