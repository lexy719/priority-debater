import type { ValidationSession } from "./types";

const SESSION_KEY = "priority-debater-session";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveSession(session: ValidationSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage full or disabled
  }
}

export function loadSession(): ValidationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ValidationSession;
    if (!session.setup || !session.validationContent || !session.messages) return null;
    if (Date.now() - (session.createdAt || 0) > MAX_AGE_MS) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
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
