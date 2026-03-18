"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Sparkles,
  FileText,
  Swords,
  Eye,
  Clipboard,
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
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// ── Animated counter ────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest) + suffix;
      }
    });
    return unsubscribe;
  }, [spring, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

// ── Section wrapper with scroll animation ───────────────────────────────
function FadeInSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger children ────────────────────────────────────────────────────
function StaggerContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Typing animation ────────────────────────────────────────────────────
function TypingText({ texts, className = "" }: { texts: string[]; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [displayText, setDisplayText] = useState(texts[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const current = texts[idx];
    const speed = isDeleting ? 30 : 60;

    if (!isDeleting && displayText === current) {
      const pause = setTimeout(() => setIsDeleting(true), 2000);
      return () => clearTimeout(pause);
    }
    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      setIdx((i) => (i + 1) % texts.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayText(
        isDeleting ? current.slice(0, displayText.length - 1) : current.slice(0, displayText.length + 1)
      );
    }, speed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, idx, texts, mounted]);

  // Server and initial render: show first text statically to avoid hydration mismatch
  return (
    <span className={className} suppressHydrationWarning>
      {displayText}
      {mounted && <span className="animate-pulse">|</span>}
    </span>
  );
}

// ── Floating dot grid background ────────────────────────────────────────
function DotGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Gradient overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-l from-emerald-500/8 to-transparent blur-3xl" />
    </div>
  );
}

// ── Live demo mockup ────────────────────────────────────────────────────
function LiveDemoPreview() {
  const [activeStep, setActiveStep] = useState(-1);
  const [showScore, setShowScore] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setActiveStep(0), 300),
      setTimeout(() => setActiveStep(1), 1100),
      setTimeout(() => setActiveStep(2), 2300),
      setTimeout(() => { setActiveStep(3); setShowScore(true); }, 3500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  const steps = [
    { label: "Analyzing market...", color: "text-blue-400" },
    { label: "Mapping competitors...", color: "text-violet-400" },
    { label: "Scoring viability...", color: "text-amber-400" },
    { label: "Report ready", color: "text-emerald-400" },
  ];

  return (
    <div ref={ref} className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 sm:p-7 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.12)_0%,_transparent_50%)]" />
      <div className="relative">
        {/* Mock header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-amber-500/60" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          <span className="ml-2 text-[10px] text-slate-500 font-mono">prioritydebater.com/results</span>
        </div>

        {/* Idea title */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Validating</p>
          <h3 className="text-white font-bold text-sm sm:text-base">AI-powered meeting summarizer for remote teams</h3>
        </div>

        {/* Progress steps */}
        <div className="space-y-2 mb-5">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: i <= activeStep ? 1 : 0.3,
                x: i <= activeStep ? 0 : -20,
              }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center gap-2"
            >
              {i < activeStep ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </motion.div>
              ) : i === activeStep ? (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-600" />
              )}
              <span className={`text-xs ${i <= activeStep ? step.color : "text-slate-600"}`}>{step.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Score reveal */}
        <AnimatePresence>
          {showScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-emerald-400 bg-emerald-500/10 border-2 border-emerald-400/40">
                  7
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Check className="w-2.5 h-2.5" /> GO
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">with conditions</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 text-center">
                  <p className="text-emerald-400 font-bold text-sm">4</p>
                  <p className="text-[9px] text-slate-500">Strengths</p>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 text-center">
                  <p className="text-amber-400 font-bold text-sm">3</p>
                  <p className="text-[9px] text-slate-500">Risks</p>
                </div>
                <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/10 text-center">
                  <p className="text-blue-400 font-bold text-sm">5</p>
                  <p className="text-[9px] text-slate-500">Actions</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col relative overflow-hidden">
      <DotGrid />
      <Header />

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Free AI startup validator — no signup required
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-5 leading-[1.1] tracking-tight"
          >
            Validate your startup idea
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 animate-gradient-x">
              <TypingText
                texts={[
                  "before you waste 6 months.",
                  "before you burn your savings.",
                  "before reality hits you.",
                  "in under 2 minutes.",
                ]}
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Get a viability score, market analysis, competitive landscape, risk flags, lean canvas, and a business plan — then{" "}
            <span className="text-slate-900 font-semibold">debate an AI adversary</span> to stress-test every assumption.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/validate"
              className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all text-base shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-slate-900/30 hover:-translate-y-0.5"
            >
              Validate My Idea
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/validate?mode=generate"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white text-slate-700 font-medium hover:bg-slate-50 transition-all text-base border border-slate-200 hover:border-slate-300 hover:shadow-sm"
            >
              <Wand2 className="w-5 h-5" />
              Generate an Idea
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-5 mt-7 text-xs text-slate-400"
          >
            {["Free to use", "No signup required", "Ideas stay private", "Powered by GPT-4o"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Live demo preview */}
        <FadeInSection>
          <LiveDemoPreview />
        </FadeInSection>
      </section>

      {/* ═══ SOCIAL PROOF / STATS ═══ */}
      <section className="relative w-full border-y border-slate-100 bg-slate-50/50 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: 15, suffix: "+", label: "Analysis criteria", icon: <BarChart3 className="w-5 h-5" /> },
              { value: 2, suffix: " min", label: "Full report", icon: <Clock className="w-5 h-5" /> },
              { value: 6, suffix: "", label: "Score categories", icon: <Target className="w-5 h-5" /> },
              { value: 100, suffix: "%", label: "Private & secure", icon: <Shield className="w-5 h-5" /> },
            ].map((stat, i) => (
              <StaggerItem key={i}>
                <div className="flex flex-col items-center">
                  <div className="text-slate-400 mb-2">{stat.icon}</div>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <FadeInSection className="text-center mb-12">
          <span className="inline-block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">How it works</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Three steps to clarity</h2>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Describe your idea",
              desc: "Tell us what you want to build, why it will work, and your situation. Takes 30 seconds.",
              icon: <FileText className="w-6 h-6" />,
              gradient: "from-blue-500 to-indigo-600",
            },
            {
              step: "02",
              title: "Get your report",
              desc: "AI analyzes viability, market, competition, risks, and generates a comprehensive dashboard with scores.",
              icon: <BarChart3 className="w-6 h-6" />,
              gradient: "from-violet-500 to-purple-600",
            },
            {
              step: "03",
              title: "Debate & refine",
              desc: "Challenge your assumptions against an AI adversary. Find blind spots. Sharpen your pitch.",
              icon: <Swords className="w-6 h-6" />,
              gradient: "from-emerald-500 to-teal-600",
            },
          ].map((item) => (
            <StaggerItem key={item.step}>
              <div className="group relative p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.step}</span>
                <h3 className="font-bold text-slate-900 text-base mt-1 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ═══ WHAT YOU GET ═══ */}
      <section className="relative w-full bg-slate-50/50 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeInSection className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">What you get</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Everything investors will ask about</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">A complete analysis covering every angle — from market sizing to unit economics.</p>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: <Sparkles className="w-5 h-5" />, title: "Viability Score", desc: "0-10 with Go/No-Go verdict", color: "text-emerald-600", bg: "bg-emerald-50" },
              { icon: <Target className="w-5 h-5" />, title: "Radar Chart", desc: "6 category score breakdown", color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: <TrendingUp className="w-5 h-5" />, title: "Market Sizing", desc: "TAM / SAM / SOM visual", color: "text-blue-600", bg: "bg-blue-50" },
              { icon: <Eye className="w-5 h-5" />, title: "Competition Map", desc: "5+ competitors analyzed", color: "text-amber-600", bg: "bg-amber-50" },
              { icon: <Clipboard className="w-5 h-5" />, title: "Risk Flags", desc: "Blind spots & pitfalls", color: "text-red-600", bg: "bg-red-50" },
              { icon: <Grid3x3 className="w-5 h-5" />, title: "Lean Canvas", desc: "Full 9-cell canvas", color: "text-violet-600", bg: "bg-violet-50" },
              { icon: <Briefcase className="w-5 h-5" />, title: "Business Plan", desc: "Investor-ready document", color: "text-slate-600", bg: "bg-slate-100" },
              { icon: <Users className="w-5 h-5" />, title: "ICP & Positioning", desc: "Target customer profile", color: "text-sky-600", bg: "bg-sky-50" },
              { icon: <MessageSquare className="w-5 h-5" />, title: "Value Proposition", desc: "Clear messaging", color: "text-pink-600", bg: "bg-pink-50" },
              { icon: <Download className="w-5 h-5" />, title: "PDF & MD Export", desc: "Download your report", color: "text-teal-600", bg: "bg-teal-50" },
              { icon: <Share2 className="w-5 h-5" />, title: "Share Link", desc: "Share with co-founders", color: "text-orange-600", bg: "bg-orange-50" },
              { icon: <Swords className="w-5 h-5" />, title: "AI Debate", desc: "Stress-test your logic", color: "text-purple-700", bg: "bg-purple-50" },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 h-full">
                  <div className={`w-9 h-9 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    {item.icon}
                  </div>
                  <span className="font-semibold text-slate-900 text-sm block">{item.title}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ═══ DEBATE MODE HIGHLIGHT ═══ */}
      <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <FadeInSection>
          <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

            <div className="relative flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1">
                <motion.div
                  initial={{ rotate: 0 }}
                  whileInView={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 1, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="inline-flex p-4 rounded-2xl bg-white/15 backdrop-blur-sm mb-5"
                >
                  <Swords className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  The feature nobody else has
                </h3>
                <p className="text-violet-100 text-base mb-6 leading-relaxed max-w-lg">
                  After validation, debate an AI adversary inspired by Charlie Munger, Paul Graham, and Daniel Kahneman. It finds the flaws before reality does.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Steelman & Devil's Advocate",
                    "Blind spot analysis",
                    "First Principles reasoning",
                    "Argument strength scoring",
                    "Quick action buttons",
                    "Framework-based critique",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-violet-100">
                      <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock debate UI */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <div className="space-y-3">
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-xs">🗡️</div>
                      <div className="bg-white/10 rounded-xl rounded-tl-none px-3 py-2 text-xs text-white/90">
                        Your TAM of $25B assumes every business needs this. What&apos;s your actual serviceable market?
                      </div>
                    </div>
                    <div className="flex gap-2 items-start flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0 text-xs">👤</div>
                      <div className="bg-white/20 rounded-xl rounded-tr-none px-3 py-2 text-xs text-white/90">
                        Fair point. SAM is $3.2B — remote-first companies with 50+ employees...
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-xs">🗡️</div>
                      <div className="bg-white/10 rounded-xl rounded-tl-none px-3 py-2 text-xs text-white/80">
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white/80 animate-spin mr-1 align-middle" />
                        Thinking...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="relative w-full bg-slate-50/50 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeInSection className="text-center mb-12">
            <span className="inline-block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Why us</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">More depth. More insight. Free.</h2>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-500 text-xs">Feature</th>
                    <th className="text-center py-3 px-4 font-bold text-slate-900 text-xs bg-indigo-50 border-x border-indigo-100">Priority Debater</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500 text-xs">Others</th>
                  </tr>
                </thead>
                <tbody>
                  {[
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
                  ].map(([feature, us, them], i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-2.5 px-4 text-slate-700 text-xs">{feature as string}</td>
                      <td className="py-2.5 px-4 text-center bg-indigo-50/50 border-x border-indigo-100/50">
                        {us === true ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> :
                         typeof us === "string" ? <span className="text-xs font-medium text-emerald-600">{us}</span> :
                         <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {them === true ? <Check className="w-4 h-4 text-slate-400 mx-auto" /> :
                         them === false ? <span className="text-xs text-slate-300">✕</span> :
                         <span className="text-xs text-slate-400">{them as string}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <FadeInSection className="text-center mb-10">
          <span className="inline-block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">FAQ</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Common questions</h2>
        </FadeInSection>

        <StaggerContainer className="space-y-3">
          {[
            {
              q: "How long does validation take?",
              a: "About 2 minutes. You get a complete viability report with score, market analysis, risk assessment, competitive landscape, and actionable validation steps.",
            },
            {
              q: "Is my idea kept private?",
              a: "Yes. We don't store or share your ideas. Everything is processed in real-time and kept in your browser session only. No database, no logs.",
            },
            {
              q: "What makes this different from other validators?",
              a: "Depth and debate. The validation covers TAM/SAM/SOM to unit economics with a radar chart. Then you can debate your idea against an AI adversary using frameworks like inversion, base rate analysis, and pre-mortem thinking.",
            },
            {
              q: "How accurate is the AI analysis?",
              a: "GPT-4o analyzes across 15+ criteria. It's a structured thinking partner — the real value is the questions it forces you to answer before you build.",
            },
            {
              q: "Can I generate a business plan?",
              a: "Yes. After validation, generate an investor-ready business plan with executive summary, financials, go-to-market strategy, and projections.",
            },
            {
              q: "What if I don't have an idea yet?",
              a: "Use the Idea Generator. Tell us your interests, skills, and constraints and the AI will generate tailored startup ideas for you to explore.",
            },
          ].map((item, i) => (
            <StaggerItem key={i}>
              <details className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                <summary className="font-medium text-slate-900 cursor-pointer list-none flex items-center justify-between text-sm">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-300 shrink-0 ml-2" />
                </summary>
                <p className="mt-3 text-slate-500 leading-relaxed text-sm">
                  {item.a}
                </p>
              </details>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <FadeInSection>
          <div className="relative text-center py-14 px-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)]" />
            <div className="relative">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl font-bold text-white mb-3"
              >
                Ready to find out if your idea has legs?
              </motion.h2>
              <p className="text-slate-400 text-sm mb-8 max-w-md mx-auto">
                Join founders who validate before they build. Free, private, and takes 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/validate"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all text-base shadow-xl hover:-translate-y-0.5"
                >
                  Validate My Idea
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/validate?mode=generate"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-all text-base border border-white/10"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate an Idea
                </Link>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <Footer />
      </div>
    </div>
  );
}
