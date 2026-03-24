"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  Swords,
  Eye,
  Wand2,
  Briefcase,
  Target,
  Zap,
  MessageSquare,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Grid3x3,
  Download,
  Share2,
  AlertTriangle,
  Loader2,
  Lock,
  CircleHelp,
  Rocket,
  Flame,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Badge removed — using simple span now
import { StarfieldBackground } from "@/components/ui/animated-background";

// ── Animated counter ────────────────────────────────────────────────────
function Counter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      if (ref.current) ref.current.textContent = Math.round(v) + suffix;
    });
    return unsub;
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── Fade-in on scroll ───────────────────────────────────────────────────
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger ─────────────────────────────────────────────────────────────
function Stagger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className={className}>
      {children}
    </motion.div>
  );
}
function StaggerChild({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={{
      hidden: { opacity: 0, y: 24 },
      show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
    }} className={className}>{children}</motion.div>
  );
}

const DEMO_IDEA_TEXT = "AI-powered meeting summarizer for remote teams";

// ── Mini radar for demo ─────────────────────────────────────────────────
function MiniRadar() {
  const scores = [8, 7, 6, 8, 7, 9];
  const labels = ["Problem", "Market", "Edge", "Model", "Team", "Timing"];
  const n = 6;
  const cx = 60;
  const cy = 60;
  const maxR = 46;
  const pt = (r: number, i: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const dataPath =
    scores
      .map((v, i) => pt((v / 10) * maxR, i))
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + " Z";
  const gridPath = (ring: number) =>
    Array.from({ length: n }, (_, i) => pt((ring / 10) * maxR, i))
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + " Z";

  return (
    <svg viewBox="0 0 120 120" className="h-auto w-full drop-shadow-[0_0_12px_rgba(99,102,241,0.2)]">
      <defs>
        <linearGradient id="demoRadarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="demoRadarStroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      {[3, 6, 10].map((r) => (
        <path key={r} d={gridPath(r)} fill="none" stroke="rgb(99 102 241 / 0.18)" strokeWidth={0.45} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = pt(maxR, i);
        return (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgb(99 102 241 / 0.12)" strokeWidth={0.45} />
        );
      })}
      <motion.path
        d={dataPath}
        fill="url(#demoRadarFill)"
        stroke="url(#demoRadarStroke)"
        strokeWidth={1.25}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.15, type: "spring", stiffness: 120, damping: 18 }}
        style={{ transformOrigin: "60px 60px" }}
      />
      {scores.map((v, i) => {
        const p = pt((v / 10) * maxR, i);
        return (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.75}
            fill="#a5b4fc"
            stroke="#e0e7ff"
            strokeWidth={0.4}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 400, damping: 22 }}
          />
        );
      })}
      {labels.map((l, i) => {
        const p = pt(maxR + 12, i);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text-tertiary)"
            fontSize={6}
            fontWeight={600}
            style={{ letterSpacing: "0.02em", opacity: 0.9 }}
          >
            {l}
          </text>
        );
      })}
    </svg>
  );
}

function DemoPreview({ play }: { play: boolean }) {
  const [step, setStep] = useState(-1);
  const [typedText, setTypedText] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    if (!play) return;
    setStep(-1);
    setTypedText("");
    let i = 0;
    const typeInterval = setInterval(() => {
      i++;
      setTypedText(DEMO_IDEA_TEXT.slice(0, i));
      if (i >= DEMO_IDEA_TEXT.length) clearInterval(typeInterval);
    }, 32);
    const t = [
      setTimeout(() => setStep(0), 1600),
      setTimeout(() => setStep(1), 2600),
      setTimeout(() => setStep(2), 3600),
      setTimeout(() => setStep(3), 4700),
      setTimeout(() => setStep(4), 5600),
    ];
    return () => {
      clearInterval(typeInterval);
      t.forEach(clearTimeout);
    };
  }, [play]);

  const steps = [
    { label: "Analyzing market", sub: "TAM / SAM / signals", color: "text-sky-400" },
    { label: "Mapping competitors", sub: "Positioning & gaps", color: "text-violet-400" },
    { label: "Scoring viability", sub: "15+ criteria", color: "text-amber-400" },
    { label: "Report ready", sub: "Export & share", color: "text-emerald-400" },
  ];

  return (
    <div ref={ref} className="relative mx-auto max-w-5xl px-4 sm:px-0">
      <div
        className="relative overflow-hidden rounded-xl border border-white/[0.08]"
        style={{
          background: "#0E0E11",
          boxShadow: "0 25px 60px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_0_rgba(0,0,0,0.2)]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center">
            <div
              className="flex max-w-full items-center gap-2 rounded-lg border px-3 py-1.5 shadow-inner"
              style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
            >
              <Lock className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
              <span className="truncate font-mono text-[11px] sm:text-[12px]" style={{ color: "var(--text-secondary)" }}>
                prioritydebater.com<span style={{ color: "var(--text-muted)" }}>/results</span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative p-6 sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent)]"
            aria-hidden
          />

          <div className="relative">
            {/* Idea input */}
            <div
              className="mb-4 rounded-lg border p-3 sm:mb-5 sm:p-3.5"
              style={{
                borderColor: "var(--border-primary)",
                background: "var(--bg-input)",
              }}
            >
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
                Your idea
              </p>
              <p className="min-h-11 font-mono text-[12px] leading-relaxed sm:text-[13px]" style={{ color: "var(--text-primary)" }}>
                {typedText}
                {typedText.length < DEMO_IDEA_TEXT.length && (
                  <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-indigo-400 align-middle" />
                )}
              </p>
            </div>

            {/* Pipeline */}
            <div className="relative mb-1">
              <div className="absolute bottom-1 left-[13px] top-1 w-px bg-gradient-to-b from-indigo-500/35 via-violet-500/20 to-emerald-500/15" aria-hidden />
              <div className="space-y-0">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0.35, x: -6 }}
                    animate={{ opacity: i <= step ? 1 : 0.35, x: i <= step ? 0 : -6 }}
                    transition={{ duration: 0.35 }}
                    className="relative flex gap-2.5 py-2 pl-0.5"
                  >
                    <div className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center">
                      {i < step ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/25">
                          <Check className="h-3 w-3 text-emerald-500" />
                        </div>
                      ) : i === step ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 ring-2 ring-indigo-400/35">
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                        </div>
                      ) : (
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ borderColor: "var(--border-primary)", background: "var(--bg-elevated)" }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <p
                        className={`text-[12px] font-medium leading-tight sm:text-[13px] ${i <= step ? s.color : ""}`}
                        style={i > step ? { color: "var(--text-muted)" } : undefined}
                      >
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-[10px] sm:text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {s.sub}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Score + Radar */}
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                className="mt-4 rounded-lg border p-3 sm:mt-5 sm:p-4"
                style={{
                  borderColor: "var(--border-primary)",
                  background: "color-mix(in srgb, var(--bg-elevated) 85%, transparent)",
                }}
              >
                <div className="mb-4 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 text-xl font-bold tabular-nums text-emerald-500 ring-1 ring-emerald-500/20 sm:h-12 sm:w-12 sm:text-2xl">
                      7
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="h-2.5 w-2.5" /> GO
                      </span>
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                        Viability score
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:max-w-[260px] sm:shrink-0">
                    {[
                      { n: "4", label: "Strengths", color: "text-emerald-500" },
                      { n: "3", label: "Risks", color: "text-amber-500" },
                      { n: "5", label: "Actions", color: "text-sky-500" },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-md border px-1.5 py-2 text-center"
                        style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
                      >
                        <p className={`text-base font-bold tabular-nums sm:text-lg ${m.color}`}>{m.n}</p>
                        <p className="text-[9px] sm:text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {step >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-stretch sm:gap-5"
                    style={{ borderColor: "var(--border-primary)" }}
                  >
                    <div className="mx-auto w-36 shrink-0 sm:mx-0 sm:w-28">
                      <MiniRadar />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      {[
                        { label: "Problem-Solution Fit", v: 8, color: "from-indigo-400 to-violet-500" },
                        { label: "Market Opportunity", v: 7, color: "from-violet-400 to-purple-500" },
                        { label: "Business Model", v: 8, color: "from-emerald-400 to-teal-500" },
                        { label: "Timing & Trends", v: 9, color: "from-amber-400 to-orange-500" },
                      ].map((b) => (
                        <div key={b.label}>
                          <div className="mb-0.5 flex justify-between gap-2">
                            <span className="text-[10px] sm:text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              {b.label}
                            </span>
                            <span className="text-[10px] font-semibold tabular-nums sm:text-[11px]" style={{ color: "var(--text-primary)" }}>
                              {b.v}/10
                            </span>
                          </div>
                          <div
                            className="h-1.5 overflow-hidden rounded-full"
                            style={{ background: "color-mix(in srgb, var(--text-primary) 8%, transparent)" }}
                          >
                            <motion.div
                              className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${b.v * 10}%` }}
                              transition={{ duration: 0.75, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compact Step Card for "How It Works" ──────────────────────────────
function StepCard({ step, index }: { step: { num: string; title: string; desc: string; icon: React.ReactNode; accent: string; gradient: string }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group cursor-default"
    >
      <div className="rounded-xl bg-white/[0.03] p-5 h-full border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
            {step.icon}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>{step.num}</span>
        </div>
        <h3 className="text-[14px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>{step.title}</h3>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{step.desc}</p>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function Home() {
  const demoRef = useRef<HTMLDivElement>(null);
  const demoInView = useInView(demoRef, { once: true, margin: "-100px" });
  const [demoPlay, setDemoPlay] = useState(false);

  useEffect(() => {
    if (demoInView) setDemoPlay(true);
  }, [demoInView]);

  // Landing is designed dark-only (starfield + light text). Force `data-theme` while
  // this page is mounted so a saved light preference cannot wash out the hero.
  useEffect(() => {
    const prev = document.documentElement.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", "dark");
    return () => {
      if (prev) document.documentElement.setAttribute("data-theme", prev);
    };
  }, []);

  return (
    <div className="landing-page min-h-screen overflow-hidden" style={{ background: "#0A0A0B", color: "rgba(255,255,255,0.95)" }}>

      {/* ═══ CLEAN STARFIELD ═══ */}
      <StarfieldBackground />

      {/* Single subtle top glow — barely there, just adds atmospheric depth */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px]"
          style={{ background: "radial-gradient(ellipse at center, rgba(100,110,240,0.06) 0%, transparent 70%)" }}
        />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 w-full z-50" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,11,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[14px]" style={{ letterSpacing: "-0.02em" }}>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            Priority Debater
          </Link>
          <div className="flex items-center gap-1">
            {["Validate", "Toolkit", "Debate"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="hidden sm:inline-flex px-3.5 py-1.5 text-[13px] transition-colors hover:text-white/80" style={{ color: "rgba(255,255,255,0.45)" }}>
                {item}
              </Link>
            ))}
            <Link href="/validate" className="ml-3 px-5 py-2 rounded-lg text-white text-[13px] font-medium hover:bg-white/[0.15] transition-all" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Test My Idea &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Split layout: text left, demo right ═══ */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-20 sm:pb-28" ref={demoRef}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3.5 py-1 text-[12px] mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Free &middot; No signup &middot; 2 min
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-semibold leading-[1.08] mb-5" style={{ letterSpacing: "-0.035em" }}>
                Stop guessing.
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #848CD0, #B39DDB)" }}>
                  Start validating.
                </span>
              </h1>

              <p className="text-[16px] sm:text-[17px] leading-[1.65] mb-8 max-w-md" style={{ color: "rgba(255,255,255,0.45)" }}>
                5 AI personas rip your startup idea apart — investor, customer, operator, mentor, adversary. Get a viability score and action plan in 2 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/validate" className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0A0A0B] font-medium text-[14px] transition-all hover:bg-white/90">
                  Stress-Test My Idea
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/validate?mode=generate" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all" style={{ color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Wand2 className="w-4 h-4" /> Generate an Idea
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {[
                  { icon: <Shield className="w-3.5 h-3.5" />, t: "100% private" },
                  { icon: <Clock className="w-3.5 h-3.5" />, t: "2-min report" },
                  { icon: <Target className="w-3.5 h-3.5" />, t: "15+ criteria" },
                ].map((item) => (
                  <span key={item.t} className="flex items-center gap-1.5">{item.icon}{item.t}</span>
                ))}
              </div>
            </motion.div>

            {/* Right — live product demo */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={demoInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <DemoPreview play={demoPlay} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR — inline, not a separate section ═══ */}
      <section className="relative z-10 py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1200px] mx-auto px-6">
          <Stagger className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { v: 15, s: "+", label: "Blind spots checked" },
              { v: 5, s: "", label: "AI personas grilling you" },
              { v: 2, s: " min", label: "Full validation report" },
              { v: 0, s: "$", label: "Forever. No catch." },
            ].map((s, i) => (
              <StaggerChild key={i}>
                <div className="text-center cursor-default">
                  <p className="text-2xl sm:text-3xl font-semibold" style={{ letterSpacing: "-0.03em" }}><Counter value={s.v} suffix={s.s} /></p>
                  <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 3 steps, clean ═══ */}
      <section className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-[1200px] px-6">
          <Reveal className="mb-12 text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>How it works</p>
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ letterSpacing: "-0.03em" }}>
              Three steps. Two minutes.
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-4 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden sm:block absolute top-[28px] left-[16%] right-[16%] h-px" style={{ background: "rgba(255,255,255,0.06)" }} aria-hidden />
            {[
              { num: "1", title: "Describe your idea", desc: "Plain English, no templates. Takes 30 seconds.", icon: <FileText className="w-4 h-4" /> },
              { num: "2", title: "Get the brutal truth", desc: "5 AI personas score 15+ criteria. Market data, risk flags, viability score.", icon: <Flame className="w-4 h-4" /> },
              { num: "3", title: "Build with conviction", desc: "Export your report, generate a landing page, enter debate mode, or ship.", icon: <Rocket className="w-4 h-4" /> },
            ].map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full border border-white/[0.08] bg-white/[0.03] flex items-center justify-center mx-auto mb-4 relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>
                    <span className="text-[16px] font-semibold">{step.num}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1.5" style={{ letterSpacing: "-0.01em" }}>{step.title}</h3>
                  <p className="text-[13px] leading-relaxed max-w-[260px] mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>{step.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BENTO FEATURES — asymmetric grid ═══ */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.15em] font-medium mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>What you get</p>
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ letterSpacing: "-0.03em" }}>
              Everything a VC would grill you on — answered
            </h2>
          </Reveal>

          {/* Row 1: Two large feature cards */}
          <Stagger className="grid sm:grid-cols-2 gap-4 mb-4">
            {[
              {
                title: "Viability Score & Radar Chart",
                desc: "A brutal 0-10 Go/No-Go verdict across 6 dimensions. Market opportunity, problem-solution fit, business model, timing — nothing hides.",
                icons: [<Sparkles key="s" className="w-4 h-4" />, <Target key="t" className="w-4 h-4" />],
              },
              {
                title: "Market Sizing & Competition Map",
                desc: "Real TAM/SAM/SOM estimates with sources. Plus 5+ competitors you forgot about, mapped against your positioning.",
                icons: [<TrendingUp key="t" className="w-4 h-4" />, <Eye key="e" className="w-4 h-4" />],
              },
            ].map((f, i) => (
              <StaggerChild key={i}>
                <div className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all h-full">
                  <div className="flex gap-2 mb-4">
                    {f.icons.map((icon, j) => (
                      <div key={j} className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center" style={{ color: "rgba(255,255,255,0.45)" }}>{icon}</div>
                    ))}
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2" style={{ letterSpacing: "-0.01em" }}>{f.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>

          {/* Row 2: Four smaller feature cards */}
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <AlertTriangle className="w-4 h-4" />, title: "Risk Flags", desc: "Blind spots that kill startups" },
              { icon: <Grid3x3 className="w-4 h-4" />, title: "Lean Canvas", desc: "Full 9-cell, ready to iterate" },
              { icon: <Briefcase className="w-4 h-4" />, title: "Business Plan", desc: "Investor-ready in one click" },
              { icon: <Users className="w-4 h-4" />, title: "ICP & Positioning", desc: "Who buys and why they care" },
            ].map((f, i) => (
              <StaggerChild key={i}>
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{f.icon}</div>
                  <p className="font-medium text-[13px] mb-0.5" style={{ letterSpacing: "-0.01em" }}>{f.title}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>

          {/* Row 3: Export & sharing row */}
          <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {[
              { icon: <Download className="w-4 h-4" />, title: "PDF & MD Export", desc: "Take it anywhere" },
              { icon: <Share2 className="w-4 h-4" />, title: "Share Link", desc: "Loop in your co-founder" },
              { icon: <MessageSquare className="w-4 h-4" />, title: "Value Proposition", desc: "Messaging that lands" },
              { icon: <Swords className="w-4 h-4" />, title: "AI Debate Mode", desc: "Defend it or kill it" },
            ].map((f, i) => (
              <StaggerChild key={i}>
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{f.icon}</div>
                  <p className="font-medium text-[13px] mb-0.5" style={{ letterSpacing: "-0.01em" }}>{f.title}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ DEBATE MODE — Full-width highlight ═══ */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03]">

              <div className="relative p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10" style={{ background: "transparent" }}>
                <div className="flex-1">
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileInView={{ rotate: [0, -8, 8, -4, 0] }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="inline-flex p-3 rounded-xl bg-white/[0.06] border border-white/[0.06] mb-5"
                  >
                    <Swords className="w-8 h-8" style={{ color: "rgba(255,255,255,0.5)" }} />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)" }}>Your idea sounds great. Now defend it.</h3>
                  <p className="text-sm mb-6 leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.4)" }}>
                    5 AI personas inspired by Munger, Graham, and Kahneman challenge every assumption. If your idea survives this, it can survive the market.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "Adversary rips holes in your logic",
                      "Investor asks about your unit economics",
                      "Customer tells you they wouldn't buy",
                      "Operator flags what won't scale",
                      "Mentor helps you fix what's broken",
                      "Real-time argument scoring",
                    ].map((f) => (
                      <motion.div
                        key={f}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 text-[12px]"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        <div className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                        </div>
                        {f}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Mock debate */}
                <div className="w-full lg:w-72 shrink-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-3"
                  >
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-[10px]">&#x1F5E1;&#xFE0F;</div>
                      <div className="bg-white/[0.06] rounded-xl rounded-tl-none px-3 py-2 text-[11px] text-white/60 leading-relaxed">
                        Your TAM assumes every business needs this. What&apos;s your actual serviceable market?
                      </div>
                    </div>
                    <div className="flex gap-2 items-start flex-row-reverse">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-[10px]">&#x1F464;</div>
                      <div className="bg-indigo-500/10 rounded-xl rounded-tr-none px-3 py-2 text-[11px] text-white/60 leading-relaxed">
                        SAM is $3.2B — remote-first companies with 50+ employees...
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-[10px]">&#x1F5E1;&#xFE0F;</div>
                      <div className="bg-white/[0.06] rounded-xl rounded-tl-none px-3 py-2">
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-white/20 border-t-indigo-400 animate-spin" />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.15em] font-medium mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Why not just use a generic AI?</p>
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ letterSpacing: "-0.03em", color: "rgba(255,255,255,0.95)" }}>Because yes-men don&apos;t build great companies</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="min-w-0 overflow-x-auto rounded-2xl border border-white/[0.06] backdrop-blur-sm bg-white/[0.02] [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th className="text-left py-3.5 px-5 text-white/40 font-medium">Feature</th>
                    <th className="text-center py-3.5 px-5 text-indigo-400 font-semibold bg-indigo-500/[0.08]">Priority Debater</th>
                    <th className="text-center py-3.5 px-5 text-white/30 font-medium">Generic AI / Others</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["Challenges your assumptions", true, false],
                    ["5 specialized AI personas", true, false],
                    ["Market analysis (TAM/SAM/SOM)", true, "Vague"],
                    ["Competitive landscape", true, "If you ask"],
                    ["Lean Canvas", true, false],
                    ["Radar chart (6 categories)", true, false],
                    ["Live debate mode", true, false],
                    ["Actionable validation checklist", true, false],
                    ["PDF & Markdown export", true, "Paid"],
                    ["No signup required", true, false],
                    ["Price", "Free forever", "$20+/mo"],
                  ] as [string, boolean | string, boolean | string][]).map(([feature, us, them], i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-5 text-white/50">{feature}</td>
                      <td className="py-3 px-5 text-center bg-indigo-500/[0.04]">
                        {us === true ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> :
                         typeof us === "string" ? <span className="text-emerald-400 font-semibold">{us}</span> : null}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {them === true ? <Check className="w-4 h-4 text-white/20 mx-auto" /> :
                         them === false ? <span className="text-white/15 text-lg">&times;</span> :
                         <span className="text-white/25">{them}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal className="mb-8 text-center">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>FAQ</p>
            <h2 className="text-xl font-semibold sm:text-2xl" style={{ letterSpacing: "-0.02em", color: "rgba(255,255,255,0.95)" }}>
              Before you ask
            </h2>
          </Reveal>

          <Accordion type="single" collapsible className="grid gap-2.5">
            {[
              { q: "Why not just ask a generic AI to validate my idea?", a: "A generic AI is a yes-man that tells you what you want to hear. We built 5 specialized personas (Adversary, Investor, Mentor, Customer, Operator) specifically designed to challenge you. You also get structured scoring, lean canvas, financials, and a live debate mode. It's the difference between a friend saying 'sounds cool' and a VC grilling you for 30 minutes." },
              { q: "How long does it take?", a: "2 minutes to a full validation report with viability scores, market sizing, competitor analysis, risk flags, and actionable next steps. The debate can go as long as you want." },
              { q: "Is my idea kept private?", a: "Completely. No database, no logs, no accounts. Everything is processed in real-time and lives only in your browser session. We never see or store your idea." },
              { q: "How accurate is the analysis?", a: "Our AI evaluates 15+ criteria using real market data and proven frameworks from top VCs and accelerators. But the real value isn't the score — it's the questions it forces you to answer. If you can't defend your idea against our personas, you won't be able to defend it against investors or the market." },
              { q: "What's the catch? Why is it free?", a: "No catch on the core validation tool — it's free with no signup, and always will be. In the future, premium features like AI-powered landing page generation will be offered as a paid upgrade, but the full idea validation, debate mode, and export tools remain completely free." },
              { q: "What if I don't have an idea yet?", a: "Use the Idea Generator. Tell us your interests, skills, and constraints — we'll generate tailored startup ideas you can immediately validate and stress-test." },
            ].map((item, i) => (
              <AccordionItem
                key={item.q}
                value={`faq-${i}`}
                className="group border-b-0 border-0 bg-transparent"
              >
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition-colors group-data-[state=open]:border-white/[0.1]">
                  <div className="overflow-hidden rounded-[0.7rem]">
                    <AccordionTrigger className="gap-3 px-4 py-4 text-left hover:no-underline [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-40 [&[data-state=open]>svg]:rotate-180">
                      <span className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <CircleHelp className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 pt-0.5 text-left text-[13px] font-medium leading-snug" style={{ color: "rgba(255,255,255,0.85)" }}>
                          {item.q}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0 text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                      <p className="pt-2 pl-0 sm:pl-10">{item.a}</p>
                    </AccordionContent>
                  </div>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative z-10 pb-24 sm:pb-32">
        <Reveal>
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="relative text-center py-20 px-6 rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
              {/* Subtle top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(140,150,255,0.06) 0%, transparent 70%)" }} />

              <div className="relative">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold mb-4" style={{ letterSpacing: "-0.03em", color: "rgba(255,255,255,0.95)" }}>
                  Stop building on hope.{" "}
                  <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #848CD0, #B39DDB)" }}>
                    Start building on evidence.
                  </span>
                </h2>
                <p className="text-[15px] mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
                  2 minutes. 5 AI personas. Zero sugar-coating. Free forever.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/validate"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0A0A0B] font-medium text-[14px] transition-all hover:bg-white/90">
                    Stress-Test My Idea Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/validate?mode=generate"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[14px] font-medium transition-all"
                    style={{ color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Wand2 className="w-4 h-4" /> Generate an Idea
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Zap className="w-3.5 h-3.5" />
            <span>Priority Debater</span>
          </div>
          <div className="flex gap-5 text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Link href="/validate" className="hover:text-white/50 transition-colors">Validate</Link>
            <Link href="/toolkit" className="hover:text-white/50 transition-colors">Toolkit</Link>
            <Link href="/debate" className="hover:text-white/50 transition-colors">Debate</Link>
          </div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
