"use client";

import Link from "next/link";
import type * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Shield,
  ArrowRight, Send, X, ChevronRight,
  Quote, RotateCcw, Download, Copy, Pause, Play,
  Loader2, Wrench,
} from "lucide-react";
import { loadSession, saveDebateTranscript, saveDebateHandoff } from "@/lib/session";
import { deriveHandoff } from "@/lib/chamber-handoff";
import { openCase, saveSessionRecord, getSessionRecord, getCase, listCases, type RulingVerdict, type ChamberCase } from "@/lib/chamber-cases";
import { recordRuling, recordGapAxes, killRate, getSeatStat, topGapAxes, MIN_SAMPLE } from "@/lib/chamber-stats";
import { groundingFromDashboard, type ChamberGrounding } from "@/lib/chamber-grounding";
import { useTribunalVoice } from "@/components/chamber/useTribunalVoice";
import ChamberVerdict, { type VerdictPersona, type VerdictTurn } from "@/components/chamber/ChamberVerdict";
import MentorDebrief from "@/components/chamber/MentorDebrief";
import QuickCross from "@/components/chamber/QuickCross";
import ChamberResearch from "@/components/chamber/ChamberResearch";
import { JourneyStepper } from "@/components/flow/JourneyStepper";
import { SiteNav } from "@/components/SiteNav";
import { OutOfCreditsModal } from "@/components/credits/OutOfCreditsModal";
import { useRouter } from "next/navigation";
import { useCreditsState } from "@/components/credits/CreditsProvider";
import { CREDIT_COSTS } from "@/lib/credits/costs";
import type { ChamberPersonaId } from "@/lib/chamber-personas";
import { Volume2, VolumeX, Gavel, Zap } from "lucide-react";

/* ============================= TYPES & SEEDS ============================= */
// Credit-gated entry: the Chamber stays locked until the founder spends to unlock.

type Hue = "danger" | "data" | "warn" | "success" | "accent";

type Persona = {
  id: string;
  initials: string;
  name: string;
  role: string;
  archetype: string;
  hue: Hue;
  pressure: number;
  status: "speaking" | "listening" | "preparing";
  bio: string;
  killshot: number;
  dossier: { tenure: string; signature: string; tells: string[]; weakness: string };
};

type Turn = {
  id: number;
  who: string; // persona id or "you"
  role?: string;
  type: "attack" | "rebuttal" | "defense" | "concession" | "verdict" | "shield" | "question";
  severity?: "kill" | "warn" | "insight";
  body: string;
  ts: string;
  /** AI-suggested fail-proof fix attached to an evaluated exchange. */
  fix?: string;
  /** The underlying weakness an attack is probing (used when judging the defence). */
  flaw?: string;
};

const SEED_PERSONAS: Persona[] = [
  { id: "vk", initials: "VK", name: "Vera Klein",      role: "The Investor",  archetype: "Series A Partner · €1.2B AUM",        hue: "data",    pressure: 62, status: "listening", killshot: 18, bio: "Sees through narrative. Asks the unit-economics question you can't answer.",
    dossier: { tenure: "11 years at Index Ventures · led 7 vertical SaaS rounds", signature: "Will calmly ask for your CAC and watch you do mental math.",
      tells: ["Opens with a number", "Repeats your last sentence verbatim before dismantling it", "Never raises her voice"], weakness: "Sensitive to category-defining narratives if backed by 3+ design partners." } },
  { id: "mr", initials: "MR", name: "Marcus Reid",     role: "The Customer",  archetype: "Managing Partner · 140-lawyer firm",  hue: "warn",    pressure: 78, status: "speaking",  killshot: 34, bio: "He IS your buyer. Won't tolerate vendor theater.",
    dossier: { tenure: "23 years in legal practice · sat on 4 vendor selection committees", signature: "Asks the question you wish you'd already asked yourself.",
      tells: ["Cites specific competitor pricing", "Refers to 'my managing committee'", "Drops a war story mid-sentence"], weakness: "Will entertain a wedge that removes work from his partners — not adds to it." } },
  { id: "ht", initials: "HT", name: "Hiro Tanaka",     role: "The Operator",  archetype: "ex-COO, vertical SaaS unicorn",       hue: "success", pressure: 41, status: "listening", killshot: 9,  bio: "Knows what breaks at scale. Distrusts demo-driven optimism.",
    dossier: { tenure: "Scaled a vertical SaaS from $4M → $120M ARR · led 180-person org", signature: "Will draw your org chart on a napkin and circle the headcount you forgot.",
      tells: ["Asks for the on-call rotation", "Wants to see the runbook before the deck", "Quiet for 30s, then surgical"], weakness: "Respects honest 'we don't know yet' over fabricated certainty." } },
  { id: "lv", initials: "LV", name: "Dr. Lena Voss",   role: "The Adversary", archetype: "Strategy professor · INSEAD",         hue: "danger",  pressure: 91, status: "preparing", killshot: 41, bio: "Her job is to kill the idea. Politely. Surgically.",
    dossier: { tenure: "INSEAD strategy chair · 14 published case studies on failed verticals", signature: "Frames every question as a falsifiable hypothesis you can't pass.",
      tells: ["Begins with 'Let's not waste time'", "Refers to your idea in third person", "Smiles before the kill-shot"], weakness: "Cannot resist a counter-thesis that cites her own published work." } },
  { id: "es", initials: "ES", name: "Eduardo Salgado", role: "The Mentor",    archetype: "2× founder · 1 exit · 1 wind-down",   hue: "accent",  pressure: 28, status: "listening", killshot: 6,  bio: "He's been you. He's also been the cautionary tale.",
    dossier: { tenure: "Founded 2 vertical SaaS · $40M exit · 1 wind-down at $8M ARR", signature: "Offers the cautionary tale you secretly already knew.",
      tells: ["Starts with 'I built something close to this in…'", "Volunteers his own failures first", "Speaks last in the round"], weakness: "Will fight FOR you if you frame the defensibility question honestly." } },
];

/** Idle roster — everyone seated, nobody armed. No fake meters. */
const IDLE_PERSONAS: Persona[] = SEED_PERSONAS.map((p) => ({
  ...p,
  pressure: 0,
  killshot: 0,
  status: "listening" as const,
}));

const TOTAL_ROUNDS = 7;
const SHIELDS_TOTAL = 5;
const ROUND_SECONDS = 120;

/**
 * Seed the opening survival score from the AUDITED report, not a fixed 7.5.
 * A weak idea walks into the chamber already bleeding; a strong one starts ahead.
 * Falls back to 7.5 when no validated score is on file.
 */
function seededSurvival(score?: number): number {
  if (typeof score !== "number" || !Number.isFinite(score)) return 7.5;
  return Math.max(2, Math.min(9.5, +(score / 10).toFixed(1)));
}

/**
 * Deterministic opening pressure per seat — NO randomness. Pressure is the
 * inverse of the audited score (weaker idea → harder room), nudged by how
 * lethal each persona's axis is. This keeps the final verdict honest: a
 * persona's pressure only ever moves from a real exchange after this.
 */
function seededPressure(p: Persona, score?: number): number {
  const base = typeof score === "number" && Number.isFinite(score)
    ? Math.max(20, Math.min(85, Math.round(95 - score)))
    : 50;
  const bias = p.hue === "danger" ? 12 : p.hue === "warn" ? 6 : p.hue === "accent" ? -8 : 0;
  return Math.max(15, Math.min(92, base + bias));
}
function seededKillshot(p: Persona, score?: number): number {
  const pressure = seededPressure(p, score);
  const bias = p.hue === "danger" ? 18 : p.hue === "warn" ? 8 : 0;
  return Math.max(0, Math.min(70, Math.round(pressure * 0.45) + bias));
}

const ATTACK_TEMPLATES: Record<string, (idea: string) => { body: string; severity: Turn["severity"] }> = {
  vk: (idea) => ({ severity: "warn",
    body: `Fine. Walk me through the unit economics for "${truncate(idea, 60)}" — specifically: blended CAC, gross margin at 100 customers, and the month you stop being a fundraising story and start being a business. Numbers. Not adjectives.` }),
  mr: (idea) => ({ severity: "kill",
    body: `I'm the buyer. Convince me I should fire my current vendor for this. Not "augment". Fire. Because if you can't rip something out, you're a line item I cut in Q4. What gets ripped out the day "${truncate(idea, 50)}" goes live?` }),
  ht: (idea) => ({ severity: "insight",
    body: `Operationally — month 18, who's on call at 2am when the integration breaks? What's your support coverage in two languages? You're describing a product. I want to see the runbook. The org chart for "${truncate(idea, 50)}" doesn't fit in a seed round.` }),
  lv: (idea) => ({ severity: "kill",
    body: `Let me state your thesis back to you, falsifiably: "${truncate(idea, 90)}" wins because incumbents are slow. That is the same thesis 11 of the 14 case studies I've published opened with. All 11 died. What is materially different here — beyond founder conviction?` }),
  es: (idea) => ({ severity: "insight",
    body: `I'll give you the version a friend would. "${truncate(idea, 60)}" probably gets you to €2–3M ARR on regulatory tailwind. The real question — and I want you to sit with this — is what compounds after that. What's the asset you own in year three that nobody can copy in a weekend?` }),
};

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }

const CHIP_SNIPPETS: Record<string, string> = {
  "+ CITE EVIDENCE": "Per our customer-discovery interviews with the exact buyer persona, ",
  "+ NUMBERS": "Concretely: blended CAC, gross margin and payback month are: ",
  "+ REFRAME PREMISE": "I'd push back on the framing. The real question isn't X, it's: ",
  "+ CONCEDE & PIVOT": "You're right on that point — and that's exactly why we're choosing to ",
};

/* ============================= LIVE MULTI-AGENT WIRING ============================= */

/**
 * Each chamber seat is backed by its OWN AI agent (see src/lib/chamber-personas.ts):
 *  - POST /api/chamber/open    → 5 agents arm in parallel, each returns its lens,
 *    opening attack and the flaw it probes, tailored to the founder's idea.
 *  - POST /api/chamber/respond → the current speaker's agent judges the defence
 *    in character while the next panellist's agent crafts a follow-up attack
 *    that builds on the live transcript.
 */
type TailoredRound = { challenge: string; flaw: string; lens: string; severity: Turn["severity"] };
type TailoredMap = Partial<Record<string, TailoredRound>>; // keyed by seat id

type ApiStatus = "idle" | "loading" | "live" | "offline";

const TAILORED_CACHE_KEY = "priority-debater-chamber-session-v2";

/** Normalize so trivial whitespace/case edits to the same idea still hit cache. */
function cacheKeyFor(idea: string): string {
  return idea.trim().toLowerCase().replace(/\s+/g, " ");
}

function readTailoredCache(idea: string): TailoredMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TAILORED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.key === cacheKeyFor(idea) ? (parsed.map as TailoredMap) : null;
  } catch { return null; }
}

function writeTailoredCache(idea: string, map: TailoredMap) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TAILORED_CACHE_KEY, JSON.stringify({ key: cacheKeyFor(idea), map, savedAt: Date.now() })); } catch {}
}


/** Map an /api/chamber/open payload onto chamber seats. */
function tailoredFromPayload(payload: unknown): TailoredMap {
  const map: TailoredMap = {};
  const seats = (payload as { seats?: Record<string, { lens?: string; attack?: string; flaw?: string; severity?: string }> })?.seats ?? {};
  for (const id of ["vk", "mr", "ht", "lv", "es"]) {
    const s = seats[id];
    if (s?.attack) {
      const sev = s.severity === "kill" || s.severity === "warn" || s.severity === "insight" ? s.severity : "warn";
      map[id] = { challenge: s.attack, flaw: s.flaw ?? "", lens: s.lens ?? "", severity: sev };
    }
  }
  return map;
}

type EvalResult = { strength: 1 | 2 | 3; reactionQuote: string; flawCaught: string; fix: string };
type RespondPayload = {
  eval: EvalResult | null;
  next: { attack: string; flaw: string; severity: Turn["severity"] } | null;
};

/* ============================= COLOR HELPERS ============================= */

const HUE = {
  danger:  { border: "border-danger",  text: "text-danger",  bg: "bg-danger",  ring: "shadow-[0_0_0_1px_var(--danger),0_0_60px_-10px_var(--danger)]" },
  data:    { border: "border-data",    text: "text-data",    bg: "bg-data",    ring: "shadow-[0_0_0_1px_var(--data),0_0_60px_-10px_var(--data)]" },
  warn:    { border: "border-warn",    text: "text-warn",    bg: "bg-warn",    ring: "shadow-[0_0_0_1px_var(--warn),0_0_60px_-10px_var(--warn)]" },
  success: { border: "border-success", text: "text-success", bg: "bg-success", ring: "shadow-[0_0_0_1px_var(--success),0_0_60px_-10px_var(--success)]" },
  accent:  { border: "border-accent",  text: "text-accent",  bg: "bg-accent",  ring: "shadow-[0_0_0_1px_var(--accent),0_0_60px_-10px_var(--accent)]" },
} as const;

function fmtClock(totalSec: number) {
  const m = Math.max(0, Math.floor(totalSec / 60));
  const s = Math.max(0, totalSec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ============================= PAGE ============================= */

export default function DebateChamber() {
  const router = useRouter();
  const { state: creditsState, refresh: refreshCredits } = useCreditsState();
  const [ideaDraft, setIdeaDraft] = useState("");
  const [idea, setIdea] = useState("");
  const [sessionActive, setSessionActive] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>(IDLE_PERSONAS);
  const [transcript, setTranscript] = useState<Turn[]>([]);
  const [round, setRound] = useState(0);
  const [survival, setSurvival] = useState(0);
  const [survivalDelta, setSurvivalDelta] = useState(0);
  const [shieldsUsed, setShieldsUsed] = useState(0);
  const [response, setResponse] = useState("");
  const [activeSpeaker, setActiveSpeaker] = useState("lv");
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [showQuickCross, setShowQuickCross] = useState(false);
  // Silent research phase (§1.2) — shown while the panel arms on the real grounding.
  const [researching, setResearching] = useState(false);
  // Credit gate — set when the founder tries to enter without enough credits.
  const [creditGate, setCreditGate] = useState<{ balance: number } | null>(null);

  // Persistent Case File (§3) + Revise & Re-Enter arc (§5).
  const [caseId, setCaseId] = useState<string | null>(null);
  // When the current run revises a prior case, the arc against that parent.
  const [revisionOf, setRevisionOf] = useState<{ label: string; parentLabel: string; parentFinal: number } | null>(null);
  // Set by "revise" actions → the next startSession opens a linked child case.
  const reviseParentRef = useRef<string | null>(null);
  // Case ids whose ruling has been folded into the track record (avoid double-count).
  const recordedCases = useRef<Set<string>>(new Set());

  // Live engine state
  const [tailored, setTailored] = useState<TailoredMap>({});
  const [tailoredUsed, setTailoredUsed] = useState<Record<string, boolean>>({});
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [evaluating, setEvaluating] = useState(false);
  const [lastEval, setLastEval] = useState<EvalResult | null>(null);

  // Grounding from the audited report — feeds the agents real competitors/risks/score.
  const [grounding, setGrounding] = useState<ChamberGrounding | null>(null);
  // Real defence scores per persona (1-3), keyed by seat id — drives the honest final ruling.
  const [personaScores, setPersonaScores] = useState<Record<string, number[]>>({});
  // Two-way mode: founder can interrogate a panellist instead of only defending.
  const [composerMode, setComposerMode] = useState<"defend" | "ask">("defend");
  const [asking, setAsking] = useState(false);
  // Pause the round clock while the founder is actively typing (no punitive timeouts mid-thought).
  const [composerFocused, setComposerFocused] = useState(false);

  // The tribunal SPEAKS — distinct synthesized voice per agent (offline, no API).
  const [voiceOn, setVoiceOn] = useState(true);
  const voice = useTribunalVoice(voiceOn);
  const lastSpokenId = useRef<number | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  /** Arm all five persona agents for this idea (cached per idea). */
  const fetchTailored = useCallback(async (ideaText: string, ground: ChamberGrounding | null, revise = false): Promise<TailoredMap | null> => {
    const cached = readTailoredCache(ideaText);
    if (cached) { setTailored(cached); setTailoredUsed({}); setApiStatus("live"); return cached; }
    setApiStatus("loading");
    try {
      const res = await fetch(`/api/chamber/open${revise ? "?mode=revise" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaText, grounding: ground ?? undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const map = tailoredFromPayload(await res.json());
      if (Object.keys(map).length === 0) throw new Error("empty payload");
      setTailored(map);
      setTailoredUsed({});
      writeTailoredCache(ideaText, map);
      setApiStatus("live");
      return map;
    } catch {
      setApiStatus("offline");
      return null;
    }
  }, []);

  /** Begin a real session for an idea: reset state, arm the agents, open fire. */
  const startSession = useCallback(async (text: string) => {
    // Pull the audited report for THIS idea — seeds the score and arms the agents
    // with real competitors/risks instead of generic improv.
    const ground = groundingFromDashboard(loadSession()?.dashboardData);
    const score = ground?.score;

    // Open (or resume) the persistent case. A pending revise-parent forces a
    // linked CHILD case (#0007-B) so the improvement arc is recorded.
    const parentId = reviseParentRef.current;
    reviseParentRef.current = null;
    const openedCase = openCase(text, parentId);
    setCaseId(openedCase.id);
    if (openedCase.parentCaseId) {
      const parent = getCase(openedCase.parentCaseId);
      const parentRun = getSessionRecord(openedCase.parentCaseId);
      setRevisionOf(parent && parentRun
        ? { label: openedCase.label, parentLabel: parent.label, parentFinal: parentRun.finalSurvival }
        : null);
    } else {
      setRevisionOf(null);
    }

    setGrounding(ground);
    setPersonaScores({});
    setIdea(text);
    setSessionActive(true);
    setRound(1);
    setShieldsUsed(0);
    setSurvival(seededSurvival(score));
    setSurvivalDelta(0);
    setElapsed(0);
    setTimeLeft(ROUND_SECONDS);
    setLastEval(null);
    setResponse("");
    setComposerMode("defend");
    setPaused(false);
    setPersonas(SEED_PERSONAS.map((p) => ({ ...p, pressure: seededPressure(p, score), killshot: seededKillshot(p, score) })));
    setActiveSpeaker("lv");
    setTranscript([]);
    // Silent research phase (§1.2): surface the real grounding while the agents
    // arm in the background. Hold a minimum beat so the log reads as real work.
    setResearching(true);
    const [map] = await Promise.all([
      fetchTailored(text, ground, !!parentId),
      new Promise((r) => setTimeout(r, 1700)),
    ]);
    const opener = map?.lv
      ? { body: map.lv.challenge, severity: map.lv.severity, flaw: map.lv.flaw }
      : { ...ATTACK_TEMPLATES.lv(text), flaw: undefined };
    setTailoredUsed(map?.lv ? { lv: true } : {});
    setTranscript([{ id: Date.now(), who: "lv", role: "ADVERSARY", type: "attack", severity: opener.severity, body: opener.body, flaw: opener.flaw, ts: "00:00:00" }]);
    setResearching(false);
  }, [fetchTailored]);

  /**
   * Gate entry on credits, then start. A debate costs once per idea, so an
   * already-paid idea (e.g. a page refresh) re-enters free; a new idea is
   * charged, and an empty balance raises the top-up modal instead of starting.
   */
  const beginSession = useCallback((text: string) => {
    const idea = text.trim();
    if (!idea) return;
    // A revision always opens a fresh (linked) case, so it's charged even if this
    // idea's agents happen to be cached; the discount reflects reused grounding.
    const revising = !!reviseParentRef.current;
    const cost = revising ? CREDIT_COSTS.debate_revise : CREDIT_COSTS.debate;
    // A cached open means this idea's debate was already paid → free re-entry
    // (the server charges only on a real /api/chamber/open call).
    const alreadyOpened = !revising && !!readTailoredCache(idea);
    if (!alreadyOpened && creditsState.configured) {
      if (!creditsState.authed) { router.push("/login?next=/debate"); return; }
      if ((creditsState.balance ?? 0) < cost) { setCreditGate({ balance: creditsState.balance ?? 0 }); return; }
    }
    void startSession(idea).then(() => { if (!alreadyOpened) void refreshCredits(); });
  }, [startSession, creditsState, router, refreshCredits]);

  // Boot — prefill the validated idea but DON'T auto-start. The Chamber stays
  // locked until the founder clicks Enter (which charges the "debate" credits).
  useEffect(() => {
    const stored = loadSession()?.setup?.topic?.trim();
    if (stored) setIdeaDraft(stored);
  }, []);

  // Timer — only runs during an active session. Pauses while the founder is
  // actively typing so they're never punished for taking time to think.
  useEffect(() => {
    if (!sessionActive || paused || composerFocused || evaluating || asking) return;
    const t = setInterval(() => {
      setTimeLeft((s) => Math.max(0, s - 1));
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [sessionActive, paused, composerFocused, evaluating, asking]);

  // Time-out → adversary lands free hit
  useEffect(() => {
    if (sessionActive && timeLeft === 0 && !paused) {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Persist the transcript so /results can fold the debate into the dossier (#4),
  // and derive the weak-point handoff so Brand/Launch/Campaign seed from what the
  // panel actually exposed rather than starting from a blank pitch.
  useEffect(() => {
    if (!sessionActive || !idea || transcript.length === 0) return;
    saveDebateTranscript(idea, renderMarkdown(idea, transcript, personas, { round, survival, shieldsUsed }), survival);
    saveDebateHandoff(
      deriveHandoff(
        idea,
        transcript.map((t) => ({ who: t.who, type: t.type, severity: t.severity, body: t.body })),
        personas.map((p) => ({ id: p.id, name: p.name, role: p.role })),
        personaScores,
        survival,
      ),
    );
  }, [sessionActive, idea, transcript, personas, round, survival, shieldsUsed, personaScores]);

  // The agents speak their latest line aloud as it lands.
  useEffect(() => {
    if (!sessionActive || !voiceOn) return;
    const last = [...transcript].reverse().find((t) => t.who !== "you");
    if (!last || last.id === lastSpokenId.current) return;
    lastSpokenId.current = last.id;
    voice.speak(last.who as ChamberPersonaId, last.body);
  }, [transcript, sessionActive, voiceOn, voice]);

  const nextTs = useCallback((): string => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `00:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [elapsed]);

  const pickNextSpeaker = useCallback((skip?: string) => {
    const candidates = personas.filter((p) => p.id !== skip);
    // Who has already taken the floor (delivered an attack/rebuttal)?
    const spoken = new Set(transcript.filter((t) => t.who !== "you").map((t) => t.who));
    const byThreat = (a: Persona, b: Persona) => (b.pressure + b.killshot * 0.5) - (a.pressure + a.killshot * 0.5);
    // Coverage first: every persona speaks once before anyone speaks twice.
    const unspoken = candidates.filter((p) => !spoken.has(p.id)).sort(byThreat);
    if (unspoken.length > 0) return unspoken[0];
    return [...candidates].sort(byThreat)[0];
  }, [personas, transcript]);

  /* ---------- ACTIONS ---------- */

  const advanceToNextRound = useCallback((nextSpeakerId: string) => {
    setRound((r) => Math.min(TOTAL_ROUNDS, r + 1));
    setTimeLeft(ROUND_SECONDS);
    setPersonas((prev) =>
      prev.map((p) => ({
        ...p,
        status: p.id === nextSpeakerId ? "speaking" : p.killshot > 30 ? "preparing" : "listening",
      })),
    );
    setActiveSpeaker(nextSpeakerId);
  }, []);

  /** Next attack for a seat — the agent's armed opener first, template after. */
  const attackFor = useCallback((personaId: string): { body: string; severity: Turn["severity"]; flaw?: string } => {
    const t = tailored[personaId];
    if (t && !tailoredUsed[personaId]) {
      setTailoredUsed((u) => ({ ...u, [personaId]: true }));
      return { body: t.challenge, severity: t.severity, flaw: t.flaw };
    }
    return ATTACK_TEMPLATES[personaId](idea);
  }, [tailored, tailoredUsed, idea]);

  const handleSend = useCallback(async () => {
    if (!response.trim() || evaluating || !sessionActive) return;
    const text = response.trim();
    const speakerId = activeSpeaker;
    const speaker = personas.find((p) => p.id === speakerId)!;
    const lastAttack = [...transcript].reverse().find((t) => t.who !== "you");
    const next = pickNextSpeaker(speakerId);

    const defense: Turn = { id: Date.now(), who: "you", type: "defense", ts: nextTs(), body: text };
    setTranscript((t) => [...t, defense]);
    setResponse("");
    setEvaluating(true);

    // Two live agents per exchange: the speaker judges, the next seat attacks.
    let evalResult: EvalResult | null = null;
    let nextAttackLive: RespondPayload["next"] = null;
    try {
      const res = await fetch("/api/chamber/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          speakerId,
          nextSpeakerId: next.id,
          challenge: lastAttack?.body ?? "",
          flaw: lastAttack?.flaw ?? tailored[speakerId]?.flaw ?? "",
          defence: text,
          history: transcript.slice(-8).map((t) => ({ who: t.who, body: t.body })),
          grounding: grounding ?? undefined,
        }),
      });
      if (res.ok) {
        const j = (await res.json()) as RespondPayload;
        if (j?.eval?.strength === 1 || j?.eval?.strength === 2 || j?.eval?.strength === 3) evalResult = j.eval;
        if (j?.next?.attack) nextAttackLive = j.next;
      }
    } catch { /* offline — fall through to heuristic */ }

    let survivalShift: number;
    let pressureDrop: number;
    let reaction: Turn | null = null;

    if (evalResult) {
      setApiStatus("live");
      setLastEval(evalResult);
      // Record the REAL score this persona gave — the final verdict reads from here, not pressure.
      setPersonaScores((prev) => ({ ...prev, [speakerId]: [...(prev[speakerId] ?? []), evalResult!.strength] }));
      survivalShift = evalResult.strength === 3 ? 1.0 : evalResult.strength === 2 ? 0.2 : -0.7;
      pressureDrop = evalResult.strength === 3 ? 22 : evalResult.strength === 2 ? 10 : 2;
      reaction = {
        id: Date.now() + 1,
        who: speakerId,
        role: speaker.role.replace("The ", "").toUpperCase(),
        type: "rebuttal",
        severity: evalResult.strength === 3 ? "insight" : evalResult.strength === 2 ? "warn" : "kill",
        body: evalResult.reactionQuote,
        fix: evalResult.fix,
        ts: nextTs(),
      };
    } else {
      // OFFLINE — no AI. Score with a transparent heuristic and SAY it's simulated.
      setLastEval(null);
      const hasNumbers = /\d/.test(text);
      const long = text.length > 220;
      const quality = (hasNumbers ? 0.4 : 0) + (long ? 0.3 : 0) + Math.min(0.3, text.length / 1500);
      survivalShift = +(quality * 1.4 - 0.3).toFixed(2); // -0.3 .. +1.1
      pressureDrop = Math.round(8 + quality * 14);
      reaction = {
        id: Date.now() + 1,
        who: speakerId,
        role: speaker.role.replace("The ", "").toUpperCase(),
        type: "rebuttal",
        severity: quality > 0.5 ? "insight" : quality > 0.2 ? "warn" : "kill",
        body: hasNumbers
          ? `Noted — there are numbers in that. The live panel is offline so I can't truly weigh it; bring this answer back when the engine is up and I'll score it for real.`
          : `That reads like assertion, not evidence. The live panel is offline, so treat this as a rough read, not a verdict — numbers and named sources would move me.`,
        ts: nextTs(),
      };
      // brief deliberation beat so the simulated panel doesn't answer instantly
      await new Promise((r) => setTimeout(r, 700));
    }

    // current speaker eases up
    setPersonas((prev) => prev.map((p) => p.id === speakerId
      ? { ...p, pressure: Math.max(10, p.pressure - pressureDrop), killshot: Math.max(0, p.killshot - 10) }
      : p));

    setSurvival((s) => Math.max(0, Math.min(10, +(s + survivalShift).toFixed(1))));
    setSurvivalDelta(+survivalShift.toFixed(1));

    // queue next attacker — live agent attack first, armed/template fallback after
    const tmpl = nextAttackLive
      ? { body: nextAttackLive.attack, severity: nextAttackLive.severity, flaw: nextAttackLive.flaw }
      : attackFor(next.id);
    const attack: Turn = {
      id: Date.now() + 2,
      who: next.id,
      role: next.role.replace("The ", "").toUpperCase(),
      type: "attack",
      severity: tmpl.severity,
      body: tmpl.body,
      flaw: tmpl.flaw,
      ts: nextTs(),
    };

    setTranscript((t) => [...t, ...(reaction ? [reaction] : []), attack]);

    // next persona ramps up
    setPersonas((prev) => prev.map((p) => p.id === next.id
      ? { ...p, pressure: Math.min(99, p.pressure + 12), killshot: Math.min(80, p.killshot + 15) }
      : p));

    setEvaluating(false);
    advanceToNextRound(next.id);
    requestAnimationFrame(() => transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [response, evaluating, sessionActive, activeSpeaker, personas, transcript, idea, tailored, grounding, nextTs, pickNextSpeaker, attackFor, advanceToNextRound]);

  /** Two-way: the founder interrogates the persona holding the floor. No score, no attack — a real answer. */
  const handleAsk = useCallback(async () => {
    if (!response.trim() || asking || evaluating || !sessionActive) return;
    const text = response.trim();
    const targetId = activeSpeaker;
    const target = personas.find((p) => p.id === targetId)!;

    const question: Turn = { id: Date.now(), who: "you", type: "question", ts: nextTs(), body: text };
    setTranscript((t) => [...t, question]);
    setResponse("");
    setAsking(true);

    let answer = "";
    try {
      const res = await fetch("/api/chamber/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          personaId: targetId,
          question: text,
          history: transcript.slice(-8).map((t) => ({ who: t.who, body: t.body })),
          grounding: grounding ?? undefined,
        }),
      });
      if (res.ok) { const j = (await res.json()) as { answer?: string }; answer = j?.answer ?? ""; }
    } catch { /* offline */ }

    if (!answer) {
      answer = `${target.name.split(" ")[0]}: the live panel is offline — put that to me again when the engine is up and I'll answer straight.`;
    }
    const reply: Turn = {
      id: Date.now() + 1, who: targetId, role: target.role.replace("The ", "").toUpperCase(),
      type: "rebuttal", severity: "insight", body: answer, ts: nextTs(),
    };
    setTranscript((t) => [...t, reply]);
    setAsking(false);
    requestAnimationFrame(() => transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [response, asking, evaluating, sessionActive, activeSpeaker, personas, transcript, idea, grounding, nextTs]);

  const handleConcede = useCallback(() => {
    if (!sessionActive) return;
    const concession: Turn = {
      id: Date.now(), who: "you", type: "concession", ts: nextTs(),
      body: response.trim() || "Conceded. You're right — I don't have a defensible answer for that yet. I'll come back with data.",
    };
    setPersonas((prev) => prev.map((p) => p.id === activeSpeaker
      ? { ...p, pressure: Math.max(15, p.pressure - 20), killshot: Math.max(0, p.killshot - 18) }
      : { ...p, pressure: Math.min(99, p.pressure + 4) }));
    setSurvival((s) => Math.max(0, +(s - 0.3).toFixed(1)));
    setSurvivalDelta(-0.3);
    const next = pickNextSpeaker(activeSpeaker);
    const tmpl = attackFor(next.id);
    setTranscript((t) => [...t, concession, {
      id: Date.now() + 1, who: next.id, role: next.role.replace("The ","").toUpperCase(),
      type: "attack", severity: tmpl.severity, body: tmpl.body, flaw: tmpl.flaw, ts: nextTs(),
    }]);
    setResponse("");
    setLastEval(null);
    advanceToNextRound(next.id);
  }, [response, sessionActive, activeSpeaker, nextTs, pickNextSpeaker, attackFor, advanceToNextRound]);

  const handleShield = useCallback(() => {
    if (!sessionActive || shieldsUsed >= SHIELDS_TOTAL) return;
    setShieldsUsed((n) => n + 1);
    const mentor = personas.find((p) => p.id === "es")!;
    setPersonas((prev) => prev.map((p) => ({ ...p, pressure: Math.max(15, p.pressure - 10), killshot: Math.max(0, p.killshot - 8) })));
    setSurvival((s) => Math.min(10, +(s + 0.4).toFixed(1)));
    setSurvivalDelta(+0.4);
    const shieldTurn: Turn = {
      id: Date.now(), who: "es", role: "MENTOR", type: "shield", severity: "insight", ts: nextTs(),
      body: `Shield invoked. Let me reframe for the room — the founder is asking for one round to ground this in evidence rather than rhetoric. That's the right move. We move to the next axis.`,
    };
    setTranscript((t) => [...t, shieldTurn]);
    const next = pickNextSpeaker("es");
    setTimeLeft(ROUND_SECONDS);
    setActiveSpeaker(next.id);
    void mentor;
  }, [sessionActive, shieldsUsed, personas, nextTs, pickNextSpeaker]);

  const handleTimeout = useCallback(() => {
    const speaker = personas.find((p) => p.id === activeSpeaker)!;
    const timeoutTurn: Turn = {
      id: Date.now(), who: activeSpeaker, role: speaker.role.replace("The ","").toUpperCase(),
      type: "attack", severity: "kill", ts: nextTs(),
      body: `Silence is an answer. You had two minutes and gave us nothing. The room logs that as a concession on this axis.`,
    };
    setTranscript((t) => [...t, timeoutTurn]);
    setSurvival((s) => Math.max(0, +(s - 0.6).toFixed(1)));
    setSurvivalDelta(-0.6);
    const next = pickNextSpeaker(activeSpeaker);
    advanceToNextRound(next.id);
  }, [activeSpeaker, personas, nextTs, pickNextSpeaker, advanceToNextRound]);

  const handleChip = useCallback((label: keyof typeof CHIP_SNIPPETS | string) => {
    const snippet = CHIP_SNIPPETS[label as string];
    if (!snippet) return;
    setResponse((r) => (r ? r.replace(/\s*$/, " ") : "") + snippet);
  }, []);

  const handleEnterChamber = useCallback(() => {
    if (!ideaDraft.trim()) return;
    beginSession(ideaDraft.trim());
  }, [ideaDraft, beginSession]);

  /** Persist the full run into the Case File once the ruling is assembled (§3). */
  const handleRuling = useCallback((r: { overall: string; synthesisLead: string; verdicts: RulingVerdict[] }) => {
    if (!caseId) return;
    const handoff = deriveHandoff(
      idea,
      transcript.map((t) => ({ who: t.who, type: t.type, severity: t.severity, body: t.body })),
      personas.map((p) => ({ id: p.id, name: p.name, role: p.role })),
      personaScores,
      survival,
    );
    saveSessionRecord(caseId, {
      roundCount: round,
      finalSurvival: survival,
      transcriptMd: renderMarkdown(idea, transcript, personas, { round, survival, shieldsUsed }),
      ruling: { overall: r.overall, synthesisLead: r.synthesisLead, verdicts: r.verdicts, gaps: handoff.gaps },
    });
    // Fold this ruling into the persona track record + evidence axes — once per
    // case, so re-opening the verdict modal doesn't inflate the counts (§2/§8).
    if (!recordedCases.current.has(caseId)) {
      recordedCases.current.add(caseId);
      recordRuling(r.verdicts.map((v) => ({ personaId: v.personaId, ruling: v.ruling })));
      recordGapAxes(handoff.gaps.map((g) => g.axis));
    }
  }, [caseId, idea, transcript, personas, personaScores, survival, round, shieldsUsed]);

  /** End the session and return the chamber to its idle state. No fake data. */
  const handleReset = useCallback(() => {
    setSessionActive(false);
    setIdea("");
    setPersonas(IDLE_PERSONAS);
    setTranscript([]);
    setRound(0); setSurvival(0); setSurvivalDelta(0);
    setShieldsUsed(0); setResponse(""); setActiveSpeaker("lv");
    setTimeLeft(ROUND_SECONDS); setElapsed(0); setPaused(false);
    setLastEval(null); setTailoredUsed({});
    setGrounding(null); setPersonaScores({}); setComposerMode("defend"); setAsking(false);
    setCaseId(null); setRevisionOf(null);
  }, []);

  /** Revise & Re-Enter (§5): keep the idea in the composer, link the next run as a
   *  child case, and return to idle so the founder can edit before re-entering. */
  const handleRevise = useCallback(() => {
    reviseParentRef.current = caseId;
    setShowDebrief(false);
    setShowVerdict(false);
    setIdeaDraft(idea);          // handleReset clears `idea` but not the draft
    handleReset();
  }, [caseId, idea, handleReset]);

  const handleExportMarkdown = useCallback(async () => {
    const md = renderMarkdown(idea, transcript, personas, { round, survival, shieldsUsed });
    try { await navigator.clipboard.writeText(md); } catch {}
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `chamber-session-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  }, [idea, transcript, personas, round, survival, shieldsUsed]);

  const handleCopyMarkdown = useCallback(async () => {
    const md = renderMarkdown(idea, transcript, personas, { round, survival, shieldsUsed });
    try { await navigator.clipboard.writeText(md); } catch {}
  }, [idea, transcript, personas, round, survival, shieldsUsed]);

  const handleExportPDF = useCallback(() => { window.print(); }, []);

  const handleContinue = useCallback(() => {
    if (!sessionActive) return;
    if (round >= TOTAL_ROUNDS) { setShowVerdict(true); return; }
    const next = pickNextSpeaker(activeSpeaker);
    const tmpl = attackFor(next.id);
    setTranscript((t) => [...t, {
      id: Date.now(), who: next.id, role: next.role.replace("The ","").toUpperCase(),
      type: "attack", severity: tmpl.severity, body: tmpl.body, flaw: tmpl.flaw, ts: nextTs(),
    }]);
    advanceToNextRound(next.id);
  }, [sessionActive, round, activeSpeaker, nextTs, pickNextSpeaker, attackFor, advanceToNextRound]);

  /* ---------- DERIVED ---------- */

  const kills = transcript.filter((t) => t.severity === "kill").length;
  const warns = transcript.filter((t) => t.severity === "warn").length;
  const insights = transcript.filter((t) => t.severity === "insight").length;

  const verdictNow = useMemo(() => {
    if (!sessionActive) return "The chamber is empty. Submit an idea above and five agents will pressure-test it live.";
    if (survival >= 8) return "Idea is holding the line. Defensibility is sharp. The panel is pushing deeper into operational risk.";
    if (survival >= 6) return "Idea survives the initial volley. Plausible wedge, but key axes remain undefended.";
    if (survival >= 4) return "Idea is bleeding. Unanswered kill-shots on record. You are defending rhetoric, not data.";
    return "Idea is broken. The chamber would not fund this in its current form. Return with evidence.";
  }, [sessionActive, survival]);

  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground">
      <TopBar sessionActive={sessionActive} onReset={handleReset} onPause={() => setPaused((p) => !p)} paused={paused} apiStatus={apiStatus}
        voiceOn={voiceOn} voiceSupported={voice.supported} speaking={voice.speaking} onToggleVoice={() => setVoiceOn((v) => !v)} />
      <JourneyStepper current="debate" />
      <Hero
        ideaDraft={ideaDraft} setIdeaDraft={setIdeaDraft} onEnter={handleEnterChamber}
        survival={survival} survivalDelta={survivalDelta} round={round}
        timeLeft={timeLeft} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} verdict={verdictNow}
        apiStatus={apiStatus} sessionActive={sessionActive} revisionOf={revisionOf}
        onQuickCross={ideaDraft.trim() ? () => setShowQuickCross(true) : undefined}
        unlockCost={creditsState.configured ? (reviseParentRef.current ? CREDIT_COSTS.debate_revise : CREDIT_COSTS.debate) : null}
        balanceNote={
          creditsState.configured
            ? creditsState.authed
              ? `Costs ${reviseParentRef.current ? CREDIT_COSTS.debate_revise : CREDIT_COSTS.debate} credits · you have ${creditsState.balance ?? 0}`
              : `Sign in to enter · ${CREDIT_COSTS.debate} credits per debate`
            : null
        }
      />
      {!sessionActive && <CaseFilesStrip onReopen={(t) => { reviseParentRef.current = null; setIdeaDraft(t); }} onRevise={(id, t) => { reviseParentRef.current = id; setIdeaDraft(t); }} />}
      <PanelStrip personas={personas} activeSpeaker={sessionActive ? activeSpeaker : ""} onOpenDossier={setDossierId}
        speakingId={voiceOn ? voice.speakingId : null} sessionActive={sessionActive} />
      <div ref={transcriptRef} />
      <ChamberConversation
        transcript={transcript} personas={personas} response={response} setResponse={setResponse}
        timeLeft={timeLeft} round={round} apiStatus={apiStatus}
        shieldsUsed={shieldsUsed} onSend={handleSend} onConcede={handleConcede} onShield={handleShield}
        onChip={handleChip} evaluating={evaluating} lastEval={lastEval} sessionActive={sessionActive}
        voiceOn={voiceOn} speaking={voice.speaking}
        onReplay={(t) => voiceOn && voice.speak(t.who as ChamberPersonaId, t.body)}
        composerMode={composerMode} setComposerMode={setComposerMode} onAsk={handleAsk} asking={asking}
        onComposerFocus={() => setComposerFocused(true)} onComposerBlur={() => setComposerFocused(false)}
        kills={kills} warns={warns} insights={insights}
        onExportMD={handleExportMarkdown} onCopyMD={handleCopyMarkdown} onExportPDF={handleExportPDF}
      />
      <VerdictBar survival={survival} round={round} onContinue={handleContinue} onReset={handleReset}
        sessionActive={sessionActive} onVerdict={() => setShowVerdict(true)} />
      {dossierId && <DossierModal persona={personas.find(p => p.id === dossierId)!} onClose={() => setDossierId(null)} />}
      {creditGate && (
        <OutOfCreditsModal action="debate" balance={creditGate.balance} onClose={() => setCreditGate(null)} />
      )}
      {showVerdict && (
        <ChamberVerdict
          idea={idea}
          survival={survival}
          round={round}
          totalRounds={TOTAL_ROUNDS}
          personas={personas.map<VerdictPersona>((p) => ({
            id: p.id, name: p.name, role: p.role, initials: p.initials, hue: p.hue, pressure: p.pressure, killshot: p.killshot,
          }))}
          scores={personaScores}
          transcript={transcript.map<VerdictTurn>((t) => ({ who: t.who, type: t.type, severity: t.severity, body: t.body }))}
          onClose={() => setShowVerdict(false)}
          onReset={() => { setShowVerdict(false); handleReset(); }}
          onDebrief={() => setShowDebrief(true)}
          onRuling={handleRuling}
        />
      )}
      {showDebrief && (
        <MentorDebrief
          handoff={deriveHandoff(
            idea,
            transcript.map((t) => ({ who: t.who, type: t.type, severity: t.severity, body: t.body })),
            personas.map((p) => ({ id: p.id, name: p.name, role: p.role })),
            personaScores,
            survival,
          )}
          grounding={grounding}
          onClose={() => setShowDebrief(false)}
          onRevise={handleRevise}
        />
      )}
      {showQuickCross && (
        <QuickCross
          idea={ideaDraft.trim()}
          grounding={groundingFromDashboard(loadSession()?.dashboardData)}
          onClose={() => setShowQuickCross(false)}
          onEnterFull={() => { setShowQuickCross(false); beginSession(ideaDraft.trim()); }}
        />
      )}
      {researching && <ChamberResearch idea={idea} grounding={grounding} />}
    </div>
  );
}

/* ============================= CHROME ============================= */

function TopBar({ sessionActive, onReset, onPause, paused, apiStatus, voiceOn, voiceSupported, speaking, onToggleVoice }:
  { sessionActive: boolean; onReset: () => void; onPause: () => void; paused: boolean; apiStatus: ApiStatus;
    voiceOn: boolean; voiceSupported: boolean; speaking: boolean; onToggleVoice: () => void }) {
  const status = !sessionActive
    ? "Chamber · Idle"
    : apiStatus === "live" ? "Chamber · AI panel armed"
    : apiStatus === "loading" ? "Chamber · Arming panel…"
    : "Chamber · Simulated panel";
  return (
    <div className="print:hidden">
      <SiteNav
        subtitle={status}
        actions={
          <div className="flex items-center gap-2">
            {voiceSupported && (
              <button onClick={onToggleVoice} title={voiceOn ? "Mute the tribunal" : "Let the tribunal speak"}
                className={`flex items-center gap-1.5 px-3 py-2 border font-mono text-[10px] uppercase tracking-[0.16em] font-bold transition-colors ${voiceOn ? "border-[#32d74b] text-[#32d74b]" : "border-white/30 text-white hover:bg-white hover:text-black"}`}>
                {voiceOn ? <Volume2 className={`size-3 ${speaking ? "animate-pulse" : ""}`} /> : <VolumeX className="size-3" />}
                <span className="hidden sm:inline">{voiceOn ? (speaking ? "Speaking" : "Voice on") : "Voice off"}</span>
              </button>
            )}
            {sessionActive ? (
              <>
                <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-2 border border-white/30 text-white font-mono text-[10px] uppercase tracking-[0.16em] font-bold hover:bg-white hover:text-black transition-colors">
                  {paused ? <><Play className="size-3" /> Resume</> : <><Pause className="size-3" /> Pause</>}
                </button>
                <span className="hidden sm:flex items-center gap-2 px-3 py-2 border border-[#ff3b30] text-[#ff3b30] font-mono text-[10px] uppercase tracking-[0.16em] font-bold">
                  <span className="size-1.5 rounded-full bg-[#ff3b30] animate-pulse" /> {paused ? "Paused" : "Live"}
                </span>
                <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-2 bg-[#ff3b30] text-white font-mono text-[10px] uppercase tracking-[0.16em] font-bold hover:bg-white hover:text-black transition-colors">
                  <RotateCcw className="size-3" /> End
                </button>
              </>
            ) : (
              <span className="flex items-center gap-2 px-3 py-2 border border-white/30 text-white/60 font-mono text-[10px] uppercase tracking-[0.16em] font-bold">
                <span className="size-1.5 rounded-full bg-white/40" /> Idle
              </span>
            )}
          </div>
        }
      />
    </div>
  );
}

function Hero({ ideaDraft, setIdeaDraft, onEnter, survival, survivalDelta, round, timeLeft, shieldsLeft, verdict, apiStatus, sessionActive, unlockCost, balanceNote, revisionOf, onQuickCross }:
  { ideaDraft: string; setIdeaDraft: (s: string) => void; onEnter: () => void; survival: number; survivalDelta: number; round: number; timeLeft: number; shieldsLeft: number; verdict: string; apiStatus: ApiStatus; sessionActive: boolean; unlockCost?: number | null; balanceNote?: string | null; revisionOf?: { label: string; parentLabel: string; parentFinal: number } | null; onQuickCross?: () => void }) {
  const tone = survival >= 7 ? "text-success" : survival >= 5 ? "text-warn" : "text-danger";
  return (
    <section className="relative bg-ink text-ink-foreground border-y border-ink grid-bg-ink print:hidden">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-16 grid lg:grid-cols-[1.4fr_1fr] gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-6 text-[10px] tracking-widest text-ink-foreground/60">
            {sessionActive
              ? <span className="px-2 py-1 border border-danger text-danger">● CHAMBER ACTIVE</span>
              : <span className="px-2 py-1 border border-ink-foreground/40 text-ink-foreground/70">○ CHAMBER IDLE</span>}
            <span>§00 / DEBATE MODE</span>
            <span>FIVE ADVERSARIES · ONE IDEA</span>
          </div>
          <h1 className="text-display text-4xl md:text-6xl lg:text-7xl text-ink-foreground">
            Welcome to <span className="hl-red">The Chamber.</span>
          </h1>
          <p className="mt-8 max-w-xl text-sm text-ink-foreground/70 leading-relaxed">
            Five ruthless strategic perspectives will pressure-test your idea in real time.
            Defend it. Cede the right ground. Or watch it break — quietly, in front of the
            people who would have funded it.
          </p>
          <form className="mt-10 flex flex-col sm:flex-row gap-2 max-w-2xl" onSubmit={(e) => { e.preventDefault(); onEnter(); }}>
            <input
              value={ideaDraft}
              onChange={(e) => setIdeaDraft(e.target.value)}
              className="flex-1 bg-ink-foreground/5 border border-ink-foreground/25 text-ink-foreground placeholder:text-ink-foreground/40 px-4 py-4 text-sm focus:outline-none focus:border-data"
              placeholder="Paste the idea you want pressure-tested…"
            />
            <button type="submit" disabled={apiStatus === "loading"} className="px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {apiStatus === "loading"
                ? <><Loader2 className="size-4 animate-spin" /> ARMING PANEL…</>
                : <>{sessionActive ? "RE-ENTER" : "UNLOCK THE CHAMBER"}{!sessionActive && unlockCost ? ` · ${unlockCost} CR` : ""} <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {balanceNote && !sessionActive && (
              <div className="inline-block border border-ink-foreground/25 px-2.5 py-1 font-mono text-[10px] tracking-widest text-ink-foreground/70">
                {balanceNote}
              </div>
            )}
            {/* Quick Cross (§7) — one seat, cheaper, before committing to the full room. */}
            {!sessionActive && onQuickCross && (
              <button type="button" onClick={onQuickCross}
                className="inline-flex items-center gap-1.5 border border-data/50 text-data px-2.5 py-1 font-mono text-[10px] tracking-widest hover:bg-data/10">
                <Zap className="size-3" /> QUICK CROSS · ONE SEAT
              </button>
            )}
          </div>
          <div className="mt-3 text-[10px] tracking-widest text-ink-foreground/45">
            {apiStatus === "live" ? "◉ LIVE — FIVE AI AGENTS GENERATE EVERY ATTACK & SCORE FOR THIS IDEA"
              : apiStatus === "loading" ? "◌ ARMING FIVE AGENTS — EACH IS STUDYING YOUR IDEA"
              : apiStatus === "offline" ? "◌ ENGINE UNREACHABLE — RUNNING SIMULATED PANEL"
              : "◌ NOTHING IS PRE-WRITTEN — THE SESSION ONLY EXISTS ONCE YOU SUBMIT AN IDEA"}
          </div>
        </div>
        <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-6 self-start">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-widest text-ink-foreground/55">LIVE SURVIVAL SCORE</div>
            {sessionActive && <div className="text-[10px] tracking-widest text-ink-foreground/40">CASE {revisionOf ? `#${revisionOf.label}` : ""}</div>}
          </div>
          {/* Revise & Re-Enter arc — this run against the parent case (§5). */}
          {sessionActive && revisionOf && (
            <div className="mb-3 flex items-center gap-2 border border-data/40 bg-data/[0.06] px-2.5 py-1.5 font-mono text-[10px] tracking-widest">
              <span className="text-ink-foreground/60">#{revisionOf.parentLabel} → #{revisionOf.label}</span>
              <span className="text-ink-foreground/40">·</span>
              <span className={survival >= revisionOf.parentFinal ? "text-success" : "text-danger"}>
                {revisionOf.parentFinal.toFixed(1)} → {survival.toFixed(1)} {survival >= revisionOf.parentFinal ? "▲" : "▼"}{Math.abs(survival - revisionOf.parentFinal).toFixed(1)}
              </span>
            </div>
          )}
          <div className="flex items-end gap-4">
            {sessionActive ? (
              <div key={survival} className={`font-display text-[5.5rem] sm:text-[8rem] leading-none ${tone} chamber-pop`}>{survival.toFixed(1)}</div>
            ) : (
              <div className="font-display text-[5.5rem] sm:text-[8rem] leading-none text-ink-foreground/25">—</div>
            )}
            <div className="text-ink-foreground/55 mb-4 text-xl">/ 10</div>
          </div>
          {sessionActive ? (
            <div className={`text-xs ${survivalDelta >= 0 ? "text-success" : "text-danger"}`}>
              {survivalDelta >= 0 ? "▲" : "▼"} {Math.abs(survivalDelta).toFixed(1)} last exchange · trending {survivalDelta >= 0 ? "UP" : "DOWN"}
            </div>
          ) : (
            <div className="text-xs text-ink-foreground/40">NO SESSION · SCORE SEEDS FROM YOUR AUDITED REPORT, THEN MOVES WITH EVERY EXCHANGE</div>
          )}
          <div className="mt-6 grid grid-cols-3 border border-ink-foreground/20">
            <MiniStat label="ROUND" value={sessionActive ? `${round}/${TOTAL_ROUNDS}` : "—"} />
            <MiniStat label="TIME LEFT" value={sessionActive ? fmtClock(timeLeft) : "—"} tone={sessionActive && timeLeft < 30 ? "danger" : sessionActive ? "warn" : undefined} />
            <MiniStat label="SHIELDS" value={sessionActive ? `${shieldsLeft}/${SHIELDS_TOTAL}` : "—"} />
          </div>
          <div className="mt-5 text-[10px] tracking-widest text-ink-foreground/55 mb-2">CURRENT VERDICT</div>
          <p className="text-xs text-ink-foreground/80 leading-relaxed">{verdict}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Prior case files (§3 persistence + §5 re-entry). Reads the persistent case
 * store on mount and lets the founder re-open an idea fresh, or revise it as a
 * linked child case. Renders nothing until at least one case exists.
 */
function CaseFilesStrip({ onReopen, onRevise }: { onReopen: (idea: string) => void; onRevise: (parentId: string, idea: string) => void }) {
  const [cases, setCases] = useState<ChamberCase[]>([]);
  const [patterns, setPatterns] = useState<{ axis: string; count: number }[]>([]);
  useEffect(() => { setCases(listCases()); setPatterns(topGapAxes(3)); }, []);
  if (cases.length === 0) return null;
  return (
    <section className="bg-ink text-ink-foreground border-b border-ink print:hidden">
      <div className="mx-auto max-w-[1100px] px-4 md:px-8 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-widest text-ink-foreground/45">YOUR CASE FILES · {cases.length}</div>
          <div className="hidden sm:block text-[10px] tracking-widest text-ink-foreground/40">RE-OPEN TO RUN AGAIN · REVISE TO OPEN A LINKED CASE</div>
        </div>
        {/* Evidence Library seed (§8) — where YOUR ideas keep breaking. Becomes a
            cross-user benchmark once the shared library is wired server-side. */}
        {patterns.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2 border border-ink-foreground/15 px-3 py-2">
            <span className="text-[9px] tracking-widest text-ink-foreground/40">WHERE YOUR IDEAS BREAK MOST ·</span>
            {patterns.map((p) => (
              <span key={p.axis} className="font-mono text-[10px] tracking-widest text-ink-foreground/70">{p.axis} <span className="text-danger">×{p.count}</span></span>
            ))}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {cases.slice(0, 6).map((c) => {
            const rec = getSessionRecord(c.id);
            const s = rec?.finalSurvival;
            const tone = s == null ? "text-ink-foreground/40" : s >= 7 ? "text-success" : s >= 5 ? "text-warn" : "text-danger";
            return (
              <div key={c.id} className="flex items-center gap-3 border border-ink-foreground/15 px-3 py-2.5">
                <div className="font-mono text-[11px] text-ink-foreground/50 shrink-0">#{c.label}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink-foreground/85">{c.ideaText}</div>
                  <div className="text-[9px] tracking-widest text-ink-foreground/40 mt-0.5">
                    {c.status === "ruled" ? <>RULED · <span className={tone}>{s?.toFixed(1)}/10</span></> : "OPEN · NO RULING YET"}
                    {c.parentCaseId ? " · REVISION" : ""}
                  </div>
                </div>
                <button onClick={() => onReopen(c.ideaText)} title="Load this idea to run again"
                  className="shrink-0 px-2.5 py-1.5 border border-ink-foreground/25 text-ink-foreground/70 font-mono text-[9px] tracking-widest hover:bg-ink-foreground/5">RE-OPEN</button>
                <button onClick={() => onRevise(c.id, c.ideaText)} title="Open a linked revision of this case"
                  className="shrink-0 px-2.5 py-1.5 border border-data/50 text-data font-mono text-[9px] tracking-widest hover:bg-data/10">REVISE</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "danger" }) {
  const color = tone === "warn" ? "text-warn" : tone === "danger" ? "text-danger" : "text-ink-foreground";
  return (
    <div className="p-4 border-r last:border-r-0 border-ink-foreground/20">
      <div className="text-[10px] tracking-widest mb-2 text-ink-foreground/55">{label}</div>
      <div className={`font-display text-2xl ${color}`}>{value}</div>
    </div>
  );
}

/* ============================= TRIBUNAL ============================= */

function PanelStrip({ personas, activeSpeaker, onOpenDossier, speakingId, sessionActive }:
  { personas: Persona[]; activeSpeaker: string; onOpenDossier: (id: string) => void; speakingId: ChamberPersonaId | null; sessionActive: boolean }) {
  const order = ["vk", "ht", "mr", "es", "lv"];
  const seats = order.map((id) => personas.find((p) => p.id === id)!);
  return (
    <section className="bg-ink text-ink-foreground border-b border-ink print:hidden">
      <div className="mx-auto max-w-[1100px] px-4 md:px-8 py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-widest text-ink-foreground/45">THE PANEL · FIVE ADVERSARIES</div>
          <div className="hidden sm:block text-[10px] tracking-widest text-ink-foreground/45">CLICK A SEAT FOR ITS DOSSIER</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {seats.map((p) => {
            const c = HUE[p.hue];
            const active = sessionActive && p.id === activeSpeaker;
            const speaking = speakingId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onOpenDossier(p.id)}
                title={`${p.name} — ${p.role}`}
                className={`flex items-center gap-2.5 border px-3 py-2 transition-colors ${active ? `${c.border} bg-ink-foreground/[0.06]` : "border-ink-foreground/15 hover:border-ink-foreground/35"}`}
              >
                <span className={`size-8 grid place-items-center border ${c.border} font-display text-sm ${c.text}`}>{p.initials}</span>
                <span className="text-left">
                  <span className="block font-display text-sm leading-none text-ink-foreground">{p.name}</span>
                  <span className={`block text-[9px] tracking-widest mt-1 ${active ? c.text : "text-ink-foreground/45"}`}>
                    {speaking ? "SPEAKING" : active ? "HOLDING FLOOR" : p.role.toUpperCase()}
                  </span>
                </span>
                {speaking && <SpeakingBars className={c.text} />}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================= CHAMBER CORE ============================= */

/**
 * Reveal a freshly-landed line character by character so each attack feels
 * spoken in real time rather than appearing as a finished block. Falls back to
 * the full string instantly when disabled (e.g. print) or when text repeats.
 */
function useTypewriter(text: string, enabled: boolean, cps = 90): string {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!enabled || !text) { setOut(text); return; }
    setOut("");
    let i = 0;
    const step = Math.max(1, Math.round(cps / 20));
    const id = setInterval(() => {
      i += step;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [text, enabled, cps]);
  return out;
}

function ChamberConversation({
  transcript, personas, response, setResponse, timeLeft, round, apiStatus, shieldsUsed,
  onSend, onConcede, onShield, onChip, evaluating, lastEval, sessionActive,
  voiceOn, speaking, onReplay,
  composerMode, setComposerMode, onAsk, asking, onComposerFocus, onComposerBlur,
  kills, warns, insights, onExportMD, onCopyMD, onExportPDF,
}: {
  transcript: Turn[]; personas: Persona[]; response: string; setResponse: (v: string) => void;
  timeLeft: number; round: number; apiStatus: ApiStatus; shieldsUsed: number;
  onSend: () => void; onConcede: () => void; onShield: () => void; onChip: (label: string) => void;
  evaluating: boolean; lastEval: EvalResult | null; sessionActive: boolean;
  voiceOn: boolean; speaking: boolean; onReplay: (t: Turn) => void;
  composerMode: "defend" | "ask"; setComposerMode: (m: "defend" | "ask") => void;
  onAsk: () => void; asking: boolean; onComposerFocus: () => void; onComposerBlur: () => void;
  kills: number; warns: number; insights: number;
  onExportMD: () => void; onCopyMD: () => void; onExportPDF: () => void;
}) {
  const MAX = 1200;
  const threadRef = useRef<HTMLDivElement>(null);
  const lastNonYou = [...transcript].reverse().find((t) => t.who !== "you");
  const speaker = (lastNonYou && personas.find((p) => p.id === lastNonYou.who)) || personas[0];
  const sc = HUE[speaker.hue];
  const pct = ((ROUND_SECONDS - timeLeft) / ROUND_SECONDS) * 100;

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    const el = threadRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [transcript.length, evaluating, asking]);

  return (
    <section className="bg-background border-b border-border">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 py-12 print:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground mb-2">— THE FLOOR · LIVE EXCHANGE</div>
            <h2 className="text-display text-3xl md:text-4xl text-foreground leading-tight">
              The <span className="hl-red">conversation.</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] tracking-widest print:hidden">
            {sessionActive && kills + warns + insights > 0 && (
              <span className="hidden sm:flex items-center gap-1">
                <span className="px-1.5 py-0.5 border border-danger text-danger">{kills}K</span>
                <span className="px-1.5 py-0.5 border border-warn text-warn">{warns}W</span>
                <span className="px-1.5 py-0.5 border border-data text-data">{insights}I</span>
              </span>
            )}
            {lastEval && (
              <span className={`px-1.5 py-0.5 border ${lastEval.strength === 3 ? "border-success text-success" : lastEval.strength === 2 ? "border-warn text-warn" : "border-danger text-danger"}`}>
                RATED {lastEval.strength}/3
              </span>
            )}
            <span className="px-2 py-1 border border-border text-muted-foreground">R{round}/{TOTAL_ROUNDS}</span>
            <button onClick={onExportMD} title="Download transcript (.md)" className="px-2 py-1.5 border border-border text-muted-foreground hover:bg-surface"><Download className="size-3" /></button>
            <button onClick={onCopyMD} title="Copy transcript" className="px-2 py-1.5 border border-border text-muted-foreground hover:bg-surface"><Copy className="size-3" /></button>
            <button onClick={onExportPDF} title="Print / PDF" className="px-2 py-1.5 border border-border text-muted-foreground hover:bg-surface">PDF</button>
          </div>
        </div>

        <div className="border-2 border-ink bg-ink text-ink-foreground">
          {sessionActive && (
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-ink-foreground/15 print:hidden">
              <div className="flex items-center gap-3 min-w-0">
                {lastNonYou ? (
                  <>
                    <span className={`size-9 shrink-0 grid place-items-center border ${sc.border} font-display text-sm ${sc.text}`}>{speaker.initials}</span>
                    <div className="min-w-0">
                      <div className="text-[10px] tracking-widest text-ink-foreground/55 flex items-center gap-2">
                        ON THE FLOOR {voiceOn && speaking && <SpeakingBars className={sc.text} />}
                      </div>
                      <div className="font-display text-sm leading-tight truncate">
                        {speaker.name} <span className={`text-[10px] tracking-widest ${sc.text}`}>· {speaker.role.toUpperCase()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] tracking-widest text-ink-foreground/55">THE PANEL IS CONVENING…</div>
                )}
              </div>
              <CountdownRing pct={pct} label={fmtClock(timeLeft)} critical={timeLeft < 30} />
            </div>
          )}

          <div ref={threadRef} className="max-h-[58vh] overflow-y-auto px-4 md:px-6 py-6 space-y-5 grid-bg-ink print:max-h-none print:overflow-visible">
            {sessionActive && apiStatus === "offline" && (
              <div className="flex items-start gap-2.5 border border-warn/50 bg-warn/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-warn print:hidden">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                <span className="tracking-wide">
                  <span className="font-bold">SIMULATED PANEL.</span>{" "}
                  <span className="text-ink-foreground/70">
                    The live AI engine is unreachable, so attacks and scores are run by a transparent
                    heuristic — not the five agents. Bring your answers back when the engine is live for a real verdict.
                  </span>
                </span>
              </div>
            )}
            {transcript.length === 0 ? (
              <div className="py-12 text-center">
                {sessionActive ? (
                  <div className="inline-flex items-center gap-3 text-ink-foreground/70">
                    <Loader2 className="size-5 animate-spin text-data" />
                    <span className="font-display text-lg">The panel is convening…</span>
                  </div>
                ) : (
                  <div>
                    <div className="font-display text-2xl text-ink-foreground/60">The chamber is empty.</div>
                    <div className="text-[10px] tracking-widest text-ink-foreground/45 mt-2">SUBMIT YOUR IDEA ABOVE — THE FIRST ATTACK LANDS HERE</div>
                  </div>
                )}
              </div>
            ) : (
              transcript.map((t) => (
                <ThreadBubble key={t.id} t={t} personas={personas}
                  isLatest={!!lastNonYou && t.id === lastNonYou.id}
                  voiceOn={voiceOn} speaking={speaking} onReplay={onReplay} />
              ))
            )}
            {(evaluating || asking) && (
              <div className="flex items-center gap-2 text-ink-foreground/60 text-[11px] tracking-widest">
                <span className="inline-flex gap-1">
                  <span className="size-1.5 bg-ink-foreground/60 animate-bounce" />
                  <span className="size-1.5 bg-ink-foreground/60 animate-bounce [animation-delay:120ms]" />
                  <span className="size-1.5 bg-ink-foreground/60 animate-bounce [animation-delay:240ms]" />
                </span>
                {asking ? "PANELLIST IS THINKING…" : "THE PANEL IS DELIBERATING…"}
              </div>
            )}
          </div>

          <div className="border-t-2 border-ink-foreground/15 p-4 md:p-5 print:hidden">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="inline-flex border border-ink-foreground/20 text-[10px] tracking-widest">
                <button type="button" disabled={!sessionActive} onClick={() => setComposerMode("defend")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-40 ${composerMode === "defend" ? "bg-danger text-ink-foreground" : "text-ink-foreground/60 hover:text-ink-foreground"}`}>
                  <Shield className="size-3" /> DEFEND
                </button>
                <button type="button" disabled={!sessionActive} onClick={() => setComposerMode("ask")}
                  className={`px-3 py-1.5 flex items-center gap-1.5 border-l border-ink-foreground/20 transition-colors disabled:opacity-40 ${composerMode === "ask" ? "bg-data text-ink" : "text-ink-foreground/60 hover:text-ink-foreground"}`}>
                  <Quote className="size-3" /> QUESTION
                </button>
              </div>
              <div className="flex items-center gap-1.5" title={`${SHIELDS_TOTAL - shieldsUsed} shields remaining`}>
                <span className="text-[9px] tracking-widest text-ink-foreground/40">SHIELDS</span>
                {Array.from({ length: SHIELDS_TOTAL }).map((_, i) => (
                  <span key={i} className={`size-2 ${i < shieldsUsed ? "bg-ink-foreground/20" : "bg-data"}`} />
                ))}
              </div>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value.slice(0, MAX))}
              onFocus={onComposerFocus}
              onBlur={onComposerBlur}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (composerMode === "ask") onAsk(); else onSend(); } }}
              disabled={!sessionActive}
              placeholder={!sessionActive
                ? "The floor opens once a session is live — submit your idea above."
                : composerMode === "ask"
                  ? `Ask ${speaker.name.split(" ")[0]} anything — "what would change your mind?" (⌘+Enter)`
                  : "Draft your rebuttal. Numbers travel, adjectives die. (⌘+Enter to send)"}
              className="w-full h-32 bg-ink-foreground/5 border border-ink-foreground/25 text-ink-foreground placeholder:text-ink-foreground/35 p-3.5 text-sm leading-relaxed focus:outline-none focus:border-data resize-none disabled:opacity-50"
            />
            {composerMode === "defend" && (
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] tracking-widest">
                {Object.keys(CHIP_SNIPPETS).map((label) => (<Chip key={label} onClick={() => onChip(label)}>{label}</Chip>))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] tracking-widest text-ink-foreground/40">{response.length} / {MAX}</span>
              {composerMode === "ask" ? (
                <button onClick={onAsk} disabled={!response.trim() || asking || evaluating || !sessionActive}
                  className="px-5 py-3 bg-data text-ink font-display text-xs tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {asking ? <><Loader2 className="size-4 animate-spin" /> THINKING…</> : <><Send className="size-4" /> ASK {speaker.name.split(" ")[0].toUpperCase()}</>}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={onShield} disabled={!sessionActive || shieldsUsed >= SHIELDS_TOTAL}
                    className="px-3 py-3 border border-data text-data font-display text-xs tracking-widest hover:bg-data/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <Shield className="size-4" /> <span className="hidden sm:inline">SHIELD</span>
                  </button>
                  <button onClick={onConcede} disabled={!sessionActive}
                    className="px-3 py-3 border border-ink-foreground/30 text-ink-foreground/80 font-display text-xs tracking-widest hover:bg-ink-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    <X className="size-4" /> <span className="hidden sm:inline">CONCEDE</span>
                  </button>
                  <button onClick={onSend} disabled={!response.trim() || evaluating || asking || !sessionActive}
                    className="px-5 py-3 bg-danger text-ink-foreground font-display text-xs tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    {evaluating ? <><Loader2 className="size-4 animate-spin" /> DELIBERATING…</> : <><Send className="size-4" /> DELIVER</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThreadBubble({ t, personas, isLatest, voiceOn, speaking, onReplay }:
  { t: Turn; personas: Persona[]; isLatest: boolean; voiceOn: boolean; speaking: boolean; onReplay: (t: Turn) => void }) {
  const isYou = t.who === "you";
  const persona = !isYou ? personas.find((p) => p.id === t.who) : null;
  const hue: Hue = isYou ? "data" : (persona?.hue ?? "data");
  const c = HUE[hue];
  const typed = useTypewriter(t.body, isLatest && !isYou);
  const showCursor = isLatest && !isYou && typed.length < t.body.length;
  const sevTone: Hue | null = t.severity === "kill" ? "danger" : t.severity === "warn" ? "warn" : t.severity === "insight" ? "data" : null;
  const sev = sevTone ? HUE[sevTone] : null;
  const label = isYou
    ? (t.type === "question" ? "YOU · QUESTION" : t.type === "concession" ? "YOU · CONCEDE" : "YOU")
    : `${persona?.name ?? t.who}${t.role ? ` · ${t.role}` : ""}`;

  return (
    <div className={`flex gap-3 ${isYou ? "flex-row-reverse" : ""}`}>
      <span className={`size-8 shrink-0 grid place-items-center border ${c.border} font-display text-[11px] ${c.text} bg-ink`}>
        {isYou ? "YOU" : persona?.initials ?? "?"}
      </span>
      <div className={`min-w-0 max-w-[86%] flex flex-col ${isYou ? "items-end" : "items-start"}`}>
        <div className="text-[9px] tracking-widest text-ink-foreground/45 mb-1 flex items-center gap-2">
          <span className="truncate">{label}</span>
          {sev && <span className={`px-1 py-0.5 border ${sev.border} ${sev.text}`}>{t.severity!.toUpperCase()}</span>}
          {!isYou && voiceOn && (
            <button onClick={() => onReplay(t)} title="Replay aloud" className={`${c.text} opacity-60 hover:opacity-100`}><Volume2 className="size-3" /></button>
          )}
        </div>
        <div className={`border px-3 py-2 text-[14px] leading-relaxed text-ink-foreground text-left ${isYou ? "border-data/40 bg-data/[0.06]" : "border-ink-foreground/15 bg-ink-foreground/[0.03]"}`}>
          {isYou ? t.body : <>{typed}{showCursor && <span className="ml-0.5 inline-block w-1.5 -mb-0.5 h-4 bg-current animate-pulse" />}</>}
        </div>
        {t.fix && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-ink-foreground/70 leading-snug border-l-2 border-data pl-2 text-left">
            <Wrench className="size-3 text-data shrink-0 mt-0.5" />
            <span><span className="text-data tracking-widest text-[9px]">FAIL-PROOF FIX · </span>{t.fix}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SpeakingBars({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[2px] h-3 ${className}`} aria-label="speaking">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="w-[2px] bg-current chamber-eq" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </span>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 border border-ink-foreground/20 text-ink-foreground/70 hover:bg-ink-foreground/5 hover:text-ink-foreground transition-colors">
      {children}
    </button>
  );
}

function CountdownRing({ pct, label, critical }: { pct: number; label: string; critical?: boolean }) {
  const r = 26;
  const C = 2 * Math.PI * r;
  const dash = (pct / 100) * C;
  const stroke = critical ? "var(--danger)" : "var(--warn)";
  return (
    <div className={`relative size-16 shrink-0 ${critical ? "animate-pulse" : ""}`}>
      <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="color-mix(in oklab, var(--ink-foreground) 15%, transparent)" strokeWidth="3" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={stroke} strokeWidth="3" strokeDasharray={`${dash} ${C}`} strokeLinecap="butt" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`font-display text-sm leading-none ${critical ? "text-danger" : "text-warn"}`}>{label}</div>
          <div className="text-[8px] tracking-widest text-ink-foreground/55 mt-0.5">LEFT</div>
        </div>
      </div>
    </div>
  );
}

/* ============================= VERDICT BAR ============================= */

function VerdictBar({ survival, round, onContinue, onReset, sessionActive, onVerdict }:
  { survival: number; round: number; onContinue: () => void; onReset: () => void; sessionActive: boolean; onVerdict: () => void }) {
  const tone = survival >= 7 ? "text-success" : survival >= 5 ? "text-warn" : "text-danger";
  return (
    <section className="bg-ink text-ink-foreground border-y border-ink grid-bg-ink print:hidden">
      <div className="mx-auto max-w-[1100px] px-4 md:px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[10px] tracking-widest text-ink-foreground/55">
                {sessionActive ? (round >= TOTAL_ROUNDS ? "FINAL · " : "PROVISIONAL · ") : "NO SESSION"}
                {sessionActive ? `ROUND ${round}/${TOTAL_ROUNDS}` : ""}
              </div>
              <div className={`font-display text-4xl leading-none mt-1 ${sessionActive ? tone : "text-ink-foreground/30"}`}>
                {sessionActive ? survival.toFixed(1) : "—"}<span className="text-ink-foreground/40 text-lg"> / 10</span>
              </div>
            </div>
            <p className="max-w-sm text-sm text-ink-foreground/70 leading-relaxed">
              {sessionActive
                ? "Survival is the panel's running read. End the session for the full ruling — five verdicts, one decision."
                : "Submit an idea above to open a live session and earn a verdict."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sessionActive && (round >= TOTAL_ROUNDS ? (
              <button onClick={onVerdict} className="px-5 py-3 bg-danger text-ink-foreground font-display text-xs tracking-widest hover:opacity-90 flex items-center gap-2">
                <Gavel className="size-4" /> RENDER VERDICT
              </button>
            ) : (
              <>
                <button onClick={onContinue} className="px-5 py-3 bg-danger text-ink-foreground font-display text-xs tracking-widest hover:opacity-90 flex items-center gap-2">
                  CONTINUE · ROUND {round + 1} <ChevronRight className="size-4" />
                </button>
                <button onClick={onVerdict} className="px-5 py-3 border border-data text-data font-display text-xs tracking-widest hover:bg-data/10 flex items-center gap-2">
                  <Gavel className="size-4" /> VERDICT NOW
                </button>
              </>
            ))}
            <Link href="/results" className="px-5 py-3 border border-ink-foreground/40 text-ink-foreground font-display text-xs tracking-widest hover:bg-ink-foreground/5 flex items-center gap-2">
              FULL REPORT <ArrowRight className="size-4" />
            </Link>
            <Link href="/brand-kit" className="px-5 py-3 bg-accent text-accent-foreground font-display text-xs tracking-widest hover:opacity-90 flex items-center gap-2">
              BRAND KIT <ArrowRight className="size-4" />
            </Link>
            {sessionActive && (
              <button onClick={onReset} className="px-5 py-3 border border-warn text-warn font-display text-xs tracking-widest hover:bg-warn/10 flex items-center gap-2">
                <AlertTriangle className="size-4" /> ABANDON
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================= DOSSIER MODAL ============================= */

/** A seat's running track record from this device's ruled sessions (§2). */
function TrackRecord({ personaId }: { personaId: string }) {
  const [stat, setStat] = useState<{ heard: number; killed: number; passed: number } | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => { setStat(getSeatStat(personaId)); setRate(killRate(personaId)); }, [personaId]);
  if (!stat || stat.heard === 0) return null;
  return (
    <div className="mt-6 border border-ink-foreground/20 p-4">
      <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-2">TRACK RECORD · THIS DEVICE</div>
      {rate != null ? (
        <p className="text-sm text-ink-foreground/85 leading-relaxed">
          Has killed <span className="font-display text-danger">{rate}%</span> of the {stat.heard} idea{stat.heard === 1 ? "" : "s"} heard here
          {" "}<span className="text-ink-foreground/50">({stat.killed} killed · {stat.passed} passed)</span>.
        </p>
      ) : (
        <p className="text-sm text-ink-foreground/60 leading-relaxed">
          {stat.heard} idea{stat.heard === 1 ? "" : "s"} heard so far — a kill rate appears after {MIN_SAMPLE}. Cross-user history arrives with the shared library.
        </p>
      )}
    </div>
  );
}

function DossierModal({ persona, onClose }: { persona: Persona; onClose: () => void }) {
  const c = HUE[persona.hue];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm grid place-items-center p-4 print:hidden" onClick={onClose}>
      <div className="bg-ink text-ink-foreground border border-ink-foreground/25 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-foreground/15">
          <div className="text-[10px] tracking-widest text-ink-foreground/55">DOSSIER · CLASSIFIED · CHAMBER USE ONLY</div>
          <button onClick={onClose} className="text-ink-foreground/55 hover:text-ink-foreground"><X className="size-4" /></button>
        </div>
        <div className="p-8">
          <div className="flex items-start gap-6">
            <div className={`size-24 grid place-items-center border-2 ${c.border} font-display text-4xl ${c.text}`}>{persona.initials}</div>
            <div>
              <div className="font-display text-3xl text-ink-foreground">{persona.name}</div>
              <div className={`text-[11px] tracking-widest mt-1 ${c.text}`}>{persona.role.toUpperCase()}</div>
              <div className="text-xs text-ink-foreground/60 mt-1">{persona.archetype}</div>
              <div className="text-xs text-ink-foreground/60 mt-2">{persona.dossier.tenure}</div>
            </div>
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <Stat label="PRESSURE" value={`${persona.pressure}%`} tone={persona.hue} />
            <Stat label="KILL-SHOT PROB." value={`${persona.killshot}%`} tone={persona.killshot > 30 ? "danger" : "success"} />
          </div>

          {/* Track record (§2) — the seat's real history on THIS device. Honest
              about scope until the server aggregates it across all users. */}
          <TrackRecord personaId={persona.id} />

          <div className="mt-6">
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-2">SIGNATURE MOVE</div>
            <p className="text-sm text-ink-foreground/85 leading-relaxed border-l-2 border-ink-foreground/30 pl-4 italic">“{persona.dossier.signature}”</p>
          </div>

          <div className="mt-6">
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-2">TELLS</div>
            <ul className="space-y-1.5">
              {persona.dossier.tells.map((t, i) => (
                <li key={i} className="text-sm text-ink-foreground/80 flex gap-2"><span className={`mt-2 size-1.5 ${c.bg}`} />{t}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-2">EXPLOITABLE WEAKNESS</div>
            <p className="text-sm text-ink-foreground/85 leading-relaxed border-l-2 border-success pl-4">{persona.dossier.weakness}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: Hue }) {
  const c = HUE[tone];
  return (
    <div className="border border-ink-foreground/20 p-4">
      <div className="text-[10px] tracking-widest text-ink-foreground/55">{label}</div>
      <div className={`font-display text-2xl mt-1 ${c.text}`}>{value}</div>
    </div>
  );
}

/* ============================= EXPORT HELPERS ============================= */

function renderMarkdown(idea: string, transcript: Turn[], personas: Persona[], meta: { round: number; survival: number; shieldsUsed: number }) {
  const lines: string[] = [];
  lines.push(`# The Chamber — Session Transcript`, ``);
  lines.push(`**Idea:** ${idea}`, ``);
  lines.push(`**Round:** ${meta.round} / ${TOTAL_ROUNDS}  `);
  lines.push(`**Survival:** ${meta.survival.toFixed(1)} / 10  `);
  lines.push(`**Shields used:** ${meta.shieldsUsed} / ${SHIELDS_TOTAL}`, ``, `---`, ``);
  for (const t of transcript) {
    const who = t.who === "you" ? "You (Founder)" : personas.find(p => p.id === t.who)?.name ?? t.who;
    lines.push(`### [${t.ts}] ${who} — ${t.type.toUpperCase()}${t.severity ? ` · ${t.severity.toUpperCase()}` : ""}`);
    lines.push(``, t.body, ``);
    if (t.fix) lines.push(`> **Fail-proof fix (7 days):** ${t.fix}`, ``);
  }
  return lines.join("\n");
}
