"use client";

/**
 * results/debate/page.tsx — dynamic edition
 * ─────────────────────────────────────────────────────────────────────────
 *  • Reads the user's idea from loadJourneyState().
 *  • Calls /api/debate/session ONCE to build a 5-round panel tailored to
 *    the idea. Response cached in localStorage per idea (no token waste).
 *  • Falls back to the static debateData.js seed if no idea is on file or
 *    if the API fails — banner shown in either case.
 *  • Renders the chat-redesigned DebateStage (sibling component).
 *  • Hero strip has the contrast pass (white/45 → white/80, semibold mono).
 *
 *  Scoring math is now strength-driven (handlePick takes strength, not
 *  optionIdx) because there's no longer a finite 3-option array.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DebateNavbar from "@/components/debate/DebateNavbar";
import PanelRoster from "@/components/debate/PanelRoster";
import DebateStage from "@/components/debate/DebateStage";
import DebateVerdict from "@/components/debate/DebateVerdict";
import TickerTape from "@/components/dashboard/TickerTape";
import {
  debateIdea as fallbackIdea,
  debatePersonas as fallbackPersonas,
  debateRounds as fallbackRounds,
} from "@/data/debateData";
import { loadSession } from "@/lib/session";
import { RefreshCw, AlertTriangle } from "lucide-react";

const CACHE_KEY = "priority-debater-debate-session-v1";

type Persona = {
  id: string; name: string; role: string; lens: string;
  accent: string; avatar: string; bio?: string;
};

type Round = { personaId: string; challenge: string; flaw: string };

type SessionPayload = {
  idea: { title: string; oneLiner: string; stage: string };
  personas: Persona[];
  rounds: Round[];
};

/* ── cache helpers ─────────────────────────────────────────────────── */
function readCache(idea: string): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.idea !== idea) return null;
    return parsed.payload ?? null;
  } catch { return null; }
}
function writeCache(idea: string, payload: SessionPayload) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ idea, payload, savedAt: Date.now() })); } catch {}
}

/* Build the fallback session from the static seed so the page is always
   renderable even before any API call returns. */
function buildFallback(): SessionPayload {
  return {
    idea: {
      title: fallbackIdea.title,
      oneLiner: fallbackIdea.one_liner,
      stage: fallbackIdea.stage,
    },
    personas: fallbackPersonas as Persona[],
    rounds: (fallbackRounds as Array<{ personaId: string; challenge: string; flaw: string }>).map((r) => ({
      personaId: r.personaId, challenge: r.challenge, flaw: r.flaw,
    })),
  };
}

/* ── Page ──────────────────────────────────────────────────────────── */
const initialShields = (personas: Persona[]) =>
  personas.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {} as Record<string, number>);

const initialPicks = (personas: Persona[]) =>
  personas.reduce((acc, p) => ({ ...acc, [p.id]: null }), {} as Record<string, number | null>);

export default function DebatePage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [session, setSession] = useState<SessionPayload>(buildFallback());
  const [status, setStatus] = useState<"idle"|"loading"|"ready"|"error"|"no-idea">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [turn, setTurn] = useState(0);
  const [picks, setPicks] = useState<Record<string, number | null>>(initialPicks(session.personas));
  const [shields, setShields] = useState<Record<string, number>>(initialShields(session.personas));
  const [finished, setFinished] = useState(false);

  /* boot — read idea, hit cache or API */
  useEffect(() => {
    const j = loadSession();
    const t = (j?.setup?.topic || "").trim();
    if (!t) {
      setStatus("no-idea");
      // still render with fallback so the page isn't empty
      return;
    }
    setIdea(t);
    const cached = readCache(t);
    if (cached) { applySession(cached); setStatus("ready"); return; }
    fetchSession(t);
  }, []);

  function applySession(s: SessionPayload) {
    setSession(s);
    setPicks(initialPicks(s.personas));
    setShields(initialShields(s.personas));
    setTurn(0);
    setFinished(false);
  }

  async function fetchSession(t: string) {
    setStatus("loading"); setErrorMsg("");
    try {
      const res = await fetch("/api/debate/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: t }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const payload = (await res.json()) as SessionPayload;
      applySession(payload); writeCache(t, payload); setStatus("ready");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to load debate session.");
      setStatus("error");
    }
  }

  function regenerate() {
    if (!idea) return;
    try { localStorage.removeItem(CACHE_KEY); } catch {}
    fetchSession(idea);
  }

  const total = session.rounds.length;
  const currentRound = session.rounds[turn];
  const currentPersona = useMemo(
    () => session.personas.find((p) => p.id === currentRound?.personaId),
    [session, currentRound]
  );

  const statuses = session.personas.reduce((acc, p, i) => {
    if (finished) acc[p.id] = "done";
    else if (i < turn) acc[p.id] = "done";
    else if (i === turn) acc[p.id] = "active";
    else acc[p.id] = "waiting";
    return acc;
  }, {} as Record<string, "waiting" | "active" | "done">);

  const totalShields = Object.values(shields).reduce((a, b) => a + b, 0);
  const maxShields = total * 3;

  /* DebateStage now reports a numeric strength directly (from API eval). */
  const handlePick = (strength: number) => {
    if (!currentPersona) return;
    setPicks((prev) => ({ ...prev, [currentPersona.id]: 1 /* placeholder non-null */ }));
    setShields((prev) => ({ ...prev, [currentPersona.id]: Math.max(1, Math.min(3, strength)) }));
  };

  const handleContinue = () => {
    if (turn + 1 >= total) setFinished(true);
    else setTurn(turn + 1);
  };

  const handleRestart = () => {
    setTurn(0);
    setPicks(initialPicks(session.personas));
    setShields(initialShields(session.personas));
    setFinished(false);
  };

  return (
    <div data-testid="debate-page" className="min-h-screen bg-[var(--paper)] text-black">
      <DebateNavbar
        round={finished ? total : turn + 1}
        total={total}
        shieldsTotal={totalShields}
        maxShields={maxShields}
      />
      <TickerTape />

      {/* status banner */}
      {status === "loading" && <StatusBanner kind="loading" message="Generating panel challenges from your idea…" />}
      {status === "error"   && <StatusBanner kind="error"   message={errorMsg || "Couldn't reach the debate engine. Showing fallback."} onRetry={regenerate} />}
      {status === "no-idea" && <StatusBanner kind="warn"    message="No idea on file — running the demo debate. Run a validation first for a personalised panel." />}

      {/* ── Hero strip ──────────────────────────────────────────────── */}
      <section className="border-b border-black bg-black text-white">
        <div className="mx-auto grid max-w-[1480px] gap-6 px-6 py-8 lg:grid-cols-12 lg:px-10 lg:py-10">
          <div className="lg:col-span-8">
            <div className="font-mono text-[10px] font-semibold tracking-wider text-white/80">
              §DEBATE / DEFENDING
            </div>
            <h1 className="mt-2 font-display text-[32px] leading-[1.35] sm:text-[44px] lg:text-[54px]">
              "{session.idea.title}"
            </h1>
            <p className="mt-3 max-w-2xl font-mono text-[13px] leading-relaxed text-white/85">
              {session.idea.oneLiner}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px border border-white/30 bg-white/15 lg:col-span-4">
            <div className="bg-black p-4">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-white/75">STAGE</div>
              <div className="mt-2 font-display text-xl text-white">{session.idea.stage}</div>
            </div>
            <div className="bg-black p-4">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-white/75">TURN</div>
              <div className="mt-2 font-display text-xl text-white">
                {String(finished ? total : turn + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
              </div>
            </div>
            <div className="bg-black p-4">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-white/75">SHIELDS</div>
              <div className="mt-2 font-display text-xl font-bold text-[var(--hi,#7dd3fc)]">
                {totalShields}/{maxShields}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20">
          <div className="mx-auto flex max-w-[1480px] items-center gap-1 px-6 py-3 lg:px-10">
            {session.rounds.map((_, i) => {
              const isPast = i < turn || finished;
              const isCurrent = !finished && i === turn;
              return (
                <div
                  key={i}
                  data-testid={`progress-${i}`}
                  className={`h-1.5 flex-1 transition-colors ${
                    isPast ? "bg-[var(--hi,#7dd3fc)]" : isCurrent ? "bg-white" : "bg-white/25"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1480px] px-6 py-10 lg:px-10 lg:py-14">
        {!finished ? (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              {currentPersona && currentRound ? (
                <DebateStage
                  key={currentPersona.id + ":" + turn}
                  idea={idea || session.idea.title}
                  persona={currentPersona}
                  round={currentRound}
                  picked={picks[currentPersona.id]}
                  onPick={handlePick}
                  onContinue={handleContinue}
                />
              ) : null}
            </div>
            <div className="lg:col-span-4">
              <PanelRoster
                personas={session.personas}
                statuses={statuses}
                current={currentPersona?.id ?? ""}
                shields={shields}
                onJump={() => {}}
              />
            </div>
          </div>
        ) : (
          <DebateVerdict
            shields={shields}
            picks={picks}
            onRestart={handleRestart}
            onExit={() => router.push("/")}
          />
        )}
      </main>

      <TickerTape dark />
    </div>
  );
}

/* ── status banner ─────────────────────────────────────────────────── */
function StatusBanner({
  kind, message, onRetry,
}: { kind: "loading" | "error" | "warn"; message: string; onRetry?: () => void }) {
  const styles = {
    loading: "border-black bg-[var(--hi-soft,#cfe9ff)] text-black",
    warn:    "border-black bg-[var(--paper,#f4f3ef)] text-black",
    error:   "border-[var(--c-red,#ff3b30)] bg-black text-white",
  } as const;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b-2 px-6 py-3 lg:px-10 ${styles[kind]}`}>
      <div className="flex items-center gap-3 font-mono text-[11px] font-semibold tracking-wider">
        {kind === "loading" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
         : <AlertTriangle className="h-3.5 w-3.5" />}
        {message}
      </div>
      {kind === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="border border-current px-3 py-1 font-mono text-[10px] font-semibold tracking-wider hover:bg-current hover:text-black"
        >
          RETRY
        </button>
      )}
    </div>
  );
}
