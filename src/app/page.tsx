"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  Gavel,
  Gauge,
  LockKeyhole,
  MessageSquareText,
  Mic2,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  UsersRound,
  Zap,
  TrendingUp,
  Brain,
  Shield,
  Rocket,
  LineChart,
  Heart,
  Bot,
} from "lucide-react";

import { Button } from "@/components/v2/button";
import { LandingIdeaValidation } from "@/components/landing/LandingIdeaValidation";
import { cn } from "@/lib/utils";

const verdictTape = [
  ["AI tutor for nurses", "GO", "84"],
  ["Notion for chefs", "NO-GO", "31"],
  ["Senior rideshare", "CAUTION", "62"],
  ["Payments for clubs", "GO", "78"],
  ["Carbon credits for SMBs", "NO-GO", "24"],
  ["Voice notes for clinics", "CAUTION", "59"],
];

const debateMessages = [
  {
    persona: "Adversary",
    side: "against",
    text: "Your wedge is not defensible yet. Uber Health, local transport companies, and care networks can all copy the visible product.",
  },
  {
    persona: "Customer",
    side: "for",
    text: "The buyer pain is strong. Adult children already coordinate rides manually every week. Trust and continuity are worth paying for.",
  },
  {
    persona: "Operator",
    side: "against",
    text: "The hard part is not the app. It is driver training, insurance, no-show handling, and quality control in the first city.",
  },
  {
    persona: "Mentor",
    side: "for",
    text: "Do not build the marketplace yet. Run 30 recurring rides by hand, measure rebooking, then decide what software matters.",
  },
];

const debateRounds = [
  ["Round 01", "Opening arguments", "5 voices establish the strongest case for and against."],
  ["Round 02", "Cross-examination", "Personas challenge each other instead of politely agreeing."],
  ["Round 03", "Founder follow-up", "Ask the panel where the argument is weak, biased, or missing evidence."],
  ["Round 04", "Verdict synthesis", "The debate collapses into a decision, objections, and proof plan."],
];

const story = [
  {
    eyebrow: "01 / Intake",
    title: "A founder brief that forces the right detail.",
    body: "One dense hero pitch: what you are building, who pays, the pain, why now, and what is hard. The panel expands it into the same structured stress-test the API expects.",
    icon: FileText,
  },
  {
    eyebrow: "02 / Debate",
    title: "Five expert voices attack the same idea.",
    body: "Investor, customer, operator, adversary, and mentor each score the idea from their own angle. Agreement is earned, not assumed.",
    icon: UsersRound,
  },
  {
    eyebrow: "03 / Decision",
    title: "A verdict you can act on before Monday.",
    body: "You leave with a score, risk map, objection bank, evidence gaps, and a short next-step plan. The answer is not vague.",
    icon: Gauge,
  },
];

const deliverables = [
  {
    icon: ShieldCheck,
    title: "Verdict",
    text: "Go, caution, or no-go with a visible score model.",
  },
  {
    icon: Radar,
    title: "Risk radar",
    text: "Assumptions ranked by likelihood and damage.",
  },
  {
    icon: MessageSquareText,
    title: "Objection bank",
    text: "The pushback investors, buyers, and operators will raise.",
  },
  {
    icon: Target,
    title: "Proof sprint",
    text: "The smallest test that can change the decision.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "19",
    credits: "150",
    line: "Validate before you build.",
    features: [
      "3 AI startup validations",
      "Full TAM / SAM / SOM",
      "Competitor map",
      "Viability + risk flags",
      "PDF export",
    ],
  },
  {
    name: "Builder",
    price: "49",
    credits: "700",
    line: "Most flexible plan.",
    features: [
      "10 validations",
      "GO / NO-GO decision report",
      "ICP + positioning strategy",
      "Brand strategy preview",
      "Unlimited persona debates",
      "Pricing strategy preview",
    ],
    featured: true,
  },
  {
    name: "Founder",
    price: "99",
    credits: "1500",
    line: "Best value.",
    features: [
      "25 validations + 2 market deep-dives",
      "2 full investor business plans",
      "Brand strategy + visual identity",
      "GTM strategy + landing copy",
      "Marketing concept suite",
      "MVP roadmap",
    ],
  },
];

const capabilityCards = [
  {
    label: "AI Idea Validation",
    tag: "CORE",
    icon: Brain,
    description: "50+ criteria scored. Viability index 0-100 with confidence interval.",
    color: "#f5e85e",
    colorSoft: "#fef9c3",
  },
  {
    label: "TAM / SAM / SOM",
    tag: "MARKET",
    icon: LineChart,
    description: "Real-time market sizing grounded in 2026 data with reasoning.",
    color: "#22d3ee",
    colorSoft: "#cffafe",
  },
  {
    label: "Competitor Map",
    tag: "INTEL",
    icon: Radar,
    description: "3-5 named competitors with their angle and exploitable gaps.",
    color: "#e879f9",
    colorSoft: "#fae8ff",
  },
  {
    label: "Investor-Ready Plan",
    tag: "PLAN",
    icon: FileText,
    description: "SWOT, revenue models, GTM tactics, risks — exportable.",
    color: "#fb923c",
    colorSoft: "#ffedd5",
  },
  {
    label: "5-Persona Debate",
    tag: "DIFFERENTIATOR",
    icon: UsersRound,
    description: "Argue your idea against VC, founder, CTO, CMO & customer voice.",
    featured: true,
  },
  {
    label: "GTM Tactics",
    tag: "GROWTH",
    icon: Rocket,
    description: "Channel-fit recommendations + positioning angles to ship now.",
    color: "#a3e635",
    colorSoft: "#ecfccb",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });

  return (
    <main className="app-page-shell min-h-screen overflow-hidden text-[--ink-0]">
      <motion.div
        className="fixed left-0 top-0 z-[60] h-[3px] origin-left bg-[--accent]"
        style={{ scaleX: progress, width: "100%" }}
      />
      <Nav />
      <Hero />
      <CapabilitiesGrid />
      <VerdictTape />
      <WhereItBreaks />
      <KineticStory />
      <DecisionCockpit />
      <Deliverables />
      <PremiumFeatures />
      <LaunchComparison />
      <Pricing />
      <FinalCta />
    </main>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b-2 border-[--line] bg-[--bg]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-3" data-cursor="snap">
          <span className="grid h-8 w-8 place-items-center bg-[--ink-0] font-mono text-[12px] font-bold text-[--bg]">
            ID
          </span>
          <div className="flex flex-col">
            <span className="font-sans text-[14px] font-bold uppercase tracking-tight">Idea Debater</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[--ink-2]">v.1.0 / 2026</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["Features", "#features"],
            ["Personas", "#personas"],
            ["Pricing", "#pricing"],
            ["FAQ", "#faq"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[11px] uppercase tracking-widest text-[--ink-1] transition-colors hover:text-[--ink-0]"
            >
              {label}
            </a>
          ))}
        </nav>

        <Link href="/#idea-validation">
          <Button size="sm" variant="primary">
            <Zap className="h-3.5 w-3.5" />
            Validate Idea
          </Button>
        </Link>
      </div>
    </header>
  );
}

const personas = [
  { name: "Vera Kith", role: "Skeptical VC Partner", color: "#ef4444" },
  { name: "Marcus Reed", role: "Stressed Founder", color: "#f97316" },
  { name: "Anjali Rao", role: "Tech Architect / CTO", color: "#3b82f6" },
  { name: "Leo Costa", role: "Ex-CDO Now CMO / CRO", color: "#eab308" },
  { name: "Sam Okafor", role: "Voice of the Customer", color: "#a855f7" },
];

function Hero() {
  return (
    <section className="relative min-h-screen px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32">
      <div className="relative mx-auto grid min-h-[calc(100vh-8rem)] max-w-[1400px] grid-cols-1 gap-12 items-center">
        <motion.div className="space-y-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.5 }}
            className="inline-flex items-center gap-2 border-2 border-[--ink-0] bg-[--accent] px-3 py-1.5 mx-auto"
          >
            <Zap className="h-3.5 w-3.5 text-[--ink-0]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[--ink-0]">
              Stress-Test Mode / Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            className="font-sans text-[clamp(48px,8vw,90px)] font-black uppercase leading-[0.9] tracking-tight"
          >
            Debate Your
            <br />
            Startup Idea
            <br />
            <span className="inline-block bg-[--ink-0] px-3 py-1 text-[--bg]">Until It Breaks.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="text-[16px] leading-[1.6] text-[--ink-1] mx-auto"
          >
            Five ruthless AI advisors. One investor-grade report. Zero sugar-coating.
            Find out if your idea survives the panel — in <span className="font-bold text-[--ink-0]">120 seconds</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="/#idea-validation">
              <Button size="lg">
                Validate My Idea
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/results/debate">
              <Button variant="secondary" size="lg">
                Open Debate Panel
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className="flex flex-wrap items-center gap-6 pt-4 text-[11px] uppercase tracking-widest text-[--ink-2] justify-center"
          >
            <span className="inline-flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5" />
              120s Avg
            </span>
            <span className="inline-flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              No Card Required
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              Claude Sonnet 4.5
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-[580px] mx-auto"
          >
            <div className="bg-[--bg]">
              <LandingIdeaValidation />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function CapabilitiesGrid() {
  return (
    <section id="features" className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 lg:grid-cols-[0.5fr_0.5fr] lg:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[--ink-2]">
              02 / Capabilities
            </div>
            <h2 className="mt-4 font-sans text-[clamp(36px,5vw,64px)] font-black uppercase leading-[0.95] tracking-tight">
              Every Angle.
              <br />
              Every Objection.
              <br />
              <span className="bg-[#4b9be3] px-2 py-1 text-[--ink-0]">Weaponized.</span>
            </h2>
            <p className="mt-6 max-w-[480px] text-[15px] leading-[1.7] text-[--ink-1]">
              You get the same scrutiny a VC partnership meeting puts on a deal — condensed into a 120-second report and a live debate panel.
            </p>
          </div>

          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
            {capabilityCards.map(({ label, tag, icon: Icon, description, featured }, index) => (
              <article
                key={label}
                className={cn(
                  "border-2 border-[--line] p-5 transition-all hover:border-[--ink-0]",
                  featured && "bg-[--ink-0] text-[--bg]"
                )}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className={cn(
                    "grid h-10 w-10 place-items-center border-2",
                    featured ? "border-[--bg] text-[--bg]" : "border-[--ink-0] text-[--ink-0]"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={cn(
                    "border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                    featured ? "border-[--bg] text-[--bg]" : "border-[--line] text-[--ink-2]"
                  )}>
                    {tag}
                  </span>
                </div>
                <h3 className={cn(
                  "font-sans text-[18px] font-bold uppercase tracking-tight",
                  featured ? "text-[--bg]" : "text-[--ink-0]"
                )}>
                  {label}
                </h3>
                <p className={cn(
                  "mt-2 text-[13px] leading-[1.6]",
                  featured ? "text-[--bg]/80" : "text-[--ink-1]"
                )}>
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function VerdictTape() {
  return (
    <section className="border-y-2 border-[--line] bg-[--ink-0] py-4">
      <div className="overflow-hidden whitespace-nowrap">
        <div className="landing-marquee inline-flex items-center gap-8 pr-8">
          {[...verdictTape, ...verdictTape, ...verdictTape].map(([idea, verdict, score], index) => (
            <div key={`${idea}-${index}`} className="inline-flex items-center gap-4">
              <span className="font-sans text-[clamp(24px,3vw,48px)] font-bold uppercase leading-none text-[--bg]">
                {idea}
              </span>
              <span
                className={cn(
                  "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                  verdict === "GO" && "border-[--go] text-[--go]",
                  verdict === "CAUTION" && "border-[--caution] text-[--caution]",
                  verdict === "NO-GO" && "border-[--no-go] text-[--no-go]"
                )}
              >
                {verdict}
              </span>
              <span className="font-mono text-[clamp(24px,3vw,48px)] font-bold leading-none tracking-tight text-[--bg]">
                {score}
              </span>
              <span className="text-[--bg]/30">/</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhereItBreaks() {
  const RED = "#ef4444";

  const scoreAxes = [
    { label: "Problem fit",    value: "82", sub: "/ 100", tone: "go" },
    { label: "Market pull",    value: "68", sub: "/ 100", tone: "mid" },
    { label: "Timing",         value: "74", sub: "/ 100", tone: "mid" },
    { label: "Business model", value: "48", sub: "/ 100", tone: "no" },
    { label: "Competition",    value: "44", sub: "/ 100", tone: "no" },
    { label: "Execution edge", value: "58", sub: "/ 100", tone: "mid" },
  ] as const;

  const deliverables = [
    {
      icon: Gauge,
      eyebrow: "Deliverable 01",
      title: "Verdict score",
      body: "GO, Caution, or No-Go — a single defensible call backed by a visible 6-axis model.",
    },
    {
      icon: Radar,
      eyebrow: "Deliverable 02",
      title: "Risk radar",
      body: "Assumptions ranked by likelihood, blast radius, and the evidence you're still missing.",
    },
    {
      icon: UsersRound,
      eyebrow: "Deliverable 03",
      title: "5-persona debate",
      body: "Investor, customer, operator, adversary, and mentor — each in character, on the record.",
    },
    {
      icon: Target,
      eyebrow: "Deliverable 04",
      title: "Proof sprint",
      body: "The smallest test that can flip the decision. Shipped with every report.",
    },
  ] as const;

  const toneValueClass = (t: string) =>
    t === "no" ? "text-[#ef4444]" : t === "go" ? "text-[#22c55e]" : "text-white";

  return (
    <section
      id="personas"
      className="border-y-2 border-[#ef4444] bg-black px-5 py-24 text-white md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#ef4444]">
              04 / Risk Analysis
            </div>
            <h2 className="mt-5 font-sans text-[clamp(36px,5vw,64px)] font-black uppercase leading-[0.95] tracking-tight text-white">
              Where It
              <br />
              <span className="bg-[#ef4444] px-2 py-1 text-black">Breaks.</span>
            </h2>
          </div>
          <p className="max-w-[480px] text-[15px] leading-[1.7] text-white/70 lg:justify-self-end">
            Every report surfaces the assumptions investors test first, the
            trades behind market fit, and the open risk gaps that make scaling
            dangerous.
          </p>
        </div>

        {/* Cold-metrics grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-0 border-2 border-[#ef4444]"
        >
          {scoreAxes.map((m) => (
            <div
              key={m.label}
              className="border-r-2 border-b-2 border-[#ef4444]/40 p-5 last:border-r-0"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/55">
                {m.label}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`font-mono text-[36px] font-bold leading-none tracking-tight ${toneValueClass(m.tone)}`}>
                  {m.value}
                </span>
                <span className="font-mono text-[11px] text-white/50">{m.sub}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Verdict callout bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-0 grid border-x-2 border-b-2 border-[#ef4444] md:grid-cols-[auto_1fr_auto]"
        >
          {/* Big score cell */}
          <div className="flex items-center gap-5 border-b-2 border-[#ef4444]/40 px-6 py-6 md:border-b-0 md:border-r-2">
            <div className="font-mono text-[72px] font-bold leading-none tracking-tight text-white tabular-nums">
              62
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
                Verdict score · / 100
              </div>
              <div className="mt-2 inline-flex items-center gap-2 border-2 border-[#eab308] px-2 py-1">
                <span className="h-2 w-2 rounded-full bg-[#eab308]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#eab308]">
                  Caution
                </span>
              </div>
            </div>
          </div>

          {/* Subject + quote */}
          <div className="border-b-2 border-[#ef4444]/40 px-6 py-6 md:border-b-0 md:border-r-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/55">
              Case №017 · Sample report
            </div>
            <h3 className="mt-2 font-sans text-[22px] font-bold uppercase tracking-tight text-white">
              Linden — Rideshare for elders
            </h3>
            <p className="mt-3 text-[14px] leading-[1.6] text-white/70">
              The buyer pain is real — but unit economics are brutal and Uber
              Health is already circling.
            </p>
          </div>

          {/* CTA cell */}
          <Link
            href="/results"
            className="group flex items-center justify-between gap-4 bg-[#ef4444] px-6 py-6 text-black transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px]"
          >
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/70">
                Full report
              </div>
              <div className="mt-1 font-sans text-[18px] font-bold uppercase tracking-tight">
                See the dossier
              </div>
            </div>
            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Deliverables sub-section */}
        <div className="mt-20 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#ef4444]">
              04.5 / Output
            </div>
            <h2 className="mt-5 font-sans text-[clamp(30px,4vw,52px)] font-black uppercase leading-[0.95] tracking-tight text-white">
              What ships
              <br />
              <span className="bg-[#ef4444] px-2 py-1 text-black">In the envelope.</span>
            </h2>
          </div>
          <p className="max-w-[480px] text-[15px] leading-[1.7] text-white/70 lg:justify-self-end">
            Four artifacts. One envelope. Each one defensible on its own,
            devastating in combination.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-2 border-[#ef4444]">
          {deliverables.map((d, index) => {
            const Icon = d.icon;
            return (
              <motion.article
                key={d.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="min-h-[240px] border-b-2 border-r-2 border-[#ef4444]/40 p-5 last:border-r-0 md:nth-[2n]:border-r-0 lg:[&:nth-child(2)]:border-r-2 lg:[&:nth-child(4)]:border-r-0"
              >
                <div
                  className="grid h-10 w-10 place-items-center border-2 border-[#ef4444] bg-[#ef4444] text-black"
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-5 font-mono text-[10px] uppercase tracking-widest text-white/55">
                  {d.eyebrow}
                </div>
                <h3 className="mt-2 font-sans text-[22px] font-bold uppercase tracking-tight text-white">
                  {d.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-white/70">{d.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function KineticStory() {
  return (
    <section id="engine" className="border-b-2 border-[--line] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="lg:sticky lg:top-28 lg:h-fit">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--ink-2]">
              03 / The Engine
            </div>
            <h2 className="mt-5 font-sans text-[clamp(36px,5vw,64px)] font-black uppercase leading-[0.95] tracking-tight">
              A Decision Room
              <br />
              <span className="bg-[#4b9be3] px-2 py-1 text-[--ink-0]">With A Pulse.</span>
            </h2>
            <p className="mt-6 max-w-[480px] text-[15px] leading-[1.7] text-[--ink-1]">
              Every section is designed to move the idea from instinct to evidence:
              fast validation, adversarial reasoning, and an output founders can use.
            </p>
          </div>

          <div className="space-y-0">
            {story.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="surface-raised grid gap-5 border-b-2 border-[--line] p-5 md:grid-cols-[auto_1fr]"
                >
                  <div className="grid h-12 w-12 place-items-center border-2 border-[--ink-0] bg-[--accent] text-[--ink-0]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[--ink-2]">
                      {item.eyebrow}
                    </div>
                    <h3 className="mt-2 font-sans text-[24px] font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[--ink-1]">
                      {item.body}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionCockpit() {
  return (
    <section className="border-y-2 border-[--line] bg-[--ink-0] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--bg]/60">
              03.5 / Sample
            </div>
            <h2 className="mt-4 font-sans text-[clamp(36px,5vw,64px)] font-black uppercase leading-[0.95] tracking-tight text-[--bg]">
              A Real Report,
              <br />
              In Cold Metrics.
            </h2>
            <p className="mt-6 max-w-[420px] text-[15px] leading-[1.7] text-[--bg]/70">
              Every Idea Debater report ships with numbers a Tier-1 fund partner would recognize. No fluff. No vibes.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-0 border-2 border-[--bg]/20"
          >
            {[
              { label: "Viability Score", value: "82", sub: "/ 100" },
              { label: "Confidence", value: "HIGH", sub: "" },
              { label: "TAM", value: "$2.1B", sub: "global" },
              { label: "SAM", value: "$420M", sub: "serviceable" },
              { label: "SOM", value: "$42M", sub: "obtainable" },
              { label: "Competitors", value: "5", sub: "named" },
            ].map((metric, index) => (
              <div
                key={metric.label}
                className="border-r-2 border-b-2 border-[--bg]/20 p-5 last:border-r-0"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-[--bg]/50">
                  {metric.label}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-mono text-[36px] font-bold leading-none tracking-tight text-[--bg]">
                    {metric.value}
                  </span>
                  {metric.sub && (
                    <span className="font-mono text-[11px] text-[--bg]/50">
                      {metric.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Deliverables() {
  return (
    <section id="output" className="border-b-2 border-[--line] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--ink-2]">
              05 / What You Get
            </div>
            <h2 className="mt-5 font-sans text-[clamp(36px,5vw,64px)] font-black uppercase leading-[0.95] tracking-tight">
              Not A Chat.
              <br />
              <span className="bg-[#4b9be3] px-2 py-1 text-[--ink-0]">A Decision Packet.</span>
            </h2>
          </div>
          <p className="max-w-[480px] text-[15px] leading-[1.7] text-[--ink-1] lg:justify-self-end">
            Move from an idea you are emotionally attached to into a dossier you can
            defend, improve, or discard before it becomes expensive.
          </p>
        </div>

        <div className="mt-12 grid gap-0 md:grid-cols-2 lg:grid-cols-4">
          {deliverables.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                className="surface-raised min-h-[220px] border-b-2 border-r-2 border-[--line] p-5 last:border-r-0"
              >
                <div className="grid h-10 w-10 place-items-center border-2 border-[--ink-0] bg-[--accent] text-[--ink-0]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-6 font-sans text-[22px] font-bold uppercase tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[--ink-1]">{item.text}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PremiumFeatures() {
  const features = [
    {
      title: "1. Logo & Brand Kit",
      body: "Generate professional logos, color palettes, and typography rules. Compare concepts and refine them into a complete brand kit with real-world mockups.",
    },
    {
      title: "2. Landing Page Gen",
      body: "Convert your validated idea and brand kit into a high-converting, SEO-optimized landing page. Ship your waitlist in seconds.",
    },
    {
      title: "3. Investor Business Plan",
      body: "Generate a complete dossier with SWOT analysis, revenue models, GTM tactics, and risk mitigation strategies ready to export to PDF.",
    },
    {
      title: "4. MVP Roadmap",
      body: "Get a step-by-step 90-day technical and operational roadmap. Know exactly what features to build first and what to ignore.",
    },
  ];

  return (
    <section className="border-y-2 border-[--line] bg-[--ink-0] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="surface-raised overflow-hidden">
          <div className="grid border-b border-[--bg]/20 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[--bg]/20 p-6 md:p-8 lg:border-b-0 lg:border-r">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--bg]/60">
                Beyond validation
              </div>
              <h2 className="mt-5 max-w-[640px] font-serif text-[clamp(38px,5.5vw,72px)] leading-[0.95] tracking-[-0.04em] text-[--bg]">
                Don&apos;t just validate it. Ship it.
              </h2>
            </div>
            <div className="p-6 md:p-8">
              <p className="text-[17px] leading-[1.75] text-[--bg]/70">
                Once your idea survives the debate panel, move straight to execution.
                Generate investor-ready business plans, design a complete brand identity,
                and deploy a landing page without leaving the platform.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="min-h-[260px] border-b border-[--bg]/20 p-6 last:border-b-0 md:border-r md:last:border-r-0 lg:border-b-0"
              >
                <div className="font-mono text-[44px] leading-none tracking-[-0.04em] text-[#4b9be3]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-10 font-serif text-[28px] leading-[1.02] tracking-[-0.02em] text-[--bg]">
                  {feature.title}
                </h3>
                <p className="mt-4 text-[14px] leading-[1.65] text-[--bg]/70">{feature.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchComparison() {
  const models = [
    {
      name: "Friends & Family",
      icon: Heart,
      traits: [
        { label: "Tone", value: "Supportive" },
        { label: "Signal", value: "Low" },
        { label: "Output", value: "A feeling" },
      ],
      highlight: false,
    },
    {
      name: "Generic AI",
      icon: Bot,
      traits: [
        { label: "Tone", value: "Agreeable" },
        { label: "Signal", value: "Medium" },
        { label: "Output", value: "A summary" },
      ],
      highlight: false,
    },
    {
      name: "Priority Debater",
      icon: Gavel,
      traits: [
        { label: "Tone", value: "Adversarial" },
        { label: "Signal", value: "High" },
        { label: "Output", value: "A decision" },
      ],
      highlight: true,
    },
  ];

  return (
    <section className="border-y-2 border-[--line] bg-[--ink-0] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-[800px] text-center mb-16">
          <div className="inline-flex items-center gap-2 border-2 border-[--bg]/20 bg-[#4b9be3] px-3 py-1.5 mb-6">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[--ink-0]">
              The Alternative
            </span>
          </div>
          <h2 className="font-sans text-[clamp(42px,6.2vw,86px)] font-black uppercase leading-[0.92] tracking-tight text-[--bg]">
            Built to disagree.
          </h2>
          <p className="mt-6 text-[18px] leading-[1.75] text-[--bg]/70 max-w-[640px] mx-auto">
            Friendly feedback keeps weak ideas alive. Priority Debater is built for the
            harder job: pressure, disagreement, and better decisions before expensive mistakes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {models.map((model, index) => {
            const Icon = model.icon;
            return (
              <motion.article
                key={model.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "flex flex-col border-2 border-[--bg]/20 p-6 md:p-8",
                  model.highlight
                    ? "bg-[#4b9be3] shadow-[8px_8px_0px_0px_var(--bg)] md:scale-105 z-10"
                    : "bg-[--bg]/5"
                )}
              >
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={cn(
                      "grid h-12 w-12 place-items-center border-2 border-[--bg]/20",
                      model.highlight ? "bg-[--bg]" : "bg-[--bg]"
                    )}
                  >
                    <Icon className="h-6 w-6 text-[--ink-0]" />
                  </div>
                  <h3
                    className={cn(
                      "font-sans text-[24px] font-bold uppercase tracking-tight",
                      model.highlight ? "text-[--ink-0]" : "text-[--bg]"
                    )}
                  >
                    {model.name}
                  </h3>
                </div>

                <div className="mt-auto flex flex-col gap-4">
                  {model.traits.map((trait) => (
                    <div
                      key={trait.label}
                      className="flex items-center justify-between border-b-2 border-dashed border-[--bg]/20 pb-3 last:border-0 last:pb-0"
                    >
                      <span
                        className={cn(
                          "font-mono text-[11px] uppercase tracking-[0.16em]",
                          model.highlight ? "text-[--ink-0]/80" : "text-[--bg]/60"
                        )}
                      >
                        {trait.label}
                      </span>
                      <span
                        className={cn(
                          "font-serif text-[18px] font-bold tracking-tight",
                          model.highlight ? "text-[--ink-0]" : "text-[--bg]"
                        )}
                      >
                        {trait.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end mb-12">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--ink-2]">
              04 / Pricing
            </div>
            <h2 className="mt-4 font-sans text-[clamp(36px,5vw,64px)] font-black uppercase leading-[0.95] tracking-tight">
              Fair. Blunt.
              <br />
              <span className="bg-[#4b9be3] px-2 py-1 text-[--ink-0]">Cheaper Than A Consultant.</span>
            </h2>
          </div>
          <p className="max-w-[400px] text-[15px] leading-[1.7] text-[--ink-1] lg:justify-self-end">
            Start with 70 free credits. No card. No subscription. Credits never expire.
          </p>
        </div>

        <div className="grid gap-0 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "relative flex min-h-[480px] flex-col border-2 border-[--line] p-6 -ml-[2px] first:ml-0",
                plan.featured && "bg-[--ink-0] text-[--bg] -mt-[2px] md:mt-0 border-[--ink-0]"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-6 bg-[--accent] px-2 py-0.5">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[--on-accent]">
                    ★ Popular
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <h3 className={cn(
                  "font-sans text-[28px] font-bold tracking-tight",
                  plan.featured ? "text-[--bg]" : "text-[--ink-0]"
                )}>
                  {plan.name}
                </h3>
                <span className={cn(
                  "font-mono text-[9px] uppercase tracking-wider",
                  plan.featured ? "text-[--bg]/60" : "text-[--ink-2]"
                )}>
                  {plan.line}
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className={cn(
                    "font-mono text-[56px] font-bold leading-none tracking-tighter",
                    plan.featured ? "text-[--bg]" : "text-[--ink-0]"
                  )}>
                    €{plan.price}
                  </span>
                </div>
                <span className={cn(
                  "font-mono text-[11px] uppercase tracking-wider",
                  plan.featured ? "text-[--bg]/60" : "text-[--ink-2]"
                )}>
                  {plan.credits} Credits
                </span>
              </div>

              <ul className="mt-6 space-y-2 border-t-2 border-[--line] pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className={cn(
                    "flex items-start gap-2 text-[13px]",
                    plan.featured ? "text-[--bg]/90" : "text-[--ink-1]"
                  )}>
                    <Check className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      plan.featured ? "text-[--accent]" : "text-[--go]"
                    )} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/#idea-validation" className="mt-auto pt-6">
                <Button
                  variant={plan.featured ? "secondary" : "secondary"}
                  className={cn(
                    "w-full",
                    plan.featured && "bg-[--bg] text-[--ink-0] border-[--bg] hover:bg-[--bg]/90"
                  )}
                >
                  {plan.featured ? "Get Builder" : `Get ${plan.name}`}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-24 md:px-8 md:pb-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="surface-raised bg-[--accent] border-[--ink-0] p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[--ink-1]">
                <Clock3 className="h-4 w-4" />
                Four minutes to clarity
              </div>
              <h2 className="mt-4 max-w-[700px] font-sans text-[clamp(32px,5vw,56px)] font-black uppercase leading-[0.95] tracking-tight text-[--ink-0]">
                The Best Time To Hear The Hard Truth Is Before Launch.
              </h2>
            </div>
            <Link href="/#idea-validation">
              <Button size="lg" className="w-full md:w-auto whitespace-nowrap">
                Validate My Idea
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
