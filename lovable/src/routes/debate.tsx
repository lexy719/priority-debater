import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Shield, Flame, Mic, Activity, Skull,
  ArrowRight, Clock, Send, X, ChevronRight, Eye,
  Crosshair, Radio, Quote, Zap, RotateCcw, Download, Copy, Pause, Play,
} from "lucide-react";

export const Route = createFileRoute("/debate")({
  head: () => ({
    meta: [
      { title: "The Chamber — Debate Mode · Priority Debater" },
      { name: "description", content: "Live adversarial pressure-testing tribunal for your startup idea." },
    ],
  }),
  component: DebatePage,
});

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
};

const DEFAULT_IDEA =
  "LexFlow — an AI-native case-management & client-intake SaaS built specifically for mid-sized law firms across Spain & Portugal, with native Iberian compliance baked in.";

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

const SEED_TRANSCRIPT: Turn[] = [
  { id: 1, who: "lv", role: "ADVERSARY", type: "attack", severity: "kill", ts: "00:01:12",
    body: "Let's not waste time. You are pitching a vertical SaaS in a jurisdiction where 73% of mid-sized firms still run on Microsoft Word templates and a shared NAS. You are not selling software. You are selling behavioural change to a profession that bills by the hour and is structurally allergic to learning anything new. What, precisely, is your wedge?" },
  { id: 2, who: "you", type: "defense", ts: "00:02:04",
    body: "The wedge is the new Spanish e-billing and digital-evidence mandate effective Q3 2026. Firms above 50 lawyers must produce auditable digital trails. Existing tools (Lexnet, A3Innuva) are universally hated. We onboard them on the regulatory pain, then expand into case management once we own the workflow." },
  { id: 3, who: "vk", role: "INVESTOR", type: "rebuttal", severity: "warn", ts: "00:02:55",
    body: "Regulatory-wedge stories are seductive and almost always wrong on timing. Compliance budgets in Iberian law firms are signed off by managing partners with a 9-month procurement cycle. Your runway assumes 4-month sales cycles. Square that for me — or admit your CAC model is fiction." },
  { id: 4, who: "mr", role: "CUSTOMER",  type: "attack", severity: "kill", ts: "00:03:48",
    body: "I run 140 lawyers in Madrid. I get four of these pitches a quarter. Nobody — nobody — switches their case-management system mid-mandate. You will not displace Lemontech or Sage Despachos until I am forced to. So tell me: are you actually building software, or are you building a compliance checkbox I can buy without firing my current vendor?" },
  { id: 5, who: "ht", role: "OPERATOR",  type: "rebuttal", severity: "insight", ts: "00:04:30",
    body: "Even if the wedge holds, you are signing up for bilingual support, Iberian data residency, and SII tax-authority integrations from day one. That is not a 6-person team. Your stated burn doesn't match the surface area you are committing to. Show me the org chart at month 18 or this is a slide, not a plan." },
  { id: 6, who: "es", role: "MENTOR",    type: "rebuttal", severity: "insight", ts: "00:05:11",
    body: "I built something close to this in 2017 for Brazilian notaries. The honest answer is: the regulatory wedge gave us 18 great months and then a horizontal player added a compliance module and we became a feature. What is your defensibility *after* the mandate becomes table-stakes? Because right now I don't hear one." },
];

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
  "+ CITE EVIDENCE": "Per our 14 customer-discovery interviews with managing partners in Madrid & Lisbon, ",
  "+ NUMBERS": "Concretely: blended CAC €11.4k, gross margin 78%, payback at month 9. ",
  "+ REFRAME PREMISE": "I'd push back on the framing. The real question isn't X, it's: ",
  "+ CONCEDE & PIVOT": "You're right on that point — and that's exactly why we're choosing to ",
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

function DebatePage() {
  const [ideaDraft, setIdeaDraft] = useState(DEFAULT_IDEA);
  const [idea, setIdea] = useState(DEFAULT_IDEA);

  const [personas, setPersonas] = useState<Persona[]>(SEED_PERSONAS);
  const [transcript, setTranscript] = useState<Turn[]>(SEED_TRANSCRIPT);
  const [round, setRound] = useState(4);
  const [survival, setSurvival] = useState(6.2);
  const [survivalDelta, setSurvivalDelta] = useState(-0.8);
  const [shieldsUsed, setShieldsUsed] = useState(2);
  const [response, setResponse] = useState("");
  const [activeSpeaker, setActiveSpeaker] = useState("mr");
  const [timeLeft, setTimeLeft] = useState(83);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(14 * 60 + 8);
  const [dossierId, setDossierId] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setTimeLeft((s) => Math.max(0, s - 1));
      setElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [paused]);

  // Time-out → adversary lands free hit
  useEffect(() => {
    if (timeLeft === 0 && !paused) {
      handleTimeout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

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

  const handleSend = useCallback(() => {
    if (!response.trim()) return;
    const defense: Turn = {
      id: Date.now(),
      who: "you",
      type: "defense",
      ts: nextTs(),
      body: response.trim(),
    };

    // quality heuristic — numbers & length lower the next attack
    const hasNumbers = /\d/.test(response);
    const long = response.length > 220;
    const quality = (hasNumbers ? 0.4 : 0) + (long ? 0.3 : 0) + Math.min(0.3, response.length / 1500);
    const survivalShift = +(quality * 1.4 - 0.3).toFixed(2); // -0.3 .. +1.1
    const pressureDrop = Math.round(8 + quality * 14);

    // current speaker eases up
    setPersonas((prev) => prev.map((p) => p.id === activeSpeaker
      ? { ...p, pressure: Math.max(10, p.pressure - pressureDrop), killshot: Math.max(0, p.killshot - 10) }
      : p));

    setSurvival((s) => Math.max(0, Math.min(10, +(s + survivalShift).toFixed(1))));
    setSurvivalDelta(survivalShift);

    // queue next attacker
    const next = pickNextSpeaker(activeSpeaker);
    const tmpl = ATTACK_TEMPLATES[next.id](idea);
    const attack: Turn = {
      id: Date.now() + 1,
      who: next.id,
      role: next.role.replace("The ", "").toUpperCase(),
      type: "attack",
      severity: tmpl.severity,
      body: tmpl.body,
      ts: nextTs(),
    };

    setTranscript((t) => [...t, defense, attack]);
    setResponse("");

    // next persona ramps up
    setPersonas((prev) => prev.map((p) => p.id === next.id
      ? { ...p, pressure: Math.min(99, p.pressure + 12), killshot: Math.min(80, p.killshot + 15) }
      : p));

    advanceToNextRound(next.id);
    requestAnimationFrame(() => transcriptRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [response, activeSpeaker, idea, nextTs, pickNextSpeaker, advanceToNextRound]);

  const handleConcede = useCallback(() => {
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
    const tmpl = ATTACK_TEMPLATES[next.id](idea);
    setTranscript((t) => [...t, concession, {
      id: Date.now() + 1, who: next.id, role: next.role.replace("The ","").toUpperCase(),
      type: "attack", severity: tmpl.severity, body: tmpl.body, ts: nextTs(),
    }]);
    setResponse("");
    advanceToNextRound(next.id);
  }, [response, activeSpeaker, idea, nextTs, pickNextSpeaker, advanceToNextRound]);

  const handleShield = useCallback(() => {
    if (shieldsUsed >= SHIELDS_TOTAL) return;
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
  }, [shieldsUsed, personas, nextTs, pickNextSpeaker]);

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
    setIdea(ideaDraft.trim());
    setTranscript([]);
    setRound(1);
    setShieldsUsed(0);
    setSurvival(7.5);
    setSurvivalDelta(0);
    setElapsed(0);
    setTimeLeft(ROUND_SECONDS);
    setPersonas(SEED_PERSONAS.map((p) => ({ ...p, pressure: 30 + Math.floor(Math.random() * 30), killshot: Math.floor(Math.random() * 20) })));
    // open with adversary
    const opener = ATTACK_TEMPLATES.lv(ideaDraft.trim());
    setTranscript([{ id: Date.now(), who: "lv", role: "ADVERSARY", type: "attack", severity: opener.severity, body: opener.body, ts: "00:00:00" }]);
    setActiveSpeaker("lv");
  }, [ideaDraft]);

  const handleReset = useCallback(() => {
    setPersonas(SEED_PERSONAS);
    setTranscript(SEED_TRANSCRIPT);
    setRound(4); setSurvival(6.2); setSurvivalDelta(-0.8);
    setShieldsUsed(2); setResponse(""); setActiveSpeaker("mr");
    setTimeLeft(83); setElapsed(14*60+8); setPaused(false);
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
    if (round >= TOTAL_ROUNDS) { handleReset(); return; }
    const next = pickNextSpeaker(activeSpeaker);
    const tmpl = ATTACK_TEMPLATES[next.id](idea);
    setTranscript((t) => [...t, {
      id: Date.now(), who: next.id, role: next.role.replace("The ","").toUpperCase(),
      type: "attack", severity: tmpl.severity, body: tmpl.body, ts: nextTs(),
    }]);
    advanceToNextRound(next.id);
  }, [round, activeSpeaker, idea, nextTs, pickNextSpeaker, advanceToNextRound, handleReset]);

  /* ---------- DERIVED ---------- */

  const combinedPressure = Math.round(personas.reduce((a, p) => a + p.pressure, 0) / personas.length);
  const loadedKillshots = personas.filter((p) => p.killshot > 30).length;
  const winnableLanes = personas.filter((p) => p.pressure < 50).length;

  const kills = transcript.filter((t) => t.severity === "kill").length;
  const warns = transcript.filter((t) => t.severity === "warn").length;
  const insights = transcript.filter((t) => t.severity === "insight").length;

  const verdictNow = useMemo(() => {
    if (survival >= 8) return "Idea is holding the line. Defensibility is sharp. Push deeper into operational risks.";
    if (survival >= 6) return "Idea survives initial volley. Wedge is plausible but timing-fragile. Defensibility post-mandate remains undefended.";
    if (survival >= 4) return "Idea is bleeding. Two unanswered kill-shots. You are now defending rhetoric, not data.";
    return "Idea is broken. The chamber would not fund this in current form. Return with evidence.";
  }, [survival]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Ticker round={round} survival={survival} survivalDelta={survivalDelta} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} activeSpeaker={personas.find(p => p.id === activeSpeaker)!} />
      <TopBar onReset={handleReset} onPause={() => setPaused((p) => !p)} paused={paused} />
      <Hero
        ideaDraft={ideaDraft} setIdeaDraft={setIdeaDraft} onEnter={handleEnterChamber}
        survival={survival} survivalDelta={survivalDelta} round={round}
        timeLeft={timeLeft} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} verdict={verdictNow}
      />
      <Tribunal personas={personas} activeSpeaker={activeSpeaker} onOpenDossier={setDossierId}
        combinedPressure={combinedPressure} loadedKillshots={loadedKillshots} winnableLanes={winnableLanes} />
      <ChamberCore
        transcript={transcript} personas={personas} response={response} setResponse={setResponse}
        timeLeft={timeLeft} round={round} elapsed={elapsed}
        shieldsUsed={shieldsUsed} onSend={handleSend} onConcede={handleConcede} onShield={handleShield}
        onChip={handleChip}
      />
      <div ref={transcriptRef} />
      <CourtRecord transcript={transcript} personas={personas} round={round}
        kills={kills} warns={warns} insights={insights}
        onExportMD={handleExportMarkdown} onCopyMD={handleCopyMarkdown} onExportPDF={handleExportPDF} />
      <FinalVerdictPreview survival={survival} round={round} onContinue={handleContinue} onReset={handleReset} />
      <Ticker round={round} survival={survival} survivalDelta={survivalDelta} shieldsLeft={SHIELDS_TOTAL - shieldsUsed} activeSpeaker={personas.find(p => p.id === activeSpeaker)!} />
      {dossierId && <DossierModal persona={personas.find(p => p.id === dossierId)!} onClose={() => setDossierId(null)} />}
    </div>
  );
}

/* ============================= CHROME ============================= */

function Ticker({ round, survival, survivalDelta, shieldsLeft, activeSpeaker }:
  { round: number; survival: number; survivalDelta: number; shieldsLeft: number; activeSpeaker: Persona }) {
  const items = [
    { tag: "LIVE", tone: "danger" as const, txt: `ROUND ${round} OF ${TOTAL_ROUNDS} // ${activeSpeaker.role.toUpperCase()} HOLDING THE FLOOR` },
    { tag: "SCORE", tone: survivalDelta < 0 ? "warn" as const : "success" as const, txt: `SURVIVAL ${survival.toFixed(1)} / 10 — ${survivalDelta >= 0 ? "UP" : "DOWN"} ${Math.abs(survivalDelta).toFixed(1)} LAST EXCHANGE` },
    { tag: "PRESSURE", tone: "danger" as const, txt: `${activeSpeaker.name.toUpperCase()} ESCALATING — KILL-SHOT PROBABILITY ${activeSpeaker.killshot}%` },
    { tag: "SHIELD", tone: "data" as const, txt: `${shieldsLeft} SHIELDS REMAINING / USE WITH INTENT` },
    { tag: "INSIGHT", tone: "success" as const, txt: "SALGADO FLAGS DEFENSIBILITY GAP — CONVERTIBLE TO ADVANTAGE" },
  ];
  const cls = (t: string) =>
    t === "danger" ? "border-danger text-danger" :
    t === "warn"   ? "border-warn text-warn" :
    t === "success"? "border-success text-success" :
                     "border-data text-data";
  return (
    <div className="bg-ink text-ink-foreground border-y border-ink overflow-hidden print:hidden">
      <div className="flex gap-10 py-2 text-[10px] tracking-[0.2em] whitespace-nowrap animate-[scroll_60s_linear_infinite]">
        {[...items, ...items, ...items].map((s, i) => (
          <span key={i} className="flex items-center gap-3">
            <span className={`px-1.5 py-0.5 border ${cls(s.tone)}`}>[{s.tag}]</span>
            <span className="text-ink-foreground/80">{s.txt}</span>
            <span className="text-ink-foreground/30">//</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }`}</style>
    </div>
  );
}

function TopBar({ onReset, onPause, paused }: { onReset: () => void; onPause: () => void; paused: boolean }) {
  return (
    <div className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40 print:hidden">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="size-9 border border-border-strong grid place-items-center font-display text-lg">PD</div>
          <div>
            <div className="font-display text-sm tracking-wider">PRIORITY DEBATER</div>
            <div className="text-[10px] text-muted-foreground tracking-widest">CHAMBER · SESSION #00471</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] tracking-widest">
          <Link to="/" className="text-muted-foreground hover:text-foreground">REPORT</Link>
          <span>·</span><span className="text-foreground font-bold">DEBATE</span>
          <span>·</span><span className="text-muted-foreground">BRAND</span>
          <span>·</span><span className="text-muted-foreground">LANDING</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPause} className="flex items-center gap-1.5 px-3 py-2 border border-border text-foreground text-[10px] tracking-widest font-bold hover:bg-surface">
            {paused ? <><Play className="size-3" /> RESUME</> : <><Pause className="size-3" /> PAUSE</>}
          </button>
          <span className="flex items-center gap-2 px-3 py-2 border border-danger text-danger text-[10px] tracking-widest font-bold">
            <span className="size-1.5 rounded-full bg-danger animate-pulse" /> {paused ? "PAUSED" : "LIVE"}
          </span>
          <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-2 bg-accent text-accent-foreground text-[10px] tracking-widest font-bold hover:opacity-90">
            <RotateCcw className="size-3" /> RE-RUN VALIDATION
          </button>
        </div>
      </div>
    </div>
  );
}

function Hero({ ideaDraft, setIdeaDraft, onEnter, survival, survivalDelta, round, timeLeft, shieldsLeft, verdict }:
  { ideaDraft: string; setIdeaDraft: (s: string) => void; onEnter: () => void; survival: number; survivalDelta: number; round: number; timeLeft: number; shieldsLeft: number; verdict: string }) {
  const tone = survival >= 7 ? "text-success" : survival >= 5 ? "text-warn" : "text-danger";
  return (
    <section className="relative bg-ink text-ink-foreground border-y border-ink grid-bg-ink print:hidden">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-16 grid lg:grid-cols-[1.4fr_1fr] gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-6 text-[10px] tracking-widest text-ink-foreground/60">
            <span className="px-2 py-1 border border-danger text-danger">CHAMBER ACTIVE</span>
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
            <button type="submit" className="px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
              ENTER THE CHAMBER <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
        <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-6 self-start">
          <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">LIVE SURVIVAL SCORE</div>
          <div className="flex items-end gap-4">
            <div className={`font-display text-[8rem] leading-none ${tone}`}>{survival.toFixed(1)}</div>
            <div className="text-ink-foreground/55 mb-4 text-xl">/ 10</div>
          </div>
          <div className={`text-xs ${survivalDelta >= 0 ? "text-success" : "text-danger"}`}>
            {survivalDelta >= 0 ? "▲" : "▼"} {Math.abs(survivalDelta).toFixed(1)} last exchange · trending {survivalDelta >= 0 ? "UP" : "DOWN"}
          </div>
          <div className="mt-6 grid grid-cols-3 border border-ink-foreground/20">
            <MiniStat label="ROUND" value={`${round}/${TOTAL_ROUNDS}`} />
            <MiniStat label="TIME LEFT" value={fmtClock(timeLeft)} tone={timeLeft < 30 ? "danger" : "warn"} />
            <MiniStat label="SHIELDS" value={`${shieldsLeft}/${SHIELDS_TOTAL}`} />
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

function Tribunal({ personas, activeSpeaker, onOpenDossier, combinedPressure, loadedKillshots, winnableLanes }:
  { personas: Persona[]; activeSpeaker: string; onOpenDossier: (id: string) => void; combinedPressure: number; loadedKillshots: number; winnableLanes: number }) {
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
            <PersonaThrone key={p.id} p={p} active={p.id === activeSpeaker} onOpen={() => onOpenDossier(p.id)} />
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

function PersonaThrone({ p, active, onOpen }: { p: Persona; active: boolean; onOpen: () => void }) {
  const c = HUE[p.hue];
  const statusLabel = p.status.toUpperCase();
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
        <span className={statusTone}>{statusLabel}</span>
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
  onSend, onConcede, onShield, onChip,
}: {
  transcript: Turn[]; personas: Persona[]; response: string; setResponse: (v: string) => void;
  timeLeft: number; round: number; elapsed: number; shieldsUsed: number;
  onSend: () => void; onConcede: () => void; onShield: () => void; onChip: (label: string) => void;
}) {
  const MAX = 1200;
  const lastAttack = [...transcript].reverse().find((t) => t.who !== "you") || transcript[transcript.length - 1];
  const speaker = personas.find((p) => p.id === lastAttack.who) || personas[0];
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
              <div className="flex items-center gap-4">
                <div className={`size-12 grid place-items-center border-2 ${c.border} font-display text-base ${c.text} bg-ink`}>
                  {speaker.initials}
                </div>
                <div>
                  <div className="text-[10px] tracking-widest text-ink-foreground/55">INCOMING FIRE FROM</div>
                  <div className="font-display text-lg leading-tight">{speaker.name}</div>
                  <div className={`text-[10px] tracking-widest ${c.text}`}>{speaker.role.toUpperCase()} · KILL-SHOT {speaker.killshot}%</div>
                </div>
              </div>
              <CountdownRing pct={pct} label={fmtClock(timeLeft)} critical={timeLeft < 30} />
            </div>

            <div className="relative p-8 md:p-12 border-b border-ink-foreground/15">
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
            </div>

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
                placeholder="Draft your rebuttal. Be specific. Numbers travel. Adjectives die. (⌘+Enter to send)"
                className="w-full h-44 bg-ink-foreground/5 border border-ink-foreground/25 text-ink-foreground placeholder:text-ink-foreground/35 p-4 text-sm leading-relaxed focus:outline-none focus:border-data resize-none"
              />

              <div className="mt-4 flex flex-wrap gap-2 text-[10px] tracking-widest">
                {Object.keys(CHIP_SNIPPETS).map((label) => (
                  <Chip key={label} onClick={() => onChip(label)}>{label}</Chip>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <button onClick={onSend} disabled={!response.trim()}
                  className="flex-1 px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_var(--danger)]">
                  <Send className="size-4" /> DELIVER DEFENSE
                </button>
                <button onClick={onConcede}
                  className="px-5 py-4 border border-ink-foreground/30 text-ink-foreground/80 font-display text-sm tracking-widest hover:bg-ink-foreground/5 flex items-center justify-center gap-2">
                  <X className="size-4" /> CONCEDE POINT
                </button>
                <button onClick={onShield} disabled={shieldsUsed >= SHIELDS_TOTAL}
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
          <span>THE CHAMBER · SESSION #00471</span>
          <span>VOL. IV · ROUND {round} OF {TOTAL_ROUNDS}</span>
          <span>{new Date().toISOString().slice(0,10)} · {filtered.length} ENTR{filtered.length===1?"Y":"IES"}</span>
        </div>

        <div className="border border-ink bg-surface divide-y divide-border">
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground">No entries match the current filter.</div>
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

function FinalVerdictPreview({ survival, round, onContinue, onReset }: { survival: number; round: number; onContinue: () => void; onReset: () => void }) {
  return (
    <section className="bg-ink text-ink-foreground border-y border-ink grid-bg-ink">
      <div className="mx-auto max-w-[1480px] px-4 md:px-8 py-20">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-[10px] tracking-widest text-ink-foreground/55 mb-3">— 04 / FINAL VERDICT (PROJECTED)</div>
            <h2 className="text-display text-4xl md:text-5xl text-ink-foreground max-w-3xl">
              If the chamber closed now, <span className="hl-red">this is what survives.</span>
            </h2>
          </div>
          <span className="px-3 py-2 border border-warn text-warn text-[10px] tracking-widest">
            {round >= TOTAL_ROUNDS ? "FINAL" : "PROVISIONAL"} · ROUND {round} / {TOTAL_ROUNDS} · SURVIVAL {survival.toFixed(1)}/10
          </span>
        </div>

        <div className="grid lg:grid-cols-4 gap-3">
          <VerdictCard tone="warn" title="KEY ASSUMPTIONS"
            items={[
              "Q3 2026 mandate creates an unavoidable 12-month buying window.",
              "Mid-sized firms (50–200 lawyers) will adopt vertical SaaS, not generic tools.",
              "Bilingual ES/PT support is achievable with a sub-12-person team.",
            ]} />
          <VerdictCard tone="danger" title="UNRESOLVED RISKS"
            items={[
              "9-month procurement cycle breaks the 4-month CAC payback model.",
              "No defensibility once compliance becomes table-stakes.",
              "Lemontech / Sage Despachos likely to ship a compliance bolt-on.",
            ]} />
          <VerdictCard tone="danger" title="CONTRADICTIONS LOGGED"
            items={[
              "'Lean wedge' vs. ES+PT residency + SII integrations on day one.",
              "Founder timing assumes urgency law firms historically ignore.",
              "Burn plan inconsistent with stated 18-month surface area.",
            ]} />
          <VerdictCard tone="data" title="VALIDATION PRIORITIES"
            items={[
              "5 paid LOIs from 50+ lawyer Iberian firms before any code is written.",
              "Two design partners willing to expose their NAS / Lexnet workflows.",
              "Defensibility memo: what compounds AFTER the mandate?",
            ]} />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 print:hidden">
          <button onClick={onContinue} className="px-6 py-4 bg-danger text-ink-foreground font-display text-sm tracking-widest hover:opacity-90 flex items-center gap-2">
            {round >= TOTAL_ROUNDS ? "CHAMBER CLOSED — START NEW SESSION" : `CONTINUE TO ROUND ${round + 1}`} <ChevronRight className="size-4" />
          </button>
          <Link to="/" className="px-6 py-4 border border-ink-foreground/40 text-ink-foreground font-display text-sm tracking-widest hover:bg-ink-foreground/5 flex items-center gap-2">
            EXIT TO FULL VALIDATION REPORT <ArrowRight className="size-4" />
          </Link>
          <button onClick={onReset} className="px-6 py-4 border border-warn text-warn font-display text-sm tracking-widest hover:bg-warn/10 flex items-center gap-2">
            <AlertTriangle className="size-4" /> ABANDON SESSION
          </button>
        </div>
      </div>
    </section>
  );
}

function VerdictCard({ tone, title, items }: { tone: "warn" | "danger" | "data"; title: string; items: string[] }) {
  const c = HUE[tone];
  return (
    <div className="border border-ink-foreground/25 bg-ink-foreground/5 p-5">
      <div className={`text-[10px] tracking-widest mb-3 ${c.text} flex items-center gap-2`}>
        <span className={`block size-2 ${c.bg}`} />
        {title}
      </div>
      <ul className={`space-y-3 border-t ${c.border}/40 pt-3`}>
        {items.map((it, i) => (
          <li key={i} className="text-xs text-ink-foreground/85 leading-relaxed flex gap-2">
            <span className={`mt-1 size-1.5 rounded-full ${c.bg} flex-shrink-0`} />
            {it}
          </li>
        ))}
      </ul>
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
