"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Loader2,
  MessageCircle,
  SendHorizontal,
  Sparkles,
} from "lucide-react";

import { Sidebar } from "@/components/v2/sidebar";
import { PageHeader } from "@/components/v2/page-header";
import { Button } from "@/components/v2/button";
import { VerdictPill } from "@/components/v2/verdict-pill";
import { PersonaMark } from "@/components/v2/persona-mark";
import { exampleDossier } from "@/lib/example-dossier";
import { dossierFromSession, sessionMatchesDossierShape } from "@/lib/dossier-from-session";
import type { Message } from "@/lib/types";
import {
  PANEL_PERSONA_ORDER,
  getPersonalityFile,
  personaNameFromSlug,
  type PanelPersonaSlug,
} from "@/lib/personas/personality-profiles";
import { streamDebateOpening, streamDebatePersonaTurn } from "@/lib/panel-debate-stream";
import {
  loadPanelPersisted,
  resolveDebateContext,
  savePanelPersisted,
  syncInterviewChatsToSession,
} from "@/lib/panel-debate-session";
import { loadSession } from "@/lib/session";
import { cn } from "@/lib/utils";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function PanelDebatePage() {
  const [ready, setReady] = useState(false);
  const [setup, setSetup] = useState<ReturnType<typeof resolveDebateContext>["setup"] | null>(null);
  const [validationContent, setValidationContent] = useState("");
  const [hasLiveSession, setHasLiveSession] = useState(false);

  const [activeSlug, setActiveSlug] = useState<PanelPersonaSlug>(PANEL_PERSONA_ORDER[0]);
  const [threads, setThreads] = useState<Partial<Record<PanelPersonaSlug, Message[]>>>({});
  const [maxUnlocked, setMaxUnlocked] = useState(0);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [openingFor, setOpeningFor] = useState<PanelPersonaSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  const caseTitle = setup?.topic ?? exampleDossier.title;
  /** Sidebar dossier ribbon — prefers live parsed verdict after validation. */
  const [projectRibbon, setProjectRibbon] = useState({
    title: "",
    verdict: exampleDossier.verdict,
    validatedAt: "Demo dossier" as string,
  });

  useEffect(() => {
    const ctx = resolveDebateContext();
    setSetup(ctx.setup);
    setValidationContent(ctx.validationContent);
    setHasLiveSession(ctx.hasLiveSession);
    const persisted = loadPanelPersisted();
    const session = loadSession();

    if (persisted?.threads && Object.keys(persisted.threads).length > 0) {
      setThreads(persisted.threads);
    } else {
      const chats = session?.interviewChats as Partial<Record<PanelPersonaSlug, Message[]>> | undefined;
      if (chats && Object.keys(chats).length > 0) setThreads(chats);
    }
    if (persisted && typeof persisted.maxUnlocked === "number") {
      setMaxUnlocked(persisted.maxUnlocked);
    }

    if (sessionMatchesDossierShape(session)) {
      const doc = dossierFromSession(session);
      setProjectRibbon({
        title: ctx.setup.topic.slice(0, 80),
        verdict: doc.verdict,
        validatedAt: doc.caseId,
      });
    } else {
      setProjectRibbon({
        title: ctx.setup.topic.slice(0, 80),
        verdict: exampleDossier.verdict,
        validatedAt: ctx.hasLiveSession ? "Live session" : "Demo dossier",
      });
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePanelPersisted({ threads, maxUnlocked });
    syncInterviewChatsToSession(threads);
  }, [ready, threads, maxUnlocked]);

  const activeIdx = PANEL_PERSONA_ORDER.indexOf(activeSlug);
  const activeThread = threads[activeSlug] ?? [];
  const userTurns = activeThread.filter((m) => m.role === "user").length;
  const canCompleteRound = userTurns >= 1 && !streaming && activeThread.length > 0;

  const startOpening = useCallback(async () => {
    if (!setup) return;
    setError(null);
    const existing = threads[activeSlug];
    if (existing && existing.length > 0) return;

    setOpeningFor(activeSlug);
    setStreaming(true);
    let acc = "";
    try {
      await streamDebateOpening(setup, activeSlug, validationContent, (chunk) => {
        acc = chunk;
      });
      const opener: Message = {
        id: newId(),
        role: "opponent",
        content: acc,
        personaId: activeSlug,
      };
      setThreads((prev) => ({ ...prev, [activeSlug]: [opener] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the panel.");
    } finally {
      setStreaming(false);
      setOpeningFor(null);
    }
  }, [setup, validationContent, activeSlug, threads]);

  const sendReply = async () => {
    if (!setup || !draft.trim() || streaming) return;
    setError(null);
    const trimmed = draft.trim().slice(0, 2000);
    const userMsg: Message = { id: newId(), role: "user", content: trimmed };

    const base = [...(threads[activeSlug] ?? [])];
    if (base.length === 0) {
      setError("Tap “Get their opener” above so this persona introduces their critique first.");
      return;
    }

    const withUser = [...base, userMsg];
    setThreads((prev) => ({ ...prev, [activeSlug]: withUser }));
    setDraft("");

    setStreaming(true);
    let acc = "";
    try {
      await streamDebatePersonaTurn(setup, activeSlug, withUser, validationContent, (chunk) => {
        acc = chunk;
      });
      const reply: Message = {
        id: newId(),
        role: "opponent",
        content: acc,
        personaId: activeSlug,
      };
      setThreads((prev) => ({
        ...prev,
        [activeSlug]: [...(prev[activeSlug] ?? []), reply],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reply failed.");
      setThreads((prev) => ({
        ...prev,
        [activeSlug]: [...(prev[activeSlug] ?? []).filter((m) => m.id !== userMsg.id)],
      }));
      setDraft(trimmed);
    } finally {
      setStreaming(false);
    }
  };

  const completeRoundAndAdvance = () => {
    if (!canCompleteRound) return;
    const nextUnlock = Math.max(maxUnlocked, activeIdx + 1);
    setMaxUnlocked(nextUnlock);
    if (activeIdx < PANEL_PERSONA_ORDER.length - 1) {
      const nextSlug = PANEL_PERSONA_ORDER[activeIdx + 1];
      setActiveSlug(nextSlug);
    }
  };

  const selectRound = (slug: PanelPersonaSlug) => {
    const idx = PANEL_PERSONA_ORDER.indexOf(slug);
    if (idx <= maxUnlocked) setActiveSlug(slug);
  };

  const profile = useMemo(() => getPersonalityFile(activeSlug), [activeSlug]);
  const displayName = personaNameFromSlug(activeSlug);

  if (!ready || !setup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--bg] text-[--ink-2] font-mono text-[12px]">
        Loading chats…
      </div>
    );
  }

  return (
    <div className="app-page-shell min-h-screen flex text-[--ink-0]">
      <Sidebar
        project={{
          title: projectRibbon.title || caseTitle.slice(0, 80),
          verdict: projectRibbon.verdict,
          validatedAt: projectRibbon.validatedAt,
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader
          kicker="Separate chat per persona · stress-test assumptions"
          title="Debate panel"
          meta={
            <>
              {!hasLiveSession ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--caution]/90">
                  Sample brief — validate your idea first
                </span>
              ) : (
                <VerdictPill verdict={projectRibbon.verdict} size="sm" />
              )}
            </>
          }
          actions={
            <>
              <Link href="/#idea-validation">
                <Button variant="ghost" size="sm">
                  New brief
                </Button>
              </Link>
              <Link href="/results">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to results
                </Button>
              </Link>
            </>
          }
        />

        <div className="mx-6 mt-4 mb-6 rounded-[--radius] border border-[--line] bg-[--surface-1]/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.12)]">
          <div className="grid gap-4 md:grid-cols-[1.1fr_auto] md:items-center md:justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--ink-2]">
                The panel — 5/5 online
              </div>
              <div className="mt-2 font-serif text-[24px] leading-tight text-[--ink-0]">
                A live founder-pressure test for your startup idea.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PANEL_PERSONA_ORDER.map((slug) => (
                <div
                  key={slug}
                  className="rounded-full border border-[--line] bg-[--surface-2] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[--ink-1]"
                >
                  {personaNameFromSlug(slug)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 flex-col xl:flex-row">
          {/* Persona picker */}
          <aside className="shrink-0 border-b xl:border-b-0 xl:border-r border-[--line] bg-[--surface-1]/40 xl:w-[260px]">
            <div className="p-5 space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[--ink-2] pb-1">
                Who presses you
              </div>
              <p className="text-[12px] leading-snug text-[--ink-2] pb-4">
                Same five voices as validation — each in their own chat so arguments stay sharp and in character.
              </p>
              <ol className="space-y-1">
                {PANEL_PERSONA_ORDER.map((slug, idx) => {
                  const locked = idx > maxUnlocked;
                  const isActive = slug === activeSlug;
                  const hasThread = (threads[slug]?.length ?? 0) > 0;
                  const persona = personaNameFromSlug(slug);
                  const answered = userRoundDone(threads[slug]);
                  const name = persona;
                  return (
                    <li key={slug}>
                      <button
                        type="button"
                        disabled={locked}
                        data-cursor="snap"
                        onClick={() => selectRound(slug)}
                        className={cn(
                          "w-full rounded-[--radius] border border-transparent px-3 py-2.5 text-left transition-colors flex gap-3 items-start",
                          locked && "opacity-40 cursor-not-allowed",
                          isActive && "bg-[--surface-3] border-[--line]",
                          !isActive && !locked && "hover:bg-[--surface-2]"
                        )}
                      >
                        <span className="font-mono text-[10px] text-[--ink-2] tabular-nums pt-1">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <PersonaMark persona={persona} size="sm" />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[13px] text-[--ink-0]">{name}</span>
                            {answered ? (
                              <Check className="w-3.5 h-3.5 text-[--go] shrink-0" />
                            ) : hasThread ? (
                              <MessageCircle className="w-3.5 h-3.5 text-[--accent] shrink-0" />
                            ) : null}
                          </span>
                          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink-2] leading-snug block mt-1">
                            {getPersonalityFile(slug).rosterTagline}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink-2] pt-6 leading-relaxed">
                After you defend once against this persona, unlock the next. Revisit unlocked chats anytime.
              </p>
            </div>
          </aside>

          {/* Conversation */}
          <main className="flex-1 flex flex-col min-w-0 min-h-[520px] bg-[--bg] border-b xl:border-b-0 xl:border-r border-[--line]">
            <header className="px-6 py-4 border-b border-[--line] flex flex-wrap items-start justify-between gap-4 bg-[--surface-1]/35">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <PersonaMark persona={displayName} size="md" />
                  <div>
                    <div className="font-serif text-[clamp(20px,2.6vw,30px)] leading-tight tracking-[-0.02em]">
                      {displayName}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2] mt-1 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                      <span className="text-[--accent]">Chat {activeIdx + 1}/5</span>
                      <span className="text-[--ink-3]">·</span>
                      <span>{profile.rosterTagline}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={streaming || !!(threads[activeSlug]?.length)}
                  onClick={() => startOpening()}
                  type="button"
                >
                  {openingFor === activeSlug ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting opener…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Get their opener
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={streaming || !!(threads[activeSlug]?.length)}
                  onClick={() => {
                    const cur = personaNameFromSlug(activeSlug);
                    const match = exampleDossier.personas.find((x) => x.persona === cur);
                    if (match?.quote) {
                      setThreads((prev) => ({
                        ...prev,
                        [activeSlug]: [
                          {
                            id: newId(),
                            role: "opponent",
                            content: `[Sample opener · no AI call]\n\n${match.quote}`,
                            personaId: activeSlug,
                          },
                        ],
                      }));
                    }
                  }}
                  title="Use static copy from our demo dossier — works offline."
                >
                  Use sample opener
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 scroll-smooth">
              {!streaming && activeThread.length === 0 && (
                <div className="rounded-[--radius] border border-dashed border-[--line-strong] bg-[--surface-1]/35 px-5 py-8 max-w-[min(560px,100%)]">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2] mb-3">
                    Start this thread
                  </div>
                  <p className="font-serif text-[17px] text-[--ink-0] leading-snug mb-4">
                    This is a focused back-and-forth with <strong className="font-semibold">{displayName}</strong> only —
                    no blended “committee” answer — so objections stay brutal and usable.
                  </p>
                  <p className="text-[13px] text-[--ink-2] leading-relaxed">
                    Use <strong className="text-[--ink-1]">Get their opener</strong> when online, or{" "}
                    <strong className="text-[--ink-1]">Use sample opener</strong> offline, then argue with evidence until
                    the idea holds up — or breaks.
                  </p>
                </div>
              )}
              {activeThread.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[min(720px,100%)]",
                    msg.role === "user" ? "ml-auto" : ""
                  )}
                >
                  <div
                    className={cn(
                      "inline-block w-full rounded-[--radius] border px-5 py-4 text-left",
                      msg.role === "user"
                        ? "border-[--accent]/40 bg-[--accent-soft]/25"
                        : "border-[--line-strong] bg-[--surface-1] shadow-sm shadow-black/10"
                    )}
                  >
                    {msg.role === "opponent" && (
                      <div className="flex items-center gap-2 mb-2.5">
                        <Bot className="w-3.5 h-3.5 text-[--ink-2]" aria-hidden />
                        <PersonaMark persona={displayName} size="sm" />
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink-2]">
                          {displayName}
                        </span>
                      </div>
                    )}
                    {msg.role === "user" && (
                      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--accent] mb-2">
                        You
                      </div>
                    )}
                    <p className="text-[14px] leading-[1.65] text-[--ink-0] whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[--ink-2] flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> {displayName} is answering…
                </div>
              )}
              {error && (
                <div className="rounded-[--radius] border border-[--no-go]/40 bg-[--surface-1] px-4 py-3 text-[13px] text-[--no-go] max-w-xl">
                  {error}
                </div>
              )}
            </div>

            <footer className="border-t border-[--line] px-6 py-4 bg-[--surface-1]/60 backdrop-blur-sm space-y-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Answer ${displayName} — new evidence, a sharper wedge, or ask what would change their mind.`}
                rows={3}
                disabled={streaming || activeThread.length === 0}
                className="w-full rounded-[--radius] border border-[--line-strong] bg-[--bg] px-4 py-3 text-[14px] text-[--ink-0] outline-none focus:border-[--line-bright] focus:ring-2 focus:ring-[--accent-ring]/80 resize-none leading-relaxed placeholder:text-[--ink-3]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={streaming || activeThread.length === 0 || !draft.trim()}
                  onClick={sendReply}
                >
                  Send
                  <SendHorizontal className="w-3.5 h-3.5" aria-hidden />
                </Button>
                {activeIdx < PANEL_PERSONA_ORDER.length - 1 ? (
                  <Button
                    variant="secondary"
                    type="button"
                    size="sm"
                    disabled={!canCompleteRound}
                    onClick={completeRoundAndAdvance}
                  >
                    Next persona
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden />
                  </Button>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2] pt-2 max-w-[min(440px,100%)] text-right ml-auto">
                    Last voice — tighten your story here, then back to Results to export your brief.
                  </span>
                )}
              </div>
            </footer>
          </main>

          {/* Persona playbook */}
          <aside className="hidden lg:block lg:w-[min(340px,32vw)] shrink-0 bg-[--surface-1]/20 overflow-y-auto max-h-[calc(100vh-3.5rem)] border-t xl:border-t-0 xl:border-l border-[--line]">
            <div className="p-6 space-y-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.20em] text-[--ink-2] mb-3">
                  Panel roster
                </div>
                <p className="text-[13px] leading-relaxed text-[--ink-1]">
                  Each persona is a pressure point. Unlock them one by one, then keep the debate sharp.
                </p>
              </div>
              <div className="space-y-3">
                {PANEL_PERSONA_ORDER.map((slug, idx) => {
                  const locked = idx > maxUnlocked;
                  const isActive = slug === activeSlug;
                  const hasThread = (threads[slug]?.length ?? 0) > 0;
                  const answered = userRoundDone(threads[slug]);
                  const persona = personaNameFromSlug(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      disabled={locked}
                      onClick={() => selectRound(slug)}
                      className={cn(
                        "w-full rounded-[--radius] border px-4 py-4 text-left transition-colors duration-[120ms]",
                        locked
                          ? "border-[--line]/50 bg-[--surface-1] opacity-50 cursor-not-allowed"
                          : isActive
                          ? "border-[--accent] bg-[--surface-2]"
                          : "border-[--line] bg-[--surface-1]/90 hover:border-[--line-bright] hover:bg-[--surface-2]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2]">
                            {String(idx + 1).padStart(2, "0")}
                          </div>
                          <div className="mt-2 font-semibold text-[14px] text-[--ink-0]">{persona}</div>
                        </div>
                        <div className="flex items-center gap-2 text-[--ink-2]">
                          {answered ? (
                            <Check className="w-4 h-4 text-[--go]" />
                          ) : hasThread ? (
                            <MessageCircle className="w-4 h-4 text-[--accent]" />
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 text-[12px] leading-relaxed text-[--ink-1]">
                        {getPersonalityFile(slug).rosterTagline}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2] mb-2">{label}</div>
      <p className="text-[12px] leading-relaxed text-[--ink-1]">{body}</p>
    </div>
  );
}

function userRoundDone(thread: Message[] | undefined): boolean {
  if (!thread?.length) return false;
  return thread.some((m) => m.role === "user");
}
