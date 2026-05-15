"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Download,
  RefreshCcw,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  MessagesSquare,
  Zap,
  Plus,
  Minus,
  AlertCircle,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  Cell,
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PieChart,
  Pie
} from "recharts";

import { Button } from "@/components/v2/button";
import { VerdictPill } from "@/components/v2/verdict-pill";
import { PersonaMark, type PersonaName } from "@/components/v2/persona-mark";
import {
  exampleDossier,
  type DossierPersona,
  type DossierRisk,
  type ExampleDossier,
} from "@/lib/example-dossier";
import { dossierFromSession, sessionMatchesDossierShape } from "@/lib/dossier-from-session";
import { exportBriefToMarkdownFile, shareOrCopyBrief } from "@/lib/export-dossier-markdown";
import { loadSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const ResultsDossierContext = createContext<ExampleDossier>(exampleDossier);

function useDossier(): ExampleDossier {
  return useContext(ResultsDossierContext);
}

// ── Shared UI Components ─────────────────────────────────────────────

function CountUp({ end, duration = 2000, decimals = 0 }: { end: number; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(progress * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <>{count.toFixed(decimals)}</>;
}

function TopNav({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const sections = [
    { id: "overview", label: "OVERVIEW", num: "01" },
    { id: "market", label: "MARKET", num: "03" },
    { id: "risk", label: "RISK", num: "04" },
    { id: "competition", label: "COMPETITION", num: "05" },
    { id: "revenue", label: "REVENUE", num: "06" },
    { id: "audience", label: "AUDIENCE", num: "07" },
    { id: "swot", label: "SWOT", num: "08" },
    { id: "actions", label: "ACTIONS", num: "09" },
    { id: "personas", label: "PERSONAS", num: "10" },
  ];

  return (
    <div className="sticky top-0 z-[100] flex flex-col w-full">
      {/* Global Nav */}
      <nav className="h-16 bg-white border-b-2 border-black px-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-sm">ID</div>
            <div className="flex flex-col -space-y-1">
              <span className="text-[16px] font-anton tracking-tight leading-none">IDEA DEBATER</span>
              <span className="text-[9px] font-mono text-black/40 uppercase tracking-widest">STRESS-TESTED / 2026</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-10 ml-8 border-l-2 border-black/5 pl-10 h-16">
             {["OVERVIEW", "MARKET", "RISK", "COMPETITION", "REVENUE", "PERSONAS"].map(tab => (
                <button 
                  key={tab}
                  onClick={() => onChange(tab.toLowerCase())}
                  className={cn(
                    "text-[11px] font-black tracking-[0.2em] transition-all relative py-1",
                    active === tab.toLowerCase() ? "text-black" : "text-black/30 hover:text-black"
                  )}
                >
                  {tab}
                  {active === tab.toLowerCase() && (
                    <motion.div layoutId="nav-underline" className="absolute -bottom-[26px] left-0 right-0 h-1 bg-accent z-10" />
                  )}
                </button>
             ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" className="h-10 border-2 border-black font-black text-[11px] tracking-widest px-6 shadow-brutal hover:bg-black hover:text-white transition-all">
            <Zap className="w-3.5 h-3.5 mr-2" /> DEBATE MODE
          </Button>
          <Button className="h-10 bg-black text-white font-black text-[11px] tracking-widest px-6 hover:bg-accent hover:text-black transition-all">
             <RefreshCw className="w-3.5 h-3.5 mr-2" /> RE-RUN VALIDATION
          </Button>
        </div>
      </nav>

      {/* Sectional Nav */}
      <div className="h-14 bg-black border-b border-white/10 flex items-center overflow-x-auto scrollbar-hide">
         <div className="flex items-center gap-0 min-w-max h-full">
            <div className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] px-8 border-r border-white/10 h-full flex items-center gap-3">
               REPORT NAVIGATION <ChevronRight className="w-3 h-3 text-accent" />
            </div>
            {sections.map(s => (
               <button
                  key={s.id}
                  onClick={() => onChange(s.id)}
                  className={cn(
                    "px-10 h-full flex flex-col items-center justify-center gap-0.5 transition-all group relative border-r border-white/10",
                    active === s.id ? "bg-accent text-black" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
               >
                  <span className="text-[8px] font-mono opacity-50">§{s.num}</span>
                  <span className="text-[11px] font-black tracking-[0.15em] uppercase">{s.label}</span>
               </button>
            ))}
         </div>
      </div>
    </div>
  );
}

function BottomTicker() {
  const metrics = [
    { label: "VERDICT", val: "GO", color: "text-go" },
    { label: "CONFIDENCE", val: "88%", color: "text-accent" },
    { label: "TAM", val: "$2.1B", color: "text-white" },
    { label: "COMPETITORS", val: "05", color: "text-white" },
    { label: "RUNTIME", val: "118S", color: "text-white" },
    { label: "MODEL", val: "CLAUDE-4.5", color: "text-white/40" },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-black border-t border-white/20 z-[100] flex items-center overflow-hidden whitespace-nowrap">
      <div className="flex animate-marquee py-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            {metrics.map((m, idx) => (
              <div key={idx} className="flex items-center gap-4 px-10 border-r border-white/10">
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{m.label}:</span>
                <span className={cn("text-[10px] font-black tracking-widest uppercase", m.color)}>{m.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TickerTape() {
  const items = [
    { label: "VERDICT", val: "GO", color: "text-go" },
    { label: "CONFIDENCE", val: "88%", color: "text-accent" },
    { label: "MARKET SIZE", val: "$4.7B", color: "text-white" },
    { label: "COMPETITION", val: "MODERATE", color: "text-caution" },
    { label: "UNIT MARGIN", val: "42%", color: "text-go" },
    { label: "RISK LEVEL", val: "MEDIUM", color: "text-caution" },
  ];
  return (
    <div className="h-10 bg-black border-b border-white/10 flex items-center overflow-hidden whitespace-nowrap sticky top-[104px] z-[90]">
      <div className="flex animate-marquee py-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-8 border-r border-white/5 group">
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{item.label}:</span>
                <span className={cn("text-[11px] font-black tracking-widest uppercase", item.color)}>{item.val}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab Sections ─────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative pt-32 pb-44 px-8 lg:px-20 overflow-hidden app-page-shell-dark">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-24 items-end relative z-10">
        <div className="space-y-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-accent/10 border border-accent/20">
               <div className="w-2 h-2 bg-accent animate-pulse" />
               <span className="text-[11px] font-mono text-accent uppercase tracking-[0.2em]">STRESS-TEST COMPLETE / §01</span>
            </div>
            <h1 className="text-[clamp(90px,14vw,220px)] font-anton leading-[0.8] tracking-tighter uppercase text-white">
               THE CASE<br /><span className="text-accent">IS OPEN.</span>
            </h1>
          </div>
          <p className="max-w-2xl text-[19px] text-white/60 leading-relaxed font-serif italic border-l-4 border-accent pl-10">
            This dossier analyzes the commercial viability of CargoFleet EU. Synthesized from 1.2M market datapoints and cross-examined by five specialized AI personas.
          </p>
        </div>
        <div className="surface-raised bg-white p-12 space-y-12 group shadow-brutal-lg transition-all hover:-translate-x-2 hover:-translate-y-2">
          <div className="flex justify-between items-start">
             <div className="space-y-2 text-black">
                <div className="text-[11px] font-mono text-black/40 uppercase tracking-widest">VIABILITY INDEX</div>
                <div className="text-7xl font-anton uppercase tracking-tight text-accent"><CountUp end={82.4} decimals={1} /></div>
             </div>
             <div className="flex flex-col items-end gap-2">
                <ShieldCheck className="w-12 h-12 text-go" />
                <div className="text-[9px] font-mono text-go uppercase font-black tracking-widest">VERIFIED</div>
             </div>
          </div>
          <div className="space-y-6">
             <div className="flex justify-between text-[12px] font-mono uppercase font-black text-black tracking-widest">
                <span>CONFIDENCE</span><span>HIGH / 0.88</span>
             </div>
             <div className="h-1.5 bg-black/5 relative overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: "88%" }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-black" />
             </div>
             <div className="h-[80px] w-full border-t border-black/10 mt-8 relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                   <path d="M0,35 L20,30 L40,32 L60,25 L80,28 L100,20" fill="none" stroke="var(--accent)" strokeWidth="2" />
                </svg>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricGrid() {
  const metrics = [
    { label: "MARKET GAP", val: "$4.7B", tag: "UP 22%", color: "text-black" },
    { label: "COMPETITORS", val: "05", tag: "NAMED", color: "text-black" },
    { label: "UNIT MARGIN", val: "42%", tag: "OPTIMAL", color: "text-go" },
    { id: "04", label: "RISK LEVEL", val: "MED", tag: "STABLE", color: "text-caution" },
    { label: "CONFIDENCE", val: "88%", tag: "HIGH", color: "text-accent" },
    { label: "VERDICT", val: "GO", tag: "ALPHA", color: "text-go" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-black border-y-2 border-black">
      {metrics.map((m, i) => (
        <div key={i} className="bg-white p-10 border-r-2 border-black last:border-r-0 hover:bg-accent transition-all group">
          <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest mb-6 group-hover:text-black/60">{m.label}</div>
          <div className="flex items-baseline justify-between gap-4">
            <span className={cn("text-5xl font-anton tracking-tight uppercase", m.color)}>{m.val}</span>
            <span className="text-[9px] font-black border border-black px-2 py-0.5 uppercase tracking-widest">{m.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketTab() {
  const data = [
    { year: "2024", tam: 2.1, sam: 0.8 },
    { year: "2025", tam: 2.4, sam: 1.1 },
    { year: "2026", tam: 2.8, sam: 1.5 },
    { year: "2027", tam: 3.2, sam: 2.0 },
    { year: "2028", tam: 3.7, sam: 2.5 },
    { year: "2029", tam: 4.2, sam: 3.0 },
    { year: "2030", tam: 4.7, sam: 3.8 },
  ];
  return (
    <div className="min-h-screen app-page-shell">
    <div className="max-w-7xl mx-auto space-y-24 py-32 px-8">
       <section className="space-y-16">
          <div className="grid grid-cols-[1fr_auto] gap-24 items-end">
             <div className="space-y-8 text-black">
                <div className="text-[12px] font-mono text-black/40 uppercase tracking-[0.25em]">§03 / MARKET POTENTIAL</div>
                <h2 className="text-[clamp(80px,8vw,120px)] font-anton uppercase leading-[0.8] tracking-tighter">THE MARKET<br /><span className="bg-black text-white px-4">DOESN'T LIE.</span></h2>
             </div>
             <div className="flex flex-col items-end gap-6 text-black">
                <div className="text-[11px] font-mono text-black/40 uppercase tracking-widest text-right">PROJECTED CAGR</div>
                <div className="text-6xl font-anton bg-accent px-4 py-1 tracking-tighter">22.4%</div>
             </div>
          </div>
          <div className="surface-paper bg-white p-12 h-[560px] text-black shadow-brutal-lg border-2 border-black relative overflow-hidden group">
             <div className="absolute top-8 left-8 flex gap-8 z-10">
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-black" />
                   <span className="text-[10px] font-mono font-black uppercase tracking-widest">TAM / $4.7B</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-3 h-3 bg-accent" />
                   <span className="text-[10px] font-mono font-black uppercase tracking-widest">SAM / $3.8B</span>
                </div>
             </div>
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 80, right: 30, left: 0, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorSam" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                   <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800 }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800 }} />
                   <Tooltip contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '0', color: '#fff', fontFamily: 'monospace', fontSize: '12px' }} />
                   <Area isAnimationActive={true} type="monotone" dataKey="tam" stroke="#000" fill="#000" fillOpacity={0.05} strokeWidth={3} />
                   <Area isAnimationActive={true} type="monotone" dataKey="sam" stroke="var(--accent)" fill="url(#colorSam)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </section>
    </div>
    </div>
  );
}

function RiskTab() {
  const radarData = [
    { subject: 'MARKET', A: 45 }, { subject: 'TECH', A: 78 }, { subject: 'FINANCIAL', A: 62 }, { subject: 'OPERATIONAL', A: 85 }, { subject: 'REGULATORY', A: 30 }, { subject: 'TEAM', A: 25 },
  ];
  const risks = [
    { cat: "OPERATIONAL", sev: "HIGH", val: "FLEET MAINTENANCE SCALING BEYOND 200 UNITS", mit: "PRE-SIGN REGIONAL PARTNERS" },
    { cat: "TECH", sev: "HIGH", val: "AUTONOMY RELIABILITY IN MIXED TRAFFIC", mit: "PHASED TELE-OP ROLLOUT" },
    { cat: "FINANCIAL", sev: "MED", val: "CAPEX PER VEHICLE STILL €4,800 IN 2026", mit: "LEASE-TO-OWN MODEL" },
  ];
  return (
    <div className="min-h-screen app-page-shell-dark text-white">
    <div className="max-w-7xl mx-auto space-y-24 py-32 px-8">
       <section className="space-y-16">
          <div className="grid grid-cols-[1fr_auto] gap-24 items-end">
             <div className="space-y-8">
                <div className="text-[12px] font-mono text-white/40 uppercase tracking-[0.25em]">§04 / RISK ANALYSIS</div>
                <h2 className="text-[clamp(80px,8vw,120px)] font-anton uppercase leading-[0.8] tracking-tighter text-white">WHERE IT<br /><span className="bg-no-go text-white px-4">BREAKS.</span></h2>
             </div>
             <p className="max-w-[480px] text-[17px] text-white/60 leading-relaxed font-serif italic border-l-4 border-no-go pl-8">Six risk dimensions scored 0-100 (lower is safer). The operational scaling is currently the primary friction point.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-12">
             <div className="bg-white/5 border-2 border-white/10 p-12 h-[500px] shadow-brutal flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                   <RechartsRadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 11, fontFamily: 'monospace', fontWeight: 800 }} />
                      <Radar isAnimationActive={true} dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} strokeWidth={2} />
                   </RechartsRadarChart>
                </ResponsiveContainer>
             </div>
             <div className="space-y-4">
                <div className="grid grid-cols-[140px_1fr_120px] gap-6 px-8 py-4 bg-white/10 text-white font-mono text-[10px] uppercase tracking-widest border-b border-white/20">
                   <span>CATEGORY</span><span>OBJECTION</span><span className="text-right">SEVERITY</span>
                </div>
                {risks.map(r => (
                   <div key={r.cat} className="grid grid-cols-[140px_1fr_120px] gap-6 p-8 bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                      <div className="text-[11px] font-mono text-accent uppercase font-black">{r.cat}</div>
                      <div className="text-xl font-anton uppercase tracking-tight leading-none group-hover:text-accent transition-colors">{r.val}</div>
                      <div className="text-right">
                         <span className={cn(
                            "px-3 py-1 font-black text-[10px] uppercase tracking-widest border border-white/20",
                            r.sev === "HIGH" ? "bg-no-go text-white" : "bg-caution text-black"
                         )}>{r.sev}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </section>
    </div>
    </div>
  );
}

function CompetitionTab() {
  const data = [
    { x: 30, y: 40, name: 'URB-X' },
    { x: 50, y: 20, name: 'PEDAL' },
    { x: 70, y: 30, name: 'ZEROLEET' },
    { x: 20, y: 80, name: 'CARGONAUT' },
    { x: 88, y: 92, name: 'YOU (CARGOFLEET)' },
  ];
  return (
    <div className="min-h-screen app-page-shell">
    <div className="max-w-7xl mx-auto space-y-24 py-32 px-8">
       <section className="space-y-16">
          <div className="grid grid-cols-[1fr_auto] gap-24 items-end">
             <div className="space-y-8 text-black">
                <div className="text-[12px] font-mono text-black/40 uppercase tracking-[0.25em]">§05 / COMPETITIVE POSITIONING</div>
                <h2 className="text-[clamp(80px,8vw,120px)] font-anton uppercase leading-[0.8] tracking-tighter text-black">YOU SIT<br /><span className="bg-accent text-black px-4 text-white">TOP-RIGHT.</span></h2>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
             <div className="surface-paper bg-white p-12 h-[560px] shadow-brutal border-2 border-black relative">
                <div className="absolute top-4 right-4 text-[9px] font-mono font-black uppercase opacity-20">ESTABLISHED / HIGH TRACTION</div>
                <div className="absolute bottom-4 left-4 text-[9px] font-mono font-black uppercase opacity-20">EMERGENT / LOW TRACTION</div>
                <ResponsiveContainer width="100%" height="100%">
                   <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                      <XAxis type="number" dataKey="x" name="traction" hide />
                      <YAxis type="number" dataKey="y" name="viability" hide />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff', fontFamily: 'monospace' }} />
                      <Scatter name="Competitors" data={data} fill="#000">
                         {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name.includes('YOU') ? 'var(--accent)' : '#000'} />
                         ))}
                      </Scatter>
                   </ScatterChart>
                </ResponsiveContainer>
             </div>
             <div className="space-y-8">
                <div className="p-8 border-2 border-black bg-black text-white shadow-brutal space-y-4">
                   <div className="text-[10px] font-mono text-accent uppercase tracking-widest">THE EDGE</div>
                   <div className="text-2xl font-anton uppercase tracking-tight">AUTONOMOUS STACK VS HARDWARE-ONLY</div>
                   <p className="text-[13px] text-white/60 leading-relaxed">Most competitors are building better bikes. You are building the pilot that replaces the human. This is a 28x margin wedge.</p>
                </div>
                <div className="space-y-4">
                   {['URB-X', 'PEDAL', 'ZEROLEET'].map(c => (
                      <div key={c} className="flex justify-between items-center p-6 border-b-2 border-black/5">
                         <span className="font-anton uppercase text-lg">{c}</span>
                         <span className="text-[10px] font-mono font-black border border-black px-2">GAP: NO SOFTWARE</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       </section>
    </div>
    </div>
  );
}

function RevenueTab() {
  const data = [ { year: 'Y1', v: 12, s: 4 }, { year: 'Y2', v: 33, s: 12 }, { year: 'Y3', v: 62, s: 28 }, { year: 'Y4', v: 108, s: 52 }, { year: 'Y5', v: 160, s: 88 } ];
  return (
    <div className="min-h-screen app-page-shell">
    <div className="max-w-7xl mx-auto space-y-24 py-32 px-8 text-black">
       <section className="space-y-16">
          <div className="grid grid-cols-[1fr_auto] gap-24 items-end">
             <div className="space-y-8">
                <div className="text-[12px] font-mono text-black/40 uppercase tracking-[0.25em]">§06 / REVENUE MODEL</div>
                <h2 className="text-[clamp(80px,8vw,120px)] font-anton uppercase leading-[0.8] tracking-tighter"><span className="bg-accent text-black px-4">€42M ARR</span><br />BY YEAR 5.</h2>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
             <div className="surface-paper bg-white p-12 h-[500px] shadow-brutal border-2 border-black">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800 }} />
                      <Bar isAnimationActive={true} dataKey="v" fill="#000" />
                      <Bar isAnimationActive={true} dataKey="s" fill="var(--accent)" />
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-1 gap-6">
                {[
                   { label: "PILOT", price: "€12K", sub: "per city" },
                   { label: "FLEET", price: "€280K", sub: "per operator" },
                   { label: "ENTERPRISE", price: "€1.2M", sub: "annual SaaS" }
                ].map(p => (
                   <div key={p.label} className="p-8 border-2 border-black shadow-brutal space-y-4 bg-white hover:bg-accent transition-all group">
                      <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest">{p.label}</div>
                      <div className="text-4xl font-anton uppercase tracking-tight">{p.price}</div>
                      <div className="text-[10px] font-mono font-black uppercase opacity-40">{p.sub}</div>
                   </div>
                ))}
             </div>
          </div>
       </section>
    </div>
    </div>
  );
}

function AudienceTab() {
  const data = [ { name: 'Logistics', value: 44 }, { name: 'Q-Comm', value: 27 }, { name: 'Postal', value: 17 }, { name: 'Municipal', value: 12 } ];
  return (
    <div className="min-h-screen app-page-shell-dark text-white">
    <div className="max-w-7xl mx-auto space-y-24 py-32 px-8">
       <section className="space-y-16">
          <div className="grid grid-cols-[1fr_auto] gap-24 items-end">
             <div className="space-y-8">
                <div className="text-[12px] font-mono text-white/40 uppercase tracking-[0.25em]">§08 / AUDIENCE</div>
                <h2 className="text-[clamp(80px,8vw,120px)] font-anton uppercase leading-[0.8] tracking-tighter text-white">WHO PAYS<br /><span className="bg-accent text-black px-4">AND WHY.</span></h2>
             </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12">
             <div className="h-[400px] bg-white/5 border-2 border-white/10 p-12 shadow-brutal flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={data} innerRadius={80} outerRadius={120} dataKey="value" isAnimationActive={true}>
                         {data.map((_, i) => <Cell key={i} fill={i === 0 ? 'var(--accent)' : 'white'} opacity={1 - i*0.2} />)}
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                   { label: "LOGISTICS OPS", budget: "€2M+", pain: "Driver shortages", why: "Lower TCO per mile" },
                   { label: "CITY COUNCILS", budget: "€500K", pain: "Carbon targets", why: "Noise/Pollution reduction" }
                ].map(p => (
                   <div key={p.label} className="p-8 border-2 border-white/10 bg-white/5 space-y-6">
                      <div className="text-2xl font-anton uppercase text-accent">{p.label}</div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <span className="text-[9px] font-mono text-white/40 uppercase">BUDGET</span>
                            <div className="text-[13px] font-black">{p.budget}</div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[9px] font-mono text-white/40 uppercase">CORE PAIN</span>
                            <div className="text-[13px] font-black">{p.pain}</div>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[9px] font-mono text-white/40 uppercase">WHY CARGOFLEET?</span>
                         <div className="text-[13px] font-black">{p.why}</div>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </section>
    </div>
    </div>
  );
}

function SWOTTab() {
  const quadrants = [
    { label: "STRENGTHS", items: ["Autonomous unit economics", "Zero-emission positioning", "Existing EU logistics network"], color: "bg-black text-white" },
    { label: "WEAKNESSES", items: ["High upfront CAPEX", "Limited battery swap network", "Tele-op latency issues"], color: "bg-white text-black" },
    { label: "OPPORTUNITIES", items: ["EU city-center ICE bans", "Post-2026 carbon credits", "Scaling to 2nd tier cities"], color: "bg-white text-black" },
    { label: "THREATS", items: ["Chinese OEM market entry", "Regulatory drift in LiDAR", "Raw material price volatility"], color: "bg-black text-white" },
  ];
  return (
    <div className="min-h-screen app-page-shell">
    <div className="max-w-7xl mx-auto py-32 px-8">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black shadow-brutal-lg">
          {quadrants.map(q => (
             <div key={q.label} className={cn("p-12 min-h-[440px] flex flex-col border-black", q.color, q.label === "STRENGTHS" || q.label === "OPPORTUNITIES" ? "border-r-2" : "", q.label === "STRENGTHS" || q.label === "WEAKNESSES" ? "border-b-2" : "")}>
                <div className="text-[12px] font-mono uppercase tracking-[0.25em] mb-12 opacity-60">§08 / {q.label}</div>
                <div className="flex-1 space-y-8">
                   {q.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-6 group">
                         <div className="w-3 h-3 mt-1.5 shrink-0 bg-accent rotate-45 transition-transform" />
                         <span className="text-2xl font-anton uppercase leading-none tracking-tight">{item}</span>
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </div>
    </div>
    </div>
  );
}

function ActionsTab() {
  const actions = [
    { id: "P0", text: "Secure battery swap partner in DACH region", eta: "4w", impact: "CRITICAL" },
    { id: "P0", text: "Refine unit economics for 100+ unit fleets", eta: "6w", impact: "HIGH" },
    { id: "P1", text: "Lobby for urban cargo-bike lane access", eta: "12w", impact: "MED" },
    { id: "P1", text: "Phase 1 tele-op hiring pipeline", eta: "16w", impact: "MED" },
  ];
  return (
    <div className="min-h-screen app-page-shell-dark text-white">
    <div className="max-w-7xl mx-auto py-32 px-8">
       <section className="space-y-16">
          <div className="grid grid-cols-[1fr_auto] gap-24 items-end">
             <div className="space-y-8">
                <div className="text-[12px] font-mono text-white/40 uppercase tracking-[0.25em]">§09 / NEXT ACTIONS</div>
                <h2 className="text-[clamp(80px,8vw,120px)] font-anton uppercase leading-[0.8] tracking-tighter text-white">THE PATH<br /><span className="bg-accent text-black px-4">TO SEED.</span></h2>
             </div>
          </div>
          <div className="space-y-0 border-t-2 border-white/10">
             {actions.map(a => (
                <div key={a.text} className="group border-b-2 border-white/10 p-10 flex justify-between items-center transition-all hover:bg-white/5">
                   <div className="flex items-center gap-12">
                      <span className="text-5xl font-anton text-white/10 group-hover:text-accent transition-colors">{a.id}</span>
                      <div className="space-y-2">
                         <div className="text-[11px] font-mono text-accent uppercase tracking-widest">{a.impact} IMPACT</div>
                         <div className="text-2xl font-anton uppercase text-white tracking-tight leading-none">{a.text}</div>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">TIMELINE</div>
                      <div className="text-3xl font-anton text-white uppercase tabular-nums">{a.eta}</div>
                   </div>
                </div>
             ))}
          </div>
       </section>
    </div>
    </div>
  );
}

function PersonasTab() {
  const d = useDossier();
  const borderColors = ["border-r-go", "border-r-accent", "border-r-caution", "border-r-no-go", "border-r-white"];
  return (
    <div className="min-h-screen app-page-shell">
    <div className="max-w-7xl mx-auto py-32 px-8">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {d.personas.map((p, i) => (
             <div key={p.persona} className={cn("surface-paper p-12 bg-white border-2 border-black border-r-8 shadow-brutal flex flex-col gap-10 transition-all hover:shadow-brutal-lg group", borderColors[i % 5])}>
                <div className="flex justify-between items-start">
                   <div className="space-y-2">
                      <div className="text-[12px] font-mono text-black/40 uppercase tracking-widest">{p.archetype}</div>
                      <h4 className="text-3xl font-anton text-black uppercase tracking-tight leading-none">{p.persona}</h4>
                   </div>
                   <div className={cn(
                      "px-4 py-1.5 font-black text-[11px] uppercase tracking-widest border-2 border-black shadow-[2px_2px_0_0_#000]",
                      p.verdict === "GO" ? "bg-go text-white" : p.verdict === "CAUTION" ? "bg-caution text-black" : "bg-no-go text-white"
                   )}>{p.verdict}</div>
                </div>
                <div className="space-y-6">
                   <div className="text-[18px] text-black font-anton uppercase tracking-tight leading-tight">
                      "{p.pullQuote}"
                   </div>
                   <p className="text-[15px] text-black/60 italic leading-relaxed font-serif pl-8 border-l-2 border-black/10">
                      {p.quote}
                   </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-8 border-t border-black/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-accent" />
                      <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest">AI PANEL MEMBER / REF: P-0{i+1}</div>
                   </div>
                   <div className="text-right">
                      <div className="text-[9px] font-mono text-black/40 uppercase">CONFIDENCE</div>
                      <div className="text-xl font-anton text-black uppercase">{(p.confidence * 100).toFixed(0)}%</div>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
    </div>
  );
}


function OverviewTab() {
  const d = useDossier();
  return (
    <div className="space-y-0">
       <MetricGrid />
       <div className="max-w-7xl mx-auto py-32 px-8 space-y-32">
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-24">
             <div className="space-y-12">
                <div className="space-y-4">
                   <div className="text-[11px] font-mono text-black/40 uppercase tracking-[0.2em]">§02 / SUMMARY COMPASS</div>
                   <h3 className="text-6xl font-anton uppercase tracking-tighter text-black">MULTI-DIMENSIONAL<br />VIABILITY</h3>
                </div>
                <div className="surface-paper bg-white border-2 border-black h-[500px] p-12 shadow-brutal">
                   <ResponsiveContainer width="100%" height="100%">
                      <RechartsRadarChart data={d.scores.map(s => ({ subject: s.label, A: s.score }))}>
                         <PolarGrid stroke="rgba(0,0,0,0.1)" />
                         <PolarAngleAxis dataKey="subject" tick={{ fill: 'black', fontSize: 11, fontFamily: 'monospace', fontWeight: 800 }} />
                         <Radar isAnimationActive={true} dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} strokeWidth={2} />
                      </RechartsRadarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="space-y-12">
                <div className="space-y-4">
                   <div className="text-[11px] font-mono text-black/40 uppercase tracking-[0.2em]">NEXT ACTIONS</div>
                   <h3 className="text-6xl font-anton uppercase tracking-tighter text-black">PRIORITY<br />QUEUE</h3>
                </div>
                <div className="space-y-4">
                   {[
                      "Secure battery swap partner in DACH region.",
                      "Refine unit economics for 100+ unit fleets.",
                      "Lobby for urban cargo-bike lane access.",
                      "Phase 1 tele-op hiring pipeline."
                   ].map((a, i) => (
                      <div key={i} className="flex gap-6 items-start p-8 border-2 border-black bg-white shadow-brutal hover:bg-accent transition-all group">
                         <span className="font-mono text-[11px] font-black opacity-20">0{i+1}</span>
                         <span className="text-[16px] font-anton uppercase tracking-tight leading-tight">{a}</span>
                      </div>
                   ))}
                </div>
             </div>
          </section>
       </div>
    </div>
  );
}

// ── Main Page Entry ──────────────────────────────────────────────────

export default function ResultsPage() {
  const [tab, setTab] = useState("overview");
  const [dossier, setDossier] = useState<ExampleDossier>(exampleDossier);

  useEffect(() => {
    const s = loadSession();
    if (sessionMatchesDossierShape(s)) setDossier(dossierFromSession(s));
  }, []);

  const globalTab = ["market", "risk", "competition", "revenue", "audience", "swot", "actions"].includes(tab) ? (tab === "market" || tab === "risk" || tab === "competition" || tab === "revenue" ? tab : "overview") : tab;

  return (
    <ResultsDossierContext.Provider value={dossier}>
    <main className="min-h-screen bg-black font-sans selection:bg-accent/30 selection:text-white antialiased flex flex-col">
      <TopNav active={globalTab} onChange={setTab} />
      <TickerTape />
      
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full"
          >
            {tab === "overview" && (
              <div className="bg-black">
                <HeroSection />
                <div className="bg-paper text-black min-h-screen border-t-4 border-black"><OverviewTab /></div>
              </div>
            )}
            {tab === "market" && <MarketTab />}
            {tab === "risk" && <RiskTab />}
            {tab === "competition" && <div className="bg-paper text-black min-h-screen"><CompetitionTab /></div>}
            {tab === "revenue" && <div className="bg-paper text-black min-h-screen"><RevenueTab /></div>}
            {tab === "audience" && <div className="bg-black text-white min-h-screen"><AudienceTab /></div>}
            {tab === "swot" && <div className="bg-paper text-black min-h-screen"><SWOTTab /></div>}
            {tab === "actions" && <div className="bg-black text-white min-h-screen"><ActionsTab /></div>}
            {tab === "personas" && <div className="bg-paper text-black min-h-screen"><PersonasTab /></div>}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomTicker />

      <footer className="bg-black border-t border-white/5 py-32 px-8 mb-10">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-sm shadow-brutal">ID</div>
               <div className="flex flex-col text-white"><span className="text-[12px] font-anton uppercase">Priority Debater</span></div>
            </div>
            <div className="text-white/20 font-mono text-[10px] uppercase">© 2026 EMERGENT LABS</div>
         </div>
      </footer>
    </main>
    </ResultsDossierContext.Provider>
  );
}
