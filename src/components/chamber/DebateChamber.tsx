"use client";

import Link from "next/link";
import type * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Shield, Flame, Mic, Activity, Skull,
  ArrowRight, Clock, Send, X, ChevronRight, Eye,
  Crosshair, Radio, Quote, Zap, RotateCcw, Download, Copy, Pause, Play,
  Loader2, Wrench,
} from "lucide-react";
import { loadSession, saveDebateTranscript } from "@/lib/session";
import { useTribunalVoice } from "@/components/chamber/useTribunalVoice";
import ChamberVerdict, { type VerdictPersona, type VerdictTurn } from "@/components/chamber/ChamberVerdict";
import type { ChamberPersonaId } from "@/lib/chamber-personas";
import { Volume2, VolumeX, Gavel } from "lucide-react";

/* ============================= TYPES & SEEDS ============================= */

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
  type: "attack" | "rebuttal" | "defense" | "concession" | "verdict" | "shield";
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

function readTailoredCache(idea: string): TailoredMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TAILORED_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.idea === idea ? (parsed.map as TailoredMap) : null;
  } catch { return null; }
}

function writeTailoredCache(idea: string, map: TailoredMap) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TAILORED_CACHE_KEY, JSON.stringify({ idea, map, savedAt: Date.now() })); } catch {}
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
function fmtElapsed(sec: number) {
  const m = Math.floor(sec / 60); const s = sec % 60;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

/* ============================= PAGE ============================= */

export default function DebateChamber() {
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

  // Live engine state
  const [tailored, setTailored] = useState<TailoredMap>({});
  const [tailoredUsed, setTailoredUsed] = useState<Record<string, boolean>>({});
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [evaluating, setEvaluating] = useState(false);
  const [lastEval, setLastEval] = useState<EvalResult | null>(null);

  // The tribunal SPEAKS — distinct synthesized voice per agent (offline, no API).
  const [voiceOn, setVoiceOn] = useState(true);
  const voice = useTribunalVoice(voiceOn);
  const lastSpokenId = useRef<number | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  /** Arm all five persona agents for this idea (cached per idea). */
  const fetchTailored = useCallback(async (ideaText: string): Promise<TailoredMap | null> => {
    const cached = readTailoredCache(ideaText);
    if (cached) { setTailored(cached); setTailoredUsed({}); setApiStatus("live"); return cached; }
    setApiStatus("loading");
    try {
      const res = await fetch("/api/chamber/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaText }),
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
    setIdea(text);
    setSessionActive(true);
    setRound(1);
    setShieldsUsed(0);
    setSurvival(7.5);
    setSurvivalDelta(0);
    setElapsed(0);
    setTimeLeft(ROUND_SECONDS);
    setLastEval(null);
    setResponse("");
    setPaused(false);
    setPersonas(SEED_PERSONAS.map((p) => ({ ...p, pressure: 30 + Math.floor(Math.random() * 30), killshot: Math.floor(Math.random() * 20) })));
    setActiveSpeaker("lv");
    setTranscript([]);
    // arm the five agents with idea-specific challenges, then open with the adversary
    const map = await fetchTailored(text);
    const opener = map?.lv
      ? { body: map.lv.challenge, severity: map.lv.severity, flaw: map.lv.flaw }
      : { ...ATTACK_TEMPLATES.lv(text), flaw: undefined };
    setTailoredUsed(map?.lv ? { lv: true } : {});
    setTranscript([{ id: Date.now(), who: "lv", role: "ADVERSARY", type: "attack", severity: opener.severity, body: opener.body, flaw: opener.flaw, ts: "00:00:00" }]);
  }, [fetchTailored]);

  // Boot — a validated idea on file starts a real session automatically
  useEffect(() => {
    const stored = loadSession()?.setup?.topic?.trim();
    if (stored) {
      setIdeaDraft(stored);
      void startSession(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer — only runs during an active session
  useEffect(() => {
    if (!sessionActive || paused) return;
    const t = setInterval(() => {
      setTimeLeft((s) => Math.max(0, s - 1));
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [sessionActive, paused]);

  // Time-out → adversary lands free hit
  useEffect(() => {
    if (sessionActive && timeLeft === 0 && !paused) {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // Persist the transcript so /results can fold the debate into the dossier (#4)
  useEffect(() => {
    if (!sessionActive || !idea || transcript.length === 0) return;
    saveDebateTranscript(idea, renderMarkdown(idea, transcript, personas, { round, survival, shieldsUsed }), survival);
  }, [sessionActive, idea, transcript, personas, round, survival, shieldsUsed]);

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
    // Highest pressure persona, slightly weighted by kill-shot probability
    const candidates = personas.filter((p) => p.id !== skip);
    const sorted = [...candidates].sort((a, b) => (b.pressure + b.killshot * 0.5) - (a.pressure + a.killshot * 0.5));
    return sorted[0];
  }, [personas]);

  const updatePersonaPressure = useCallback((updater: (p: Persona) => Persona) => {
    setPersonas((prev) => prev.map(updater));
  }, []);

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
      // quality heuristic — numbers & length lower the next attack
      setLastEval(null);
      const hasNumbers = /\d/.test(text);
      const long = text.length > 220;
      const quality = (hasNumbers ? 0.4 : 0) + (long ? 0.3 : 0) + Math.min(0.3, text.length / 1500);
      survivalShift = +(quality * 1.4 - 0.3).toFixed(2); // -0.3 .. +1.1
      pressureDrop = Math.round(8 + quality * 14);
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
  }, [response, evaluating, sessionActive, activeSpeaker, personas, transcript, idea, tailored, nextTs, pickNextSpeaker, attackFor, advanceToNextRound]);

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
    void startSession(ideaDraft.trim());
  }, [ideaDraft, startSession]);

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
  }, []);

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
  }, [sessionActive, round, activeSpeaker, nextTs, pickNextSpeaker, attackFor, advanceToNextRound, handleReset]);

  /* ---------- DERIVED ---------- */

  const combinedPressure = Math.round(personas.reduce((a, p) => a + p.pressure, 0) / personas.length);
  const loadedKillshots = personas.filter((p) => p.killshot > 30).length;
  const winnableLanes = personas.filter((p) => p.pressure < 50).length;

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

  // Final-verdict synthesis — built from the live session, never hardcoded
  const verdictCards = useMemo(() => ({
    assumptions: Object.values(tailored).map((t) => t?.lens).filter((x): x is string => !!x).slice(0, 4),
    risks: [...new Set(
      transcript
        .filter((t) => t.who !== "you" && (t.severity === "kill" || t.severity === "warn"))
        .map((t) => t.flaw || t.body),
    )].slice(-4),
    concessions: transcript.filter((t) => t.type === "concession").map((t) => t.body).slice(-4),
    priorities: [...new Set(transcript.map((t) => t.fix).filter((x): x is string => !!x))].slice(-4),
  }), [tailored, transcript]);

  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground">
      <Ticker sessionActive={sessionActive} round={round} survival={survival} survivalDelta={survivalDelta} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} activeSpeaker={personas.find(p => p.id === activeSpeaker)!} />
      <TopBar sessionActive={sessionActive} onReset={handleReset} onPause={() => setPaused((p) => !p)} paused={paused} apiStatus={apiStatus}
        voiceOn={voiceOn} voiceSupported={voice.supported} speaking={voice.speaking} onToggleVoice={() => setVoiceOn((v) => !v)} />
      <Hero
        ideaDraft={ideaDraft} setIdeaDraft={setIdeaDraft} onEnter={handleEnterChamber}
        survival={survival} survivalDelta={survivalDelta} round={round}
        timeLeft={timeLeft} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} verdict={verdictNow}
        apiStatus={apiStatus} sessionActive={sessionActive}
      />
      <Tribunal personas={personas} activeSpeaker={sessionActive ? activeSpeaker : ""} onOpenDossier={setDossierId}
        combinedPressure={combinedPressure} loadedKillshots={loadedKillshots} winnableLanes={winnableLanes}
        speakingId={voiceOn ? voice.speakingId : null} />
      <ChamberCore
        transcript={transcript} personas={personas} response={response} setResponse={setResponse}
        timeLeft={timeLeft} round={round} elapsed={elapsed}
        shieldsUsed={shieldsUsed} onSend={handleSend} onConcede={handleConcede} onShield={handleShield}
        onChip={handleChip} evaluating={evaluating} lastEval={lastEval} sessionActive={sessionActive}
        voiceOn={voiceOn} speaking={voice.speaking}
        onReplay={(t) => voiceOn && voice.speak(t.who as ChamberPersonaId, t.body)}
      />
      <div ref={transcriptRef} />
      <CourtRecord transcript={transcript} personas={personas} round={round}
        kills={kills} warns={warns} insights={insights}
        onExportMD={handleExportMarkdown} onCopyMD={handleCopyMarkdown} onExportPDF={handleExportPDF} />
      <FinalVerdictPreview survival={survival} round={round} onContinue={handleContinue} onReset={handleReset}
        sessionActive={sessionActive} cards={verdictCards} onVerdict={() => setShowVerdict(true)} />
      <Ticker sessionActive={sessionActive} round={round} survival={survival} survivalDelta={survivalDelta} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} activeSpeaker={personas.find(p => p.id === activeSpeaker)!} />
      {dossierId && <DossierModal persona={personas.find(p => p.id === dossierId)!} onClose={() => setDossierId(null)} />}
      {showVerdict && (
        <ChamberVerdict
          idea={idea}
          survival={survival}
          round={round}
          totalRounds={TOTAL_ROUNDS}
          personas={personas.map<VerdictPersona>((p) => ({
            id: p.id, name: p.name, role: p.role, initials: p.initials, hue: p.hue, pressure: p.pressure, killshot: p.killshot,
          }))}
          transcript={transcript.map<VerdictTurn>((t) => ({ who: t.who, type: t.type, severity: t.severity, body: t.body }))}
          onClose={() => setShowVerdict(false)}
          onReset={() => { setShowVerdict(false); handleReset(); }}
        />
      )}
    </div>
  );
}

/* ============================= CHROME ============================= */

function Ticker({ sessionActive, round, survival, survivalDelta, shieldsLeft, activeSpeaker }:
  { sessionActive: boolean; round: number; survival: number; survivalDelta: number; shieldsLeft: number; activeSpeaker: Persona }) {
  const items = sessionActive
    ? [
        { tag: "LIVE", tone: "danger" as const, txt: `ROUND ${round} OF ${TOTAL_ROUNDS} // ${activeSpeaker.role.toUpperCase()} HOLDING THE FLOOR` },
        { tag: "SCORE", tone: survivalDelta < 0 ? "warn" as const : "success" as const, txt: `SURVIVAL ${survival.toFixed(1)} / 10 — ${survivalDelta >= 0 ? "UP" : "DOWN"} ${Math.abs(survivalDelta).toFixed(1)} LAST EXCHANGE` },
        { tag: "PRESSURE", tone: "danger" as const, txt: `${activeSpeaker.name.toUpperCase()} ESCALATING — KILL-SHOT PROBABILITY ${activeSpeaker.killshot}%` },
        { tag: "SHIELD", tone: "data" as const, txt: `${shieldsLeft} SHIELDS REMAINING / USE WITH INTENT` },
      ]
    : [
        { tag: "IDLE", tone: "data" as const, txt: "CHAMBER EMPTY — AWAITING AN IDEA TO PRESSURE-TEST" },
        { tag: "PANEL", tone: "warn" as const, txt: "FIVE AGENTS SEATED // INVESTOR · CUSTOMER · OPERATOR · ADVERSARY · MENTOR" },
        { tag: "SCORE", tone: "data" as const, txt: "SURVIVAL — / 10 · NO SESSION ON RECORD" },
        { tag: "SYS", tone: "success" as const, txt: "SUBMIT YOUR IDEA ABOVE TO OPEN THE SESSION" },
      ];
  const cls = (t: string) =>
    t === "danger" ? "border-danger text-danger" :
    t === "warn"   ? "border-warn text-warn" :
    t === "success"? "border-success text-success" :
                     "border-data text-data";
  return (
    <div className="chamber-ticker bg-ink text-ink-foreground border-y border-ink overflow-hidden print:hidden">
      <div className="chamber-ticker-track flex gap-10 py-2 text-[10px] tracking-[0.2em] whitespace-nowrap">
        {[...items, ...items, ...items].map((s, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className={`px-1.5 py-0.5 border ${cls(s.tone)}`}>[{s.tag}]</span>
            <span className="text-ink-foreground/80">{s.txt}</span>
            <span className="text-ink-foreground/30">//</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TopBar({ sessionActive, onReset, onPause, paused, apiStatus, voiceOn, voiceSupported, speaking, onToggleVoice }:
  { sessionActive: boolean; onReset: () => void; onPause: () => void; paused: boolean; apiStatus: ApiStatus;
    voiceOn: boolean; voiceSupported: boolean; speaking: boolean; onToggleVoice: () => void }) {
  return (
    <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40 print:hidden">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-9 border border-border-strong grid place-items-center font-display text-lg">PD</div>
          <div>
            <div className="font-display text-sm tracking-wider">PRIORITY DEBATER</div>
            <div className="text-[10px] text-muted-foreground tracking-widest">
              CHAMBER · {!sessionActive ? "IDLE — NO SESSION" : apiStatus === "live" ? "AI PANEL ARMED" : apiStatus === "loading" ? "ARMING PANEL…" : "OFFLINE — SIMULATED PANEL"}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest">
          <Link href="/results" className="text-muted-foreground hover:text-foreground">REPORT</Link>
          <span>·</span><span className="text-foreground font-bold">DEBATE</span>
          <span>·</span><Link href="/brand" className="text-muted-foreground hover:text-foreground">BRAND</Link>
          <span>·</span><Link href="/landing" className="text-muted-foreground hover:text-foreground">LANDING</Link>
        </div>
        <div className="flex items-center gap-2">
          {voiceSupported && (
            <button onClick={onToggleVoice} title={voiceOn ? "Mute the tribunal" : "Let the tribunal speak"}
              className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] tracking-widest font-bold transition-colors ${voiceOn ? "border-data text-data" : "border-border text-muted-foreground hover:bg-surface"}`}>
              {voiceOn ? <Volume2 className={`size-3 ${speaking ? "animate-pulse" : ""}`} /> : <VolumeX className="size-3" />}
              <span className="hidden sm:inline">{voiceOn ? (speaking ? "SPEAKING" : "VOICE ON") : "VOICE OFF"}</span>
            </button>
          )}
          {sessionActive ? (
            <>
              <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-2 border border-border text-foreground text-[10px] tracking-widest font-bold hover:bg-surface">
                {paused ? <><Play className="size-3" /> RESUME</> : <><Pause className="size-3" /> PAUSE</>}
              </button>
              <span className="flex items-center gap-2 px-3 py-2 border border-danger text-danger text-[10px] tracking-widest font-bold">
                <span className="size-1.5 rounded-full bg-danger animate-pulse" /> {paused ? "PAUSED" : "LIVE"}
              </span>
              <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-2 bg-accent text-accent-foreground text-[10px] tracking-widest font-bold hover:opacity-90">
                <RotateCcw className="size-3" /> END SESSION
              </button>
            </>
          ) : (
            <span className="flex items-center gap-2 px-3 py-2 border border-border text-muted-foreground text-[10px] tracking-widest font-bold">
              <span className="size-1.5 rounded-full bg-muted-foreground/50" /> IDLE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({ ideaDraft, setIdeaDraft, onEnter, survival, survivalDelta, round, timeLeft, shieldsLeft, verdict, apiStatus, sessionActive }:
  { ideaDraft: string; setIdeaDraft: (s: string) => void; onEnter: () => void; survival: number; survivalDelta: number; round: number; timeLeft: number; shieldsLeft: number; verdict: string; apiStatus: ApiStatus; sessionActive: boolean }) {
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
              {apiStatus === "loading" ? <><Loader2 className="size-4 animate-spin" /> ARMING PANEL…</> : <>ENTER THE CHAMBER <ArrowRight className="size-4" /></>}
            </button>
          </form>
          <div className="mt-3 text-[10px] tracking-widest text-ink-foreground/45">
            {apiStatus === "live" ? "◉ LIVE — FIVE AI AGENTS GENERATE EVERY ATTACK & SCORE FOR THIS IDEA"
              : apiStatus === "loading" ? "◌ ARMING FIVE AGENTS — EACH IS STUDYING YOUR IDEA"
              : apiStatus === "offline" ? "◌ ENGINE UNREACHABLE — RUNNING SIMULATED PANEL"
              : "◌ NOTHING IS PRE-WRITTEN — THE SESSION ONLY EXISTS ONCE YOU SUBMIT AN IDEA"}
          </div>
        </div>
        <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-6 self-start">
          <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">LIVE SURVIVAL SCORE</div>
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
            <div className="text-xs text-ink-foreground/40">NO SESSION · SCORE STARTS AT 7.5 AND MOVES WITH EVERY EXCHANGE</div>
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

function Tribunal({ personas, activeSpeaker, onOpenDossier, combinedPressure, loadedKillshots, winnableLanes, speakingId }:
  { personas: Persona[]; activeSpeaker: string; onOpenDossier: (id: string) => void; combinedPressure: number; loadedKillshots: number; winnableLanes: number; speakingId: ChamberPersonaId | null }) {
  const order = ["vk", "ht", "mr", "es", "lv"];
  const seats = order.map((id) => personas.find((p) => p.id === id)!);

  return (
    <section className="relative bg-ink text-ink-foreground border-b border-ink overflow-hidden print:hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%, color-mix(in oklab, var(--danger) 22%, transparent), transparent 70%)" }} />
      <div className="absolute inset-0 grid-bg-ink pointer-events-none opacity-60" />

      <div className="relative mx-auto max-w-[1480px] px-4 md:px-8 pt-20 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-14">
          <div>
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">— 01 / THE TRIBUNAL · NOW IN SESSION</div>
            <h2 className="text-display text-5xl md:text-6xl lg:text-7xl text-ink-foreground leading-[0.95]">
              Five seats.<br /><span className="hl-red">Five blades.</span>
            </h2>
          </div>
          <div className="flex flex-col items-end gap-3 max-w-md text-right">
            <div className="flex items-center gap-2 text-[10px] tracking-widest text-danger">
              <Radio className="size-3 animate-pulse" /> LIVE TRANSMISSION · AUTO-RECORDED
            </div>
            <p className="text-sm text-ink-foreground/65 leading-relaxed">
              Each persona attacks from a distinct strategic axis. Click a seat to open the dossier.
              You cannot satisfy all five — choose what you defend.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-ink-foreground/15 border border-ink-foreground/20">
          {seats.map((p) => (
            <PersonaThrone key={p.id} p={p} active={p.id === activeSpeaker} speaking={speakingId === p.id} onOpen={() => onOpenDossier(p.id)} />
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-3 text-[10px] tracking-widest">
          <RailStat label="COMBINED PRESSURE" value={`${combinedPressure}%`} tone={combinedPressure > 55 ? "warn" : "success"} detail={combinedPressure > 55 ? "Above ignition threshold (55%)" : "Below ignition threshold"} />
          <RailStat label="LOADED KILL-SHOTS" value={`${loadedKillshots} / 5`} tone={loadedKillshots >= 2 ? "danger" : "warn"} detail={loadedKillshots >= 2 ? "Multiple adversaries armed" : "Manageable threat level"} />
          <RailStat label="WINNABLE LANES" value={`${winnableLanes}`} tone="success" detail="Personas under 50% pressure" />
        </div>
      </div>
    </section>
  );
}

function RailStat({ label, value, tone, detail }: { label: string; value: string; tone: "danger" | "warn" | "success"; detail: string }) {
  const c = HUE[tone];
  return (
    <div className="border border-ink-foreground/20 bg-ink-foreground/5 p-4 flex items-center gap-4">
      <div className={`size-10 grid place-items-center border ${c.border} ${c.text}`}>
        {tone === "danger" ? <Crosshair className="size-4" /> : tone === "warn" ? <Flame className="size-4" /> : <Shield className="size-4" />}
      </div>
      <div className="min-w-0">
        <div className="text-ink-foreground/55">{label}</div>
        <div className={`font-display text-xl ${c.text}`}>{value}</div>
        <div className="text-ink-foreground/55 normal-case tracking-normal text-[11px] mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

function PersonaThrone({ p, active, speaking, onOpen }: { p: Persona; active: boolean; speaking: boolean; onOpen: () => void }) {
  const c = HUE[p.hue];
  const statusLabel = speaking ? "SPEAKING" : p.status.toUpperCase();
  const statusTone =
    p.status === "speaking"  ? "text-danger"  :
    p.status === "preparing" ? "text-warn"    :
                                "text-ink-foreground/55";

  return (
    <div
      className={`relative bg-ink p-6 pt-8 flex flex-col min-h-[420px] transition-all ${
        active ? "bg-gradient-to-b from-[color-mix(in_oklab,var(--danger)_14%,transparent)] to-transparent" : ""
      }`}
    >
      {active && (
        <>
          <div className="absolute inset-x-0 -top-px h-[3px] bg-danger" />
          <div className="absolute inset-x-0 -bottom-px h-[3px] bg-danger" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 bg-danger text-ink-foreground text-[9px] tracking-widest font-bold">
            <span className="size-1 rounded-full bg-ink-foreground animate-pulse" /> HOLDING THE FLOOR
          </div>
        </>
      )}

      <div className="flex items-center justify-between text-[9px] tracking-widest text-ink-foreground/40 mb-6">
        <span>SEAT · {p.initials}</span>
        <span className={`flex items-center gap-1.5 ${speaking ? c.text : statusTone}`}>
          {speaking && <SpeakingBars className={c.text} />}{statusLabel}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className={`relative size-20 grid place-items-center border-2 ${c.border} bg-ink-foreground/5 font-display text-3xl ${c.text}`}>
          {p.initials}
          {active && <div className={`absolute -inset-1 ${c.ring} pointer-events-none`} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg leading-tight text-ink-foreground">{p.name}</div>
          <div className={`text-[10px] tracking-widest mt-1 ${c.text}`}>{p.role.toUpperCase()}</div>
          <div className="text-[10px] text-ink-foreground/50 mt-1 leading-snug">{p.archetype}</div>
        </div>
      </div>

      <p className={`text-[12px] text-ink-foreground/70 mt-5 leading-relaxed border-l-2 ${c.border} pl-3 italic`}>
        “{p.bio}”
      </p>

      <div className="mt-auto pt-5 space-y-3">
        <div>
          <div className="flex items-center justify-between text-[9px] tracking-widest text-ink-foreground/55 mb-1.5">
            <span className="flex items-center gap-1.5"><Flame className="size-3" /> PRESSURE</span>
            <span className={c.text}>{p.pressure}%</span>
          </div>
          <div className="h-[3px] bg-ink-foreground/10 relative overflow-hidden">
            <div className={`h-full ${c.bg} transition-all duration-500`} style={{ width: `${p.pressure}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-[9px] tracking-widest text-ink-foreground/55 mb-1.5">
            <span className="flex items-center gap-1.5"><Skull className="size-3" /> KILL-SHOT</span>
            <span className={p.killshot > 30 ? "text-danger" : "text-ink-foreground/70"}>{p.killshot}%</span>
          </div>
          <div className="h-[3px] bg-ink-foreground/10 relative overflow-hidden">
            <div className={`h-full transition-all duration-500 ${p.killshot > 30 ? "bg-danger" : "bg-ink-foreground/40"}`} style={{ width: `${p.killshot}%` }} />
          </div>
        </div>

        <button onClick={onOpen} className="w-full mt-2 text-[10px] tracking-widest text-ink-foreground/55 hover:text-ink-foreground flex items-center justify-center gap-2 border border-ink-foreground/15 py-2 hover:bg-ink-foreground/5">
          <Eye className="size-3" /> OPEN DOSSIER
        </button>
      </div>
    </div>
  );
}

/* ============================= CHAMBER CORE ============================= */

function ChamberCore({
  transcript, personas, response, setResponse, timeLeft, round, elapsed, shieldsUsed,
  onSend, onConcede, onShield, onChip, evaluating, lastEval, sessionActive,
  voiceOn, speaking, onReplay,
}: {
  transcript: Turn[]; personas: Persona[]; response: string; setResponse: (v: string) => void;
  timeLeft: number; round: number; elapsed: number; shieldsUsed: number;
  onSend: () => void; onConcede: () => void; onShield: () => void; onChip: (label: string) => void;
  evaluating: boolean; lastEval: EvalResult | null; sessionActive: boolean;
  voiceOn: boolean; speaking: boolean; onReplay: (t: Turn) => void;
}) {
  const MAX = 1200;
  const lastAttack = [...transcript].reverse().find((t) => t.who !== "you") ?? transcript[transcript.length - 1];
  const speaker = (lastAttack && personas.find((p) => p.id === lastAttack.who)) || personas[0];
  const c = HUE[speaker.hue];

  const pct = ((ROUND_SECONDS - timeLeft) / ROUND_SECONDS) * 100;

  const attacks = transcript.filter((t) => t.type === "attack").length;
  const rebuttals = transcript.filter((t) => t.type === "rebuttal" || t.type === "defense").length;

  return (
    <section className="bg-background border-b border-border print:hidden">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 pt-16 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground mb-3">— 02 / THE FLOOR · YOUR TURN</div>
            <h2 className="text-display text-4xl md:text-5xl text-foreground leading-tight">
              They've stopped talking. <span className="hl-red">Now you speak.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-widest">
            <span className="px-2 py-1 border border-danger text-danger flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-danger animate-pulse" /> FLOOR OPEN
            </span>
            <span className="px-2 py-1 border border-border text-muted-foreground">ROUND {round} / {TOTAL_ROUNDS}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-3">
          <div className="bg-ink text-ink-foreground border border-ink relative overflow-hidden">
            <div className="absolute inset-0 grid-bg-ink opacity-50 pointer-events-none" />

            <div className="relative flex items-center justify-between px-6 py-4 border-b border-ink-foreground/15">
              {sessionActive && lastAttack ? (
                <div className="flex items-center gap-4">
                  <div className={`size-12 grid place-items-center border-2 ${c.border} font-display text-base ${c.text} bg-ink`}>
                    {speaker.initials}
                  </div>
                  <div>
                    <div className="text-[10px] tracking-widest text-ink-foreground/55 flex items-center gap-2">
                      INCOMING FIRE FROM
                      {voiceOn && speaking && <SpeakingBars className={c.text} />}
                    </div>
                    <div className="font-display text-lg leading-tight flex items-center gap-2">
                      {speaker.name}
                      {voiceOn && lastAttack && (
                        <button onClick={() => onReplay(lastAttack)} title="Replay aloud"
                          className={`${c.text} opacity-60 hover:opacity-100`}>
                          <Volume2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className={`text-[10px] tracking-widest ${c.text}`}>{speaker.role.toUpperCase()} · KILL-SHOT {speaker.killshot}%</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="size-12 grid place-items-center border-2 border-ink-foreground/25 font-display text-base text-ink-foreground/40 bg-ink">?</div>
                  <div>
                    <div className="text-[10px] tracking-widest text-ink-foreground/55">INCOMING FIRE FROM</div>
                    <div className="font-display text-lg leading-tight text-ink-foreground/40">—</div>
                    <div className="text-[10px] tracking-widest text-ink-foreground/35">NO SESSION IN PROGRESS</div>
                  </div>
                </div>
              )}
              {sessionActive && <CountdownRing pct={pct} label={fmtClock(timeLeft)} critical={timeLeft < 30} />}
            </div>

            <div className="relative p-8 md:p-12 border-b border-ink-foreground/15">
              {lastAttack ? (
                <>
                  <Quote className={`absolute top-6 left-6 size-10 ${c.text} opacity-25`} />
                  <p className="relative pl-14 font-display text-2xl md:text-3xl text-ink-foreground leading-snug">
                    {lastAttack.body}
                  </p>
                  <div className="mt-6 pl-14 flex items-center gap-3 text-[10px] tracking-widest">
                    {lastAttack.severity === "kill" && (
                      <span className="px-1.5 py-0.5 border border-danger text-danger flex items-center gap-1"><Skull className="size-3" /> KILL-SHOT</span>
                    )}
                    {lastAttack.severity === "warn" && (
                      <span className="px-1.5 py-0.5 border border-warn text-warn flex items-center gap-1"><AlertTriangle className="size-3" /> WARNING</span>
                    )}
                    {lastAttack.severity === "insight" && (
                      <span className="px-1.5 py-0.5 border border-data text-data flex items-center gap-1"><Activity className="size-3" /> INSIGHT</span>
                    )}
                    <span className="text-ink-foreground/45">LOGGED {lastAttack.ts}</span>
                  </div>
                </>
              ) : sessionActive ? (
                <div className="flex items-center gap-4 text-ink-foreground/70">
                  <Loader2 className="size-6 animate-spin text-data" />
                  <div>
                    <div className="font-display text-2xl text-ink-foreground">THE PANEL IS CONVENING…</div>
                    <div className="text-[10px] tracking-widest text-ink-foreground/50 mt-1">FIVE AGENTS ARE STUDYING YOUR IDEA · FIRST ATTACK INCOMING</div>
                  </div>
                </div>
              ) : (
                <div className="text-ink-foreground/70">
                  <div className="font-display text-2xl text-ink-foreground/60">THE CHAMBER IS EMPTY.</div>
                  <div className="text-[10px] tracking-widest text-ink-foreground/45 mt-2">SUBMIT YOUR IDEA ABOVE — THE FIRST ATTACK LANDS HERE</div>
                </div>
              )}
            </div>

            {lastEval && (
              <div className="relative px-6 md:px-8 py-5 border-b border-ink-foreground/15 bg-ink-foreground/[0.03]">
                <div className="flex items-center gap-2 text-[10px] tracking-widest mb-2">
                  <span className={`px-1.5 py-0.5 border ${lastEval.strength === 3 ? "border-success text-success" : lastEval.strength === 2 ? "border-warn text-warn" : "border-danger text-danger"}`}>
                    DEFENSE RATED {lastEval.strength}/3
                  </span>
                  <span className="text-ink-foreground/45">PANEL VERDICT ON YOUR LAST ANSWER</span>
                </div>
                <p className="text-sm text-ink-foreground/85 leading-relaxed italic">“{lastEval.reactionQuote}”</p>
                <div className="mt-3 flex items-start gap-2 text-xs text-ink-foreground/75 leading-relaxed border-l-2 border-data pl-3">
                  <Wrench className="size-3.5 text-data shrink-0 mt-0.5" />
                  <span><span className="text-data tracking-widest text-[10px]">FAIL-PROOF FIX · </span>{lastEval.fix}</span>
                </div>
              </div>
            )}

            <div className="relative p-6 md:p-8">
              <div className="flex items-center justify-between mb-3 text-[10px] tracking-widest text-ink-foreground/55">
                <span className="flex items-center gap-2 text-data">
                  <Mic className="size-3 animate-pulse" /> THE FLOOR IS YOURS
                </span>
                <span>{response.length} / {MAX}</span>
              </div>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onSend(); } }}
                disabled={!sessionActive}
                placeholder={sessionActive
                  ? "Draft your rebuttal. Be specific. Numbers travel. Adjectives die. (⌘+Enter to send)"
                  : "The floor opens once a session is live — submit your idea above."}
                className="w-full h-44 bg-ink-foreground/5 border border-ink-foreground/25 text-ink-foreground placeholder:text-ink-foreground/35 p-4 text-sm leading-relaxed focus:outline-none focus:border-data resize-none disabled:opacity-50"
              />

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] tracking-widest">
                {Object.keys(CHIP_SNIPPETS).map((label) => (
                  <Chip key={label} onClick={() => onChip(label)}>{label}</Chip>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <button onClick={onSend} disabled={!response.trim() || evaluating || !sessionActive}
                  className="flex-1 px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_var(--danger)]">
                  {evaluating ? <><Loader2 className="size-4 animate-spin" /> PANEL DELIBERATING…</> : <><Send className="size-4" /> DELIVER DEFENSE</>}
                </button>
                <button onClick={onConcede} disabled={!sessionActive}
                  className="px-5 py-4 border border-ink-foreground/30 text-ink-foreground/80 font-display text-sm tracking-widest hover:bg-ink-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <X className="size-4" /> CONCEDE POINT
                </button>
                <button onClick={onShield} disabled={!sessionActive || shieldsUsed >= SHIELDS_TOTAL}
                  className="px-5 py-4 border border-data text-data font-display text-sm tracking-widest hover:bg-data/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Shield className="size-4" /> USE SHIELD
                </button>
              </div>
            </div>
          </div>

          <aside className="grid grid-rows-[auto_1fr_auto] gap-3">
            <div className="border border-border bg-surface p-5">
              <div className="text-[10px] tracking-widest text-muted-foreground mb-3">SESSION</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <KV k="ROUND" v={`${round} / ${TOTAL_ROUNDS}`} />
                <KV k="ELAPSED" v={fmtElapsed(elapsed)} />
                <KV k="ATTACKS" v={String(attacks)} />
                <KV k="REBUTTALS" v={String(rebuttals)} />
              </div>
            </div>

            <div className="border border-border bg-surface p-5">
              <div className="flex items-center justify-between text-[10px] tracking-widest text-muted-foreground mb-4">
                <span>PRESSURE BY PERSONA</span>
                <span className="text-warn flex items-center gap-1"><Zap className="size-3" /> AVG {Math.round(personas.reduce((a,p)=>a+p.pressure,0)/personas.length)}%</span>
              </div>
              <div className="space-y-3">
                {personas.map((p) => {
                  const tone: Hue = p.pressure > 75 ? "danger" : p.pressure > 45 ? "warn" : "success";
                  const t = HUE[tone];
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between text-[10px] tracking-widest mb-1">
                        <span className="text-foreground"><span className="text-muted-foreground">{p.initials} ·</span> {p.role.toUpperCase()}</span>
                        <span className={t.text}>{p.pressure}%</span>
                      </div>
                      <div className="h-1.5 bg-muted relative overflow-hidden">
                        <div className={`h-full ${t.bg} transition-all duration-500`} style={{ width: `${p.pressure}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border border-border bg-surface p-5">
              <div className="text-[10px] tracking-widest text-muted-foreground mb-3">SHIELDS REMAINING</div>
              <div className="flex items-center gap-2">
                {Array.from({ length: SHIELDS_TOTAL }).map((_, i) => {
                  const used = i < shieldsUsed;
                  return (
                    <div key={i} className={`size-10 grid place-items-center border transition-all ${used ? "border-border text-muted-foreground/40" : "border-data text-data shadow-[0_0_20px_-6px_var(--data)]"}`}>
                      <Shield className="size-4" />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                A shield buys one round of expert reframing. Use them on assumptions you can't yet defend with data.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
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

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-border p-3 bg-background">
      <div className="text-[9px] tracking-widest text-muted-foreground">{k}</div>
      <div className="font-display text-lg text-foreground mt-1">{v}</div>
    </div>
  );
}

/* ============================= COURT RECORD ============================= */

function CourtRecord({ transcript, personas, round, kills, warns, insights, onExportMD, onCopyMD, onExportPDF }:
  { transcript: Turn[]; personas: Persona[]; round: number; kills: number; warns: number; insights: number; onExportMD: () => void; onCopyMD: () => void; onExportPDF: () => void }) {
  const [filter, setFilter] = useState<"all" | "kill" | "warn" | "insight" | "you">("all");
  const [query, setQuery] = useState("");

  const filtered = transcript.filter((t) => {
    if (filter === "you" && t.who !== "you") return false;
    if (filter !== "all" && filter !== "you" && t.severity !== filter) return false;
    if (query && !t.body.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <section className="bg-background border-b border-border">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground mb-3">— 03 / COURT RECORD · VERBATIM</div>
            <h2 className="text-display text-4xl md:text-5xl text-foreground leading-tight">
              Every word. <span className="hl-red">Logged & timestamped.</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
              The transcript reads like a newspaper of record. Search it, export it, or hand
              it to the co-founder who wasn't in the room.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 print:hidden">
            <div className="grid grid-cols-3 gap-2 text-[10px] tracking-widest">
              <span className="px-2 py-1 border border-danger text-danger">{kills} KILL-SHOT{kills===1?"":"S"}</span>
              <span className="px-2 py-1 border border-warn text-warn">{warns} WARNING{warns===1?"":"S"}</span>
              <span className="px-2 py-1 border border-data text-data">{insights} INSIGHT{insights===1?"":"S"}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] tracking-widest">
              <button onClick={onExportPDF} className="px-3 py-2 border border-border hover:bg-surface flex items-center gap-1.5"><Download className="size-3" /> EXPORT PDF</button>
              <button onClick={onExportMD} className="px-3 py-2 border border-border hover:bg-surface flex items-center gap-1.5"><Download className="size-3" /> .MD</button>
              <button onClick={onCopyMD} className="px-3 py-2 border border-border hover:bg-surface flex items-center gap-1.5"><Copy className="size-3" /> COPY</button>
            </div>
          </div>
        </div>

        {/* filter / search */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 print:hidden">
          <div className="flex items-center gap-1 text-[10px] tracking-widest">
            {(["all","kill","warn","insight","you"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 border ${filter === f ? "border-ink bg-ink text-ink-foreground" : "border-border text-muted-foreground hover:bg-surface"}`}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the record…"
            className="px-3 py-2 border border-border bg-background text-xs w-72 focus:outline-none focus:border-ink"
          />
        </div>

        <div className="border-y-2 border-ink py-3 mb-px flex items-center justify-between text-[10px] tracking-widest text-muted-foreground">
          <span>THE CHAMBER · OFFICIAL RECORD</span>
          <span>ROUND {round} OF {TOTAL_ROUNDS}</span>
          <span>{new Date().toISOString().slice(0,10)} · {filtered.length} ENTR{filtered.length===1?"Y":"IES"}</span>
        </div>

        <div className="border border-ink bg-surface divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {transcript.length === 0
                ? "The record is empty. It begins the moment you enter the chamber with an idea."
                : "No entries match the current filter."}
            </div>
          )}
          {filtered.map((t, i) => (
            <TranscriptRow key={t.id} t={t} idx={i + 1} personas={personas} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TranscriptRow({ t, idx, personas }: { t: Turn; idx: number; personas: Persona[] }) {
  const isYou = t.who === "you";
  const persona = !isYou ? personas.find((p) => p.id === t.who)! : null;
  const hue: Hue = isYou ? "data" : persona!.hue;
  const c = HUE[hue];

  const sevTone: Hue | null =
    t.severity === "kill"    ? "danger" :
    t.severity === "warn"    ? "warn"   :
    t.severity === "insight" ? "data"   : null;
  const sev = sevTone ? HUE[sevTone] : null;

  const typeLabel =
    t.type === "attack"     ? "ATTACK" :
    t.type === "rebuttal"   ? "REBUTTAL" :
    t.type === "defense"    ? "DEFENSE" :
    t.type === "concession" ? "CONCESSION" :
    t.type === "shield"     ? "SHIELD" :
                              "VERDICT";

  return (
    <article className="grid md:grid-cols-[60px_220px_1fr] gap-0">
      <div className="hidden md:flex flex-col items-center justify-start p-5 border-r border-border bg-background">
        <div className="font-display text-2xl text-muted-foreground">{String(idx).padStart(2, "0")}</div>
        <div className="text-[9px] tracking-widest text-muted-foreground mt-1">EX-{String(idx).padStart(3, "0")}</div>
      </div>

      <div className={`p-5 md:p-6 border-r border-border flex md:flex-col md:items-start gap-4 ${isYou ? "bg-data/[0.04]" : ""}`}>
        <div className={`size-14 grid place-items-center border-2 ${c.border} font-display text-base ${c.text} bg-background shrink-0`}>
          {isYou ? "YOU" : persona!.initials}
        </div>
        <div className="min-w-0">
          <div className="font-display text-base leading-tight">{isYou ? "You" : persona!.name}</div>
          <div className={`text-[10px] tracking-widest mt-1 ${c.text}`}>{isYou ? "FOUNDER" : t.role}</div>
          <div className="mt-3 grid gap-1 text-[10px] tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5"><Clock className="size-3" /> {t.ts}</div>
            <div>EXCHANGE #{String(idx).padStart(2, "0")}</div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <div className="flex items-center gap-2 mb-4 text-[10px] tracking-widest">
          <span className={`px-1.5 py-0.5 border ${c.border} ${c.text}`}>{typeLabel}</span>
          {sev && (
            <span className={`px-1.5 py-0.5 border ${sev.border} ${sev.text} flex items-center gap-1`}>
              {t.severity === "kill" && <Skull className="size-3" />}
              {t.severity === "warn" && <AlertTriangle className="size-3" />}
              {t.severity === "insight" && <Activity className="size-3" />}
              {t.severity!.toUpperCase()}
            </span>
          )}
          <span className="text-muted-foreground">— {isYou ? "rebuttal accepted into record" : `${persona!.name.split(" ")[0]} on the offensive`}</span>
        </div>
        <p className={`text-base text-foreground leading-relaxed ${isYou ? "" : "first-letter:font-display first-letter:text-5xl first-letter:float-left first-letter:mr-2 first-letter:leading-[0.85]"}`}>
          {t.body}
        </p>
        {t.fix && (
          <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed border-l-2 border-data pl-3 text-foreground/80">
            <Wrench className="size-3.5 text-data shrink-0 mt-0.5" />
            <span><span className="text-data tracking-widest text-[10px]">FAIL-PROOF FIX · </span>{t.fix}</span>
          </div>
        )}
        {t.severity === "kill" && (
          <div className="mt-4 inline-flex items-center gap-2 text-[10px] tracking-widest text-danger border-l-2 border-danger pl-3">
            <Crosshair className="size-3" /> THIS EXCHANGE LOWERED SURVIVAL SCORE
          </div>
        )}
        {t.severity === "insight" && (
          <div className="mt-4 inline-flex items-center gap-2 text-[10px] tracking-widest text-data border-l-2 border-data pl-3">
            <Activity className="size-3" /> CONVERTIBLE TO STRATEGIC ADVANTAGE IF ADDRESSED
          </div>
        )}
      </div>
    </article>
  );
}

/* ============================= FINAL VERDICT PREVIEW ============================= */

type VerdictCards = { assumptions: string[]; risks: string[]; concessions: string[]; priorities: string[] };

function FinalVerdictPreview({ survival, round, onContinue, onReset, sessionActive, cards, onVerdict }:
  { survival: number; round: number; onContinue: () => void; onReset: () => void; sessionActive: boolean; cards: VerdictCards; onVerdict: () => void }) {
  return (
    <section className="bg-ink text-ink-foreground border-y border-ink grid-bg-ink">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">— 04 / FINAL VERDICT (PROJECTED)</div>
            <h2 className="text-display text-4xl md:text-5xl text-ink-foreground max-w-3xl">
              {sessionActive
                ? <>If the chamber closed now, <span className="hl-red">this is what survives.</span></>
                : <>Nothing on record. <span className="hl-red">Nothing to judge.</span></>}
            </h2>
          </div>
          <span className="px-3 py-2 border border-warn text-warn text-[10px] tracking-widest">
            {sessionActive
              ? `${round >= TOTAL_ROUNDS ? "FINAL" : "PROVISIONAL"} · ROUND ${round} / ${TOTAL_ROUNDS} · SURVIVAL ${survival.toFixed(1)}/10`
              : "NO SESSION · VERDICT PENDING"}
          </span>
        </div>

        <div className="grid lg:grid-cols-4 gap-3">
          <VerdictCard tone="warn" title="ATTACK AXES ARMED"
            items={cards.assumptions} emptyNote="Lenses appear once the agents study your idea." />
          <VerdictCard tone="danger" title="UNRESOLVED RISKS"
            items={cards.risks} emptyNote="Kill-shots and warnings land here as they're logged." />
          <VerdictCard tone="danger" title="CONCESSIONS LOGGED"
            items={cards.concessions} emptyNote="Ground you cede in the debate is recorded here." />
          <VerdictCard tone="data" title="FAIL-PROOF FIXES"
            items={cards.priorities} emptyNote="Each judged defence produces a concrete next step." />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 print:hidden">
          {sessionActive && (
            <>
              {round >= TOTAL_ROUNDS ? (
                <button onClick={onVerdict} className="px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center gap-2">
                  <Gavel className="size-4" /> RENDER THE FINAL VERDICT
                </button>
              ) : (
                <button onClick={onContinue} className="px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center gap-2">
                  CONTINUE TO ROUND {round + 1} <ChevronRight className="size-4" />
                </button>
              )}
              <button onClick={onVerdict} className="px-6 py-4 border border-data text-data font-display text-sm tracking-widest hover:bg-data/10 flex items-center gap-2">
                <Gavel className="size-4" /> DEMAND THE VERDICT NOW
              </button>
            </>
          )}
          <Link href="/results" className="px-6 py-4 border border-ink-foreground/40 text-ink-foreground font-display text-sm tracking-widest hover:bg-ink-foreground/5 flex items-center gap-2">
            EXIT TO FULL VALIDATION REPORT <ArrowRight className="size-4" />
          </Link>
          {sessionActive && (
            <button onClick={onReset} className="px-6 py-4 border border-warn text-warn font-display text-sm tracking-widest hover:bg-warn/10 flex items-center gap-2">
              <AlertTriangle className="size-4" /> ABANDON SESSION
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function VerdictCard({ tone, title, items, emptyNote }: { tone: "warn" | "danger" | "data"; title: string; items: string[]; emptyNote: string }) {
  const c = HUE[tone];
  return (
    <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-5">
      <div className={`text-[10px] tracking-widest mb-3 ${c.text} flex items-center gap-2`}>
        <span className={`block size-2 ${c.bg}`} />
        {title}
        {items.length > 0 && <span className="ml-auto text-ink-foreground/45">{items.length}</span>}
      </div>
      {items.length > 0 ? (
        <ul className={`space-y-3 border-t ${c.border}/40 pt-3`}>
          {items.map((it, i) => (
            <li key={i} className="text-xs text-ink-foreground/85 leading-relaxed flex gap-2">
              <span className={`mt-1 size-1.5 rounded-full ${c.bg} flex-shrink-0`} />
              {it}
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-t border-ink-foreground/15 pt-3">
          <div className="text-[10px] tracking-widest text-ink-foreground/35 mb-1">NONE LOGGED YET</div>
          <p className="text-xs text-ink-foreground/45 leading-relaxed">{emptyNote}</p>
        </div>
      )}
    </div>
  );
}

/* ============================= DOSSIER MODAL ============================= */

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
  }
  return lines.join("\n");
}
