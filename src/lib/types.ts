export interface Message {
  id: string;
  role: "user" | "opponent";
  content: string;
  isQuickAction?: boolean;
  /** Present on opponent messages from debate mode — which persona spoke (stable avatars in transcript). */
  personaId?: string;
}

export interface DebateSetup {
  template: string;
  topic: string;
  position: string;
  context: string;
  lens: "investor" | "customer" | "competitor" | "postmortem" | "market" | "future";
}

/** Heuristic vertical (tech, fintech, …) for imagery and prompts; optional on older sessions */
export interface IdeaCategoryRef {
  id: string;
  label: string;
}

/** Dual-model score reconciliation (GPT-4.1 primary + Gemini blind scorer) */
export interface ScoreReconciliation {
  final: Record<string, number>;
  primary: Record<string, number>;
  blind: Record<string, number>;
  deltas: Record<string, number>;
  confidence: "high" | "medium" | "low";
  maxDelta: number;
}

export interface ValidationSession {
  setup: DebateSetup;
  validationContent: string;
  messages: Message[];
  createdAt: number;
  ideaCategory?: IdeaCategoryRef;
  /** Isolated validation interview threads per persona (replaces one long debate transcript). */
  interviewChats?: Partial<Record<string, Message[]>>;
  /** Dual-model score reconciliation — present when Gemini blind scorer succeeds */
  scoreReconciliation?: ScoreReconciliation;
}

export const SESSION_KEY = "priority-debater-session";
