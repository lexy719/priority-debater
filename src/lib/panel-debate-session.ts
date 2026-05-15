import type { DebateSetup } from "@/lib/types";
import { exampleDossier } from "@/lib/example-dossier";
import { loadSession, saveSession } from "@/lib/session";
import type { Message } from "@/lib/types";
import type { PanelPersonaSlug } from "@/lib/personas/personality-profiles";

const FLOW_KEY = "priority-debater-panel-flow-v1";

export type PanelFlowPersist = {
  /** Persona slug → transcript */
  threads: Partial<Record<PanelPersonaSlug, Message[]>>;
  /** Max round index unlocked (0 = first persona only … 4 = all) */
  maxUnlocked: number;
};

function defaultSetup(): DebateSetup {
  const d = exampleDossier;
  const context = [
    d.oneLiner,
    "",
    "Panel excerpts (from last simulated run):",
    ...d.personas.map((p) => `- ${p.persona}: ${p.pullQuote}`),
  ].join("\n");

  return {
    template: "validate",
    topic: d.title,
    position: d.thesis,
    context: context.slice(0, 9950),
    lens: "investor",
  };
}

/** Markdown-ish context for prompts when no streamed report exists locally. */
function defaultValidationContent(): string {
  const d = exampleDossier;
  const scoreLines = d.scores.map((s) => `- ${s.label}: ${s.score}/100 — ${s.note}`).join("\n");
  return [`# Case: ${d.title}`, "", d.thesis, "", "## Category scores", scoreLines, "", "## Risks", ...d.risks.map((r) => `- [${r.severity}] ${r.title}: ${r.nextStep}`)].join("\n");
}

/** Setup + dossier body for `/api/debate` — prefers live validation session when present. */
export function resolveDebateContext(): {
  setup: DebateSetup;
  validationContent: string;
  hasLiveSession: boolean;
} {
  const session = loadSession();
  if (session?.setup?.topic && session.validationContent?.trim()) {
    return {
      setup: session.setup,
      validationContent: session.validationContent,
      hasLiveSession: true,
    };
  }
  return {
    setup: defaultSetup(),
    validationContent: defaultValidationContent(),
    hasLiveSession: false,
  };
}

export function loadPanelPersisted(): PanelFlowPersist | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(FLOW_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PanelFlowPersist;
    if (!p.threads || typeof p.maxUnlocked !== "number") return null;
    return p;
  } catch {
    return null;
  }
}

export function savePanelPersisted(state: PanelFlowPersist): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

/** Merge transcripts into canonical validation session interview map when possible. */
/** Start a fresh case — panel rounds should not bleed into prior transcripts */
export function clearPanelFlowPersist(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(FLOW_KEY);
  } catch {
    /* ignore */
  }
}

export function syncInterviewChatsToSession(threads: Partial<Record<PanelPersonaSlug, Message[]>>): void {
  const session = loadSession();
  if (!session) return;
  saveSession({
    ...session,
    interviewChats: {
      ...session.interviewChats,
      ...threads,
    },
  });
}
