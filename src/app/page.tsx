"use client";

/**
 * PDR — brand landing (route `/`).
 *
 * The front door for Precision Dynamics: one platform across the lifecycle of an
 * AI-native business — Validation → Studio → Commerce. Light, white-based
 * treatment of the house system (Anton display, JetBrains Mono metadata, zero
 * border-radius, exactly one yellow CTA). Consistent light shell; each product
 * gets its own bespoke design + signature color. Motion via framer-motion +
 * a GSAP scrub line, all Lenis-synced through the app-wide SmoothScroll.
 *
 * The legacy two-fork split screen now lives at `/fork`.
 */

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, ArrowDown, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Reveal,
  MaskLines,
  CountUp,
  ScoreBar,
} from "@/components/pdr/motion-primitives";

gsap.registerPlugin(ScrollTrigger);

/* Signature accents per stage. */
const RED = "#FF2B2B";
const BLUE = "#0047FF";
const GREEN = "#16B364";
const HAIRLINE = "border-[#E7E4DC]";

const STAGES = [
  { n: "01", name: "Validation", tag: "The AI Venture Analyst", href: "/validation" },
  { n: "02", name: "Studio", tag: "The AI Business Creation Engine", href: "/studio" },
  { n: "03", name: "Commerce", tag: "The Autonomous Business OS", href: "/commerce/command" },
] as const;

/* ── Shared bits ───────────────────────────────────────────────────────── */

function Eyebrow({ children, color = BLUE }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="font-mono text-[11px] uppercase tracking-[0.34em]"
      style={{ color }}
    >
      {children}
    </span>
  );
}

/* Old vs new purchase path — the "shift" section. */
function FlowColumn({ label, nodes, muted }: { label: string; nodes: string[]; muted?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-black/40">
        {label}
      </span>
      <div className="flex flex-col gap-2">
        {nodes.map((node, i) => (
          <Reveal key={node} delay={i * 0.07} y={12}>
            <div className="flex flex-col items-start gap-2">
              <div
                className={[
                  "w-full border px-4 py-3 font-mono text-[12px] uppercase tracking-[0.14em]",
                  muted
                    ? "border-[#E7E4DC] bg-white text-black/40"
                    : "border-black bg-black text-white",
                ].join(" ")}
              >
                {node}
              </div>
              {i < nodes.length - 1 && (
                <ArrowDown
                  size={15}
                  strokeWidth={2.5}
                  style={{ color: muted ? "rgba(0,0,0,0.2)" : BLUE }}
                  aria-hidden
                />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* A product's text column — consistent across the three modules. */
function ProductCopy({
  n,
  name,
  kicker,
  lede,
  points,
  cta,
  href,
  color,
}: {
  n: string;
  name: string;
  kicker: string;
  lede: string;
  points: string[];
  cta: string;
  href: string;
  color: string;
}) {
  return (
    <div className="flex flex-col justify-center">
      <Reveal>
        <span className="font-display text-[clamp(3.4rem,9vw,7rem)] leading-[0.8]" style={{ color: `${color}1f` }}>
          {n}
        </span>
      </Reveal>
      <Reveal delay={0.05}>
        <div className="mt-4">
          <Eyebrow color={color}>{kicker}</Eyebrow>
          <h2 className="mt-3 font-display text-[clamp(2.4rem,5.5vw,4.4rem)] uppercase leading-[0.9] tracking-[-0.01em]">
            {name}
          </h2>
        </div>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-6 max-w-md text-[17px] leading-relaxed text-black/70">{lede}</p>
      </Reveal>
      <ul className="mt-7 flex max-w-md flex-col gap-2.5">
        {points.map((pt, i) => (
          <Reveal key={pt} delay={0.14 + i * 0.06} y={14}>
            <li className="flex items-start gap-3">
              <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color }} />
              <span className="text-[15px] leading-snug text-black/75">{pt}</span>
            </li>
          </Reveal>
        ))}
      </ul>
      <Reveal delay={0.3}>
        <Link
          href={href}
          className="group mt-9 inline-flex w-fit items-center gap-3 border border-black bg-transparent px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-black no-underline transition-colors hover:bg-black hover:text-white"
        >
          {cta}
          <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </Reveal>
    </div>
  );
}

/* ── 01 · VALIDATION — red analyst "verdict dossier" ───────────────────── */

function ValidationShowcase() {
  return (
    <section className={`border-b ${HAIRLINE}`} style={{ backgroundColor: "#FFF5F4" }}>
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-28">
        <ProductCopy
          n="01"
          name="Validation"
          kicker="The AI Venture Analyst"
          lede="Most ideas shouldn't become businesses. Validation acts as a venture capitalist, market researcher, and strategist — and its goal is not to encourage you. Its goal is to tell the truth."
          points={[
            "Deep analysis: market size, competition, saturation, pricing, moats",
            "The hard questions — why now, why you, what's defensible",
            "A complete company blueprint, not a vanity score",
          ]}
          cta="Stress-test an idea"
          href="/validation"
          color={RED}
        />

        {/* Dossier card */}
        <Reveal delay={0.1} blur>
          <div className="border border-black bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">
              <span>Idea #0447 · Analysis complete</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5" style={{ backgroundColor: RED }} />
                Verdict
              </span>
            </div>
            <div className="px-5 py-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/40">
                The ruling
              </span>
              <p className="mt-1 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] uppercase leading-[0.95]">
                Proceed —<br />
                <span style={{ color: RED }}>with conditions.</span>
              </p>
              <div className="mt-7 flex flex-col gap-4">
                <ScoreBar label="Market demand" pct={72} color={GREEN} delay={0.1} />
                <ScoreBar label="Defensibility" pct={41} color={RED} delay={0.2} />
                <ScoreBar label="Timing" pct={88} color={BLUE} delay={0.3} />
              </div>
              <div className="mt-7 border-l-2 pl-4" style={{ borderColor: RED }}>
                <p className="font-mono text-[12px] leading-relaxed text-black/70">
                  &ldquo;Demand is real, but three funded incumbents own distribution. Why would
                  anyone switch to you?&rdquo;
                </p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-black/40">
                  — Panel, unresolved objection
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 02 · STUDIO — blue "generation grid" (human vs AI interface) ──────── */

function GenTile({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={twMerge("border border-black/12 bg-white p-4", className)}
      initial={reduce ? false : { opacity: 0, scale: 0.94, y: 10 }}
      whileInView={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StudioShowcase() {
  return (
    <section className={`border-b ${HAIRLINE}`} style={{ backgroundColor: "#F4F6FF" }}>
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-28">
        {/* Generation grid FIRST on desktop for rhythm variety */}
        <Reveal delay={0.05} blur className="order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-3">
            <GenTile delay={0.05} className="col-span-2 flex items-center justify-between">
              <span className="font-display text-2xl uppercase tracking-[0.02em]">Northwind</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">
                wordmark · v3
              </span>
            </GenTile>
            <GenTile delay={0.12}>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">
                Palette
              </span>
              <div className="mt-2 flex gap-1.5">
                {[BLUE, "#0A0A0A", "#FFD400", "#F4F6FF"].map((c) => (
                  <span key={c} className="h-7 w-7 border border-black/10" style={{ backgroundColor: c }} />
                ))}
              </div>
            </GenTile>
            <GenTile delay={0.18}>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">
                Human interface
              </span>
              <div className="mt-2 space-y-1.5">
                <div className="h-2 w-full bg-black/80" />
                <div className="h-1.5 w-3/4 bg-black/20" />
                <div className="h-1.5 w-2/3 bg-black/20" />
                <div className="mt-2 inline-block px-2 py-1" style={{ backgroundColor: BLUE }}>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white">Shop</span>
                </div>
              </div>
            </GenTile>
            <GenTile delay={0.24} className="col-span-2 bg-[#0A0A0A]">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: "#7aa2ff" }}>
                AI interface · machine-readable
              </span>
              <pre className="mt-2 overflow-hidden font-mono text-[10px] leading-relaxed text-white/80">
{`{ "@type": "Product",
  "name": "Trail Jacket",
  "audience": "backcountry",
  "compatibleWith": ["…"],
  "availability": "InStock" }`}
              </pre>
            </GenTile>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2">
          <ProductCopy
            n="02"
            name="Studio"
            kicker="The AI Business Creation Engine"
            lede="Not a website builder — a business creation platform. Studio turns a validated idea into a complete digital identity that lives in two worlds at once."
            points={[
              "Human interface — website, brand, product pages, portals",
              "AI interface — machine-readable catalog, knowledge graph, agent endpoints",
              "Every product becomes an intelligent, queryable object",
            ]}
            cta="Explore Studio"
            href="/brand"
            color={BLUE}
          />
        </div>
      </div>
    </section>
  );
}

/* ── 03 · COMMERCE — green "live dashboard" + AI worker ────────────────── */

function KpiTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-black/10 bg-white p-4">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">{label}</span>
      <div className="mt-1.5 font-display text-[clamp(1.5rem,4vw,2.2rem)] leading-none tracking-[-0.01em]">
        {children}
      </div>
    </div>
  );
}

function CommerceShowcase() {
  const reduce = useReducedMotion();
  return (
    <section className={`border-b ${HAIRLINE}`} style={{ backgroundColor: "#F1FAF5" }}>
      <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-28">
        <ProductCopy
          n="03"
          name="Commerce"
          kicker="The Autonomous Business OS"
          lede="Traditional platforms give owners tools. PDR gives businesses AI workers. You stop operating software and start managing objectives."
          points={[
            "The Business Brain — one intelligence layer over the whole company",
            "Inventory Intelligence Worker — what's profitable, what's running out",
            "Every euro of recovery traced to a real order in your store",
          ]}
          cta="Open the operations room"
          href="/commerce/command"
          color={GREEN}
        />

        {/* Dashboard */}
        <Reveal delay={0.1} blur>
          <div className="border border-black bg-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">
              <span>Business Brain · Live</span>
              <span className="flex items-center gap-1.5" style={{ color: GREEN }}>
                <motion.span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: GREEN }}
                  animate={reduce ? undefined : { opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
                Syncing
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              <KpiTile label="Revenue recovered">
                <CountUp to={12480} prefix="€" />
              </KpiTile>
              <KpiTile label="AI visibility">
                <span style={{ color: GREEN }}>
                  <CountUp to={68} suffix="%" />
                </span>
              </KpiTile>
              <KpiTile label="Orders traced">
                <CountUp to={214} />
              </KpiTile>
              <KpiTile label="Margin (avg)">
                <CountUp to={62} suffix="%" />
              </KpiTile>
            </div>
            {/* AI worker */}
            <div className="border-t border-black/10 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.18em]">
                  Inventory Intelligence Worker
                </span>
                <span
                  className="border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
                  style={{ color: GREEN, borderColor: GREEN }}
                >
                  Active
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  "3 products low on stock — reorder now",
                  "Bestseller margin holding at 62%",
                  "2 listings invisible to AI shoppers — fix ready",
                ].map((line, i) => (
                  <Reveal key={line} delay={0.2 + i * 0.1} y={8}>
                    <div className="flex items-start gap-2 font-mono text-[11px] leading-snug text-black/65">
                      <span style={{ color: GREEN }}>→</span>
                      {line}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function PdrLanding() {
  const pipelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  // Pipeline spine draws with scroll — GSAP ScrollTrigger, Lenis-synced.
  useEffect(() => {
    const section = pipelineRef.current;
    const line = lineRef.current;
    if (!section || !line) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(line, { scaleY: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top 65%", end: "bottom 60%", scrub: true },
        },
      );
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <main className="bg-white text-[#0A0A0A]">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-40 border-b ${HAIRLINE} bg-white/80 backdrop-blur`}>
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4 lg:px-10">
          <Link href="/" className="font-display text-[22px] uppercase leading-none tracking-[0.02em] text-black no-underline">
            PDR
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {STAGES.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/55 no-underline transition-colors hover:text-black"
              >
                {s.name}
              </Link>
            ))}
          </nav>
          <Link
            href="/validation"
            className="border border-black bg-transparent px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-black no-underline transition-colors hover:bg-black hover:text-white"
          >
            Start
          </Link>
        </div>
      </header>

      {/* ── 1 · HERO ─────────────────────────────────────────────────── */}
      <section className={`relative overflow-hidden border-b ${HAIRLINE}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.6]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(120% 90% at 20% 10%, #000 40%, transparent 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1180px] px-6 py-24 lg:px-10 lg:py-36">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Eyebrow>PDR · Precision Dynamics</Eyebrow>
          </motion.div>

          <h1 className="mt-6 max-w-5xl font-display text-[clamp(2.9rem,8.5vw,7.4rem)] uppercase leading-[0.92] tracking-[-0.02em]">
            <MaskLines
              lines={[
                "The operating system",
                <>
                  for <span style={{ color: BLUE }}>AI-native</span>
                </>,
                "businesses.",
              ]}
            />
          </h1>

          <Reveal delay={0.45} mount>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-black/65">
              The internet was built for search engines and humans browsing websites. The next
              generation of businesses will be built for AI agents — they discover, evaluate,
              negotiate, and buy on your customers&rsquo; behalf. PDR builds companies designed for
              that economy.
            </p>
          </Reveal>

          <Reveal delay={0.55} mount>
            <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* THE single yellow CTA on the page. */}
              <Link
                href="/validation"
                className="group inline-flex items-center gap-3 bg-[#FFD400] px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-black no-underline"
              >
                Build your business
                <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="#ecosystem"
                className="inline-flex items-center gap-2 border-b border-black/25 pb-1 font-mono text-[12px] uppercase tracking-[0.2em] text-black/70 no-underline transition-colors hover:border-black hover:text-black"
              >
                See how it works
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.65} mount>
            <div className={`mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t ${HAIRLINE} pt-6`}>
              {STAGES.map((s) => (
                <span key={s.name} className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/40">
                  <span style={{ color: BLUE }}>{s.n}</span> {s.name}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2 · THE SHIFT ───────────────────────────────────────────── */}
      <section className={`border-b ${HAIRLINE}`} style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto grid max-w-[1180px] gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-32">
          <div>
            <Reveal>
              <Eyebrow>The shift</Eyebrow>
              <h2 className="mt-6 max-w-xl font-display text-[clamp(2rem,4.5vw,3.6rem)] uppercase leading-[0.98] tracking-[-0.01em]">
                The shopping journey is collapsing.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-black/60">
                For twenty years the path was a funnel a human walked. Soon a personal agent walks it
                for them — talking directly to a business&rsquo;s agent, comparing, negotiating, and
                closing. Businesses need a representative in that conversation.
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <FlowColumn label="Today" muted nodes={["Google", "Website", "Product page", "Checkout"]} />
            <FlowColumn label="Next" nodes={["Human", "Personal agent", "Business agent", "Negotiation", "Purchase"]} />
          </div>
        </div>
      </section>

      {/* ── 3 · ECOSYSTEM PIPELINE ──────────────────────────────────── */}
      <section id="ecosystem" ref={pipelineRef} className={`relative border-b ${HAIRLINE} bg-white`}>
        <div className="mx-auto max-w-[1180px] px-6 py-24 lg:px-10 lg:py-32">
          <Reveal>
            <Eyebrow>The ecosystem</Eyebrow>
            <h2 className="mt-6 max-w-3xl font-display text-[clamp(2rem,5vw,4rem)] uppercase leading-[0.96] tracking-[-0.01em]">
              One platform. Idea to autonomous company.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-black/60">
              Not disconnected tools — website builders, ecommerce, CRMs, dashboards — but a single
              system that carries a business through its whole lifecycle.
            </p>
          </Reveal>

          <div className="relative mt-16 pl-10 md:pl-16">
            <div aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-black/10 md:left-[11px]" />
            <div
              ref={lineRef}
              aria-hidden
              className="absolute left-[7px] top-2 w-px origin-top scale-y-0 md:left-[11px]"
              style={{ bottom: "0.5rem", backgroundColor: BLUE }}
            />
            <div className="flex flex-col gap-10">
              {[
                { n: "—", name: "Business idea", tag: "Where every company begins", href: null },
                ...STAGES,
                { n: "→", name: "AI-native autonomous company", tag: "Thinks, communicates, adapts, operates", href: null },
              ].map((node, i) => (
                <Reveal key={node.name} delay={i * 0.05} y={18}>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute -left-10 top-1.5 flex h-4 w-4 items-center justify-center border border-black bg-white md:-left-16"
                    >
                      <span className="h-1.5 w-1.5" style={{ backgroundColor: BLUE }} />
                    </span>
                    {node.href ? (
                      <Link href={node.href} className="group block no-underline">
                        <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: BLUE }}>
                          {node.n} · {node.tag}
                        </span>
                        <div className="mt-1 flex items-center gap-3">
                          <h3 className="font-display text-[clamp(1.6rem,4vw,2.8rem)] uppercase leading-none tracking-[-0.01em] text-black">
                            {node.name}
                          </h3>
                          <ArrowRight
                            size={22}
                            strokeWidth={2.5}
                            className="text-black/25 transition-all group-hover:translate-x-1 group-hover:text-black"
                          />
                        </div>
                      </Link>
                    ) : (
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-black/35">
                          {node.tag}
                        </span>
                        <h3 className="mt-1 font-display text-[clamp(1.4rem,3.4vw,2.3rem)] uppercase leading-none tracking-[-0.01em] text-black/70">
                          {node.name}
                        </h3>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 · PRODUCTS (three bespoke designs) ────────────────────── */}
      <ValidationShowcase />
      <StudioShowcase />
      <CommerceShowcase />

      {/* ── 5 · PHILOSOPHY ──────────────────────────────────────────── */}
      <section className={`border-b ${HAIRLINE}`} style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-[1180px] px-6 py-24 lg:px-10 lg:py-32">
          <Reveal>
            <Eyebrow>The philosophy</Eyebrow>
            <h2 className="mt-6 max-w-4xl font-display text-[clamp(2rem,5vw,4.2rem)] uppercase leading-[0.96] tracking-[-0.01em]">
              Every company we build lives in two worlds.
            </h2>
          </Reveal>
          <div className={`mt-14 grid gap-px border ${HAIRLINE} bg-[#E7E4DC] md:grid-cols-2`}>
            <Reveal className="bg-white p-8 lg:p-12">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-black/40">
                The human world
              </span>
              <p className="mt-4 text-lg leading-relaxed text-black/75">
                Where customers still value trust, storytelling, and experience — and expect clarity,
                not just aesthetics.
              </p>
            </Reveal>
            <Reveal delay={0.08} className="bg-white p-8 lg:p-12">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: BLUE }}>
                The AI world
              </span>
              <p className="mt-4 text-lg leading-relaxed text-black/75">
                Where intelligent agents discover, evaluate, compare, negotiate, and transact on
                behalf of users. PDR&rsquo;s mission is to bridge the two.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 6 · CTA ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#FAFAF8" }}>
        <div className="mx-auto max-w-[1180px] px-6 py-28 text-center lg:px-10 lg:py-40">
          <Reveal>
            <Eyebrow>Start now</Eyebrow>
            <h2 className="mx-auto mt-6 max-w-4xl font-display text-[clamp(2.4rem,7vw,6rem)] uppercase leading-[0.92] tracking-[-0.02em]">
              Build a business the AI economy can see.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-black/60">
              Every business once needed a website, then a social presence. Next it needs an
              intelligent AI presence. Start with the truth about your idea.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/validation"
              className="group mt-12 inline-flex items-center gap-3 border border-black bg-black px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-white no-underline transition-colors hover:bg-transparent hover:text-black"
            >
              Validate your idea
              <ArrowRight size={16} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className={`border-t ${HAIRLINE} bg-white`}>
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between lg:px-10">
          <span className="font-display text-[20px] uppercase tracking-[0.02em]">PDR</span>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {STAGES.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/55 no-underline hover:text-black"
              >
                {s.name}
              </Link>
            ))}
            <Link href="/fork" className="font-mono text-[11px] uppercase tracking-[0.22em] text-black/35 no-underline hover:text-black">
              Fork picker
            </Link>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/40">
            Precision Dynamics · The AI-native business OS
          </span>
        </div>
      </footer>
    </main>
  );
}
