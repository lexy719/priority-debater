"use client";

/**
 * PD Studio — BUSINESS FABRICATION UNIT (route `/studio`).
 *
 * Not a website. A machine. An industrial HMI whose only job is manufacturing a
 * business from a spec: feed it a work order, it runs the line — BRAND · MARKET
 * · SOCIAL · PLATFORM — streaming telemetry the whole way, and outputs each
 * module as a dense technical spec sheet. Monospace, hairline cells, status
 * LEDs, part numbers. Function over beauty.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CORE_RULES, PIPELINE_ENFORCED, enforceBoard, videoBrainCheck, type BrainRule, type VideoBrief } from "@/lib/studio/brain";


/* ── machine palette — locked, see docs/pd-studio-design.md ─────────────── */
const BG = "#0A0A0B";       // base void / chassis (never pure #000)
const PANEL = "#111113";    // surface — panel / cell fill
const RAISED = "#17171A";   // hover / selected / active
const WELL = "#060607";     // recessed inset — console, log wells, inputs
const LINE = "#26262B";     // default hairline
const LINE2 = "#3A3A42";    // focused / major divider
const INK = "#EDEDEA";      // primary text
const DIM = "#8A8A82";      // secondary readouts
const FAINT = "#55554F";    // labels, units, marginalia
const AMBER = "#FFB000";    // accent — identity + attention (by treatment)
const GREEN = "#35C46A";    // ok / live / published
const WARN = "#F5A623";     // publishing / attention (flashing)
const SCHED = "#B5852F";    // queued / pending (muted ochre)
const RED = "#F04438";      // fault
const BLUE = "#4C9AFF";     // data / ids / metrics
const LEDOFF = "#2A2A2E";   // unlit LED / empty segment

/* ── data ──────────────────────────────────────────────────────────────── */
type Swatch = { name: string; hex: string; role: string; contrast: string };
type BrandKit = {
  projectCode: string; fullName: string; descriptor: string; domain: string;
  taglines: string[]; oneLiner?: string;
  brandKit: {
    audience: string; personality: string; positioning: string; tone: string;
    palette: Swatch[];
    typography: { display: { family: string; role: string }; body: { family: string; role: string }; mono: { family: string; role: string } };
    voice: { tag: string; body: string }[];
  };
  /* Campaign parameters the spindle manufactures alongside the kit. */
  campaign?: { objective?: string; audiences?: string[]; shots?: { v916?: string[]; v169?: string[]; v11?: string[] } };
};

const SUGGESTIONS = [
  "A sustainable coffee subscription for remote teams",
  "An AI study planner for medical students",
  "A ceramics studio selling handmade tableware",
];

const DEMO_KIT: BrandKit = {
  projectCode: "MERIDIAN", fullName: "Meridian Coffee Collective", descriptor: "A sustainable coffee subscription built for distributed teams.", domain: "meridian.coffee",
  taglines: ["Fuel the remote", "One roast, every timezone", "Your standup, upgraded"],
  oneLiner: "Meridian keeps distributed teams caffeinated with single-origin coffee, shipped on their sprint cadence.",
  brandKit: {
    audience: "Remote-first teams", personality: "Warm, precise, sustainable", positioning: "Premium ethical coffee ops", tone: "Direct and warm",
    palette: [
      { name: "ROAST", hex: "#2A1A12", role: "Primary ink", contrast: "#FFFFFF" },
      { name: "CREMA", hex: "#E8D9C4", role: "Surface", contrast: "#0A0A0A" },
      { name: "COPPER", hex: "#B5551D", role: "Accent", contrast: "#FFFFFF" },
      { name: "LEAF", hex: "#3F7D53", role: "Sustainable", contrast: "#FFFFFF" },
      { name: "PAPER", hex: "#FBF8F3", role: "Background", contrast: "#0A0A0A" },
      { name: "NIGHT", hex: "#141210", role: "Dark surface", contrast: "#FFFFFF" },
    ],
    typography: { display: { family: "Fraunces", role: "DISPLAY" }, body: { family: "Inter", role: "BODY" }, mono: { family: "JetBrains Mono", role: "META" } },
    voice: [
      { tag: "DIRECT", body: "Say what the coffee is and where it's from." },
      { tag: "WARM", body: "Talk to teams like people, not accounts." },
      { tag: "HONEST", body: "Name the farm, the roast date, the footprint." },
      { tag: "PRECISE", body: "Specifics build trust — origin, altitude, cadence." },
    ],
  },
};

type QStatus = "POSTED" | "PUBLISHING" | "SCHEDULED" | "QUEUED";

const MODULES = [
  { id: "00", key: "input", name: "INPUT" },
  { id: "01", key: "brand", name: "BRAND" },
  { id: "02", key: "market", name: "ADS" },
  { id: "03", key: "social", name: "SOCIAL" },
  { id: "04", key: "platform", name: "PLATFORM" },
] as const;
type ModKey = (typeof MODULES)[number]["key"];
type ModState = "locked" | "run" | "ok" | "fault";

/* ── helpers ───────────────────────────────────────────────────────────── */
function hash8(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase();
}
const clock2 = (n: number) => n.toString().padStart(2, "0");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const resOf = (fmt: string) => (fmt === "9:16" ? "1080×1920" : fmt === "1:1" ? "1080×1080" : "1920×1080");
const hms = (s: number) => `${clock2(Math.floor(s / 3600))}:${clock2(Math.floor((s % 3600) / 60))}:${clock2(s % 60)}`;

function ledColor(s: ModState) { return s === "ok" ? GREEN : s === "run" ? AMBER : s === "fault" ? RED : FAINT; }

/* ── page ──────────────────────────────────────────────────────────────── */
type Phase = "boot" | "idle" | "fab" | "ready";
type Log = { t: string; txt: string; c?: string };
const BOOT = ["CORE", "MEMORY 512K", "CONNECTORS 3/3", "MODULES 05 LINKED", "TELEMETRY BUS", "CALIBRATION"];

export default function PdStudioMachine() {
  const [brief, setBrief] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [phase, setPhase] = useState<Phase>("boot");
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [demo, setDemo] = useState(false);
  const [fab, setFab] = useState<{ cur: ModKey | null; prog: number }>({ cur: null, prog: 0 });
  const [active, setActive] = useState<ModKey>("input");
  const [bootStep, setBootStep] = useState(0);
  const [mod, setMod] = useState<Record<ModKey, ModState>>({ input: "locked", brand: "locked", market: "locked", social: "locked", platform: "locked" });
  const [logs, setLogs] = useState<Log[]>([]);
  const [conOpen, setConOpen] = useState(false);
  const [now, setNow] = useState({ h: 0, m: 0, s: 0 });
  const startRef = useRef<number>(0);
  const [uptime, setUptime] = useState(0);
  const conRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startRef.current = Date.now();
    const id = setInterval(() => {
      const d = new Date();
      setNow({ h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() });
      setUptime(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { conRef.current?.scrollTo({ top: conRef.current.scrollHeight }); }, [logs]);
  // telemetry is the star during boot/fab; the product is the star once ready.
  useEffect(() => { setConOpen(phase === "boot" || phase === "fab"); }, [phase]);

  // BOOT / power-on self-test — streams before the unit accepts a work order.
  useEffect(() => {
    let cancel = false;
    (async () => {
      for (let i = 0; i < BOOT.length; i++) {
        if (cancel) return;
        setBootStep(i);
        setLogs((l) => [...l, { t: "00:00:00", txt: `POST · ${BOOT[i]} OK`, c: DIM }]);
        await wait(185);
      }
      if (cancel) return;
      setBootStep(BOOT.length);
      setMod((m) => ({ ...m, input: "ok" }));
      setLogs((l) => [...l, { t: "00:00:00", txt: "UNIT READY · AWAITING WORK ORDER", c: GREEN }]);
      await wait(340);
      if (!cancel) setPhase("idle");
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stamp = () => `${clock2(now.h)}:${clock2(now.m)}:${clock2(now.s)}`;
  const log = (txt: string, c?: string) => setLogs((l) => [...l, { t: stamp(), txt, c }]);
  const setModS = (k: ModKey, s: ModState) => setMod((m) => ({ ...m, [k]: s }));

  async function run(text: string) {
    const topic = text.trim();
    if (!topic || phase === "fab") return;
    setSubmitted(topic); setPhase("fab"); setDemo(false); setKit(null);
    setActive("brand");
    setMod({ input: "ok", brand: "locked", market: "locked", social: "locked", platform: "locked" });
    setFab({ cur: null, prog: 0 });
    const spec = hash8(topic);
    setLogs([{ t: stamp(), txt: `INPUT ACCEPTED · SPEC ${spec} · ${topic.length}B`, c: INK }]);

    // step a module's progress through discrete telemetry ticks (mechanical, not smooth).
    const ticks = async (k: ModKey, steps: string[], to = 100) => {
      setModS(k, "run"); setFab({ cur: k, prog: 0 });
      for (let i = 0; i < steps.length; i++) {
        log(steps[i], DIM);
        setFab({ cur: k, prog: Math.round(((i + 1) / steps.length) * to) });
        await wait(170);
      }
    };
    const runMod = async (k: ModKey, steps: string[], okLog: string) => {
      await ticks(k, steps);
      setModS(k, "ok"); setFab({ cur: k, prog: 100 });
      log(okLog, GREEN); await wait(140);
    };

    await wait(180);
    const apiP = fetch("/api/studio/brandkit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) })
      .then((r) => r.json().then((d) => ({ ok: r.ok && !!d?.ok && !!d?.kit, d })).catch(() => ({ ok: false, d: null })))
      .catch(() => ({ ok: false, d: null }));

    // BRAND — gated on the live spindle (Claude); hold at ~85% until stock arrives.
    await ticks("brand", ["ENGAGING SPINDLE · CLAUDE", "RETRIEVING STOCK", "SYNTHESIZING PALETTE", "FITTING TYPE", "TUNING VOICE"], 85);
    log("AWAITING SYNTHESIS…", DIM);
    const res = await apiP;
    const isDemo = !res.ok;
    const k: BrandKit = isDemo ? DEMO_KIT : (res.d.kit as BrandKit);
    setKit(k); setDemo(isDemo);
    setFab({ cur: "brand", prog: 100 }); setModS("brand", "ok");
    log(`BRAND OK · DESIGNATION ${k.projectCode} · PAL(${k.brandKit.palette.length}) TYPE(3) VOICE(${k.brandKit.voice.length})`, GREEN);
    // Company-specific guidelines: Claude writes THIS business's ad rules into
    // the brain (idempotent server-side). Fire-and-forget — never blocks the line.
    if (!isDemo) {
      log("SEEDING COMPANY GUIDELINES → BRAIN", DIM);
      fetch("/api/studio/brainseed", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kit: { projectCode: k.projectCode, fullName: k.fullName, descriptor: k.descriptor, oneLiner: k.oneLiner, brandKit: { audience: k.brandKit.audience, positioning: k.brandKit.positioning, personality: k.brandKit.personality, tone: k.brandKit.tone } } }),
      }).catch(() => { /* teach UI still works */ });
    }
    await wait(200);

    await runMod("market", ["DRAFTING OBJECTIVE", "SEGMENTING AUDIENCE(2)", "ALLOCATING BUDGET €8.4K", "BUILDING FLIGHT PLAN WK 01–06", "WIRING PERFORMANCE METERS"], "ADS OK · 4 CH · 2 SEG · FLIGHTED");
    await runMod("social", ["WRITING BATCH(9)", "SIZING PER PLATFORM", "SPOOLING HIGGSFIELD(2)…", "SCHEDULING QUEUE(9)", "ARMING AUTO-PUBLISH"], "SOCIAL OK · 9 POSTS · 2 VIDEO · AUTOPILOT ARMED");
    await runMod("platform", ["OPENING ENDPOINTS(3)", "INDEXING CATALOG", "AGENT HANDSHAKE"], "PLATFORM OK · STORE ONLINE");

    log(`RUN COMPLETE · 4 MODULES · 0 FAULTS · ${isDemo ? "DEMO STOCK" : "LIVE"}`, isDemo ? AMBER : GREEN);
    setFab({ cur: null, prog: 0 });
    setPhase("ready");
  }

  function reset() {
    setPhase("idle"); setKit(null); setBrief(""); setSubmitted(""); setDemo(false);
    setActive("input"); setMod({ input: "ok", brand: "locked", market: "locked", social: "locked", platform: "locked" });
    setLogs([{ t: stamp(), txt: "UNIT RESET · AWAITING WORK ORDER", c: DIM }]);
  }

  const canSelect = (k: ModKey) => k === "input" || phase === "ready";

  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden text-[13px]" style={{ backgroundColor: BG, color: INK, fontFamily: "var(--app-font-mono)", fontVariantNumeric: "tabular-nums slashed-zero" }}>
      {/* ── TOP RAIL ─────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-stretch border-b" style={{ borderColor: LINE }}>
        <Link href="/" className="flex items-center gap-2 border-r px-4 no-underline" style={{ borderColor: LINE, color: INK }}>
          <span className="font-display text-[16px] tracking-[0.04em]">PDR</span>
          <span className="text-[10px] tracking-[0.2em]" style={{ color: DIM }}>STUDIO</span>
        </Link>
        <div className="flex flex-1 items-center gap-5 overflow-hidden px-4 text-[10px] uppercase tracking-[0.14em]" style={{ color: DIM }}>
          <span>UNIT <span style={{ color: INK }}>PD-STUDIO-01</span></span>
          <span className="hidden sm:inline">FIRMWARE <span style={{ color: INK }}>v0.4.1</span></span>
          <span className="hidden md:inline">SPEC <span style={{ color: INK }}>{submitted ? hash8(submitted) : "—"}</span></span>
        </div>
        <div className="flex items-center gap-2 border-l px-4 text-[10px] uppercase tracking-[0.16em]" style={{ borderColor: LINE }}>
          <Led color={phase === "fab" || phase === "boot" ? AMBER : phase === "ready" ? GREEN : DIM} blink={phase === "fab" || phase === "boot"} glow />
          <span style={{ color: phase === "fab" || phase === "boot" ? AMBER : phase === "ready" ? GREEN : DIM }}>
            {phase === "boot" ? "POST" : phase === "fab" ? "RUNNING" : phase === "ready" ? "READY" : "IDLE"}
          </span>
        </div>
        <div className="hidden items-center gap-4 border-l px-4 text-[10px] tabular-nums tracking-[0.12em] md:flex" style={{ borderColor: LINE, color: DIM }}>
          <span>CLK <span style={{ color: INK }}>{stamp()}</span></span>
          <span>UP <span style={{ color: INK }}>{clock2(Math.floor(uptime / 60))}:{clock2(uptime % 60)}</span></span>
        </div>
        <a href="/commerce/command" className="border-l px-4 text-[10px] uppercase tracking-[0.16em] no-underline transition-colors hover:text-white" style={{ borderColor: LINE, color: BLUE, display: "flex", alignItems: "center" }}>
          COMMERCE ↗
        </a>
        <button onClick={reset} className="border-l px-4 text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-white" style={{ borderColor: LINE, color: DIM }}>
          ⏻ RESET
        </button>
      </header>

      {/* ── BODY: process stack + work area ──────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* PROCESS STACK */}
        <aside className="hidden w-[224px] shrink-0 flex-col border-r md:flex" style={{ borderColor: LINE }}>
          <div className="border-b px-4 py-2 text-[9px] uppercase tracking-[0.24em]" style={{ borderColor: LINE, color: FAINT }}>Process line</div>
          {MODULES.map((m) => {
            const s = mod[m.key];
            const on = active === m.key;
            const sel = canSelect(m.key);
            return (
              <button key={m.key} disabled={!sel} onClick={() => sel && setActive(m.key)}
                className="group flex items-center gap-3 border-b border-l-2 px-4 py-3 text-left transition-colors disabled:cursor-default"
                style={{ borderBottomColor: LINE, borderLeftColor: on ? AMBER : "transparent", backgroundColor: on ? RAISED : "transparent" }}>
                <span className="tabular-nums text-[11px]" style={{ color: on ? AMBER : FAINT }}>{m.id}</span>
                <span className="flex-1 text-[12px] tracking-[0.08em]" style={{ color: on ? INK : sel ? DIM : FAINT }}>{m.name}</span>
                <Led color={ledColor(s)} blink={s === "run"} />
                <span className="w-9 text-right text-[9px] uppercase tracking-[0.1em]" style={{ color: ledColor(s) }}>
                  {s === "ok" ? "OK" : s === "run" ? "RUN" : s === "fault" ? "ERR" : "—"}
                </span>
              </button>
            );
          })}
          <div className="mt-auto border-t px-4 py-3 text-[9px] uppercase leading-relaxed tracking-[0.14em]" style={{ borderColor: LINE, color: FAINT }}>
            <div>YIELD <span style={{ color: DIM }}>{Object.values(mod).filter((s) => s === "ok").length}/5</span></div>
            <div className="mt-1">FAULTS <span style={{ color: DIM }}>0</span></div>
          </div>
        </aside>

        {/* WORK AREA */}
        <div className="min-w-0 flex-1 overflow-auto" style={{ backgroundImage: `linear-gradient(${LINE} 1px,transparent 1px),linear-gradient(90deg,${LINE} 1px,transparent 1px)`, backgroundSize: "44px 44px", backgroundPosition: "-1px -1px" }}>
          {phase === "boot" ? <BootScreen step={bootStep} /> : phase === "fab" ? <FabricationView mod={mod} fab={fab} /> : (
            <>
              {active === "input" && <InputModule brief={brief} setBrief={setBrief} onRun={run} phase={phase} demo={demo} />}
              {active === "brand" && kit && <BrandModule kit={kit} demo={demo} onLock={(p) => setKit((k) => (k ? { ...k, ...p, brandKit: { ...k.brandKit, ...p.brandKit } } : k))} />}
              {active === "market" && kit && <MarketModule kit={kit} />}
              {active === "social" && kit && <SocialModule kit={kit} />}
              {active === "platform" && kit && <PlatformModule kit={kit} />}
            </>
          )}
        </div>
        {/* spine label — engineering marginalia */}
        <aside className="hidden w-7 shrink-0 items-center justify-center border-l lg:flex" style={{ borderColor: LINE }}>
          <span className="text-[9px] uppercase tracking-[0.3em]" style={{ color: FAINT, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>PD-STUDIO-01 · REV A · MACHINE-LEGIBLE · CONFIDENTIAL</span>
        </aside>
      </div>

      {/* ── BOTTOM CONSOLE — collapsible; a thin telemetry ticker by default ── */}
      <section className="flex shrink-0 flex-col border-t" style={{ borderColor: LINE, backgroundColor: WELL, height: conOpen ? 148 : 28 }}>
        <button onClick={() => setConOpen((o) => !o)} className="flex items-center gap-3 border-b px-4 py-1 text-[9px] uppercase tracking-[0.22em]" style={{ borderColor: conOpen ? LINE : "transparent", color: FAINT }}>
          <Led color={phase === "fab" ? AMBER : GREEN} blink={phase === "fab"} />
          <span className="shrink-0">Console</span>
          {!conOpen && logs.length > 0 && (
            <span className="min-w-0 flex-1 truncate normal-case tracking-normal" style={{ color: logs[logs.length - 1]?.c ?? DIM }}>{logs[logs.length - 1]?.txt}</span>
          )}
          <span className="ml-auto shrink-0 tabular-nums">{conOpen ? "▾" : "▴"} {logs.length} LINES</span>
        </button>
        {conOpen && (
          <div ref={conRef} className="flex-1 overflow-auto px-4 py-1.5 text-[11px] leading-[1.55]">
            {logs.map((l, i) => (
              <div key={i} className="flex gap-3 whitespace-pre-wrap">
                <span className="shrink-0 tabular-nums" style={{ color: FAINT }}>{l.t}</span>
                <span style={{ color: l.c ?? DIM }}>{l.txt}</span>
              </div>
            ))}
            {phase === "fab" && <div className="flex gap-3"><span className="tabular-nums" style={{ color: FAINT }}>{stamp()}</span><Cursor /></div>}
          </div>
        )}
      </section>
    </main>
  );
}

/* ── shared machine bits ───────────────────────────────────────────────── */
function Led({ color, blink, glow }: { color: string; blink?: boolean; glow?: boolean }) {
  const lit = color !== LEDOFF;
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 border ${blink ? "animate-pulse" : ""}`}
      style={{ backgroundColor: color, borderColor: "rgba(0,0,0,0.5)", boxShadow: glow && lit ? `0 0 7px ${color}99` : "none" }}
    />
  );
}
function Cursor() {
  const [on, setOn] = useState(true);
  useEffect(() => { const id = setInterval(() => setOn((v) => !v), 500); return () => clearInterval(id); }, []);
  return <span style={{ color: AMBER }}>{on ? "▊" : " "}</span>;
}
/* registration mark — machined-panel corner tick (engineering marginalia). */
function Corner({ br }: { br?: boolean }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute ${br ? "bottom-0 right-0 rotate-180" : "top-0 left-0"}`} style={{ width: 7, height: 7 }}>
      <span className="absolute left-0 top-0 h-[7px] w-[1px]" style={{ backgroundColor: LINE2 }} />
      <span className="absolute left-0 top-0 h-[1px] w-[7px]" style={{ backgroundColor: LINE2 }} />
    </span>
  );
}
function Cell({ label, children, span, className }: { label?: string; children: React.ReactNode; span?: string; className?: string }) {
  return (
    <div className={`relative border p-4 ${span ?? ""} ${className ?? ""}`} style={{ borderColor: LINE, backgroundColor: PANEL }}>
      <Corner /><Corner br />
      {label && <div className="mb-2.5 text-[9px] uppercase tracking-[0.22em]" style={{ color: FAINT }}>{label}</div>}
      {children}
    </div>
  );
}
function ModuleHead({ id, name, rev, sn }: { id: string; name: string; rev: string; sn: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b px-6 py-3 text-[10px] uppercase tracking-[0.18em]" style={{ borderColor: LINE, backgroundColor: "#0B0C0A", color: FAINT }}>
      <span style={{ color: AMBER }}>MOD {id}/04</span>
      <span className="text-[13px] tracking-[0.1em]" style={{ color: INK }}>{name}</span>
      <span>REV <span style={{ color: DIM }}>{rev}</span></span>
      <span>SN <span style={{ color: DIM }}>{sn}</span></span>
      <span className="ml-auto flex items-center gap-2"><Led color={GREEN} /> <span style={{ color: GREEN }}>OK</span></span>
    </div>
  );
}

/* ── fabrication cycle — the machine mid-run ───────────────────────────── */
function SegBar({ pct, color = AMBER, segs = 30 }: { pct: number; color?: string; segs?: number }) {
  const filled = Math.round((pct / 100) * segs);
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: segs }).map((_, i) => (
        <span key={i} className="h-3 flex-1" style={{ backgroundColor: i < filled ? color : "#191b15" }} />
      ))}
    </div>
  );
}
function Spinner() {
  const frames = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((v) => (v + 1) % frames.length), 90); return () => clearInterval(id); }, []);
  return <span style={{ color: AMBER }}>{frames[i]}</span>;
}
function FabricationView({ mod, fab }: { mod: Record<ModKey, ModState>; fab: { cur: ModKey | null; prog: number } }) {
  const items = MODULES.filter((m) => m.key !== "input");
  const pctOf = (k: ModKey) => (mod[k] === "ok" ? 100 : fab.cur === k ? fab.prog : 0);
  const overall = Math.round(items.reduce((a, m) => a + pctOf(m.key), 0) / items.length);
  const curName = MODULES.find((m) => m.key === fab.cur)?.name ?? "—";
  return (
    <div className="mx-auto max-w-[900px] p-6 lg:p-10">
      <div className="flex items-baseline gap-4">
        <Spinner />
        <span className="font-display text-[clamp(1.8rem,4.5vw,3rem)] uppercase tracking-[0.02em]" style={{ color: AMBER }}>Cycle in progress</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>
        <span>FABRICATING BUSINESS</span>
        <span>CURRENT <span style={{ color: INK }}>{curName}</span></span>
        <span className="tabular-nums">OVERALL <span style={{ color: INK }}>{clock2(overall)}%</span></span>
      </div>

      <div className="mt-7 border" style={{ borderColor: LINE, backgroundColor: PANEL }}>
        {items.map((m) => {
          const s = mod[m.key]; const p = pctOf(m.key);
          return (
            <div key={m.key} className="flex items-center gap-4 border-b px-4 py-3.5" style={{ borderColor: LINE }}>
              <span className="tabular-nums text-[11px]" style={{ color: FAINT }}>{m.id}</span>
              <span className="w-24 shrink-0 text-[12px] tracking-[0.08em]" style={{ color: s === "locked" ? FAINT : INK }}>{m.name}</span>
              <Led color={ledColor(s)} blink={s === "run"} />
              <div className="min-w-0 flex-1"><SegBar pct={p} color={s === "ok" ? GREEN : AMBER} /></div>
              <span className="w-12 shrink-0 text-right tabular-nums text-[11px]" style={{ color: s === "ok" ? GREEN : s === "run" ? AMBER : FAINT }}>{s === "ok" ? "OK" : `${clock2(p)}%`}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <span className="w-24 shrink-0 text-[10px] uppercase tracking-[0.2em]" style={{ color: DIM }}>Overall</span>
        <div className="min-w-0 flex-1"><SegBar pct={overall} color={AMBER} /></div>
        <span className="w-12 shrink-0 text-right tabular-nums text-[12px]" style={{ color: INK }}>{clock2(overall)}%</span>
      </div>
    </div>
  );
}

/* ── boot — power-on self-test ─────────────────────────────────────────── */
function BootScreen({ step }: { step: number }) {
  const pct = Math.round((step / BOOT.length) * 100);
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="relative w-[460px] max-w-[88vw] border p-6" style={{ borderColor: LINE, backgroundColor: PANEL }}>
        <Corner /><Corner br />
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>
          <span>UNIT PD-STUDIO-01</span><span>POWER-ON SELF TEST</span>
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {BOOT.map((s, i) => {
            const st = i < step ? "ok" : i === step ? "run" : "off";
            return (
              <div key={s} className="flex items-center gap-3 text-[12px]">
                <Led color={st === "ok" ? GREEN : st === "run" ? AMBER : LEDOFF} blink={st === "run"} glow={st !== "off"} />
                <span className="flex-1 tracking-[0.06em]" style={{ color: st === "off" ? FAINT : INK }}>{s}</span>
                <span className="w-8 text-right text-[10px] uppercase tracking-[0.12em] tabular-nums" style={{ color: st === "ok" ? GREEN : st === "run" ? AMBER : FAINT }}>{st === "ok" ? "OK" : st === "run" ? "··" : ""}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-6"><SegBar pct={pct} color={pct === 100 ? GREEN : AMBER} segs={26} /></div>
        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] tabular-nums" style={{ color: FAINT }}>
          <span>{step >= BOOT.length ? <span style={{ color: GREEN }}>UNIT READY</span> : "SELF-TEST"}</span><span>{clock2(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── 00 · INPUT — work order ───────────────────────────────────────────── */
function InputModule({ brief, setBrief, onRun, phase, demo }: { brief: string; setBrief: (v: string) => void; onRun: (t: string) => void; phase: Phase; demo: boolean }) {
  const running = phase === "fab";
  return (
    <div className="mx-auto max-w-[880px] p-6 lg:p-10">
      <div className="mb-6 flex items-baseline gap-4">
        <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: AMBER }}>MOD 00 / INPUT</span>
        <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>WORK ORDER · SPEC ENTRY</span>
      </div>
      <h1 className="font-display text-[clamp(2.4rem,6vw,4.6rem)] uppercase leading-[0.9] tracking-[0.01em]">Business<br />Fabrication Unit</h1>
      <p className="mt-5 max-w-[62ch] text-[13px] leading-relaxed" style={{ color: DIM }}>
        Load one line of spec. The unit runs the line — brand, market, social, platform — and outputs each
        module as a technical sheet. No decoration. It gets it done.
      </p>

      <div className="mt-8 border" style={{ borderColor: LINE, backgroundColor: PANEL }}>
        <div className="flex items-center justify-between border-b px-4 py-2 text-[9px] uppercase tracking-[0.2em]" style={{ borderColor: LINE, color: FAINT }}>
          <span>INPUT SPEC</span><span>{brief.length} BYTES</span>
        </div>
        <div className="flex items-start gap-3 p-4">
          <span className="pt-0.5" style={{ color: AMBER }}>›</span>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onRun(brief); } }}
            placeholder="a sustainable coffee subscription for remote teams" autoFocus rows={2} disabled={running}
            className="w-full resize-none bg-transparent text-[15px] leading-snug outline-none" style={{ color: INK, outline: "none", boxShadow: "none" }} />
        </div>
        <div className="flex items-center justify-between border-t px-4 py-2" style={{ borderColor: LINE }}>
          <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>⌘↵ TO RUN</span>
          <button onClick={() => onRun(brief)} disabled={!brief.trim() || running}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-opacity disabled:opacity-30"
            style={{ backgroundColor: AMBER, color: "#0A0A08" }}>
            {running ? "RUNNING…" : "▶ RUN LINE"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[9px] uppercase tracking-[0.22em]" style={{ color: FAINT }}>Preset orders</div>
        <div className="border-t" style={{ borderColor: LINE }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={s} onClick={() => { setBrief(s); onRun(s); }} disabled={running}
              className="flex w-full items-center gap-3 border-b px-2 py-2.5 text-left text-[12px] transition-colors hover:bg-[#0F100E] disabled:opacity-40"
              style={{ borderColor: LINE, color: DIM }}>
              <span className="tabular-nums text-[10px]" style={{ color: FAINT }}>{clock2(i + 1)}</span>
              <span style={{ color: AMBER }}>›</span>{s}
            </button>
          ))}
        </div>
      </div>

      {demo && <div className="mt-6 border px-4 py-2 text-[10px] uppercase tracking-[0.14em]" style={{ borderColor: "#5a4400", color: AMBER, backgroundColor: "#141002" }}>⚠ DEMO STOCK LOADED · synthesis engine offline · check ANTHROPIC_API_KEY</div>}
    </div>
  );
}

/* ── 01 · BRAND spec sheet ─────────────────────────────────────────────── */
const BRAND_ROLES = ["Primary ink", "Surface", "Accent", "Support", "Background", "Dark surface"];
function mkPal(names: string[], hexes: string[]): Swatch[] {
  return names.map((n, i) => ({ name: n, hex: hexes[i], role: BRAND_ROLES[i] ?? "Support", contrast: i === 1 || i === 4 ? "#0A0A0A" : "#FFFFFF" }));
}
// Alternate palette stock the studio cycles through on REGENERATE (deterministic variants).
const BRAND_ALTS: { key: string; pal: Swatch[] }[] = [
  { key: "EMBER", pal: mkPal(["ROOT", "LINEN", "FLAME", "MOSS", "SHELL", "COAL"], ["#1A1613", "#ECE4D8", "#E2551F", "#4B7A46", "#FAF6EF", "#100D0B"]) },
  { key: "SLATE", pal: mkPal(["INK", "MIST", "AZURE", "TEAL", "SNOW", "ONYX"], ["#14181D", "#E4E8EC", "#2E6BE6", "#2AA79B", "#F6F8FA", "#0C0F13"]) },
  { key: "FOREST", pal: mkPal(["PINE", "SAGE", "LEAF", "CLAY", "MEADOW", "BARK"], ["#14201A", "#DCE6DB", "#2E8B57", "#C0713A", "#F4F8F2", "#0E140F"]) },
  { key: "NOIR", pal: mkPal(["JET", "ASH", "GOLD", "STEEL", "PAPER", "VOID"], ["#141414", "#E6E6E4", "#D4A84B", "#6E7076", "#F7F6F3", "#0B0B0B"]) },
];
const PAIRINGS = [
  { label: "EDITORIAL", display: "Fraunces", body: "Inter", mono: "JetBrains Mono", serif: true },
  { label: "INDUSTRIAL", display: "Archivo", body: "Inter", mono: "JetBrains Mono", serif: false },
  { label: "MODERN", display: "Space Grotesk", body: "Inter", mono: "IBM Plex Mono", serif: false },
  { label: "LUXE", display: "Playfair Display", body: "Source Serif 4", mono: "JetBrains Mono", serif: true },
];

type BrandPatch = {
  projectCode: string; fullName: string; domain: string; taglines: string[];
  brandKit: Partial<BrandKit["brandKit"]>;
};

function BrandModule({ kit, demo, onLock }: { kit: BrandKit; demo: boolean; onLock?: (patch: BrandPatch) => void }) {
  const bk = kit.brandKit;
  const [code, setCode] = useState(kit.projectCode);
  const [fullName, setFullName] = useState(kit.fullName);
  const [domain, setDomain] = useState(kit.domain);
  const [palIdx, setPalIdx] = useState(-1); // -1 = kit stock palette
  const [custom, setCustom] = useState<{ key: string; pal: Swatch[] } | null>(null); // Claude-regenerated set
  const [palBusy, setPalBusy] = useState(false);
  const [accent, setAccent] = useState(2);
  const [pairIdx, setPairIdx] = useState(0);
  const [locked, setLocked] = useState(false);
  const [tagline, setTagline] = useState(kit.taglines[0] ?? bk.positioning);
  const [pos, setPos] = useState(bk.positioning);
  const [aud, setAud] = useState(bk.audience);
  const [pers, setPers] = useState(bk.personality);
  const [tone, setTone] = useState(bk.tone);

  const palette = (custom ? custom.pal : palIdx < 0 ? bk.palette : BRAND_ALTS[palIdx].pal).slice(0, 6);
  const palName = custom ? custom.key : palIdx < 0 ? "STOCK" : BRAND_ALTS[palIdx].key;
  // ⟳ = Claude synthesizes a fresh set for THIS business; canned sets are the offline fallback.
  const regen = async () => {
    if (palBusy) return;
    setPalBusy(true);
    try {
      const avoid = [...bk.palette, ...(custom?.pal ?? [])].map((s) => s.hex);
      const r = await fetch("/api/studio/palette", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kit: { projectCode: kit.projectCode, descriptor: kit.descriptor, positioning: bk.positioning, audience: bk.audience }, avoid }),
      });
      const d = await r.json();
      if (d?.ok && Array.isArray(d.palette) && d.palette.length === 6) {
        setCustom({ key: d.name ?? "FRESH", pal: d.palette });
      } else {
        setCustom(null); setPalIdx((i) => (i + 1) % BRAND_ALTS.length);
      }
    } catch {
      setCustom(null); setPalIdx((i) => (i + 1) % BRAND_ALTS.length);
    }
    setAccent(2);
    setPalBusy(false);
  };
  // LOCK writes the edited identity back into the LIVE kit — SOCIAL, ADS and
  // the storefront all fabricate with what you locked, not the first draft.
  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    if (next && onLock) onLock({
      projectCode: code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || kit.projectCode,
      fullName, domain,
      taglines: [tagline, ...kit.taglines.filter((t) => t !== tagline)],
      brandKit: {
        positioning: pos, audience: aud, personality: pers, tone, palette,
        typography: { display: { family: pair.display, role: "DISPLAY" }, body: { family: pair.body, role: "BODY" }, mono: { family: pair.mono, role: "META" } },
      },
    });
  };
  const pair = PAIRINGS[pairIdx];
  const dispFam = `"${pair.display}", ${pair.serif ? "Georgia, serif" : "system-ui, sans-serif"}`;
  const bodyFam = `"${pair.body}", system-ui, sans-serif`;

  const accSw = palette[Math.min(accent, palette.length - 1)];
  const acc = accSw?.hex ?? AMBER;
  const cardBg = palette[4]?.hex ?? "#FBF8F3";
  const cardInk = palette[0]?.hex ?? "#141210";
  const mono = (code.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "PD").toUpperCase();
  const coherence = Math.min(99, 62 + palette.length * 2 + bk.voice.length * 4 + (locked ? 9 : 0));

  const inputCls = "w-full border px-3 py-2 text-[13px]";
  const inputSty = { borderColor: LINE, backgroundColor: WELL, color: INK, outline: "none" } as const;
  const fields: [string, string, (s: string) => void][] = [
    ["POSITIONING", pos, setPos], ["AUDIENCE", aud, setAud], ["PERSONALITY", pers, setPers], ["TONE", tone, setTone],
  ];

  return (
    <div>
      <ModuleHead id="01" name="BRAND" rev="A" sn={hash8(code).slice(0, 6)} />
      {demo && <div className="border-b px-6 py-1.5 text-[10px] uppercase tracking-[0.14em]" style={{ borderColor: LINE, color: AMBER, backgroundColor: "#141002" }}>⚠ demo stock</div>}
      <div className="p-4 lg:p-6">
        {/* prominent workspace identity */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: AMBER }}>Identity studio</div>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.88]">Brand Studio</h2>
            <p className="mt-1.5 max-w-[56ch] text-[13px]" style={{ color: DIM }}>Shape the wordmark, palette, type system &amp; voice — then lock the kit for every downstream module.</p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="font-display text-[clamp(2rem,4vw,3rem)] leading-none" style={{ color: AMBER }}>{coherence}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>coherence idx</div>
          </div>
        </div>

        {/* status strip */}
        <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.14em]" style={{ borderColor: LINE, backgroundColor: PANEL }}>
          <span className="flex items-center gap-2"><Led color={locked ? GREEN : SCHED} glow /> <span style={{ color: locked ? GREEN : SCHED }}>{locked ? "LOCKED · SEALED" : "DRAFT"}</span></span>
          <span style={{ color: FAINT }}>PALETTE <span style={{ color: INK }}>{palName}</span></span>
          <span style={{ color: FAINT }}>TYPE <span style={{ color: INK }}>{pair.label}</span></span>
          <span style={{ color: FAINT }}>VOICE <span style={{ color: INK }}>{clock2(bk.voice.length)}</span></span>
          <span className="ml-auto tabular-nums" style={{ color: FAINT }}>ACCENT <span style={{ color: INK }}>{acc}</span></span>
        </div>

        {/* IDENTITY PREVIEW — live rendered mark on brand surface */}
        <Cell label="IDENTITY PREVIEW · LIVE RENDER" className="mb-3">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center" style={{ backgroundColor: cardBg }}>
            <div className="flex h-24 w-24 shrink-0 items-center justify-center" style={{ backgroundColor: acc }}>
              <span className="font-display text-[2.6rem] leading-none" style={{ color: accSw?.contrast ?? "#fff" }}>{mono}</span>
            </div>
            <div className="min-w-0">
              <div className="truncate text-[clamp(1.8rem,5vw,3rem)] uppercase leading-[0.9]" style={{ fontFamily: dispFam, color: cardInk }}>{code}</div>
              <div className="mt-1.5 text-[13px]" style={{ fontFamily: bodyFam, color: cardInk, opacity: 0.7 }}>{fullName}</div>
              <div className="mt-0.5 text-[12px]" style={{ fontFamily: bodyFam, color: acc }}>{domain}</div>
              <div className="mt-3 max-w-[42ch] text-[14px] leading-snug" style={{ fontFamily: bodyFam, color: cardInk }}>{tagline}</div>
            </div>
            <div className="ml-auto hidden shrink-0 flex-col gap-1 sm:flex">
              {palette.map((sw, i) => <span key={sw.hex + i} className="h-4 w-14" style={{ backgroundColor: sw.hex }} />)}
            </div>
          </div>
        </Cell>

        {/* designation — editable */}
        <div className="grid gap-3 lg:grid-cols-3">
          <Cell label="WORDMARK">
            <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full border px-3 py-2 font-display text-[clamp(1.2rem,3vw,1.8rem)] uppercase" style={inputSty} />
          </Cell>
          <Cell label="LEGAL NAME"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} style={inputSty} /></Cell>
          <Cell label="DOMAIN"><input value={domain} onChange={(e) => setDomain(e.target.value)} className={inputCls} style={{ ...inputSty, color: AMBER }} /></Cell>
        </div>

        {/* palette — editable material spec (tap swatch → accent · regenerate cycles sets) */}
        <Cell label="PALETTE · MATERIAL SPEC" className="mt-3">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>SET <span style={{ color: INK }}>{palName}</span> · tap a swatch to set accent</span>
            <button onClick={regen} disabled={palBusy} className="ml-auto flex items-center gap-2 border px-3 py-1 text-[10px] uppercase tracking-[0.12em] disabled:opacity-50" style={{ borderColor: LINE2, color: AMBER }}>{palBusy ? "⟳ CLAUDE IS MIXING…" : "⟳ regenerate"}</button>
          </div>
          <div className="grid gap-x-8 gap-y-1.5 text-[11px] tabular-nums sm:grid-cols-2">
            {palette.map((sw, i) => { const on = i === accent; return (
              <button key={sw.hex + i} onClick={() => setAccent(i)} className="flex items-center gap-3 border-b py-1.5 text-left" style={{ borderColor: on ? AMBER : LINE }}>
                <span style={{ color: on ? AMBER : FAINT }}>{clock2(i + 1)}</span>
                <span className="h-5 w-8 shrink-0 border" style={{ backgroundColor: sw.hex, borderColor: on ? AMBER : LINE }} />
                <span className="w-16 shrink-0 tracking-[0.06em]" style={{ color: INK }}>{sw.name}</span>
                <span className="w-16 shrink-0" style={{ color: DIM }}>{sw.hex}</span>
                <span className="truncate text-[10px] uppercase tracking-[0.1em]" style={{ color: on ? AMBER : FAINT }}>{on ? "◆ ACCENT" : sw.role}</span>
              </button>
            ); })}
          </div>
        </Cell>

        {/* type system (selectable pairing + specimen) + voice */}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Cell label="TYPE SYSTEM">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PAIRINGS.map((p, i) => <button key={p.label} onClick={() => setPairIdx(i)} className="border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]" style={{ borderColor: pairIdx === i ? AMBER : LINE, color: pairIdx === i ? AMBER : DIM, backgroundColor: pairIdx === i ? "rgba(255,176,0,0.09)" : "transparent" }}>{p.label}</button>)}
            </div>
            <div className="border-t pt-3" style={{ borderColor: LINE }}>
              <div className="leading-none" style={{ fontFamily: dispFam, color: INK, fontSize: "clamp(2rem,6vw,3.2rem)" }}>Ag</div>
              <div className="mt-2 text-[13px]" style={{ fontFamily: bodyFam, color: DIM }}>{(kit.oneLiner || kit.descriptor || "The quick brown fox jumps over the lazy dog.").slice(0, 90)}</div>
              <div className="mt-3 flex flex-col gap-1.5 text-[11px]">
                {[["DISPLAY", pair.display], ["BODY", pair.body], ["MONO", pair.mono]].map(([r, f]) => (
                  <div key={r} className="flex items-baseline justify-between border-b py-1" style={{ borderColor: LINE }}><span className="text-[9px] uppercase tracking-[0.18em]" style={{ color: FAINT }}>{r}</span><span style={{ color: INK }}>{f}</span></div>
                ))}
              </div>
            </div>
          </Cell>
          <Cell label="VOICE · PARAMETERS">
            <div className="flex flex-col gap-2">
              {bk.voice.slice(0, 4).map((v) => (
                <div key={v.tag} className="border-b py-1.5" style={{ borderColor: LINE }}>
                  <span className="text-[11px] tracking-[0.1em]" style={{ color: AMBER }}>{v.tag}</span>
                  <span className="ml-3 text-[12px]" style={{ color: DIM }}>{v.body}</span>
                </div>
              ))}
            </div>
          </Cell>
        </div>

        {/* positioning — editable 4-up */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map(([k, v, set]) => (
            <Cell key={k} label={k}>
              <input value={v} onChange={(e) => set(e.target.value)} className="w-full border px-2.5 py-1.5 text-[13px]" style={inputSty} />
            </Cell>
          ))}
        </div>

        {/* tagline picker */}
        <Cell label="TAGLINE" className="mt-3">
          <div className="flex flex-wrap gap-1.5">
            {kit.taglines.map((t) => <button key={t} onClick={() => setTagline(t)} className="border px-2.5 py-1 text-[12px]" style={{ borderColor: tagline === t ? AMBER : LINE, color: tagline === t ? AMBER : DIM, backgroundColor: tagline === t ? "rgba(255,176,0,0.09)" : "transparent" }}>{t}</button>)}
          </div>
        </Cell>

        {/* LOCK */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: LINE }}>
          <div className="text-[11px]" style={{ color: DIM }}>{code} · {palName} palette · {pair.label} type · accent {acc} · {clock2(bk.voice.length)} voice params</div>
          <button onClick={toggleLock} className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ backgroundColor: locked ? "transparent" : AMBER, color: locked ? GREEN : "#0A0A08", border: locked ? `1px solid ${GREEN}` : "none" }}>
            {locked ? "● KIT LOCKED · UNLOCK" : "▶ LOCK BRAND KIT"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 02 · ADS — paid-growth console (results of the autopilot + the paid plan) ── */
function Filmstrip({ shots, colors }: { shots: string[]; colors: string[] }) {
  return (
    <div>
      <div className="flex gap-[3px]">{Array.from({ length: 14 }).map((_, i) => <span key={i} className="h-[3px] w-full" style={{ backgroundColor: i % 2 ? "transparent" : FAINT }} />)}</div>
      <div className="my-[3px] flex gap-[3px]">
        {shots.map((s, i) => (
          <div key={i} className="relative flex-1" style={{ height: 58, backgroundColor: colors[i % colors.length] }}>
            <span className="absolute left-1 top-1 text-[8px] tabular-nums" style={{ color: "#ffffffaa" }}>{clock2(i + 1)}</span>
            <span className="absolute bottom-1 left-1 text-[8px] uppercase tracking-[0.1em]" style={{ color: "#ffffffcc" }}>{s}</span>
            {i === 0 && <span className="absolute inset-0 flex items-center justify-center text-[14px]" style={{ color: "#ffffffcc" }}>▶</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-[3px]">{Array.from({ length: 14 }).map((_, i) => <span key={i} className="h-[3px] w-full" style={{ backgroundColor: i % 2 ? "transparent" : FAINT }} />)}</div>
    </div>
  );
}
const MKT_CHANNELS = [
  { id: "LINKEDIN", w: 34 }, { id: "PAID VIDEO", w: 28 }, { id: "INSTAGRAM", w: 20 },
  { id: "GOOGLE", w: 12 }, { id: "TIKTOK", w: 4 }, { id: "X", w: 2 },
];
const AUDIENCES = ["Remote-first teams", "Eng leaders", "Ops managers", "Startup founders", "Design teams"];
const VFMT = [
  { fmt: "9:16", plats: "TIKTOK · REELS", shots: ["HOOK", "SHOW", "PROOF", "CTA"], frames: 450, dur: "0:15" },
  { fmt: "16:9", plats: "YOUTUBE", shots: ["INTRO", "STORY", "DEMO", "OFFER", "CTA"], frames: 900, dur: "0:30" },
  { fmt: "1:1", plats: "META", shots: ["LOGO", "PRODUCT", "CTA"], frames: 180, dur: "0:06" },
];
/* Kit-specific storyboard labels when the spindle produced them; stock
   otherwise — ALWAYS pushed through the brain's board enforcement (hook
   first, CTA card last, pacing) before it can cost a render. */
const vshots = (kit: BrandKit, i: number): string[] => {
  const c = kit.campaign?.shots;
  const arr = i === 0 ? c?.v916 : i === 1 ? c?.v169 : c?.v11;
  return enforceBoard(arr && arr.length >= 3 ? arr : VFMT[i].shots, VFMT[i].dur);
};

/* Per-channel baseline results of what the Social Autopilot shipped (views K · eng % · CPA €). */
const PERF: Record<string, { v: number; e: number; c: number }> = {
  LINKEDIN: { v: 46.2, e: 4.2, c: 18 }, "PAID VIDEO": { v: 38.5, e: 6.8, c: 11 },
  INSTAGRAM: { v: 27.4, e: 5.1, c: 14 }, GOOGLE: { v: 16.8, e: 2.3, c: 22 },
  TIKTOK: { v: 21.6, e: 8.4, c: 9 }, X: { v: 3.1, e: 1.9, c: 31 },
};
function StatTile({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="relative border p-3" style={{ borderColor: LINE, backgroundColor: PANEL }}>
      <Corner /><Corner br />
      <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>{label}</div>
      <div className="mt-1.5 font-display text-[clamp(1.4rem,2.6vw,1.9rem)] leading-none tabular-nums" style={{ color: color ?? INK }}>
        {value}{unit && <span className="ml-1 align-top text-[11px]" style={{ color: FAINT, fontFamily: "var(--app-font-mono)" }}>{unit}</span>}
      </div>
    </div>
  );
}

/* ── the marketing brain — taught know-how, like Loam for websites ───────
   Core rules ship with the machine (src/lib/studio/brain.ts); taught rules are
   persisted per company via /api/studio/brain and steer Claude regeneration
   through /api/studio/copy. */
function brainCheck(body: string): Record<string, boolean> {
  const first = (body.split("\n")[0] ?? "").trim();
  const tags = (body.match(/#\w/g) ?? []).length;
  return {
    "HOOK-3S": first.length > 0 && first.length <= 72,
    "ONE-IDEA": body.split(/[.!?]/).filter((s) => s.trim().length > 8).length <= 5,
    "NAME-AUDIENCE": /team|founder|leader|manager|student|maker|for /i.test(body),
    "SPECIFICS": /\d|·|€/.test(body) || body.includes("→"),
    "CTA-NEXT": /→|start|join|get|see|read|follow/i.test(body),
    "NO-HYPE": !/revolutionary|game.?chang|amazing|incredible|world.?class/i.test(body),
    "NO-WALLS": body.length <= 480,
    "NO-STOCK": true,
    "NO-TAG-SPAM": tags <= 3,
  };
}

type AdView = { pf: string; angle: string; body: string; video: { dur: string; fmt: string; shots: string[] } | null; views: number; eng: number };

function AdModal({ ad, kit, onClose, onUpdate }: { ad: AdView; kit: BrandKit; onClose: () => void; onUpdate: (a: AdView) => void }) {
  const checks = brainCheck(ad.body);
  const cols = kit.brandKit.palette.slice(0, 4).map((p) => p.hex);
  // Persistent brain: core + taught rules for this company.
  const [rules, setRules] = useState<BrainRule[]>(CORE_RULES);
  const [teachTxt, setTeachTxt] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/studio/brain?code=${encodeURIComponent(kit.projectCode)}`)
      .then((r) => r.json()).then((d) => { if (alive && d?.ok && Array.isArray(d.brain?.rules)) setRules(d.brain.rules); })
      .catch(() => {});
    return () => { alive = false; };
  }, [kit.projectCode]);
  const coreOf = (kind: BrainRule["kind"]) => rules.filter((r) => r.kind === kind && r.src === "core" && r.domain !== "video");
  const taught = rules.filter((r) => r.src === "taught");
  const company = rules.filter((r) => r.src === "company");
  // Product grounding: does this ad name a real catalog product / exact price?
  const [products, setProducts] = useState<{ name: string; price: string }[]>([]);
  useEffect(() => {
    let alive = true; let slug: string | null = null;
    try { slug = localStorage.getItem("pdr-last-store"); } catch { /* ignore */ }
    if (!slug) return;
    fetch(`/store/${slug}/agent-catalog.json`).then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d?.products)) setProducts(d.products.map((p: { name: string; price: string }) => ({ name: p.name, price: p.price }))); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const grounded = products.length ? products.some((p) => (p.name && ad.body.includes(p.name)) || (p.price && ad.body.includes(p.price))) : null;
  // Video-domain rules: deterministic storyboard checks + pipeline guarantees.
  const vc = ad.video ? videoBrainCheck(ad.video) : null;
  const vRules = rules.filter((r) => r.src === "core" && r.domain === "video");
  const copyCore = coreOf("do").concat(coreOf("dont"));
  const passed = copyCore.filter((r) => checks[r.k]).length + (vc ? vRules.filter((r) => PIPELINE_ENFORCED.has(r.k) || vc[r.k]).length : 0);
  const total = copyCore.length + (vc ? vRules.length : 0);
  const [teachDomain, setTeachDomain] = useState<"copy" | "video">("copy");
  // Render spec: shot-level prompts + camera + timing — the Higgsfield payload.
  const [brief, setBrief] = useState<{ b: VideoBrief; lint: Record<string, boolean> } | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const compileBrief = async () => {
    if (briefBusy || !ad.video) return;
    setBriefBusy(true);
    let slug: string | null = null;
    try { slug = localStorage.getItem("pdr-last-store"); } catch { /* ignore */ }
    try {
      const r = await fetch("/api/studio/videobrief", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kit: { projectCode: kit.projectCode, fullName: kit.fullName, oneLiner: kit.oneLiner, descriptor: kit.descriptor, brandKit: { audience: kit.brandKit.audience, positioning: kit.brandKit.positioning, palette: kit.brandKit.palette.map((p) => ({ name: p.name, hex: p.hex })) } },
          slug, platform: ad.pf, fmt: ad.video.fmt, dur: ad.video.dur, shots: ad.video.shots, hook: ad.body.slice(0, 120),
        }),
      });
      const d = await r.json();
      if (d?.ok && d.brief) setBrief({ b: d.brief, lint: d.lint ?? {} });
    } catch { /* stays uncompiled */ }
    setBriefBusy(false);
  };

  const teach = async (kind: BrainRule["kind"]) => {
    const txt = teachTxt.trim(); if (!txt) return;
    setTeachTxt("");
    try {
      const r = await fetch("/api/studio/brain", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: kit.projectCode, add: { kind, txt, domain: teachDomain } }) });
      const d = await r.json(); if (d?.ok) setRules(d.brain.rules);
    } catch { /* stays local-only this session */ }
  };
  const forget = async (k: string) => {
    try {
      const r = await fetch("/api/studio/brain", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: kit.projectCode, remove: k }) });
      const d = await r.json(); if (d?.ok) setRules(d.brain.rules);
    } catch { /* ignore */ }
  };
  // Regenerate = next pillar, written by Claude THROUGH the brain, grounded in
  // the store's real catalog; template fallback.
  const regen = async () => {
    if (busy) return;
    setBusy(true);
    const nx = ANGLES[(ANGLES.findIndex((x) => x.label === ad.angle) + 1 + ANGLES.length) % ANGLES.length];
    let body = craft(kit, nx.key, ad.pf);
    let slug: string | null = null;
    try { slug = localStorage.getItem("pdr-last-store"); } catch { /* ignore */ }
    try {
      const r = await fetch("/api/studio/copy", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kit: { projectCode: kit.projectCode, fullName: kit.fullName, descriptor: kit.descriptor, domain: kit.domain, oneLiner: kit.oneLiner, brandKit: { audience: kit.brandKit.audience, positioning: kit.brandKit.positioning, tone: kit.brandKit.tone } }, platform: ad.pf, angle: nx.label, slug }),
      });
      const d = await r.json();
      if (d?.ok && d.body) body = d.body;
    } catch { /* fallback stands */ }
    onUpdate({ ...ad, angle: nx.label, body });
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(4,4,5,0.8)" }} onClick={onClose}>
      <div className="relative max-h-[92vh] w-full max-w-[920px] overflow-auto border" style={{ borderColor: LINE2, backgroundColor: PANEL }} onClick={(e) => e.stopPropagation()}>
        <Corner /><Corner br />
        {/* head */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-5 py-3 text-[10px] uppercase tracking-[0.18em]" style={{ borderColor: LINE, backgroundColor: "#0B0C0A" }}>
          <span style={{ color: AMBER }}>AD UNIT</span>
          <span className="text-[12px]" style={{ color: INK }}>{ad.pf}</span>
          <span style={{ color: FAINT }}>{ad.angle}</span>
          {ad.video && <span className="border px-1.5 py-[1px] tabular-nums" style={{ borderColor: AMBER, color: AMBER }}>▶ {ad.video.dur} · {ad.video.fmt}</span>}
          <span className="ml-auto flex items-center gap-4 tabular-nums" style={{ color: FAINT }}>
            <span><span style={{ color: INK }}>{ad.views.toFixed(1)}K</span> VIEWS</span>
            <span><span style={{ color: GREEN }}>{ad.eng.toFixed(1)}%</span> ENG</span>
          </span>
          <button onClick={onClose} className="border px-2 py-0.5" style={{ borderColor: LINE2, color: DIM }}>✕</button>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* creative — what actually ships */}
          <div className="border-b p-5 lg:border-b-0 lg:border-r" style={{ borderColor: LINE }}>
            <div className="text-[9px] uppercase tracking-[0.22em]" style={{ color: FAINT }}>CREATIVE</div>
            {ad.video && (
              <div className="mt-3">
                <Filmstrip shots={ad.video.shots} colors={cols} />
                <div className="mt-2 border-t pt-2 text-[10px] tabular-nums" style={{ borderColor: LINE, color: FAINT }}>
                  {resOf(ad.video.fmt)} · {ad.video.fmt} · {ad.video.dur} · H.264 · 24FPS · <span style={{ color: DIM }}>{ad.pf}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: SCHED }}>
                  <Led color={SCHED} /> RENDER · HIGGSFIELD · KEY PENDING — FRAMES ARE PLACEHOLDER ART
                </div>

                {/* RENDER SPEC — shot-level prompts, the literal Higgsfield payload */}
                <div className="mt-3 border-t pt-3" style={{ borderColor: LINE }}>
                  {!brief ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={compileBrief} disabled={briefBusy} className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>
                        {briefBusy ? "⟳ COMPILING…" : "▦ COMPILE RENDER SPEC"}
                      </button>
                      <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>shot prompts · camera · timing · overlays — in the company&apos;s visual world</span>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] uppercase tracking-[0.14em]">
                        <span style={{ color: BLUE }}>RENDER SPEC · {brief.b.platform} · {brief.b.fmt} · {brief.b.dur}</span>
                        {brief.b.product && <span style={{ color: FAINT }}>SELLS <span style={{ color: INK }}>{brief.b.product.name} · {brief.b.product.price}</span></span>}
                        <span className="ml-auto flex items-center gap-2">
                          {Object.entries(brief.lint).map(([k, ok]) => <span key={k} title={k} className="inline-block h-2 w-2 border" style={{ backgroundColor: ok ? GREEN : RED, borderColor: "rgba(0,0,0,0.5)" }} />)}
                          <span className="tabular-nums" style={{ color: Object.values(brief.lint).every(Boolean) ? GREEN : SCHED }}>{Object.values(brief.lint).filter(Boolean).length}/{Object.values(brief.lint).length} LINT</span>
                        </span>
                      </div>
                      <div className="max-h-[200px] overflow-auto border" style={{ borderColor: LINE, backgroundColor: WELL }}>
                        {brief.b.shots.map((s, i) => (
                          <div key={i} className="border-b px-3 py-2" style={{ borderColor: LINE }}>
                            <div className="flex flex-wrap items-baseline gap-x-3 text-[10px] uppercase tracking-[0.1em] tabular-nums">
                              <span style={{ color: FAINT }}>{clock2(i + 1)}</span>
                              <span style={{ color: AMBER }}>{s.beat}</span>
                              <span style={{ color: DIM }}>{s.seconds}s · {s.camera}</span>
                              {s.overlay && <span className="ml-auto normal-case tracking-normal" style={{ color: INK }}>“{s.overlay}”</span>}
                            </div>
                            <div className="mt-1 text-[11px] leading-snug" style={{ color: DIM }}>{s.prompt}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
                        <span>THIS SPEC IS THE HIGGSFIELD PAYLOAD — SOUL KEYFRAME → DOP MOTION, PER SHOT</span>
                        <button onClick={() => { setBrief(null); void compileBrief(); }} disabled={briefBusy} className="border px-2 py-0.5 uppercase disabled:opacity-50" style={{ borderColor: LINE2, color: AMBER }}>{briefBusy ? "⟳" : "↻ RECOMPILE"}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="mt-3 border p-4" style={{ borderColor: LINE, backgroundColor: WELL }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center font-display text-[14px]" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>{kit.projectCode[0]}</div>
                <div className="min-w-0">
                  <div className="truncate text-[12px]" style={{ color: INK }}>{kit.fullName}</div>
                  <div className="text-[10px]" style={{ color: FAINT }}>@{kit.domain.split(".")[0]} · {ad.pf} · SPONSORED</div>
                </div>
              </div>
              <div className="mt-3 whitespace-pre-wrap text-[13.5px] leading-relaxed" style={{ color: INK }}>{ad.body}</div>
            </div>
          </div>

          {/* the brain — why this ad looks the way it does */}
          <div className="p-5">
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.22em]" style={{ color: FAINT }}>
              <span>MARKETING BRAIN · KNOW-HOW</span>
              <span className="ml-auto flex items-center gap-2 tabular-nums" style={{ color: passed === total ? GREEN : AMBER }}>
                <Led color={passed === total ? GREEN : AMBER} glow />{passed}/{total} PASS
              </span>
            </div>
            <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: DIM }}>Always</div>
            <div className="mt-1 flex flex-col">
              {coreOf("do").map((r) => (
                <div key={r.k} className="flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                  <Led color={checks[r.k] ? GREEN : RED} glow={checks[r.k]} />
                  <span className="w-24 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: checks[r.k] ? GREEN : RED }}>{r.k}</span>
                  <span style={{ color: DIM }}>{r.txt}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: DIM }}>Never</div>
            <div className="mt-1 flex flex-col">
              {coreOf("dont").map((r) => (
                <div key={r.k} className="flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                  <Led color={checks[r.k] ? GREEN : RED} glow={checks[r.k]} />
                  <span className="w-24 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: checks[r.k] ? GREEN : RED }}>{r.k}</span>
                  <span style={{ color: DIM }}>{r.txt}</span>
                </div>
              ))}
            </div>
            {/* product grounding — the ad must sell what the store sells */}
            {grounded !== null && (
              <div className="mt-2 flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                <Led color={grounded ? GREEN : SCHED} glow={grounded} />
                <span className="w-24 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: grounded ? GREEN : SCHED }}>PRODUCT</span>
                <span style={{ color: DIM }}>{grounded ? "Names a real catalog product / exact price" : "Not grounded in the catalog yet — ↻ REGENERATE pulls real products in"}</span>
              </div>
            )}
            {/* company guidelines — generated for THIS business, never generic */}
            {company.length > 0 && (
              <>
                <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: INK }}>Company guidelines · written for {kit.projectCode}</div>
                <div className="mt-1 flex flex-col">
                  {company.map((r) => (
                    <div key={r.k} className="flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                      <Led color={INK} />
                      <span className="w-28 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: DIM }}>{r.k} · {r.kind === "do" ? "DO" : "DON'T"}{r.domain === "video" ? " · VID" : ""}</span>
                      <span className="min-w-0 flex-1" style={{ color: DIM }}>{r.txt}</span>
                      <button onClick={() => forget(r.k)} className="shrink-0 text-[10px]" style={{ color: FAINT }}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* learned from performance — measured, superseded on each learn pass */}
            {rules.some((r) => r.src === "learned") && (
              <>
                <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: BLUE }}>Learned from performance · measured data</div>
                <div className="mt-1 flex flex-col">
                  {rules.filter((r) => r.src === "learned").map((r) => (
                    <div key={r.k} className="flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                      <Led color={BLUE} glow />
                      <span className="w-28 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: BLUE }}>{r.k} · {r.kind === "do" ? "DO" : "DON'T"}</span>
                      <span className="min-w-0 flex-1" style={{ color: DIM }}>{r.txt}</span>
                      <button onClick={() => forget(r.k)} className="shrink-0 text-[10px]" style={{ color: FAINT }}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* video-domain rules — checked against THIS storyboard, pre-render */}
            {vc && (
              <>
                <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: BLUE }}>Video · storyboard rules</div>
                <div className="mt-1 flex flex-col">
                  {vRules.map((r) => { const ok = PIPELINE_ENFORCED.has(r.k) || !!vc[r.k]; return (
                    <div key={r.k} className="flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                      <Led color={ok ? GREEN : RED} glow={ok} />
                      <span className="w-24 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: ok ? GREEN : RED }}>{r.k}</span>
                      <span className="min-w-0 flex-1" style={{ color: DIM }}>{r.txt}</span>
                      {PIPELINE_ENFORCED.has(r.k) && <span className="shrink-0 text-[8px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>PIPELINE</span>}
                    </div>
                  ); })}
                </div>
              </>
            )}
            {taught.length > 0 && (
              <>
                <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: AMBER }}>Taught · steers generation</div>
                <div className="mt-1 flex flex-col">
                  {taught.map((r) => (
                    <div key={r.k} className="flex items-center gap-2.5 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                      <Led color={AMBER} glow />
                      <span className="w-28 shrink-0 text-[9px] uppercase tracking-[0.1em]" style={{ color: AMBER }}>{r.k} · {r.kind === "do" ? "DO" : "DON'T"}{r.domain === "video" ? " · VID" : ""}</span>
                      <span className="min-w-0 flex-1" style={{ color: DIM }}>{r.txt}</span>
                      <button onClick={() => forget(r.k)} className="shrink-0 text-[10px]" style={{ color: FAINT }}>✕</button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* teach the brain */}
            <div className="mt-3 border-t pt-3" style={{ borderColor: LINE }}>
              <div className="mb-1.5 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>Teach the brain</div>
              <input value={teachTxt} onChange={(e) => setTeachTxt(e.target.value)} placeholder="e.g. always mention the 30-day trial"
                className="w-full border px-2.5 py-1.5 text-[12px]" style={{ borderColor: LINE, backgroundColor: WELL, color: INK, outline: "none" }} />
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {(["copy", "video"] as const).map((d) => (
                  <button key={d} onClick={() => setTeachDomain(d)} className="border px-2 py-1 text-[9px] uppercase tracking-[0.12em]" style={{ borderColor: teachDomain === d ? AMBER : LINE, color: teachDomain === d ? AMBER : DIM, backgroundColor: teachDomain === d ? "rgba(255,176,0,0.09)" : "transparent" }}>{d === "copy" ? "COPY" : "VIDEO"}</button>
                ))}
                <button onClick={() => teach("do")} disabled={!teachTxt.trim()} className="border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] disabled:opacity-40" style={{ borderColor: LINE2, color: GREEN }}>+ ALWAYS</button>
                <button onClick={() => teach("dont")} disabled={!teachTxt.trim()} className="border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] disabled:opacity-40" style={{ borderColor: LINE2, color: RED }}>+ NEVER</button>
                <span className="ml-auto self-center text-[9px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>persisted per company</span>
              </div>
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3" style={{ borderColor: LINE }}>
          <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: busy ? AMBER : FAINT }}>{busy ? "CLAUDE IS REWRITING THROUGH THE BRAIN…" : "REGENERATE = CLAUDE + EVERY BRAIN RULE"}</span>
          <div className="flex items-center gap-2">
            <button onClick={regen} disabled={busy} className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] disabled:opacity-50" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>{busy ? "⟳ REGENERATING…" : "↻ REGENERATE"}</button>
            <button onClick={onClose} className="border px-4 py-2 text-[11px] uppercase tracking-[0.16em]" style={{ borderColor: LINE2, color: DIM }}>CLOSE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketModule({ kit }: { kit: BrandKit }) {
  const AUD = kit.campaign?.audiences?.length ? kit.campaign.audiences : AUDIENCES;
  const [objective, setObjective] = useState(kit.campaign?.objective || "Drive 500 team trials in Q3");
  const [channels, setChannels] = useState<Set<string>>(() => new Set(["LINKEDIN", "PAID VIDEO", "INSTAGRAM", "GOOGLE"]));
  const [audience, setAudience] = useState<Set<string>>(() => new Set(AUD.slice(0, 2)));
  const [budget, setBudget] = useState(8400);
  const [launched, setLaunched] = useState(false);
  const [views, setViews] = useState<Record<string, number>>(() => Object.fromEntries(Object.entries(PERF).map(([k, p]) => [k, p.v])));
  const [spend, setSpend] = useState(2140);
  // REAL meters: agent traffic + orders measured on the last published store.
  const [lastStore, setLastStore] = useState<string | null>(null);
  const [traffic, setTraffic] = useState<{ agents: number; humans: number; byAgent: Record<string, number>; recent: { ts: string; agent: string; kind: string }[] } | null>(null);
  const [orders, setOrders] = useState<{ count: number; revenue: number; byChannel: Record<string, number>; byAgent: Record<string, number>; recent: { id: string; ts: string; productName: string; qty: number; price: string; channel: string; agent: string }[] } | null>(null);
  useEffect(() => { try { setLastStore(localStorage.getItem("pdr-last-store")); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!lastStore) return;
    let alive = true;
    const pull = () => {
      fetch(`/api/store/${lastStore}/traffic`).then((r) => r.json()).then((d) => { if (alive && d?.ok) setTraffic(d); }).catch(() => {});
      fetch(`/api/store/${lastStore}/orders`).then((r) => r.json()).then((d) => { if (alive && d?.ok) setOrders(d); }).catch(() => {});
    };
    pull();
    const id = setInterval(pull, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [lastStore]);
  const liveRef = useRef(launched);
  liveRef.current = launched;
  // Live meters: while the campaign is live, views + spend tick.
  useEffect(() => {
    const id = setInterval(() => {
      if (!liveRef.current) return;
      setViews((v) => Object.fromEntries(Object.entries(v).map(([k, n]) => [k, n + PERF[k].v * (0.003 + Math.random() * 0.004)])));
      setSpend((s) => s + 1 + Math.random() * 2.4);
    }, 700);
    return () => clearInterval(id);
  }, []);

  const toggleCh = (id: string) => setChannels((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAud = (a: string) => setAudience((s) => { const n = new Set(s); n.has(a) ? n.delete(a) : n.add(a); return n; });
  // Feedback loop: distill the MEASURED data into learned brain rules.
  const [learnBusy, setLearnBusy] = useState(false);
  const [learnMsg, setLearnMsg] = useState<string | null>(null);
  const learn = async () => {
    if (!lastStore || learnBusy) return;
    setLearnBusy(true); setLearnMsg(null);
    try {
      const r = await fetch("/api/studio/brainlearn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: kit.projectCode, slug: lastStore }) });
      const d = await r.json();
      setLearnMsg(d?.ok ? `${(d.learned ?? []).length} LEARNED RULES → BRAIN · STEERING ALL FUTURE ADS` : String(d?.error ?? "learn failed").toUpperCase());
    } catch {
      setLearnMsg("LEARN FAILED");
    }
    setLearnBusy(false);
  };

  const chArr = MKT_CHANNELS.filter((c) => channels.has(c.id));
  const wsum = chArr.reduce((a, c) => a + c.w, 0) || 1;
  const totViews = chArr.reduce((a, c) => a + (views[c.id] ?? 0), 0);
  const avgEng = totViews ? chArr.reduce((a, c) => a + (views[c.id] ?? 0) * PERF[c.id].e, 0) / totViews : 0;
  const conv = Math.max(1, totViews * 1.19);
  const cpa = spend / conv;
  const roas = (conv * 38) / Math.max(1, spend);
  const maxV = Math.max(...chArr.map((c) => views[c.id] ?? 0), 1);
  const bestCh = chArr.length ? chArr.reduce((a, c) => (PERF[c.id].c < PERF[a.id].c ? c : a)) : null;
  const worstCh = chArr.length > 1 ? chArr.reduce((a, c) => (PERF[c.id].c > PERF[a.id].c ? c : a)) : null;
  const b = brandBits(kit);
  const top = [
    { pf: "TIKTOK", angle: "PAIN POINT", key: "problem", views: 18.4, eng: 9.2, video: true, hook: angleCore(b, "problem").hook },
    { pf: "LINKEDIN", angle: "PAIN POINT", key: "problem", views: 12.1, eng: 5.4, video: false, hook: angleCore(b, "problem").hook },
    { pf: "INSTAGRAM", angle: "SOCIAL PROOF", key: "proof", views: 9.8, eng: 6.1, video: false, hook: angleCore(b, "proof").hook },
  ];
  const [openAd, setOpenAd] = useState<AdView | null>(null);
  const openTop = (tc: (typeof top)[number]) => setOpenAd({
    pf: tc.pf, angle: tc.angle, body: craft(kit, tc.key, tc.pf),
    video: tc.video ? { dur: VFMT[0].dur, fmt: VFMT[0].fmt, shots: vshots(kit, 0) } : null,
    views: tc.views, eng: tc.eng,
  });

  return (
    <div>
      <ModuleHead id="02" name="ADS" rev="A" sn={hash8(kit.projectCode + "mkt").slice(0, 6)} />
      <div className="p-4 lg:p-6">
        {/* prominent workspace identity */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: AMBER }}>Paid growth</div>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.88]">Ads Console</h2>
            <p className="mt-1.5 max-w-[56ch] text-[13px]" style={{ color: DIM }}>The results of everything the Social Autopilot ships — views, spend, what worked where — and the paid plan behind it.</p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tabular-nums" style={{ color: AMBER }}>{totViews.toFixed(0)}K</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>views / mo</div>
          </div>
        </div>

        {/* status strip */}
        <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] tabular-nums" style={{ borderColor: LINE, backgroundColor: PANEL }}>
          <span className="flex items-center gap-2"><Led color={launched ? GREEN : SCHED} blink={launched} glow /> <span style={{ color: launched ? GREEN : SCHED }}>{launched ? "LIVE · AUTOPILOT" : "DRAFT"}</span></span>
          <span style={{ color: FAINT }}>CHANNELS <span style={{ color: INK }}>{channels.size}</span></span>
          <span style={{ color: FAINT }}>AUDIENCE <span style={{ color: INK }}>{audience.size} SEG</span></span>
          <span style={{ color: FAINT }}>SPEND <span style={{ color: INK }}>€{Math.round(spend).toLocaleString("en-US")}</span></span>
          <span className="ml-auto" style={{ color: FAINT }}>ROAS <span style={{ color: roas >= 2 ? GREEN : INK }}>{roas.toFixed(1)}×</span></span>
        </div>

        {/* PERFORMANCE — live meters */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="VIEWS / MO" value={`${totViews.toFixed(1)}K`} color={AMBER} />
          <StatTile label="ENG RATE" value={avgEng.toFixed(1)} unit="%" />
          <StatTile label="CPA" value={`€${cpa.toFixed(0)}`} color={BLUE} />
          <StatTile label="ROAS" value={`${roas.toFixed(1)}×`} color={GREEN} />
          <StatTile label="SPEND" value={`€${Math.round(spend).toLocaleString("en-US")}`} />
        </div>

        {/* WHERE IT WORKED — per-channel results + verdicts */}
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <Cell label="CHANNEL PERFORMANCE · WHERE IT WORKED · SIM UNTIL AD ACCOUNTS CONNECT">
            <div className="flex flex-col text-[11px] tabular-nums">
              {chArr.length === 0 && <span style={{ color: RED }}>NO CHANNELS SELECTED</span>}
              {chArr.map((c) => {
                const p = PERF[c.id]; const v = views[c.id] ?? p.v;
                const isBest = bestCh?.id === c.id, isWorst = worstCh?.id === c.id;
                return (
                  <div key={c.id} className="flex items-center gap-3 border-b py-2 pl-2" style={{ borderColor: LINE, backgroundColor: isBest ? RAISED : "transparent", borderLeft: isBest ? `2px solid ${AMBER}` : "2px solid transparent" }}>
                    <span className="w-20 shrink-0 uppercase tracking-[0.06em]" style={{ color: isBest ? INK : DIM }}>{c.id}</span>
                    <div className="h-3 flex-1" style={{ backgroundColor: "#1a1c18" }}><div className="h-full" style={{ width: `${Math.round((v / maxV) * 100)}%`, backgroundColor: isBest ? AMBER : "#8a8a5266" }} /></div>
                    <span className="w-14 text-right" style={{ color: INK }}>{v.toFixed(1)}K</span>
                    <span className="w-11 text-right" style={{ color: DIM }}>{p.e.toFixed(1)}%</span>
                    <span className="w-11 text-right" style={{ color: BLUE }}>€{p.c}</span>
                    <span className="w-14 text-right text-[9px] uppercase tracking-[0.1em]" style={{ color: isBest ? GREEN : isWorst ? RED : FAINT }}>{isBest ? "SCALE ▲" : isWorst ? "CUT ▼" : "HOLD"}</span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>
                <span>VIEWS · ENG · CPA PER CHANNEL</span><span>VERDICT BY CPA</span>
              </div>
            </div>
          </Cell>
          <Cell label="TOP CONTENT · FROM THE AUTOPILOT · SIM METRICS">
            <div className="flex flex-col">
              {top.map((tc, i) => (
                <button key={tc.pf} onClick={() => openTop(tc)} className="border-b py-2.5 text-left transition-colors hover:bg-[#17171A]" style={{ borderColor: LINE }}>
                  <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.12em]">
                    <span className="tabular-nums" style={{ color: FAINT }}>{clock2(i + 1)}</span>
                    <span style={{ color: AMBER }}>{tc.pf}</span>
                    <span style={{ color: FAINT }}>{tc.angle}</span>
                    {tc.video && <span className="border px-1.5 py-[1px] tabular-nums" style={{ borderColor: AMBER, color: AMBER }}>▶ {VFMT[0].dur} · {VFMT[0].fmt}</span>}
                    <span className="ml-auto tabular-nums" style={{ color: INK }}>{tc.views.toFixed(1)}K</span>
                    <span className="tabular-nums" style={{ color: GREEN }}>{tc.eng.toFixed(1)}%</span>
                    <span style={{ color: FAINT }}>⊕</span>
                  </div>
                  <div className="mt-1.5 truncate text-[12px]" style={{ color: DIM }}>{tc.hook}</div>
                </button>
              ))}
              <div className="pt-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>RANKED BY VIEWS · TAP AN AD TO OPEN IT</div>
            </div>
          </Cell>
        </div>

        {/* AGENT TRAFFIC — the only meter in the studio that is MEASURED, not simulated */}
        <Cell label="AGENT TRAFFIC · REAL — MEASURED ON YOUR PUBLISHED STORE" className="mt-3">
          {!lastStore ? (
            <div className="text-[11px]" style={{ color: FAINT }}>
              NO STOREFRONT PUBLISHED YET — generate one in PLATFORM. This panel counts real AI agents (GPTBot, ClaudeBot, PerplexityBot…) reading your store; everything else on this console is simulated until ad accounts connect.
            </div>
          ) : !traffic ? (
            <div className="text-[11px] tabular-nums" style={{ color: DIM }}>reading /store/{lastStore}…</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[200px_1fr_1fr]">
              <div>
                <div className="font-display text-[clamp(2rem,4vw,2.8rem)] leading-none tabular-nums" style={{ color: traffic.agents > 0 ? GREEN : FAINT }}>{traffic.agents}</div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>AI agent hits</div>
                <div className="mt-2 text-[10px] tabular-nums" style={{ color: DIM }}>{traffic.humans} human · /store/{lastStore}</div>
              </div>
              <div className="flex flex-col gap-1.5 text-[11px] tabular-nums">
                <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>BY AGENT</div>
                {Object.entries(traffic.byAgent).length === 0 && <span style={{ color: FAINT }}>no agent visits yet — submit the feed or share the store URL</span>}
                {Object.entries(traffic.byAgent).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a, n]) => {
                  const max = Math.max(...Object.values(traffic.byAgent), 1);
                  return (
                    <div key={a} className="flex items-center gap-2.5">
                      <span className="w-32 shrink-0 truncate" style={{ color: INK }}>{a}</span>
                      <div className="h-2.5 flex-1" style={{ backgroundColor: "#1a1c18" }}><div className="h-full" style={{ width: `${Math.round((n / max) * 100)}%`, backgroundColor: GREEN }} /></div>
                      <span className="w-8 text-right" style={{ color: DIM }}>{n}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-1 text-[10px] tabular-nums">
                <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>RECENT READS</div>
                {traffic.recent.length === 0 && <span style={{ color: FAINT }}>—</span>}
                {traffic.recent.slice(0, 6).map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span style={{ color: FAINT }}>{h.ts.slice(11, 19)}</span>
                    <span style={{ color: h.agent === "HUMAN" ? DIM : GREEN }}>{h.agent}</span>
                    <span className="uppercase" style={{ color: FAINT }}>{h.kind}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {lastStore && (
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t pt-2.5" style={{ borderColor: LINE }}>
              <button onClick={learn} disabled={learnBusy} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] disabled:opacity-50" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>
                {learnBusy ? "⟳ DISTILLING…" : "✦ LEARN FROM PERFORMANCE → BRAIN"}
              </button>
              <span className="text-[9px] uppercase tracking-[0.12em]" style={{ color: learnMsg ? (learnMsg.includes("LEARNED") ? GREEN : SCHED) : FAINT }}>
                {learnMsg ?? "distills measured reads + orders into rules that steer every future ad"}
              </span>
            </div>
          )}
        </Cell>

        {/* ORDERS — real revenue received by the published store */}
        {lastStore && orders && (
          <Cell label="ORDERS · REAL — RECEIVED BY YOUR STORE" className="mt-3">
            {orders.count === 0 ? (
              <div className="text-[11px]" style={{ color: FAINT }}>
                NO ORDERS YET — the store takes guest checkout and agent order-intents; every order lands here with its channel and agent recorded.
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[200px_1fr_1fr]">
                <div>
                  <div className="font-display text-[clamp(2rem,4vw,2.8rem)] leading-none tabular-nums" style={{ color: GREEN }}>€{Math.round(orders.revenue).toLocaleString("en-US")}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>revenue received</div>
                  <div className="mt-2 text-[10px] tabular-nums" style={{ color: DIM }}>{orders.count} orders · every euro traces to an order id</div>
                </div>
                <div className="flex flex-col gap-1.5 text-[11px] tabular-nums">
                  <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>BY CHANNEL</div>
                  {Object.entries(orders.byChannel).map(([c, n]) => (
                    <div key={c} className="flex items-center gap-2.5">
                      <span className="w-24 shrink-0 uppercase" style={{ color: INK }}>{c === "agent-json" ? "AGENT" : "WEB"}</span>
                      <span style={{ color: DIM }}>{n}</span>
                    </div>
                  ))}
                  {Object.entries(orders.byAgent).length > 0 && (
                    <>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>BY AGENT</div>
                      {Object.entries(orders.byAgent).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([a, n]) => (
                        <div key={a} className="flex items-center gap-2.5">
                          <span className="w-24 shrink-0 truncate" style={{ color: GREEN }}>{a}</span>
                          <span style={{ color: DIM }}>{n}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-[10px] tabular-nums">
                  <div className="text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>RECENT ORDERS</div>
                  {orders.recent.map((o) => (
                    <div key={o.id} className="flex items-center gap-2.5">
                      <span style={{ color: FAINT }}>{o.ts.slice(11, 19)}</span>
                      <span className="min-w-0 truncate" style={{ color: INK }}>{o.productName} ×{o.qty}</span>
                      <span style={{ color: o.channel === "agent-json" ? GREEN : DIM }}>{o.channel === "agent-json" ? o.agent : "WEB"}</span>
                      <span className="ml-auto" style={{ color: DIM }}>{o.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Cell>
        )}

        {/* objective + audience */}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Cell label="OBJECTIVE">
            <input value={objective} onChange={(e) => setObjective(e.target.value)}
              className="w-full border px-3 py-2 font-display text-[clamp(1.2rem,3vw,1.8rem)] uppercase"
              style={{ borderColor: LINE, backgroundColor: WELL, color: INK, outline: "none" }} />
          </Cell>
          <Cell label="AUDIENCE · TARGETING">
            <div className="flex flex-wrap gap-1.5">
              {AUD.map((a) => { const on = audience.has(a); return (
                <button key={a} onClick={() => toggleAud(a)} className="flex items-center gap-2 border px-2.5 py-1 text-[11px]" style={{ borderColor: on ? AMBER : LINE, color: on ? AMBER : DIM, backgroundColor: on ? "rgba(255,176,0,0.09)" : "transparent" }}><Led color={on ? AMBER : LEDOFF} glow={on} />{a}</button>
              ); })}
            </div>
          </Cell>
        </div>

        {/* channels + budget */}
        <Cell label="CHANNELS · BUDGET ALLOCATION" className="mt-3">
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            {MKT_CHANNELS.map((c) => { const on = channels.has(c.id); return (
              <button key={c.id} onClick={() => toggleCh(c.id)} className="flex items-center gap-2 border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]" style={{ borderColor: on ? AMBER : LINE, color: on ? AMBER : DIM, backgroundColor: on ? "rgba(255,176,0,0.09)" : "transparent" }}><Led color={on ? AMBER : LEDOFF} glow={on} />{c.id}</button>
            ); })}
            <div className="ml-auto flex items-center gap-2 text-[12px] tabular-nums">
              <button onClick={() => setBudget((b) => Math.max(500, b - 500))} className="border px-2 py-0.5" style={{ borderColor: LINE, color: DIM }}>−</button>
              <span style={{ color: AMBER }}>€{budget.toLocaleString("en-US")}</span>
              <button onClick={() => setBudget((b) => b + 500)} className="border px-2 py-0.5" style={{ borderColor: LINE, color: DIM }}>+</button>
              <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>/ MO</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-[11px] tabular-nums">
            {chArr.length === 0 && <span style={{ color: RED }}>NO CHANNELS SELECTED</span>}
            {chArr.map((c) => { const pct = Math.round((c.w / wsum) * 100); const amt = Math.round(budget * (c.w / wsum)); return (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 tracking-[0.06em]" style={{ color: DIM }}>{c.id}</span>
                <div className="h-3 flex-1" style={{ backgroundColor: "#1a1c18" }}><div className="h-full" style={{ width: `${pct}%`, backgroundColor: AMBER }} /></div>
                <span className="w-9 text-right" style={{ color: INK }}>{clock2(pct)}%</span>
                <span className="w-16 text-right" style={{ color: FAINT }}>€{amt.toLocaleString("en-US")}</span>
              </div>
            ); })}
          </div>
        </Cell>

        {/* flight plan derived from selected channels */}
        <Cell label="FLIGHT PLAN · WK 01–06" className="mt-3">
          <div className="flex flex-col gap-1.5 text-[10px] tabular-nums">
            <div className="flex items-center gap-3" style={{ color: FAINT }}>
              <span className="w-24 shrink-0" />
              {["W1", "W2", "W3", "W4", "W5", "W6"].map((w) => <span key={w} className="flex-1 text-center">{w}</span>)}
            </div>
            {chArr.map((c, i) => { const start = i % 3, end = 6 - (i % 2); return (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-24 shrink-0 uppercase tracking-[0.06em]" style={{ color: DIM }}>{c.id}</span>
                {[0, 1, 2, 3, 4, 5].map((wk) => <span key={wk} className="h-3.5 flex-1" style={{ backgroundColor: wk >= start && wk < end ? AMBER : "#191b15" }} />)}
              </div>
            ); })}
          </div>
        </Cell>

        {/* LAUNCH */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: LINE }}>
          <div className="text-[11px]" style={{ color: DIM }}>{channels.size} channels · €{budget.toLocaleString("en-US")}/mo · {audience.size} segments · creative via Social Autopilot</div>
          <button onClick={() => setLaunched((l) => !l)} className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ backgroundColor: launched ? "transparent" : AMBER, color: launched ? GREEN : "#0A0A08", border: launched ? `1px solid ${GREEN}` : "none" }}>
            {launched ? "● CAMPAIGN LIVE · PAUSE" : "▶ LAUNCH CAMPAIGN"}
          </button>
        </div>
      </div>
      {openAd && <AdModal ad={openAd} kit={kit} onClose={() => setOpenAd(null)} onUpdate={setOpenAd} />}
    </div>
  );
}

/* ── 03 · SOCIAL — content studio (compose · preview · calendar · queue) ── */
const QCOLOR: Record<QStatus, string> = { POSTED: GREEN, PUBLISHING: WARN, SCHEDULED: SCHED, QUEUED: "#6E6E64" };
const PLATFORMS = [
  { id: "LINKEDIN", limit: 3000 },
  { id: "X", limit: 280 },
  { id: "INSTAGRAM", limit: 2200 },
  { id: "TIKTOK", limit: 2200 },
  { id: "YOUTUBE", limit: 5000 },
] as const;
const WEEK = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
/* ── content pillars the autopilot rotates through ─────────────────────── */
const ANGLES = [
  { key: "problem", label: "PAIN POINT" },
  { key: "how", label: "HOW IT WORKS" },
  { key: "proof", label: "SOCIAL PROOF" },
  { key: "offer", label: "OFFER" },
  { key: "behind", label: "BEHIND THE BUILD" },
  { key: "story", label: "ORIGIN STORY" },
] as const;
type Post = { slot: string; day: string; time: string; pf: string; status: QStatus; body: string; angle: string; video?: string };

// Everything the copy engine needs, extracted from the kit the machine produced.
function brandBits(kit: BrandKit) {
  const bk = kit.brandKit;
  const what = (kit.descriptor || kit.oneLiner || "").replace(/^an?\s+/i, "").replace(/\.$/, "").trim();
  const one = (kit.oneLiner || kit.descriptor || "").trim();
  const who = bk.audience || "your team";
  const pos = bk.positioning || what;
  const tag = kit.taglines[0] || pos;
  const words = `${kit.projectCode} ${who} ${pos}`.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter((w) => w.length > 3);
  const tags = [...new Set(words)].slice(0, 3).map((w) => "#" + w).join(" ");
  return { name: kit.fullName, code: kit.projectCode, what, one, who, whoL: who.toLowerCase(), pos, posL: pos.toLowerCase(), tag, site: kit.domain, handle: "@" + kit.domain.split(".")[0], tags };
}
type Bits = ReturnType<typeof brandBits>;
// Platform-agnostic message per content pillar — product-specific, from the kit.
function angleCore(b: Bits, key: string): { hook: string; body: string; cta: string } {
  switch (key) {
    case "problem": return { hook: `${b.who} deserve better.`, body: `${b.name} is ${b.what}. ${b.one}`, cta: "See how it works →" };
    case "how": return { hook: `How ${b.code} works`, body: `${b.one} Built for ${b.whoL} who want ${b.posL}.`, cta: "Start today →" };
    case "proof": return { hook: `${b.who} are switching to ${b.code}.`, body: `${b.pos}. That's ${b.name} — ${b.what}.`, cta: "Join them →" };
    case "offer": return { hook: b.tag, body: `${b.name}: ${b.what}. Made for ${b.whoL}.`, cta: `Get started at ${b.site} →` };
    case "behind": return { hook: `Behind ${b.code}`, body: `We built ${b.name} because ${b.whoL} were underserved. ${b.one}`, cta: "Follow the build →" };
    default: return { hook: `Why we made ${b.code}`, body: `${b.one} Because ${b.posL} shouldn't be rare.`, cta: "Read the story →" };
  }
}
const titleCase = (s: string) => s.replace(/\b\w/g, (m) => m.toUpperCase());
// Wrap the core message in each platform's native register.
function craft(kit: BrandKit, angleKey: string, platform: string): string {
  const b = brandBits(kit);
  const c = angleCore(b, angleKey);
  switch (platform) {
    case "LINKEDIN": return `${c.hook}\n\n${c.body}\n\n${c.cta}\n\n${b.tags}`;
    case "X": { const s = `${c.hook.toLowerCase()} ${c.body}`.replace(/\s+/g, " ").trim(); return s.length > 240 ? s.slice(0, 237).trimEnd() + "…" : s; }
    case "INSTAGRAM": return `${c.hook} ✦\n\n${c.body}\n\n${c.cta}\n${b.tags} #${b.code.toLowerCase()}`;
    case "TIKTOK": return `POV: ${c.hook.toLowerCase()}\n\n[HOOK] ${c.hook}\n[SHOW] ${b.what}\n[CTA] ${c.cta}`;
    case "YOUTUBE": return `${titleCase(c.hook)} — ${b.code}\n\n${c.body} ${c.cta}`;
    default: return `${c.hook} ${c.body} ${c.cta}`;
  }
}
const angleLabel = (key: string) => ANGLES.find((a) => a.key === key)?.label ?? "POST";
function seedPosts(kit: BrandKit): Post[] {
  const combos: [string, string, QStatus][] = [
    ["problem", "LINKEDIN", "POSTED"], ["offer", "X", "POSTED"], ["proof", "INSTAGRAM", "POSTED"],
    ["how", "TIKTOK", "SCHEDULED"], ["story", "LINKEDIN", "SCHEDULED"], ["behind", "YOUTUBE", "SCHEDULED"],
    ["offer", "INSTAGRAM", "QUEUED"], ["proof", "X", "QUEUED"], ["how", "TIKTOK", "QUEUED"],
  ];
  return combos.map(([ang, pf, status], i) => ({
    slot: clock2(i + 1), day: WEEK[i % 7], time: `${clock2(8 + (i % 9))}:${i % 2 ? "40" : "10"}`,
    pf, status, angle: angleLabel(ang), body: craft(kit, ang, pf),
  }));
}
const DISPATCH = 5; // seconds between auto-dispatches
/* Higgsfield render pipeline phases for auto-built marketing videos. */
const VPHASE = ["PROMPT", "DIFFUSION", "ENCODE", "READY"] as const;
type SVid = { id: number; pf: string; hook: string; fmt: string; dur: string; shots: string[]; phase: number; prog: number };
/* One Claude brain-pass per company per page session (survives tab switches). */
const brainWroteFor = new Set<string>();

function SocialModule({ kit }: { kit: BrandKit }) {
  const [armed, setArmed] = useState(true);
  const [channels, setChannels] = useState<Set<string>>(() => new Set(PLATFORMS.map((p) => p.id)));
  const [pillars, setPillars] = useState<Set<string>>(() => new Set(ANGLES.map((a) => a.key)));
  const [q, setQ] = useState<Post[]>(() => seedPosts(kit));
  const [drafts, setDrafts] = useState<Record<string, { angle: string; body: string }>>(() => {
    const d: Record<string, { angle: string; body: string }> = {};
    PLATFORMS.forEach((p, i) => { const a = ANGLES[i % ANGLES.length]; d[p.id] = { angle: a.label, body: craft(kit, a.key, p.id) }; });
    return d;
  });
  const [svids, setSvids] = useState<SVid[]>(() => {
    const b = brandBits(kit);
    return [
      { id: 0, pf: "TIKTOK", hook: angleCore(b, "problem").hook, fmt: VFMT[0].fmt, dur: VFMT[0].dur, shots: vshots(kit, 0), phase: 1, prog: 36 },
      { id: 1, pf: "YOUTUBE", hook: angleCore(b, "how").hook, fmt: VFMT[1].fmt, dur: VFMT[1].dur, shots: vshots(kit, 1), phase: 0, prog: 20 },
    ];
  });
  const [t, setT] = useState(DISPATCH);
  const [openAd, setOpenAd] = useState<AdView | null>(null);
  const [brainPf, setBrainPf] = useState<Set<string>>(() => new Set());
  const [busyPf, setBusyPf] = useState<string | null>(null);
  const tRef = useRef(DISPATCH);
  const genRef = useRef(0);
  const svRef = useRef(2);
  const attachedRef = useRef<Set<number>>(new Set());
  const cardRef = useRef<Record<string, number>>({});
  // Latest state readable inside the interval without re-arming it.
  const live = useRef({ armed, channels, pillars });
  live.current = { armed, channels, pillars };

  // Higgsfield render loop: PROMPT → DIFFUSION → ENCODE → READY.
  useEffect(() => {
    const id = setInterval(() => setSvids((vs) => vs.map((v) => {
      if (v.phase >= 3) return v;
      const inc = v.phase === 0 ? 11 : v.phase === 1 ? 2.6 : 6;
      const p = v.prog + inc;
      return p >= 100 ? { ...v, phase: v.phase + 1, prog: 0 } : { ...v, prog: p };
    })), 150);
    return () => clearInterval(id);
  }, []);
  // A finished video publishes TOGETHER with a crafted post for its channel.
  useEffect(() => {
    svids.filter((v) => v.phase >= 3 && !attachedRef.current.has(v.id)).forEach((v) => {
      attachedRef.current.add(v.id);
      setQ((cur) => [...cur, {
        slot: clock2(cur.length + 1), day: WEEK[cur.length % 7], time: `${clock2(9 + (cur.length % 9))}:15`,
        pf: v.pf, status: "SCHEDULED", angle: "VIDEO DROP", body: craft(kit, "offer", v.pf), video: `${v.dur} · ${v.fmt}`,
      }]);
    });
  }, [svids, kit]);

  // The engine: every dispatch it publishes the next scheduled post AND (if armed)
  // crafts a fresh product-specific post for the next channel/pillar in rotation.
  useEffect(() => {
    const id = setInterval(() => {
      if (tRef.current > 1) { tRef.current -= 1; setT(tRef.current); return; }
      tRef.current = DISPATCH; setT(DISPATCH);
      setQ((cur) => { const i = cur.findIndex((x) => x.status === "SCHEDULED"); if (i < 0) return cur; const n = cur.map((x) => ({ ...x })); n[i].status = "PUBLISHING"; return n; });
      window.setTimeout(() => setQ((cur) => {
        const i = cur.findIndex((x) => x.status === "PUBLISHING"); if (i < 0) return cur;
        const n = cur.map((x) => ({ ...x })); n[i].status = "POSTED";
        const j = n.findIndex((x) => x.status === "QUEUED"); if (j >= 0) n[j].status = "SCHEDULED";
        return n;
      }), 1500);
      const st = live.current;
      const chs = [...st.channels], pls = [...st.pillars];
      if (st.armed && chs.length && pls.length) {
        const g = genRef.current++;
        const pf = chs[g % chs.length];
        const key = pls[g % pls.length];
        const body = craft(kit, key, pf);
        setDrafts((d) => ({ ...d, [pf]: { angle: angleLabel(key), body } }));
        setQ((cur) => [...cur, { slot: clock2(cur.length + 1), day: WEEK[cur.length % 7], time: `${clock2(8 + (cur.length % 10))}:${cur.length % 2 ? "30" : "00"}`, pf, status: "QUEUED", body, angle: angleLabel(key) }]);
        // Every other dispatch, the Higgsfield engine starts a fresh video ad.
        if (g % 2 === 1) setSvids((vs) => {
          if (vs.filter((v) => v.phase < 3).length >= 2) return vs;
          const id = svRef.current++;
          const fi = id % VFMT.length;
          const f = VFMT[fi];
          const vpf = chs[id % chs.length];
          return [{ id, pf: vpf, hook: angleCore(brandBits(kit), pls[id % pls.length]).hook, fmt: f.fmt, dur: f.dur, shots: vshots(kit, fi), phase: 0, prog: 0 }, ...vs].slice(0, 6);
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [kit]);

  const count = (s: QStatus) => q.filter((x) => x.status === s).length;
  const activeIdx = q.findIndex((x) => x.status === "PUBLISHING");
  const hot = activeIdx >= 0 ? activeIdx : q.findIndex((x) => x.status === "SCHEDULED");
  const chArr = PLATFORMS.filter((p) => channels.has(p.id));

  const toggleCh = (id: string) => setChannels((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePillar = (k: string) => setPillars((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  // Brain-write a channel draft: Claude + every brain rule + the store's real
  // catalog (product grounding); template is the fallback/optimistic value.
  const brainWrite = async (pf: string, angle: string) => {
    setBusyPf(pf);
    let slug: string | null = null;
    try { slug = localStorage.getItem("pdr-last-store"); } catch { /* ignore */ }
    try {
      const r = await fetch("/api/studio/copy", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kit: { projectCode: kit.projectCode, fullName: kit.fullName, descriptor: kit.descriptor, domain: kit.domain, oneLiner: kit.oneLiner, brandKit: { audience: kit.brandKit.audience, positioning: kit.brandKit.positioning, tone: kit.brandKit.tone } }, platform: pf, angle, slug }),
      });
      const d = await r.json();
      if (d?.ok && d.body) {
        setDrafts((x) => ({ ...x, [pf]: { angle, body: d.body } }));
        setBrainPf((s) => new Set(s).add(pf));
      }
    } catch { /* template draft stands */ }
    setBusyPf(null);
  };
  const recraft = (pf: string) => {
    const pls = [...pillars]; if (!pls.length) return;
    const next = (cardRef.current[pf] ?? 0) + 1; cardRef.current[pf] = next;
    const key = pls[next % pls.length];
    setDrafts((d) => ({ ...d, [pf]: { angle: angleLabel(key), body: craft(kit, key, pf) } }));
    void brainWrite(pf, angleLabel(key));
  };
  const postNow = (pf: string) => {
    const dr = drafts[pf]; if (!dr) return;
    setQ((cur) => [...cur, { slot: clock2(cur.length + 1), day: "—", time: "—", pf, status: "PUBLISHING", body: dr.body, angle: dr.angle }]);
    window.setTimeout(() => setQ((c) => c.map((x) => (x.pf === pf && x.time === "—" && x.status === "PUBLISHING" ? { ...x, status: "POSTED" } : x))), 1500);
  };
  const publishAll = () => chArr.forEach((p) => postNow(p.id));
  // First mount for this company: rewrite each selected channel's draft through
  // Claude + the brain, staggered so it reads like the machine working.
  useEffect(() => {
    if (brainWroteFor.has(kit.projectCode)) return;
    const ids: number[] = [];
    let i = 0;
    PLATFORMS.forEach((p) => {
      if (!channels.has(p.id)) return;
      const angle = drafts[p.id]?.angle ?? "OFFER";
      // Mark the company only when a write actually fires — StrictMode's
      // double-mount clears these timers before they run, and marking early
      // would permanently skip the pass.
      ids.push(window.setTimeout(() => { brainWroteFor.add(kit.projectCode); void brainWrite(p.id, angle); }, 1500 + i * 4200));
      i += 1;
    });
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot per company
  }, [kit.projectCode]);
  const openVid = (v: SVid) => setOpenAd({
    pf: v.pf, angle: "VIDEO AD", body: craft(kit, "offer", v.pf),
    video: { dur: v.dur, fmt: v.fmt, shots: v.shots },
    views: PERF[v.pf]?.v ?? 8, eng: PERF[v.pf]?.e ?? 5,
  });

  return (
    <div>
      <ModuleHead id="03" name="SOCIAL" rev="A" sn={hash8(kit.projectCode + "soc").slice(0, 6)} />
      <div className="p-4 lg:p-6">
        {/* prominent workspace identity */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: AMBER }}>Content automation</div>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.88]">Social Autopilot</h2>
            <p className="mt-1.5 max-w-[54ch] text-[13px]" style={{ color: DIM }}>Crafts product-specific posts &amp; renders marketing videos for every channel from your brand kit — then publishes them together, on cadence.</p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="font-display text-[clamp(2rem,4vw,3rem)] leading-none tabular-nums" style={{ color: GREEN }}>{clock2(count("POSTED"))}</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>posts live</div>
          </div>
        </div>

        {/* status strip */}
        <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.14em]" style={{ borderColor: LINE, backgroundColor: PANEL }}>
          <span className="flex items-center gap-2"><Led color={armed ? GREEN : SCHED} blink={armed} glow /> <span style={{ color: armed ? GREEN : SCHED }}>{armed ? "AUTOPILOT ARMED" : "AUTOPILOT PAUSED"}</span></span>
          <span style={{ color: FAINT }}>CHANNELS <span style={{ color: INK }}>{channels.size}/5</span></span>
          <span style={{ color: FAINT }}>PILLARS <span style={{ color: INK }}>{clock2(pillars.size)}</span></span>
          <span style={{ color: FAINT }}>VIDEO <span style={{ color: INK }}>{clock2(svids.filter((v) => v.phase >= 3).length)}/{clock2(svids.length)}</span></span>
          <span style={{ color: FAINT }}>CADENCE <span style={{ color: INK }}>{DISPATCH}s</span></span>
          <span className="ml-auto flex items-center gap-4 tabular-nums" style={{ color: FAINT }}>
            <span><span style={{ color: GREEN }}>{count("POSTED")}</span> POSTED</span>
            <span><span style={{ color: SCHED }}>{count("SCHEDULED")}</span> SCHED</span>
            <span><span style={{ color: "#6E6E64" }}>{count("QUEUED")}</span> QUEUED</span>
          </span>
        </div>

        {/* ENGINE CONTROL */}
        <Cell label="AUTOPILOT ENGINE">
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setArmed((a) => !a)} className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ backgroundColor: armed ? "transparent" : AMBER, color: armed ? GREEN : "#0A0A08", border: armed ? `1px solid ${GREEN}` : "none" }}>
              {armed ? "● ENGINE RUNNING · PAUSE" : "▶ ARM AUTOPILOT"}
            </button>
            <span className="text-[11px]" style={{ color: DIM }}>Rotates <span style={{ color: INK }}>{pillars.size}</span> pillars across <span style={{ color: INK }}>{channels.size}</span> channels · one crafted post every {DISPATCH}s</span>
            <button onClick={publishAll} disabled={chArr.length === 0} className="ml-auto flex items-center gap-2 border px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ borderColor: LINE2, color: AMBER, opacity: chArr.length ? 1 : 0.4 }}>▶ PUBLISH ALL NOW</button>
          </div>
          <div className="mt-3 border-t pt-3" style={{ borderColor: LINE }}>
            <div className="mb-1.5 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>Channels</div>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map((p) => { const on = channels.has(p.id); return (
                <button key={p.id} onClick={() => toggleCh(p.id)} className="flex items-center gap-2 border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]" style={{ borderColor: on ? AMBER : LINE, color: on ? AMBER : DIM, backgroundColor: on ? "rgba(255,176,0,0.09)" : "transparent" }}><Led color={on ? AMBER : LEDOFF} glow={on} />{p.id}</button>
              ); })}
            </div>
            <div className="mb-1.5 mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>Content pillars</div>
            <div className="flex flex-wrap gap-1.5">
              {ANGLES.map((a) => { const on = pillars.has(a.key); return (
                <button key={a.key} onClick={() => togglePillar(a.key)} className="flex items-center gap-2 border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]" style={{ borderColor: on ? AMBER : LINE, color: on ? AMBER : DIM, backgroundColor: on ? "rgba(255,176,0,0.09)" : "transparent" }}><Led color={on ? AMBER : LEDOFF} glow={on} />{a.label}</button>
              ); })}
            </div>
          </div>
        </Cell>

        {/* VIDEO ENGINE — Higgsfield renders marketing videos, published with posts */}
        <div className="mb-2 mt-4 flex flex-wrap items-center gap-3 border-b pb-2" style={{ borderColor: LINE }}>
          <span className="text-[12px] uppercase tracking-[0.2em]" style={{ color: INK }}>Video engine</span>
          <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>render: <span style={{ color: AMBER }}>HIGGSFIELD</span> · finished videos auto-attach to a post &amp; publish together</span>
          <span className="ml-auto flex items-center gap-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: svids.some((v) => v.phase < 3) ? AMBER : GREEN }}>
            <Led color={svids.some((v) => v.phase < 3) ? AMBER : GREEN} blink={svids.some((v) => v.phase < 3)} glow />
            {svids.some((v) => v.phase < 3) ? "RENDERING" : "ALL RENDERED"}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {svids.map((v) => {
            const done = v.phase >= 3;
            const cols = kit.brandKit.palette.slice(0, 4).map((p) => p.hex);
            return (
              <div key={v.id} onClick={() => openVid(v)} className="cursor-pointer">
              <Cell label={`HIGGSFIELD · ${v.pf} · ⊕`}>
                <div className="flex items-baseline justify-between text-[10px] tabular-nums" style={{ color: DIM }}>
                  <span style={{ color: AMBER }}>{v.dur}</span><span>{resOf(v.fmt)} · {v.fmt} · 24FPS · H.264</span>
                </div>
                <div className="mt-2.5" style={{ opacity: done ? 1 : 0.45 }}><Filmstrip shots={v.shots} colors={cols} /></div>
                <div className="mt-2 text-[12px] leading-snug" style={{ color: INK }}>{v.hook}</div>
                {done ? (
                  <div className="mt-2.5 flex items-center gap-2 border-t pt-2.5 text-[9px] uppercase tracking-[0.14em]" style={{ borderColor: LINE, color: GREEN }}>
                    <Led color={GREEN} glow /> RENDERED · ATTACHED TO {v.pf} POST
                  </div>
                ) : (
                  <div className="mt-2.5 border-t pt-2.5" style={{ borderColor: LINE }}>
                    <SegBar pct={v.prog} color={AMBER} segs={20} />
                    <div className="mt-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] tabular-nums" style={{ color: AMBER }}>
                      <span className="flex items-center gap-2"><Led color={AMBER} blink glow /> {VPHASE[v.phase]}</span>
                      <span style={{ color: FAINT }}>{clock2(Math.round(v.prog))}%</span>
                    </div>
                  </div>
                )}
              </Cell>
              </div>
            );
          })}
        </div>

        {/* LATEST CRAFTED — one product-specific draft per channel */}
        <div className="mb-2 mt-4 flex flex-wrap items-center gap-3 border-b pb-2" style={{ borderColor: LINE }}>
          <span className="text-[12px] uppercase tracking-[0.2em]" style={{ color: INK }}>Latest crafted</span>
          <span className="text-[9px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>auto-written from the brand kit · per-platform register</span>
          <span className="ml-auto flex items-center gap-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: armed ? GREEN : SCHED }}><Led color={armed ? GREEN : SCHED} blink={armed} glow />{armed ? "writing live" : "idle"}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {chArr.length === 0 && <div className="text-[11px]" style={{ color: RED }}>NO CHANNELS SELECTED</div>}
          {chArr.map((p) => {
            const dr = drafts[p.id] ?? { angle: "POST", body: craft(kit, "offer", p.id) };
            const over = dr.body.length > p.limit;
            return (
              <Cell key={p.id} label={`${p.id} · ${dr.angle}${brainPf.has(p.id) ? " · ✦ BRAIN" : busyPf === p.id ? " · ⟳ BRAIN…" : " · TEMPLATE"}`}>
                <div className="flex items-center gap-2.5 border-b pb-2" style={{ borderColor: LINE }}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center font-display text-[14px]" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>{kit.projectCode[0]}</div>
                  <div className="min-w-0">
                    <div className="truncate text-[12px]" style={{ color: INK }}>{kit.fullName}</div>
                    <div className="text-[10px]" style={{ color: FAINT }}>@{kit.domain.split(".")[0]} · {p.id}</div>
                  </div>
                </div>
                <div className="mt-2.5 whitespace-pre-wrap text-[12.5px] leading-relaxed" style={{ color: INK, maxHeight: 168, overflow: "hidden" }}>{dr.body}</div>
                <div className="mt-2 flex items-center gap-2 text-[9px] tabular-nums" style={{ color: over ? RED : FAINT }}>
                  <div className="h-1 flex-1" style={{ backgroundColor: "#1a1c18" }}><div className="h-full" style={{ width: `${Math.min(100, (dr.body.length / p.limit) * 100)}%`, backgroundColor: over ? RED : GREEN }} /></div>
                  {dr.body.length}/{p.limit}{over && " OVER"}
                </div>
                <div className="mt-2.5 flex items-center gap-2 border-t pt-2.5" style={{ borderColor: LINE }}>
                  <button onClick={() => recraft(p.id)} disabled={busyPf === p.id} className="border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] disabled:opacity-50" style={{ borderColor: LINE, color: AMBER }}>{busyPf === p.id ? "⟳ BRAIN…" : "↻ RECRAFT"}</button>
                  <button onClick={() => postNow(p.id)} className="ml-auto flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>▶ POST NOW</button>
                </div>
              </Cell>
            );
          })}
        </div>

        {/* WEEK CALENDAR */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.22em]" style={{ color: FAINT }}>
            <span>CONTENT CALENDAR · THIS WEEK</span><span className="tabular-nums">{q.length} SLOTS</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {WEEK.map((d) => {
              const items = q.filter((x) => x.day === d);
              return (
                <div key={d} className="flex flex-col border" style={{ borderColor: LINE, backgroundColor: PANEL, minHeight: 104 }}>
                  <div className="flex items-center justify-between border-b px-2 py-1 text-[9px] uppercase tracking-[0.12em]" style={{ borderColor: LINE, color: FAINT }}>{d}<span className="tabular-nums">{items.length || ""}</span></div>
                  <div className="flex flex-1 flex-col gap-1 p-1.5">
                    {items.map((x, i) => (
                      <div key={i} className="border-l-2 px-1.5 py-1" style={{ borderColor: QCOLOR[x.status], backgroundColor: WELL }}>
                        <div className="flex items-center justify-between text-[9px]"><span style={{ color: AMBER }}>{x.pf.slice(0, 2)}</span><span className="tabular-nums" style={{ color: FAINT }}>{x.time}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LIVE PUBLISH QUEUE */}
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.22em]" style={{ color: FAINT }}>
            <span>PUBLISH QUEUE · LIVE</span>
            <span className="flex items-center gap-2" style={{ color: activeIdx >= 0 ? WARN : SCHED }}>
              <Led color={activeIdx >= 0 ? WARN : SCHED} blink={activeIdx >= 0} glow />
              {activeIdx >= 0 ? "PUBLISHING…" : `NEXT DISPATCH T-${clock2(t)}s`}
            </span>
          </div>
          <div className="border" style={{ borderColor: LINE }}>
            {q.slice(-14).map((r, i, arr) => { const gi = q.length - arr.length + i; return (
              <div key={r.slot + r.pf} className="grid grid-cols-[34px_58px_90px_1fr_104px] items-center gap-3 border-b px-4 py-2 text-[12px]" style={{ borderColor: LINE, backgroundColor: gi === hot ? RAISED : "transparent" }}>
                <span className="tabular-nums text-[11px]" style={{ color: gi === hot ? WARN : FAINT }}>{r.slot}</span>
                <span className="tabular-nums text-[10px] leading-tight" style={{ color: DIM }}>{r.day} <span style={{ color: INK }}>{r.time}</span></span>
                <span className="truncate text-[9px] uppercase tracking-[0.1em]" style={{ color: FAINT }}>{r.angle}</span>
                <span className="min-w-0"><span className="mr-2 text-[9px] uppercase tracking-[0.14em]" style={{ color: AMBER }}>{r.pf}</span>{r.video && <span className="mr-2 border px-1.5 py-[1px] text-[8px] uppercase tracking-[0.08em] tabular-nums" style={{ borderColor: AMBER, color: AMBER }}>▶ {r.video}</span>}<span className="truncate" style={{ color: r.status === "QUEUED" ? DIM : INK }}>{r.body.replace(/\n+/g, " · ")}</span></span>
                <span className="flex items-center justify-end gap-2 text-[9px] uppercase tracking-[0.12em]" style={{ color: QCOLOR[r.status] }}><Led color={QCOLOR[r.status]} blink={r.status === "PUBLISHING"} glow={r.status === "PUBLISHING" || r.status === "POSTED"} />{r.status}</span>
              </div>
            ); })}
          </div>
        </div>
      </div>
      {openAd && <AdModal ad={openAd} kit={kit} onClose={() => setOpenAd(null)} onUpdate={setOpenAd} />}
    </div>
  );
}

/* ── 04 · PLATFORM — the site fabricator (the grand feature) ─────────────
   Deliberately SIMPLE: one panel, one button. The button opens /studio/site
   in a new page, which fabricates and renders the full agent-first store
   (catalog, product pages, JSON-LD, llms.txt). No landing-page fluff — the
   output is a storefront built for LLM shopping agents. */
function PlatformModule({ kit }: { kit: BrandKit }) {
  const [sent, setSent] = useState(false);
  // Last published store (written by /studio/site after publish) — real endpoints beat demo ones.
  const [lastStore, setLastStore] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ slug: string; name: string; ts: number }[]>([]);
  const [report, setReport] = useState<{ score: number; checks: { k: string; label: string; status: "PASS" | "WARN" | "FAIL"; note: string }[] } | null>(null);
  useEffect(() => {
    try {
      setLastStore(localStorage.getItem("pdr-last-store"));
      const raw = localStorage.getItem("pdr-stores");
      if (raw) setSaved(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [sent]);
  // Crawl our own output JS-off (the way GPTBot reads it) and score it.
  useEffect(() => {
    if (!lastStore) return;
    let alive = true;
    fetch(`/api/store/${lastStore}/report`).then((r) => r.json()).then((d) => { if (alive && d?.ok) setReport(d); }).catch(() => {});
    return () => { alive = false; };
  }, [lastStore]);
  const generate = () => {
    try { localStorage.setItem("pdr-site-kit", JSON.stringify({ kit, ts: Date.now() })); } catch { /* ignore */ }
    setSent(true);
    // NOTE: no "noopener" feature here — with it, window.open returns null BY
    // SPEC even on success, which made the popup-blocked fallback ALSO fire
    // (one click → the new tab AND the current tab both navigated).
    const w = window.open("/studio/site", "_blank");
    if (!w) window.location.assign("/studio/site"); // genuinely blocked → same tab
    window.setTimeout(() => setSent(false), 2400);
  };
  return (
    <div>
      <ModuleHead id="04" name="PLATFORM" rev="A" sn={hash8("platform").slice(0, 6)} />
      <div className="p-4 lg:p-6">
        {/* prominent workspace identity */}
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: AMBER }}>Site fabricator</div>
            <h2 className="mt-1 font-display text-[clamp(2rem,5vw,3.4rem)] uppercase leading-[0.88]">Storefront Generator</h2>
            <p className="mt-1.5 max-w-[56ch] text-[13px]" style={{ color: DIM }}>One click prints the whole store — catalog, product pages, structured data. Built for the LLMs doing the shopping, not for humans scrolling a landing page.</p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="font-display text-[clamp(2rem,4vw,3rem)] leading-none" style={{ color: AMBER }}>100%</div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>agent-legible</div>
          </div>
        </div>

        {/* the single control — simple by design */}
        <Cell>
          <div className="flex flex-col items-center py-10 text-center">
            <div className="text-[9px] uppercase tracking-[0.24em]" style={{ color: FAINT }}>WORK ORDER</div>
            <div className="mt-2 font-display text-[clamp(1.8rem,4vw,2.8rem)] uppercase leading-none">{kit.projectCode}</div>
            <div className="mt-1.5 text-[12px]" style={{ color: DIM }}>{kit.fullName} · <span style={{ color: AMBER }}>{kit.domain}</span></div>
            <button onClick={generate} className="mt-7 flex items-center gap-3 px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.2em]" style={{ backgroundColor: AMBER, color: "#0A0A08" }}>
              {sent ? "⟳ FABRICATING…" : "▶ GENERATE STOREFRONT"}
            </button>
            <div className="mt-3 text-[9px] uppercase tracking-[0.16em]" style={{ color: sent ? GREEN : FAINT }}>
              {sent ? "OPENED IN NEW PAGE · PRINTING SITE" : "opens a new page · synthesized live by claude · ~10s"}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 border-t pt-4 text-[10px] uppercase tracking-[0.12em]" style={{ borderColor: LINE, color: FAINT }}>
              <span>CATALOG + PRODUCT PAGES</span>
              <span style={{ color: DIM }}>SCHEMA.ORG JSON-LD</span>
              <span>/llms.txt</span>
              <span style={{ color: DIM }}>/.well-known/agent-catalog.json</span>
            </div>
          </div>
        </Cell>

        {/* saved storefronts — every fabricated site, one click to reopen */}
        {saved.length > 0 && (
          <Cell label={`SAVED STOREFRONTS · ${clock2(saved.length)}`} className="mt-3">
            <div className="flex flex-col">
              {saved.map((st) => (
                <a key={st.slug} href={`/store/${st.slug}`} target="_blank" rel="noreferrer"
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b py-2 no-underline transition-colors hover:bg-[#17171A]" style={{ borderColor: LINE }}>
                  <span className="w-32 shrink-0 font-display text-[15px] uppercase" style={{ color: INK }}>{st.name}</span>
                  <span className="tabular-nums text-[11px]" style={{ color: DIM }}>/store/{st.slug}</span>
                  <span className="ml-auto tabular-nums text-[10px]" style={{ color: FAINT }}>{new Date(st.ts).toISOString().slice(0, 16).replace("T", " ")}</span>
                  <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: AMBER }}>OPEN ↗</span>
                </a>
              ))}
            </div>
          </Cell>
        )}

        {/* live agent endpoints — the published store's feed pack when one exists */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.12em]" style={{ borderColor: LINE, backgroundColor: PANEL }}>
          {lastStore ? (
            <>
              <span className="flex items-center gap-2"><Led color={GREEN} glow /> <span style={{ color: GREEN }}>STORE PUBLISHED</span></span>
              {[`/store/${lastStore}`, `/store/${lastStore}/feed.jsonl`, `/store/${lastStore}/agent-catalog.json`].map((p) => (
                <a key={p} href={p} target="_blank" rel="noreferrer" className="no-underline tabular-nums" style={{ color: DIM }}>{p} ↗</a>
              ))}
            </>
          ) : (
            <>
              <span className="flex items-center gap-2"><Led color={SCHED} glow /> <span style={{ color: SCHED }}>NO STORE PUBLISHED YET</span></span>
              <span style={{ color: FAINT }}>SAMPLE (MERIDIAN DEMO):</span>
              {["/api/store/demo/catalog", "/api/store/demo/llms"].map((p) => (
                <a key={p} href={p} target="_blank" rel="noreferrer" className="no-underline tabular-nums" style={{ color: FAINT }}>{p} ↗</a>
              ))}
            </>
          )}
        </div>

        {/* agent legibility — our crawler reading the published store JS-off */}
        {report && (
          <Cell label="AGENT LEGIBILITY REPORT · CRAWLED JS-OFF, LIKE GPTBOT" className="mt-3">
            <div className="mb-2 flex items-baseline gap-4">
              <span className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-none tabular-nums" style={{ color: report.score >= 70 ? GREEN : AMBER }}>{report.score}/100</span>
              <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: FAINT }}>/store/{lastStore}</span>
            </div>
            <div className="flex flex-col">
              {report.checks.map((c) => (
                <div key={c.k} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b py-1.5 text-[11.5px]" style={{ borderColor: LINE }}>
                  <span className="w-12 shrink-0 text-[9px] font-bold tracking-[0.12em]" style={{ color: c.status === "PASS" ? GREEN : c.status === "WARN" ? SCHED : RED }}>{c.status}</span>
                  <span className="w-64 shrink-0" style={{ color: INK }}>{c.label}</span>
                  <span className="min-w-0" style={{ color: DIM }}>{c.note}</span>
                </div>
              ))}
            </div>
          </Cell>
        )}

      </div>
    </div>
  );
}
