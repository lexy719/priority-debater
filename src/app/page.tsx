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
  CircleHelp,
  Rocket,
  Flame,
  Lightbulb,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Badge removed — using simple span now
import { StarfieldBackground } from "@/components/ui/animated-background";
import { SCORE_MAX } from "@/lib/scoring-scale";

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

const DEMO_IDEA = {
  title: "AsyncStand — voice standups for remote teams",
  lines: [
    "15-second async voice updates instead of live standups.",
    "Managers get a morning digest; integrates with Slack & Linear.",
  ],
} as const;

const DEMO_PERSONAS = [
  { id: "A", label: "Adversary" },
  { id: "I", label: "Investor" },
  { id: "C", label: "Customer" },
  { id: "O", label: "Operator" },
  { id: "M", label: "Mentor" },
] as const;

/** Illustrative rubric bars — not real scores (shows structure of the 0–100 report). */
const DEMO_RUBRIC_ROWS = [
  { label: "Problem–solution", score: 58 },
  { label: "Market", score: 64 },
  { label: "Competition", score: 47 },
  { label: "Business model", score: 61 },
  { label: "Execution", score: 52 },
  { label: "Timing", score: 69 },
] as const;

/**
 * Hero preview: demo idea + six-dimension 0–100 rubric strip (like lean + investor diligence), no fake headline score.
 */
function HeroValidationPreview({ play }: { play: boolean }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const outer = requestAnimationFrame(() => {
      if (cancelled) return;
       if (!play) {
        setActive(false);
        return;
      }
      setActive(false);
      requestAnimationFrame(() => {
        if (!cancelled) setActive(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(outer);
    };
  }, [play]);

  return (
    <div className="relative w-full min-w-0">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10"
        style={{
          background:
            "linear-gradient(160deg, rgba(18,18,26,0.96) 0%, rgba(6,6,10,0.99) 45%, #0a0a0f 100%)",
          boxShadow:
            "0 28px 56px -24px rgba(0,0,0,0.55), 0 0 0 1px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.7]"
          style={{
            background:
              "radial-gradient(ellipse 85% 50% at 100% 0%, rgba(99,102,241,0.11), transparent 52%), radial-gradient(ellipse 55% 45% at 0% 100%, rgba(34,211,153,0.06), transparent 48%)",
          }}
          aria-hidden
        />

        <div className="relative space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Validation layout</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-white/92 sm:text-[17px]" style={{ letterSpacing: "-0.025em" }}>
                Six scores + headline, tied to evidence
              </h3>
            </div>
            <span className="w-fit rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-200/80">
              Illustrative only
            </span>
          </div>

          <motion.div
            className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 sm:p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={active ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Sample idea</span>
            </div>
            <p className="text-[13px] font-semibold leading-snug text-white/88">{DEMO_IDEA.title}</p>
            <ul className="mt-2 space-y-1 border-t border-white/[0.06] pt-2">
              {DEMO_IDEA.lines.map((line, i) => (
                <li key={i} className="text-[11px] leading-relaxed text-white/42">
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
                Rubric ({SCORE_MAX} pts each)
              </p>
              <p className="text-[10px] text-white/30">Lean + diligence-style dimensions</p>
            </div>
            <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-black/20 p-3 sm:p-4">
              {DEMO_RUBRIC_ROWS.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={active ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.06 * i, duration: 0.35 }}
                  className="flex items-center gap-3 sm:gap-4"
                >
                  <span className="w-[min(7.5rem,32%)] shrink-0 text-[10px] font-medium leading-tight text-white/50 sm:text-[11px]">
                    {row.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500/90 to-violet-500/75"
                        initial={{ width: "0%" }}
                        animate={active ? { width: `${row.score}%` } : { width: "0%" }}
                        transition={{ delay: 0.12 + i * 0.05, duration: 0.55, ease: [0.25, 0.4, 0.25, 1] }}
                      />
                    </div>
                  </div>
                  <span className="w-9 shrink-0 text-right text-[10px] font-bold tabular-nums text-white/45 sm:text-[11px]">
                    {row.score}
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-white/32">
              Numbers above are placeholders. Your report scores each axis from evidence in your pitch; headline viability stays aligned with the category average so the read doesn’t “gaslight” you.
            </p>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/30">Perspectives in one report</p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_PERSONAS.map((p, i) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={active ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.2 + i * 0.04, duration: 0.3 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/55"
                >
                  <span className="flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/35 to-violet-500/25 text-[8px] font-semibold text-white/90">
                    {p.id}
                  </span>
                  {p.label}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 text-[10px] text-white/38">
              <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1">Evidence gates on high scores</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1">Radar + checklist</span>
            </div>
            <Link
              href="/validate"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-center text-[11px] font-semibold text-[#0A0A0B] transition-colors hover:bg-white/90"
            >
              Run your idea
              <ArrowRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function Home() {
  const demoRef = useRef<HTMLDivElement>(null);
  const demoInView = useInView(demoRef, { once: true, margin: "-100px" });

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
          className="absolute top-0 left-1/2 h-[600px] w-[min(1600px,100vw)] -translate-x-1/2"
          style={{ background: "radial-gradient(ellipse at center, rgba(100,110,240,0.06) 0%, transparent 70%)" }}
        />
      </div>

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 w-full z-50" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,11,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex h-14 w-full max-w-[min(1520px,96vw)] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[14px]" style={{ letterSpacing: "-0.02em" }}>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            Priority Debater
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/journey" className="hidden sm:inline-flex px-3.5 py-1.5 text-[13px] transition-colors hover:text-white/80" style={{ color: "rgba(255,255,255,0.45)" }}>
              Guided journey
            </Link>
            <Link href="/validate" className="hidden sm:inline-flex px-3.5 py-1.5 text-[13px] transition-colors hover:text-white/80" style={{ color: "rgba(255,255,255,0.45)" }}>
              Full report
            </Link>
            <Link href="/journey" className="ml-3 px-5 py-2 rounded-lg text-white text-[13px] font-medium hover:bg-white/15 transition-all" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Start guided audit &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Split layout: text left, demo right ═══ */}
      <section className="relative z-10 pt-28 sm:pt-36 pb-20 sm:pb-28" ref={demoRef}>
        <div className="mx-auto w-full max-w-[min(1520px,96vw)] px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-14 xl:gap-16 2xl:gap-20">
            {/* Left — copy */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3.5 py-1 text-[12px] mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
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
                Five AI personas stress-test your startup idea — investor, customer, operator, mentor, adversary. Get a 0–{SCORE_MAX} viability rubric and an action plan in about two minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/journey" className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0A0A0B] font-medium text-[14px] transition-all hover:bg-white/90">
                  Guided validation
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
              <HeroValidationPreview play={demoInView} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR — inline, not a separate section ═══ */}
      <section className="relative z-10 py-12 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="mx-auto w-full max-w-[min(1520px,96vw)] px-4 sm:px-6">
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
        <div className="mx-auto w-full max-w-[min(1520px,96vw)] px-4 sm:px-6">
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
                  <div className="w-14 h-14 rounded-full border border-white/8 bg-white/3 flex items-center justify-center mx-auto mb-4 relative z-10" style={{ color: "rgba(255,255,255,0.5)" }}>
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
        <div className="mx-auto w-full max-w-[min(1520px,96vw)] px-4 sm:px-6">
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
                desc: `A calibrated 0–${SCORE_MAX} Go/No-Go read across 6 diligence dimensions. Market, problem–solution, model, competition, execution, timing — nothing hides.`,
                icons: [<Sparkles key="s" className="w-4 h-4" />, <Target key="t" className="w-4 h-4" />],
              },
              {
                title: "Market Sizing & Competition Map",
                desc: "Real TAM/SAM/SOM estimates with sources. Plus 5+ competitors you forgot about, mapped against your positioning.",
                icons: [<TrendingUp key="t" className="w-4 h-4" />, <Eye key="e" className="w-4 h-4" />],
              },
            ].map((f, i) => (
              <StaggerChild key={i}>
                <div className="p-6 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 hover:border-white/10 transition-all h-full">
                  <div className="flex gap-2 mb-4">
                    {f.icons.map((icon, j) => (
                      <div key={j} className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.45)" }}>{icon}</div>
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
                <div className="p-4 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 hover:border-white/10 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{f.icon}</div>
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
                <div className="p-4 rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 hover:border-white/10 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-white/6 flex items-center justify-center mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{f.icon}</div>
                  <p className="font-medium text-[13px] mb-0.5" style={{ letterSpacing: "-0.01em" }}>{f.title}</p>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="mx-auto w-full max-w-[min(56rem,96vw)] px-4 sm:px-6">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.15em] font-medium mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>Why not just use a generic AI?</p>
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ letterSpacing: "-0.03em", color: "rgba(255,255,255,0.95)" }}>Because yes-men don&apos;t build great companies</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="min-w-0 overflow-x-auto rounded-2xl border border-white/6 backdrop-blur-sm bg-white/2 [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[520px] text-[13px]">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th className="text-left py-3.5 px-5 text-white/40 font-medium">Feature</th>
                    <th className="text-center py-3.5 px-5 text-indigo-400 font-semibold bg-indigo-500/8">Priority Debater</th>
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
                    [`Radar chart (6 × 0–${SCORE_MAX})`, true, false],
                    ["Live debate mode", true, false],
                    ["Actionable validation checklist", true, false],
                    ["PDF & Markdown export", true, "Paid"],
                    ["No signup required", true, false],
                    ["Price", "Free forever", "$20+/mo"],
                  ] as [string, boolean | string, boolean | string][]).map(([feature, us, them], i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-5 text-white/50">{feature}</td>
                      <td className="py-3 px-5 text-center bg-indigo-500/4">
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
                <div className="rounded-xl border border-white/6 bg-white/3 hover:bg-white/5 transition-colors group-data-[state=open]:border-white/10">
                  <div className="overflow-hidden rounded-[0.7rem]">
                    <AccordionTrigger className="gap-3 px-4 py-4 text-left hover:no-underline [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:opacity-40 [&[data-state=open]>svg]:rotate-180">
                      <span className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/6" style={{ color: "rgba(255,255,255,0.4)" }}>
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
          <div className="mx-auto w-full max-w-[min(1520px,96vw)] px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/2 px-4 py-16 text-center sm:px-6 sm:py-20">
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
                  <Link href="/journey"
                    className="group inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#0A0A0B] font-medium text-[14px] transition-all hover:bg-white/90">
                    Start guided journey
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
        <div className="mx-auto flex w-full max-w-[min(1520px,96vw)] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Zap className="w-3.5 h-3.5" />
            <span>Priority Debater</span>
          </div>
          <div className="flex gap-5 text-[12px]" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Link href="/journey" className="hover:text-white/50 transition-colors">Guided journey</Link>
            <Link href="/validate" className="hover:text-white/50 transition-colors">Full report</Link>
          </div>
          <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
