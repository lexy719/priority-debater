import type { ValidationSession } from "./types";
import type { DebateHandoff } from "./chamber-handoff";

const SESSION_KEY = "priority-debater-session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export type SessionLoadResult =
  | { status: "loaded"; session: ValidationSession }
  | { status: "expired" }
  | { status: "none" };

export function saveSession(session: ValidationSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage full or disabled
  }
}

/**
 * Load session with status info. Use this to distinguish between
 * "no session ever existed" vs "session expired".
 */
export function loadSessionWithStatus(): SessionLoadResult {
  if (typeof window === "undefined") return { status: "none" };
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { status: "none" };
    const session = JSON.parse(raw) as ValidationSession;
    if (!session.setup || !session.validationContent || !session.messages) return { status: "none" };
    if (Date.now() - (session.createdAt || 0) > MAX_AGE_MS) {
      clearSession();
      return { status: "expired" };
    }
    return { status: "loaded", session };
  } catch {
    return { status: "none" };
  }
}

/**
 * Legacy helper: returns session or null.
 * Prefer loadSessionWithStatus() for new code.
 */
export function loadSession(): ValidationSession | null {
  const result = loadSessionWithStatus();
  return result.status === "loaded" ? result.session : null;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function updateSessionMessages(messages: ValidationSession["messages"]): void {
  const session = loadSession();
  if (!session) return;
  saveSession({ ...session, messages });
}

const DEBATE_KEY = "priority-debater-chamber-transcript";

/**
 * Persist a rendered Chamber debate transcript so the /results synthesis can
 * fold "what the panel actually challenged" into the dossier. Stored against
 * the idea so a stale transcript from another idea is never reused.
 */
export function saveDebateTranscript(idea: string, transcript: string, survival: number): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DEBATE_KEY, JSON.stringify({ idea: idea.trim(), transcript, survival, savedAt: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadDebateTranscript(idea: string): { transcript: string; survival: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DEBATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { idea?: string; transcript?: string; survival?: number };
    if (!parsed.transcript || parsed.idea?.trim() !== idea.trim()) return null;
    return { transcript: parsed.transcript, survival: typeof parsed.survival === "number" ? parsed.survival : 0 };
  } catch {
    return null;
  }
}

const HANDOFF_KEY = "priority-debater-chamber-handoff";

/**
 * Persist the debate's derived weak-point handoff so the downstream flow
 * (Brand → Launch → Campaign) can seed generation from what the panel actually
 * exposed. Keyed by idea so a stale handoff from another idea is never reused.
 */
export function saveDebateHandoff(handoff: DebateHandoff): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // ignore
  }
}

export function loadDebateHandoff(idea: string): DebateHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DebateHandoff;
    if (!parsed?.idea || parsed.idea.trim() !== idea.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}
