import "server-only";

/**
 * Agent thread persistence — in-memory for now (per running instance), mirroring
 * the report store's pluggable philosophy. Threads upgrade to durable Supabase
 * (`commerce_agent_threads`, migration 0004) once the service-role key lands;
 * call sites won't change. Ephemeral storage is fine for the conversational UX —
 * the value (the generated artifacts) is copy/downloaded by the user.
 */

import { randomBytes } from "crypto";
import type { AgentArtifact, AgentMessage, AgentThread, AgentThreadSummary } from "./types";

const threads = new Map<string, AgentThread>();

function id(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

export function newMessage(role: "user" | "assistant", content: string, artifact?: AgentArtifact): AgentMessage {
  return { id: id("m"), role, content, artifact, ts: new Date().toISOString() };
}

export function createThread(userId: string | null, reportId: string, title: string): AgentThread {
  const now = new Date().toISOString();
  const thread: AgentThread = { id: id("t"), userId, reportId, title: title.slice(0, 80), messages: [], createdAt: now, updatedAt: now };
  threads.set(thread.id, thread);
  return thread;
}

export function getThread(threadId: string): AgentThread | null {
  return threads.get(threadId) ?? null;
}

export function appendMessages(thread: AgentThread, msgs: AgentMessage[]): AgentThread {
  thread.messages.push(...msgs);
  thread.updatedAt = new Date().toISOString();
  threads.set(thread.id, thread);
  return thread;
}

/** A user's conversations, newest first (optionally scoped to one report). */
export function listThreads(userId: string | null, reportId?: string): AgentThreadSummary[] {
  return [...threads.values()]
    .filter((t) => t.userId === userId && (!reportId || t.reportId === reportId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((t) => ({ id: t.id, title: t.title, updatedAt: t.updatedAt }));
}
