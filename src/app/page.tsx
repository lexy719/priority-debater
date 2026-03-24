"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
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
  BarChart3,
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
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { StarfieldBackground, GridPattern } from "@/components/ui/animated-background";

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
    <div ref={ref} className="relative mx-auto max-w-xl px-4 sm:max-w-2xl sm:px-0">
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-gradient-to-b from-indigo-500/15 via-violet-500/10 to-transparent blur-3xl"
        aria-hidden
      />
      <div className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-br from-white/[0.12] via-transparent to-indigo-500/20 opacity-80" />

      <div
        className="relative overflow-hidden rounded-[1.15rem] border"
        style={{
          borderColor: "var(--border-primary)",
          background: "var(--bg-card)",
          boxShadow:
            "var(--shadow-elevated), inset 0 1px 0 color-mix(in srgb, var(--text-primary) 6%, transparent)",
        }}
      >
        {/* Window chrome */}
        <div
          className="flex items-center gap-3 border-b px-3 py-2.5 sm:px-4"
          style={{ borderColor: "var(--border-primary)", background: "var(--bg-secondary)" }}
        >
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57] shadow-[inset_0_-1px_0_rgba(0,0,0,0.2)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840] shadow-[inset_0_-1px_0_rgba(0,0,0,0.15)]" />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center sm:justify-start">
            <div
              className="flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1 shadow-inner"
              style={{ borderColor: "var(--border-primary)", background: "var(--bg-input)" }}
            >
              <Lock className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
              <span className="truncate font-mono text-[10px] sm:text-[11px]" style={{ color: "var(--text-secondary)" }}>
                prioritydebater.com<span style={{ color: "var(--text-muted)" }}>/results</span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative p-4 sm:p-5">
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
function StepCard({ step, index }: { step: { num: string; title: string; desc: string; icon: React.ReactNode; color: string; borderColor: string }; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="group relative cursor-default"
    >
      {/* Glow on hover */}
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
      <div className="relative rounded-2xl border border-white/[0.06] bg-[#0c0c14]/80 backdrop-blur-sm p-5 h-full">
        {/* Step number */}
        <div className={`absolute -top-3 -right-2 text-[40px] font-black ${step.color.includes("indigo") ? "text-indigo-500/10" : step.color.includes("violet") ? "text-violet-500/10" : step.color.includes("emerald") ? "text-emerald-500/10" : "text-amber-500/10"} select-none`}>
          {step.num}
        </div>
        <div className={`w-10 h-10 rounded-xl border ${step.borderColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
          {step.icon}
        </div>
        <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
        <p className="text-[11px] text-white/35 leading-relaxed">{step.desc}</p>
      </div>
    </motion.div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function Home() {
  const heroScrollRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroScrollRef,
    offset: ["start start", "end end"],
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.42], [1, 0.9]);
  const heroY = useTransform(scrollYProgress, [0, 0.42], [0, -28]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.38], [1, 0.65]);
  const demoOpacity = useTransform(scrollYProgress, [0.14, 0.42], [0, 1]);
  const demoY = useTransform(scrollYProgress, [0.14, 0.42], [90, 0]);
  const demoScale = useTransform(scrollYProgress, [0.14, 0.42], [0.92, 1]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const [demoPlay, setDemoPlay] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v > 0.2) setDemoPlay(true);
  });

  return (
    <div className="landing-page min-h-screen overflow-hidden" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>

      {/* ═══ FULL-PAGE INTERACTIVE STARFIELD ═══ */}
      <StarfieldBackground />

      {/* Nebula glow layers — fixed, behind everything */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <motion.div
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-5%] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -60, 50, 0], y: [0, 50, -70, 0], scale: [1, 0.85, 1.15, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, 40, -60, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)" }}
        />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 w-full z-50" style={{ borderBottom: "1px solid var(--border-primary)", background: "color-mix(in srgb, var(--bg-primary) 60%, transparent)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            Priority Debater
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/validate" className="hidden sm:inline-flex px-3.5 py-1.5 text-xs transition-colors hover:text-white/70" style={{ color: "var(--text-tertiary)" }}>
              Validate
            </Link>
            <Link href="/toolkit" className="hidden sm:inline-flex px-3.5 py-1.5 text-xs transition-colors hover:text-white/70" style={{ color: "var(--text-tertiary)" }}>
              Toolkit
            </Link>
            <Link href="/debate" className="hidden sm:inline-flex px-3.5 py-1.5 text-xs transition-colors hover:text-white/70" style={{ color: "var(--text-tertiary)" }}>
              Debate
            </Link>
            <ThemeToggle />
            <Link href="/validate"
              className="ml-2 px-5 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40" style={{ background: "linear-gradient(135deg, var(--accent-gradient-from), var(--accent-gradient-to))" }}>
              Test My Idea &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO + scroll-reveal live preview ═══ */}
      <section ref={heroScrollRef} className="relative z-10 min-h-[220vh] sm:min-h-[260vh]">
        <div className="sticky top-0 flex min-h-[100svh] flex-col justify-center overflow-hidden pt-20 sm:pt-24 pb-10">

        <motion.div
          style={{ scale: heroScale, y: heroY, opacity: heroOpacity }}
          className="relative mx-auto max-w-5xl origin-top px-5 text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-8 flex justify-center"
          >
            <Badge
              variant="outline"
              className="h-auto gap-2 rounded-full border-indigo-500/25 bg-indigo-500/[0.08] px-4 py-1.5 text-[11px] font-normal text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)] backdrop-blur-sm hover:bg-indigo-500/[0.12]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
              Free forever &middot; No signup &middot; 2-minute full report
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.8, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.05] mb-6">
            <span className="block">Stop guessing.</span>
            <motion.span
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="block mt-1 text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(90deg, #818cf8, #a78bfa, #ec4899, #818cf8)", backgroundSize: "200% auto" }}>
              Start validating.
            </motion.span>
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            5 AI personas rip your startup idea apart — investor, customer, operator, mentor, adversary.
            <span className="text-white/80 font-normal"> Get a brutal viability score, lean canvas, and action plan in 2 minutes.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/validate" className="cta-primary group relative overflow-hidden inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-[#08080e] font-bold text-base transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.3)]">
                <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />
                Stress-Test My Idea
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href="/validate?mode=generate"
                className="cta-secondary inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white/[0.07] text-white/80 font-semibold text-base hover:bg-white/[0.14] transition-all border border-white/[0.1] hover:border-indigo-400/30 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]">
                <Wand2 className="w-5 h-5" />
                Generate an Idea
              </Link>
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-6 text-xs text-white/40">
            {[
              { icon: <Shield className="w-3.5 h-3.5 text-emerald-400" />, t: "100% private" },
              { icon: <Clock className="w-3.5 h-3.5 text-blue-400" />, t: "2-min report" },
              { icon: <Zap className="w-3.5 h-3.5 text-amber-400" />, t: "No signup" },
              { icon: <Target className="w-3.5 h-3.5 text-violet-400" />, t: "15+ criteria" },
            ].map((item) => (
              <span key={item.t} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
                {item.icon}{item.t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: demoOpacity, y: demoY, scale: demoScale }}
          className="relative mx-auto mt-2 w-full max-w-5xl px-4 sm:mt-4"
        >
          <div className="mb-4 text-center sm:mb-5">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-400/90">Live preview</p>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl" style={{ color: "var(--text-primary)" }}>
              Watch a validation run
            </h2>
            <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm" style={{ color: "var(--text-tertiary)" }}>
              Unlocks as you scroll — same flow as the real report.
            </p>
          </div>
          <DemoPreview play={demoPlay} />
        </motion.div>

        <motion.p
          style={{ opacity: scrollHintOpacity, color: "var(--text-tertiary)" }}
          className="pointer-events-none absolute bottom-6 left-0 right-0 text-center text-[11px]"
        >
          <span className="inline-flex items-center gap-2">
            Scroll for live preview
            <span className="inline-block animate-bounce">&darr;</span>
          </span>
        </motion.p>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="relative z-10 border-y border-white/[0.06] py-16 sm:py-20">
        <div className="absolute inset-0 bg-[#08080e]/60 backdrop-blur-sm" />
        <GridPattern />
        <Stagger className="relative max-w-5xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            { v: 15, s: "+", label: "Blind spots checked", icon: <BarChart3 className="w-5 h-5" />, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
            { v: 5, s: "", label: "AI personas grilling you", icon: <Target className="w-5 h-5" />, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
            { v: 2, s: " min", label: "To a full validation report", icon: <Clock className="w-5 h-5" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { v: 0, s: "$", label: "Forever. No catch.", icon: <Shield className="w-5 h-5" />, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          ].map((s, i) => (
            <StaggerChild key={i}>
              <motion.div
                whileHover={{ y: -4, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-center p-5 sm:p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.04] transition-colors cursor-default"
              >
                <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.color} flex items-center justify-center mx-auto mb-3`}>{s.icon}</div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white"><Counter value={s.v} suffix={s.s} /></p>
                <p className="text-xs text-white/40 mt-1.5 font-medium">{s.label}</p>
              </motion.div>
            </StaggerChild>
          ))}
        </Stagger>
      </section>

      {/* ═══ HOW IT WORKS — Compact 4-step cards ═══ */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-5">
          <Reveal className="mb-10 text-center">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-400/80">How it works</p>
            <h2 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>
              From napkin sketch to investor-ready
            </h2>
            <p className="mx-auto max-w-md text-sm" style={{ color: "var(--text-tertiary)" }}>
              Four steps. Two minutes. Zero sugar-coating.
            </p>
          </Reveal>

          {/* Connecting line on desktop */}
          <div className="relative">
            <div className="hidden sm:block absolute top-[52px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" aria-hidden />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { num: "01", title: "Pitch it", desc: "Describe your idea in plain English. No templates, no jargon — 30 seconds to submit.", icon: <FileText className="w-4.5 h-4.5 text-blue-400" />, color: "from-blue-500/20 to-transparent", borderColor: "border-blue-500/20 bg-blue-500/[0.06]" },
                { num: "02", title: "Get torn apart", desc: "5 AI personas score you across 15+ criteria. Market sizing, risk flags, viability score.", icon: <Flame className="w-4.5 h-4.5 text-violet-400" />, color: "from-violet-500/20 to-transparent", borderColor: "border-violet-500/20 bg-violet-500/[0.06]" },
                { num: "03", title: "Defend it", desc: "Enter debate mode. Adversary, Investor, Customer challenge every assumption you have.", icon: <Swords className="w-4.5 h-4.5 text-emerald-400" />, color: "from-emerald-500/20 to-transparent", borderColor: "border-emerald-500/20 bg-emerald-500/[0.06]" },
                { num: "04", title: "Ship it", desc: "Export PDF, generate a landing page, create a pitch deck. Build with conviction.", icon: <Rocket className="w-4.5 h-4.5 text-amber-400" />, color: "from-amber-500/20 to-transparent", borderColor: "border-amber-500/20 bg-amber-500/[0.06]" },
              ].map((step, i) => (
                <StepCard key={step.num} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU GET ═══ */}
      <section className="relative z-10 py-20 sm:py-28 border-y border-white/[0.06]">
        <div className="absolute inset-0 bg-[#08080e]/40 backdrop-blur-[2px]" />
        <div className="relative max-w-5xl mx-auto px-5">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-3">Your validation report</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Everything a VC would grill you on — answered</h2>
            <p className="text-white/30 text-sm max-w-lg mx-auto">Not a vague summary. A complete teardown with scores, frameworks, and actionable next steps.</p>
          </Reveal>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { icon: <Sparkles className="w-4 h-4" />, title: "Viability Score", desc: "Brutal 0-10 Go/No-Go verdict", c: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", glow: "rgba(16,185,129,0.15)" },
              { icon: <Target className="w-4 h-4" />, title: "Radar Chart", desc: "6 dimensions, zero hiding", c: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", glow: "rgba(99,102,241,0.15)" },
              { icon: <TrendingUp className="w-4 h-4" />, title: "Market Sizing", desc: "TAM / SAM / SOM with sources", c: "text-blue-400 bg-blue-500/10 border-blue-500/20", glow: "rgba(59,130,246,0.15)" },
              { icon: <Eye className="w-4 h-4" />, title: "Competition Map", desc: "5+ rivals you forgot about", c: "text-amber-400 bg-amber-500/10 border-amber-500/20", glow: "rgba(245,158,11,0.15)" },
              { icon: <AlertTriangle className="w-4 h-4" />, title: "Risk Flags", desc: "The blind spots that kill startups", c: "text-red-400 bg-red-500/10 border-red-500/20", glow: "rgba(239,68,68,0.15)" },
              { icon: <Grid3x3 className="w-4 h-4" />, title: "Lean Canvas", desc: "Full 9-cell, ready to iterate", c: "text-violet-400 bg-violet-500/10 border-violet-500/20", glow: "rgba(139,92,246,0.15)" },
              { icon: <Briefcase className="w-4 h-4" />, title: "Business Plan", desc: "Investor-ready in one click", c: "text-slate-300 bg-white/[0.06] border-white/[0.08]", glow: "rgba(255,255,255,0.08)" },
              { icon: <Users className="w-4 h-4" />, title: "ICP & Positioning", desc: "Who buys and why they care", c: "text-sky-400 bg-sky-500/10 border-sky-500/20", glow: "rgba(14,165,233,0.15)" },
              { icon: <MessageSquare className="w-4 h-4" />, title: "Value Proposition", desc: "Messaging that actually lands", c: "text-pink-400 bg-pink-500/10 border-pink-500/20", glow: "rgba(236,72,153,0.15)" },
              { icon: <Download className="w-4 h-4" />, title: "PDF & MD Export", desc: "Take it anywhere", c: "text-teal-400 bg-teal-500/10 border-teal-500/20", glow: "rgba(20,184,166,0.15)" },
              { icon: <Share2 className="w-4 h-4" />, title: "Share Link", desc: "Loop in your co-founder", c: "text-orange-400 bg-orange-500/10 border-orange-500/20", glow: "rgba(249,115,22,0.15)" },
              { icon: <Swords className="w-4 h-4" />, title: "AI Debate Mode", desc: "Defend it or kill it", c: "text-purple-400 bg-purple-500/10 border-purple-500/20", glow: "rgba(168,85,247,0.15)" },
            ].map((f, i) => (
              <StaggerChild key={i}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -6 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all h-full cursor-default"
                  style={{ willChange: "transform" }}
                >
                  <div className={`w-9 h-9 rounded-lg ${f.c} border flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
                    style={{ "--tw-shadow-color": f.glow } as React.CSSProperties}>
                    {f.icon}
                  </div>
                  <p className="font-semibold text-white text-[13px]">{f.title}</p>
                  <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">{f.desc}</p>
                </motion.div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ DEBATE MODE ═══ */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal>
            <div className="relative rounded-3xl overflow-hidden">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-purple-600/20" />
              <div className="absolute inset-0 border border-white/[0.08] rounded-3xl" />
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />

              <div className="relative p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10">
                <div className="flex-1">
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileInView={{ rotate: [0, -8, 8, -4, 0] }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="inline-flex p-3 rounded-xl bg-white/[0.08] border border-white/[0.08] mb-5"
                  >
                    <Swords className="w-8 h-8 text-indigo-400" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">Your idea sounds great. Now defend it.</h3>
                  <p className="text-white/40 text-sm mb-6 leading-relaxed max-w-md">
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
                        className="flex items-center gap-2 text-[12px] text-white/50"
                      >
                        <div className="w-4 h-4 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-indigo-400" />
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
      <section className="relative z-10 py-20 sm:py-28 border-y border-white/[0.06]">
        <div className="absolute inset-0 bg-[#08080e]/50 backdrop-blur-[2px]" />
        <div className="relative max-w-3xl mx-auto px-5">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-3">Why not just use a generic AI?</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Because yes-men don&apos;t build great companies</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden backdrop-blur-sm">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-white/30 font-medium">Feature</th>
                    <th className="text-center py-3 px-4 text-indigo-400 font-semibold bg-indigo-500/[0.06]">Priority Debater</th>
                    <th className="text-center py-3 px-4 text-white/30 font-medium">Generic AI / Others</th>
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
                    <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-4 text-white/50">{feature}</td>
                      <td className="py-2.5 px-4 text-center bg-indigo-500/[0.03]">
                        {us === true ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> :
                         typeof us === "string" ? <span className="text-emerald-400 font-medium">{us}</span> : null}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {them === true ? <Check className="w-3.5 h-3.5 text-white/20 mx-auto" /> :
                         them === false ? <span className="text-white/15">&times;</span> :
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
      <section className="relative z-10 py-14 sm:py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent" aria-hidden />
        <div className="mx-auto max-w-2xl px-5">
          <Reveal className="mb-8 text-center">
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-indigo-400/80">FAQ</p>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--text-primary)" }}>
              Before you ask
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs" style={{ color: "var(--text-tertiary)" }}>
              Tap a row to expand.
            </p>
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
                className="group border-b-0 border-0 bg-transparent data-[state=open]:shadow-[0_12px_40px_-16px_rgba(99,102,241,0.2)]"
              >
                <div
                  className="rounded-xl border p-px transition-colors group-data-[state=open]:border-indigo-400/30"
                  style={{ borderColor: "var(--border-primary)", background: "var(--bg-card)" }}
                >
                  <div className="overflow-hidden rounded-[0.7rem]" style={{ background: "var(--bg-card)" }}>
                    <AccordionTrigger className="gap-3 px-3.5 py-3.5 text-left hover:no-underline sm:px-4 sm:py-4 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-indigo-500 [&[data-state=open]>svg]:rotate-180">
                      <span className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          style={{ boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--text-primary) 8%, transparent)" }}
                        >
                          <CircleHelp className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 pt-0.5 text-left text-[13px] font-semibold leading-snug sm:text-sm" style={{ color: "var(--text-primary)" }}>
                          {item.q}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent
                      className="border-t px-3.5 pb-3.5 pt-0 text-[12px] leading-relaxed sm:px-4"
                      style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                    >
                      <p className="pt-3 pl-0 sm:pl-11">{item.a}</p>
                    </AccordionContent>
                  </div>
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative z-10 pb-20 sm:pb-28">
        <Reveal>
          <div className="max-w-4xl mx-auto px-5">
            {/* Animated gradient border wrapper */}
            <motion.div
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="rounded-3xl p-[1px]"
              style={{ backgroundImage: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899, #6366f1)", backgroundSize: "300% 300%" }}
            >
              <div className="relative text-center py-16 px-6 rounded-3xl overflow-hidden bg-[#0a0a12]">
                {/* Background glow orbs */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full"
                  style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 60%)" }}
                />

                <div className="relative">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3"
                  >
                    Stop building on hope.{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                      Start building on evidence.
                    </span>
                  </motion.h2>
                  <p className="text-white/35 text-sm sm:text-base mb-8 max-w-md mx-auto">
                    2 minutes. 5 AI personas. Zero sugar-coating. Free forever.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <Link href="/validate"
                        className="cta-primary group relative overflow-hidden inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-[#08080e] font-bold text-sm transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]">
                        <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />
                        Stress-Test My Idea Now
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                      <Link href="/validate?mode=generate"
                        className="cta-secondary inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/[0.07] text-white/80 text-sm font-semibold transition-all border border-white/[0.1] hover:border-indigo-400/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]">
                        <Wand2 className="w-4 h-4" /> Generate an Idea
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Priority Debater</span>
          </div>
          <div className="flex gap-5 text-[11px] text-white/20">
            <Link href="/validate" className="hover:text-white/50 transition-colors">Validate</Link>
            <Link href="/toolkit" className="hover:text-white/50 transition-colors">Toolkit</Link>
            <Link href="/debate" className="hover:text-white/50 transition-colors">Debate</Link>
          </div>
          <p className="text-[11px] text-white/15">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
