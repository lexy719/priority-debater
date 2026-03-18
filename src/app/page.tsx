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
  BarChart3,
  TrendingUp,
  Users,
  Grid3x3,
  Download,
  Share2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

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

// ── Live demo mockup ────────────────────────────────────────────────────
// ── Mini radar for demo ─────────────────────────────────────────────────
function MiniRadar() {
  const scores = [8, 7, 6, 8, 7, 9];
  const labels = ["Problem", "Market", "Edge", "Model", "Team", "Timing"];
  const n = 6; const cx = 60; const cy = 60; const maxR = 48;
  const pt = (r: number, i: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const dataPath = scores.map((v, i) => pt((v / 10) * maxR, i)).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
  const gridPath = (ring: number) => Array.from({ length: n }, (_, i) => pt((ring / 10) * maxR, i)).map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 120 120" className="w-full h-auto">
      {[4, 7, 10].map((r) => <path key={r} d={gridPath(r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />)}
      {Array.from({ length: n }, (_, i) => { const p = pt(maxR, i); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />; })}
      <motion.path d={dataPath} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth={1.5}
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
        style={{ transformOrigin: "60px 60px" }} />
      {scores.map((v, i) => { const p = pt((v / 10) * maxR, i); return <motion.circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#6366f1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }} />; })}
      {labels.map((l, i) => { const p = pt(maxR + 10, i); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.25)" fontSize={5.5} fontWeight={500}>{l}</text>; })}
    </svg>
  );
}

function DemoPreview() {
  const [step, setStep] = useState(-1);
  const [typedText, setTypedText] = useState("");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const fullText = "AI-powered meeting summarizer for remote teams";

  useEffect(() => {
    if (!inView) return;
    // Typing effect
    let i = 0;
    const typeInterval = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(typeInterval);
    }, 35);
    const t = [
      setTimeout(() => setStep(0), 1800),
      setTimeout(() => setStep(1), 2800),
      setTimeout(() => setStep(2), 3800),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 5800), // radar reveal
    ];
    return () => { clearInterval(typeInterval); t.forEach(clearTimeout); };
  }, [inView]);

  const steps = [
    { label: "Analyzing market...", color: "text-blue-400" },
    { label: "Mapping competitors...", color: "text-violet-400" },
    { label: "Scoring viability...", color: "text-amber-400" },
    { label: "Report ready", color: "text-emerald-400" },
  ];

  return (
    <div ref={ref} className="relative mx-auto max-w-2xl">
      {/* Glow behind the card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-60" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
        {/* Browser dots */}
        <div className="flex items-center gap-1.5 mb-5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          <span className="ml-3 text-[10px] text-white/20 font-mono">prioritydebater.com/results</span>
        </div>

        {/* Idea with typing effect */}
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Validating</p>
        <h3 className="text-white font-semibold text-sm sm:text-base mb-5">
          {typedText}
          {typedText.length < fullText.length && <span className="inline-block w-[2px] h-[14px] bg-indigo-400 ml-0.5 animate-pulse align-middle" />}
        </h3>

        {/* Steps */}
        <div className="space-y-2.5 mb-6">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0.2, x: -12 }}
              animate={{ opacity: i <= step ? 1 : 0.2, x: i <= step ? 0 : -12 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2.5"
            >
              {i < step ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </div>
              ) : i === step ? (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400/60 border-t-indigo-400 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-white/10" />
              )}
              <span className={`text-xs ${i <= step ? s.color : "text-white/20"}`}>{s.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Score + Radar */}
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.35, duration: 0.6 }}
            className="pt-5 border-t border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  7
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    <Check className="w-2.5 h-2.5" /> GO
                  </span>
                  <p className="text-[10px] text-white/30 mt-0.5">Viability score</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { n: "4", label: "Strengths", color: "text-emerald-400" },
                  { n: "3", label: "Risks", color: "text-amber-400" },
                  { n: "5", label: "Actions", color: "text-blue-400" },
                ].map((m) => (
                  <div key={m.label} className="bg-white/[0.04] rounded-lg px-3 py-2 text-center border border-white/[0.06]">
                    <p className={`font-bold text-sm ${m.color}`}>{m.n}</p>
                    <p className="text-[9px] text-white/30">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini radar chart reveal */}
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-4 pt-4 border-t border-white/[0.04]"
              >
                <div className="w-28 shrink-0">
                  <MiniRadar />
                </div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { label: "Problem-Solution Fit", v: 8, color: "bg-indigo-500" },
                    { label: "Market Opportunity", v: 7, color: "bg-violet-500" },
                    { label: "Business Model", v: 8, color: "bg-emerald-500" },
                    { label: "Timing & Trends", v: 9, color: "bg-amber-500" },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[8px] text-white/25">{b.label}</span>
                        <span className="text-[8px] text-white/40 font-bold">{b.v}/10</span>
                      </div>
                      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${b.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${b.v * 10}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
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
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#08080e] text-white overflow-hidden">

      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/[0.06] bg-[#08080e]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            Priority Debater
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/validate" className="hidden sm:inline-flex px-3.5 py-1.5 text-xs text-white/50 hover:text-white transition-colors">
              Validate
            </Link>
            <Link href="/debate" className="hidden sm:inline-flex px-3.5 py-1.5 text-xs text-white/50 hover:text-white transition-colors">
              Debate
            </Link>
            <Link href="/validate"
              className="ml-2 px-4 py-1.5 rounded-lg bg-white text-[#08080e] text-xs font-semibold hover:bg-white/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative pt-32 sm:pt-40 pb-20 sm:pb-28">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/15 rounded-full blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-5 text-center">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.04] text-[11px] text-white/50 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Free &middot; No signup &middot; Private
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] mb-5">
            Validate your startup idea{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">
              before you waste 6 months
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="text-white/40 text-base sm:text-lg max-w-2xl mx-auto mb-9 leading-relaxed">
            Viability score, market analysis, competitive landscape, risk flags, lean canvas — then{" "}
            <span className="text-white/70 font-medium">debate an AI adversary</span> to stress-test every assumption. All in 2 minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
            <Link href="/validate"
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#08080e] font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/5 hover:shadow-xl hover:shadow-white/10">
              Validate My Idea
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/validate?mode=generate"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] text-white/70 font-medium text-sm hover:bg-white/[0.1] transition-all border border-white/[0.08]">
              <Wand2 className="w-4 h-4" />
              Generate an Idea
            </Link>
          </motion.div>

          {/* Trust */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-5 text-[11px] text-white/25">
            {["Powered by GPT-5", "100% private", "No credit card", "Results in 2 min"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-emerald-500/60" />{t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ DEMO ═══ */}
      <section className="relative pb-24 sm:pb-32">
        <Reveal>
          <DemoPreview />
        </Reveal>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="border-y border-white/[0.06] py-14">
        <Stagger className="max-w-5xl mx-auto px-5 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { v: 15, s: "+", label: "Analysis criteria", icon: <BarChart3 className="w-4 h-4" /> },
            { v: 6, s: "", label: "Score categories", icon: <Target className="w-4 h-4" /> },
            { v: 2, s: " min", label: "Full report", icon: <Clock className="w-4 h-4" /> },
            { v: 100, s: "%", label: "Private & secure", icon: <Shield className="w-4 h-4" /> },
          ].map((s, i) => (
            <StaggerChild key={i}>
              <div className="text-white/20 mb-2 flex justify-center">{s.icon}</div>
              <p className="text-2xl font-bold text-white"><Counter value={s.v} suffix={s.s} /></p>
              <p className="text-[11px] text-white/30 mt-0.5">{s.label}</p>
            </StaggerChild>
          ))}
        </Stagger>
      </section>

      {/* ═══ HOW IT WORKS — Zigzag Timeline ═══ */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-5">
          <Reveal className="text-center mb-16">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-3">Our approach</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">From Idea to Clarity in 4 Steps</h2>
          </Reveal>

          {/* Zigzag timeline */}
          <div className="relative">
            {/* Vertical center line — hidden on mobile */}
            <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/30 via-violet-500/20 to-purple-500/30" style={{ backgroundImage: "repeating-linear-gradient(to bottom, rgba(99,102,241,0.3) 0px, rgba(99,102,241,0.3) 6px, transparent 6px, transparent 12px)" }} />

            {[
              { n: "01", title: "Describe", desc: "Tell us your idea, why you think it works, and your situation. Takes 30 seconds.", badge: "30 SECONDS • FREE", icon: <FileText className="w-5 h-5" />, accent: "border-blue-500/30 bg-blue-500/[0.06]", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20", dotColor: "bg-blue-500" },
              { n: "02", title: "Analyze", desc: "GPT-5 evaluates viability, market size, competitors, risks, and generates a full dashboard with radar chart and lean canvas.", badge: "15+ CRITERIA • RADAR CHART", icon: <BarChart3 className="w-5 h-5" />, accent: "border-violet-500/30 bg-violet-500/[0.06]", badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20", dotColor: "bg-violet-500" },
              { n: "03", title: "Debate", desc: "Defend your position against an AI adversary that uses inversion, base rate analysis, and pre-mortem thinking to find every flaw.", badge: "AI ADVERSARY • 6 QUICK ACTIONS", icon: <Swords className="w-5 h-5" />, accent: "border-emerald-500/30 bg-emerald-500/[0.06]", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dotColor: "bg-emerald-500" },
              { n: "04", title: "Launch", desc: "Export your report as PDF, generate a business plan, share with co-founders, and start building with confidence.", badge: "PDF EXPORT • SHARE LINK", icon: <Zap className="w-5 h-5" />, accent: "border-amber-500/30 bg-amber-500/[0.06]", badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20", dotColor: "bg-amber-500" },
            ].map((item, i) => {
              const isRight = i % 2 === 1;
              return (
                <Reveal key={item.n} delay={i * 0.1}>
                  <div className={`relative flex flex-col sm:flex-row ${isRight ? "sm:flex-row-reverse" : ""} items-center gap-6 mb-12 last:mb-0`}>
                    {/* Card */}
                    <div className={`w-full sm:w-[calc(50%-32px)] rounded-2xl border p-6 ${item.accent} transition-all hover:scale-[1.02] duration-300`}>
                      <p className="text-[10px] font-semibold text-indigo-400/60 uppercase tracking-widest mb-1">{item.n}</p>
                      <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed mb-3">{item.desc}</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-wider border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    {/* Center dot — hidden on mobile */}
                    <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-[#08080e] z-10 items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${item.dotColor} shadow-lg`} style={{ boxShadow: `0 0 10px 2px ${item.dotColor === "bg-blue-500" ? "rgba(59,130,246,0.4)" : item.dotColor === "bg-violet-500" ? "rgba(139,92,246,0.4)" : item.dotColor === "bg-emerald-500" ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}` }} />
                    </div>

                    {/* Spacer for the other side */}
                    <div className="hidden sm:block w-[calc(50%-32px)]" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ WHAT YOU GET — on dark bg with accent borders ═══ */}
      <section className="py-20 sm:py-28 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-5">
          <Reveal className="text-center mb-14">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-3">What you get</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">Everything investors will ask about</h2>
            <p className="text-white/30 text-sm max-w-lg mx-auto">A complete analysis covering every angle — market sizing to unit economics.</p>
          </Reveal>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { icon: <Sparkles className="w-4 h-4" />, title: "Viability Score", desc: "0-10 with Go/No-Go", c: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
              { icon: <Target className="w-4 h-4" />, title: "Radar Chart", desc: "6 category breakdown", c: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
              { icon: <TrendingUp className="w-4 h-4" />, title: "Market Sizing", desc: "TAM / SAM / SOM", c: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { icon: <Eye className="w-4 h-4" />, title: "Competition Map", desc: "5+ competitors analyzed", c: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { icon: <AlertTriangle className="w-4 h-4" />, title: "Risk Flags", desc: "Blind spots & pitfalls", c: "text-red-400 bg-red-500/10 border-red-500/20" },
              { icon: <Grid3x3 className="w-4 h-4" />, title: "Lean Canvas", desc: "Full 9-cell canvas", c: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
              { icon: <Briefcase className="w-4 h-4" />, title: "Business Plan", desc: "Investor-ready", c: "text-slate-300 bg-white/[0.06] border-white/[0.08]" },
              { icon: <Users className="w-4 h-4" />, title: "ICP & Positioning", desc: "Target customer profile", c: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
              { icon: <MessageSquare className="w-4 h-4" />, title: "Value Proposition", desc: "Clear messaging", c: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
              { icon: <Download className="w-4 h-4" />, title: "PDF & MD Export", desc: "Download your report", c: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
              { icon: <Share2 className="w-4 h-4" />, title: "Share Link", desc: "Share with co-founders", c: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
              { icon: <Swords className="w-4 h-4" />, title: "AI Debate Mode", desc: "Stress-test your logic", c: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
            ].map((f, i) => (
              <StaggerChild key={i}>
                <div className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all h-full">
                  <div className={`w-8 h-8 rounded-lg ${f.c} border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {f.icon}
                  </div>
                  <p className="font-medium text-white text-[13px]">{f.title}</p>
                  <p className="text-[11px] text-white/30 mt-0.5">{f.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ DEBATE MODE ═══ */}
      <section className="py-20 sm:py-28">
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
                  <h3 className="text-xl sm:text-2xl font-bold mb-3">The feature nobody else has</h3>
                  <p className="text-white/40 text-sm mb-6 leading-relaxed max-w-md">
                    After validation, debate an AI adversary inspired by Munger, Graham, and Kahneman. It finds the flaws before reality does.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      "Steelman & Devil's Advocate",
                      "Blind spot analysis",
                      "First Principles reasoning",
                      "Argument scoring",
                      "Quick action buttons",
                      "Framework-based critique",
                    ].map((f) => (
                      <div key={f} className="flex items-center gap-2 text-[12px] text-white/50">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-indigo-400" />
                        </div>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mock debate */}
                <div className="w-full lg:w-72 shrink-0">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-3">
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-[10px]">🗡️</div>
                      <div className="bg-white/[0.06] rounded-xl rounded-tl-none px-3 py-2 text-[11px] text-white/60 leading-relaxed">
                        Your TAM assumes every business needs this. What&apos;s your actual serviceable market?
                      </div>
                    </div>
                    <div className="flex gap-2 items-start flex-row-reverse">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 text-[10px]">👤</div>
                      <div className="bg-indigo-500/10 rounded-xl rounded-tr-none px-3 py-2 text-[11px] text-white/60 leading-relaxed">
                        SAM is $3.2B — remote-first companies with 50+ employees...
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-[10px]">🗡️</div>
                      <div className="bg-white/[0.06] rounded-xl rounded-tl-none px-3 py-2">
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-white/20 border-t-indigo-400 animate-spin" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="py-20 sm:py-28 border-y border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-5">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-3">Why us</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">More depth. Free.</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-white/30 font-medium">Feature</th>
                    <th className="text-center py-3 px-4 text-indigo-400 font-semibold bg-indigo-500/[0.06]">Priority Debater</th>
                    <th className="text-center py-3 px-4 text-white/30 font-medium">Others</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ["Viability score", true, true],
                    ["Market analysis (TAM/SAM/SOM)", true, "Partial"],
                    ["Competitive landscape", true, "Basic"],
                    ["Lean Canvas", true, false],
                    ["Radar chart (6 categories)", true, false],
                    ["AI Debate Mode", true, false],
                    ["Interactive checklist", true, false],
                    ["PDF & Markdown export", true, "Paid"],
                    ["Business plan generator", true, "Paid"],
                    ["No signup required", true, false],
                    ["Free tier", "Unlimited", "3-5 uses"],
                  ] as [string, boolean | string, boolean | string][]).map(([feature, us, them], i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="py-2.5 px-4 text-white/50">{feature}</td>
                      <td className="py-2.5 px-4 text-center bg-indigo-500/[0.03]">
                        {us === true ? <Check className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> :
                         typeof us === "string" ? <span className="text-emerald-400 font-medium">{us}</span> : null}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {them === true ? <Check className="w-3.5 h-3.5 text-white/20 mx-auto" /> :
                         them === false ? <span className="text-white/15">✕</span> :
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
      <section className="py-20 sm:py-28">
        <div className="max-w-2xl mx-auto px-5">
          <Reveal className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-400/70 font-medium mb-3">FAQ</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Common questions</h2>
          </Reveal>
          <Stagger className="space-y-2">
            {[
              { q: "How long does validation take?", a: "About 2 minutes. You get a complete viability report with score, market analysis, risk assessment, competitive landscape, and actionable steps." },
              { q: "Is my idea kept private?", a: "Yes. No database, no logs. Everything is processed in real-time and kept in your browser session only." },
              { q: "What makes this different?", a: "Depth and debate. The validation covers TAM/SAM/SOM to unit economics with a radar chart. Then debate an AI adversary that uses inversion, base rate analysis, and pre-mortem thinking." },
              { q: "How accurate is the analysis?", a: "GPT-4o analyzes across 15+ criteria. It's a structured thinking partner — the real value is the questions it forces you to answer." },
              { q: "Can I export my report?", a: "Yes. Download as PDF (print-friendly) or Markdown. You can also share a link with co-founders." },
              { q: "What if I don't have an idea?", a: "Use the Idea Generator. Tell us your interests and constraints, and AI will generate tailored startup ideas." },
            ].map((item, i) => (
              <StaggerChild key={i}>
                <details className="group p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <summary className="font-medium text-white/80 text-[13px] cursor-pointer list-none flex items-center justify-between">
                    {item.q}
                    <ChevronDown className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform duration-300 shrink-0 ml-3" />
                  </summary>
                  <p className="mt-3 text-[12px] text-white/35 leading-relaxed">{item.a}</p>
                </details>
              </StaggerChild>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="pb-20 sm:pb-28">
        <Reveal>
          <div className="max-w-4xl mx-auto px-5">
            <div className="relative text-center py-16 px-6 rounded-3xl overflow-hidden">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-violet-600/10" />
              <div className="absolute inset-0 border border-white/[0.06] rounded-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-indigo-500/15 rounded-full blur-[100px]" />

              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
                  Ready to find out if your idea has legs?
                </h2>
                <p className="text-white/30 text-sm mb-8 max-w-md mx-auto">
                  Free, private, and takes 2 minutes.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/validate"
                    className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#08080e] font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/5">
                    Validate My Idea
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link href="/validate?mode=generate"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] text-white/70 text-sm font-medium hover:bg-white/[0.1] transition-all border border-white/[0.08]">
                    <Wand2 className="w-4 h-4" /> Generate an Idea
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Priority Debater</span>
          </div>
          <div className="flex gap-5 text-[11px] text-white/20">
            <Link href="/validate" className="hover:text-white/50 transition-colors">Validate</Link>
            <Link href="/debate" className="hover:text-white/50 transition-colors">Debate</Link>
          </div>
          <p className="text-[11px] text-white/15">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
