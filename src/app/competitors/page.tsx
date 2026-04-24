"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Radar,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  Users,
  Crosshair,
  Swords,
  Eye,
  Calendar,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { StudioChrome } from "@/components/studio-chrome";
import { GlowCard } from "@/components/ui/glow-card";
import { loadSessionWithStatus } from "@/lib/session";
import { messageFromFailedResponse } from "@/lib/read-api-error";
import type { ValidationSession } from "@/lib/types";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type CompetitorBlueprint = {
  executive: {
    landscape: string;
    wedge: string;
    biggestThreat: string;
    biggestOpportunity: string;
    nextValidation: string;
    marketDensity: "open" | "moderate" | "crowded";
  };
  marketMap: {
    direct: string[];
    indirect: string[];
    incumbents: string[];
  };
  players: Array<{
    name: string;
    type: "direct" | "indirect" | "incumbent";
    positioning: string;
    pricingSignal: string;
    strength: string;
    weakness: string;
    threatLevel: number;
    switchingRisk: string;
    howWeWin: string;
  }>;
  matrix: Array<{
    dimension: string;
    ourClaim: string;
    competitorReality: string;
    gapAction: string;
  }>;
  winLoss: Array<{
    scenario: "win" | "loss";
    trigger: string;
    playbook: string;
  }>;
  intelligenceTasks: Array<{
    task: string;
    source: string;
    timebox: string;
    signal: string;
  }>;
  ninetyDayPlan: string[];
};

// ────────────────────────────────────────────────────────────
// SVG Charts
// ────────────────────────────────────────────────────────────

function ThreatRadarChart({ players }: { players: CompetitorBlueprint["players"] }) {
  const n = players.length;
  if (n < 3) return null;
  const cx = 150, cy = 150, maxR = 110;

  const rings = [2, 4, 6, 8, 10];

  function polarToXY(r: number, idx: number) {
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  const dataPoints = players.map((p, i) => {
    const r = (p.threatLevel / 10) * maxR;
    return polarToXY(r, i);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox="0 0 300 300" className="w-full h-auto">
        {/* Grid rings */}
        {rings.map((ring) => {
          const r = (ring / 10) * maxR;
          const pts = Array.from({ length: n }, (_, i) => polarToXY(r, i));
          const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
          return <path key={ring} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={ring === 10 ? 1.5 : 0.5} />;
        })}

        {/* Axis lines */}
        {players.map((_, i) => {
          const p = polarToXY(maxR, i);
          return <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />;
        })}

        {/* Gradient defs */}
        <defs>
          <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Data polygon */}
        <motion.path
          d={dataPath}
          fill="url(#radarGrad)"
          stroke="#f43f5e"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <motion.circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={5}
            fill="#f43f5e"
            stroke="#08080e"
            strokeWidth={2.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
          />
        ))}

        {/* Labels */}
        {players.map((p, i) => {
          const pos = polarToXY(maxR + 24, i);
          return (
            <text key={`label-${i}`} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.45)" fontSize={9} fontWeight={600}>
              {p.name.length > 14 ? p.name.slice(0, 12) + "…" : p.name}
              <tspan x={pos.x} dy={13} fontSize={10} fontWeight={700} fill="rgba(251,113,133,0.8)">
                {p.threatLevel}/10
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MarketDonutChart({ marketMap }: { marketMap: CompetitorBlueprint["marketMap"] }) {
  const segments = [
    { label: "Direct", count: marketMap.direct.length, color: "#ef4444", colorFaded: "rgba(239,68,68,0.15)" },
    { label: "Indirect", count: marketMap.indirect.length, color: "#f59e0b", colorFaded: "rgba(245,158,11,0.15)" },
    { label: "Incumbents", count: marketMap.incumbents.length, color: "#3b82f6", colorFaded: "rgba(59,130,246,0.15)" },
  ];
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  const cx = 80, cy = 80, r = 60, strokeW = 18;
  const circumference = 2 * Math.PI * r;
  let accumulatedOffset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} />
        {segments.map((seg, i) => {
          const pct = seg.count / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const offset = -circumference * 0.25 + accumulatedOffset;
          accumulatedOffset += dash;
          return (
            <motion.circle
              key={seg.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeW}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dash} ${gap}` }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.7, ease: "easeOut" }}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="700">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="500">
          PLAYERS
        </text>
      </svg>
      <div className="space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-white/70 font-medium">{seg.label}</span>
            <span className="text-xs font-bold text-white/90">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function DensityBadge({ density }: { density: CompetitorBlueprint["executive"]["marketDensity"] }) {
  const config = {
    open: { cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300", icon: <TrendingUp className="w-3 h-3" /> },
    moderate: { cls: "border-amber-500/30 bg-amber-500/15 text-amber-300", icon: <Target className="w-3 h-3" /> },
    crowded: { cls: "border-rose-500/30 bg-rose-500/15 text-rose-300", icon: <Users className="w-3 h-3" /> },
  }[density];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${config.cls}`}>
      {config.icon}
      {density} market
    </span>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <GlowCard glowColor={color} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-2">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/8">
          {icon}
        </div>
      </div>
    </GlowCard>
  );
}

function ThreatBar({ name, level, type }: { name: string; level: number; type: string }) {
  const typeColors: Record<string, string> = {
    direct: "text-red-300",
    indirect: "text-amber-300",
    incumbent: "text-blue-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-xl border border-white/8 bg-black/25 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{name}</p>
          <span className={`text-[9px] font-bold uppercase tracking-wider ${typeColors[type] || "text-white/50"}`}>
            {type}
          </span>
        </div>
        <span className="shrink-0 rounded-md border border-white/12 bg-white/6 px-2 py-0.5 text-[10px] font-bold text-white/80">
          {level}/10
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #f59e0b ${Math.max(0, 100 - level * 10)}%, #ef4444 100%)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(8, Math.min(100, level * 10))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

function BattleCard({ player, delay }: { player: CompetitorBlueprint["players"][0]; delay: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeStyle: Record<string, { border: string; bg: string; text: string }> = {
    direct: { border: "border-red-500/20", bg: "bg-red-500/8", text: "text-red-300" },
    indirect: { border: "border-amber-500/20", bg: "bg-amber-500/8", text: "text-amber-300" },
    incumbent: { border: "border-blue-500/20", bg: "bg-blue-500/8", text: "text-blue-300" },
  };
  const style = typeStyle[player.type] || typeStyle.direct;
  const threatColor = player.threatLevel >= 7 ? "text-rose-400" : player.threatLevel >= 4 ? "text-amber-400" : "text-emerald-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-2xl border ${style.border} ${style.bg} p-4 transition-all hover:border-white/15`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-white truncate">{player.name}</h3>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
            {player.type}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-1 rounded-lg border border-white/12 bg-black/30 px-2.5 py-1 ${threatColor}`}>
            <Crosshair className="w-3 h-3" />
            <span className="text-[11px] font-bold">{player.threatLevel}/10</span>
          </div>
        </div>
      </div>

      {/* Positioning */}
      <p className="text-xs text-white/65 leading-relaxed mb-3">{player.positioning}</p>

      {/* Strength / Weakness pills */}
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-300">{player.strength}</span>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          <span className="text-[10px] font-medium text-rose-300">{player.weakness}</span>
        </div>
      </div>

      {/* Toggle details */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] font-semibold text-white/40 hover:text-white/70 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Less" : "More details"}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 pt-3 border-t border-white/6">
              <div className="text-xs text-white/60">
                <span className="text-white/85 font-medium">Pricing:</span> {player.pricingSignal}
              </div>
              <div className="text-xs text-white/60">
                <span className="text-white/85 font-medium">Switching risk:</span> {player.switchingRisk}
              </div>
              <div className="text-xs text-white/60">
                <span className="text-indigo-300 font-medium">How we win:</span> {player.howWeWin}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────

export default function CompetitorsStudioPage() {
  const router = useRouter();
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [blueprint, setBlueprint] = useState<CompetitorBlueprint | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRunDone = useRef(false);
  const [activeType, setActiveType] = useState<"all" | "direct" | "indirect" | "incumbent">("all");
  const [activeSection, setActiveSection] = useState<"overview" | "battlecards" | "matrix" | "playbook">("overview");

  useEffect(() => {
    const result = loadSessionWithStatus();
    if (result.status === "expired") {
      alert("Your session has expired (24h limit). Please start a new validation.");
      router.replace("/validate");
      return;
    }
    if (result.status === "none") {
      router.replace("/validate");
      return;
    }
    const s = result.session;
    if (s.setup.template === "generate") {
      router.replace("/validate");
      return;
    }
    setSession(s);
  }, [router]);

  const run = useCallback(async () => {
    if (!session) return;
    setGenerating(true);
    setError(null);
    setBlueprint(null);
    try {
      const response = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setup: session.setup,
          validationContent: session.validationContent,
        }),
      });
      if (!response.ok) throw new Error(await messageFromFailedResponse(response));
      const data = (await response.json()) as CompetitorBlueprint;
      setBlueprint(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate competitor intelligence.");
    } finally {
      setGenerating(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session || autoRunDone.current) return;
    autoRunDone.current = true;
    void run();
  }, [session, run]);

  const topThreat = useMemo(() => {
    if (!blueprint?.players?.length) return null;
    return [...blueprint.players].sort((a, b) => b.threatLevel - a.threatLevel)[0];
  }, [blueprint]);

  const avgThreat = useMemo(() => {
    if (!blueprint?.players?.length) return 0;
    return Math.round((blueprint.players.reduce((s, p) => s + p.threatLevel, 0) / blueprint.players.length) * 10) / 10;
  }, [blueprint]);

  const filteredPlayers = useMemo(() => {
    if (!blueprint) return [];
    if (activeType === "all") return blueprint.players;
    return blueprint.players.filter((p) => p.type === activeType);
  }, [blueprint, activeType]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080e]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500/50" />
      </div>
    );
  }

  const sectionTabs = [
    { id: "overview" as const, label: "Overview", icon: <Radar className="w-3.5 h-3.5" /> },
    { id: "battlecards" as const, label: "Battle Cards", icon: <Swords className="w-3.5 h-3.5" /> },
    { id: "matrix" as const, label: "Matrix", icon: <Target className="w-3.5 h-3.5" /> },
    { id: "playbook" as const, label: "Playbook", icon: <Calendar className="w-3.5 h-3.5" /> },
  ];

  return (
    <StudioChrome title={session.setup.topic} eyebrow="Competitive intelligence" maxWidthClass="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/15 border border-rose-500/25">
          <Radar className="w-4.5 h-4.5 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Competitor Analysis</h2>
      </div>
      <p className="text-white/40 text-sm max-w-2xl mx-auto text-center mb-8">
        Decision-ready competitor map with threat radar, battle cards, positioning matrix, and a 90-day execution plan.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty + generate CTA */}
      {!blueprint && !generating && (
        <GlowCard glowColor="rgba(251,113,133,0.35)" className="rounded-2xl border border-white/8 bg-linear-to-br from-rose-500/12 to-orange-500/8 p-8 text-center">
          <div className="mx-auto mb-4 max-w-xl">
            <p className="text-sm leading-relaxed text-white/80">
              We map direct/indirect competitors, rank threats, and generate concrete counter-plays from your validation context.
            </p>
          </div>
          <button
            type="button"
            onClick={run}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-500/20 transition-all hover:shadow-rose-500/35 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" />
            Generate competitor intelligence
          </button>
        </GlowCard>
      )}

      {/* Loading skeleton */}
      {generating && !blueprint && (
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-rose-400/60" />
            Analyzing market landscape and direct threats...
          </div>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl border border-white/8 bg-white/[0.03] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-white/8 bg-white/[0.03] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
            <div className="h-72 rounded-2xl border border-white/8 bg-white/[0.03] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      {blueprint && (
        <div className="space-y-6">
          {/* Refresh */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={run}
              disabled={generating}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs text-white/70 hover:bg-white/8 disabled:opacity-40 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
              Refresh analysis
            </button>
          </div>

          {/* ── Level 1: KPI stat cards ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid gap-4 grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              label="Market density"
              value={blueprint.executive.marketDensity.charAt(0).toUpperCase() + blueprint.executive.marketDensity.slice(1)}
              color={
                blueprint.executive.marketDensity === "open"
                  ? "rgba(16,185,129,0.25)"
                  : blueprint.executive.marketDensity === "moderate"
                    ? "rgba(245,158,11,0.25)"
                    : "rgba(239,68,68,0.25)"
              }
              icon={<Shield className="w-5 h-5 text-white/50" />}
            />
            <StatCard
              label="Top threat"
              value={topThreat ? `${topThreat.threatLevel}/10` : "—"}
              color="rgba(239,68,68,0.25)"
              icon={<Crosshair className="w-5 h-5 text-rose-400/60" />}
            />
            <StatCard
              label="Total players"
              value={String(blueprint.players.length)}
              color="rgba(99,102,241,0.25)"
              icon={<Users className="w-5 h-5 text-indigo-400/60" />}
            />
            <StatCard
              label="Avg. threat"
              value={String(avgThreat)}
              color="rgba(245,158,11,0.25)"
              icon={<TrendingUp className="w-5 h-5 text-amber-400/60" />}
            />
          </motion.div>

          {/* ── Executive read ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl border border-white/7 bg-white/[0.03] p-5"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Executive read</p>
              <DensityBadge density={blueprint.executive.marketDensity} />
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{blueprint.executive.landscape}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/6 bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Wedge strategy</p>
                <p className="text-xs text-white/70">{blueprint.executive.wedge}</p>
              </div>
              <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-300/60 mb-1">Biggest threat</p>
                <p className="text-xs text-rose-200/80">{blueprint.executive.biggestThreat}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/60 mb-1">Biggest opportunity</p>
                <p className="text-xs text-emerald-200/80">{blueprint.executive.biggestOpportunity}</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-black/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">Next validation</p>
                <p className="text-xs text-white/70">{blueprint.executive.nextValidation}</p>
              </div>
            </div>
          </motion.div>

          {/* ── Section tabs ── */}
          <div className="flex gap-1.5 rounded-xl border border-white/8 bg-white/[0.02] p-1.5 overflow-x-auto scrollbar-hide">
            {sectionTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                  activeSection === tab.id
                    ? "bg-white/8 text-white shadow-sm"
                    : "text-white/40 hover:text-white/70 hover:bg-white/4"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW SECTION ── */}
          <AnimatePresence mode="wait">
            {activeSection === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Charts grid */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Threat radar */}
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Threat radar</p>
                    {blueprint.players.length >= 3 ? (
                      <ThreatRadarChart players={blueprint.players} />
                    ) : (
                      <div className="flex items-center justify-center py-16 text-xs text-white/30">
                        Need 3+ competitors for radar chart
                      </div>
                    )}
                  </div>

                  {/* Market composition donut + threat bars */}
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Market composition</p>
                      <MarketDonutChart marketMap={blueprint.marketMap} />
                    </div>
                  </div>
                </div>

                {/* Threat heatmap */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Threat heatmap</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {blueprint.players
                      .slice()
                      .sort((a, b) => b.threatLevel - a.threatLevel)
                      .map((p, idx) => (
                        <ThreatBar key={`${p.name}-threat-${idx}`} name={p.name} level={p.threatLevel} type={p.type} />
                      ))}
                  </div>
                </div>

                {/* Market map categories */}
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: "Direct", items: blueprint.marketMap.direct, border: "border-red-500/25", bg: "bg-red-500/8", text: "text-red-200", icon: <Swords className="w-3.5 h-3.5 text-red-400" /> },
                    { title: "Indirect", items: blueprint.marketMap.indirect, border: "border-amber-500/25", bg: "bg-amber-500/8", text: "text-amber-200", icon: <Eye className="w-3.5 h-3.5 text-amber-400" /> },
                    { title: "Incumbents", items: blueprint.marketMap.incumbents, border: "border-blue-500/25", bg: "bg-blue-500/8", text: "text-blue-200", icon: <Shield className="w-3.5 h-3.5 text-blue-400" /> },
                  ].map((group) => (
                    <div key={group.title} className={`rounded-2xl border p-4 ${group.border} ${group.bg}`}>
                      <div className="flex items-center gap-2 mb-3">
                        {group.icon}
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${group.text}`}>{group.title}</p>
                      </div>
                      <ul className="space-y-2">
                        {group.items.map((item, idx) => (
                          <li key={`${item}-${idx}`} className={`text-xs leading-relaxed ${group.text} opacity-90`}>
                            <span className="mr-1.5 inline-block h-1 w-1 rounded-full bg-current align-middle" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── BATTLE CARDS SECTION ── */}
            {activeSection === "battlecards" && (
              <motion.div
                key="battlecards"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Type filter */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all" as const, label: "All", count: blueprint.players.length },
                    { id: "direct" as const, label: "Direct", count: blueprint.players.filter(p => p.type === "direct").length },
                    { id: "indirect" as const, label: "Indirect", count: blueprint.players.filter(p => p.type === "indirect").length },
                    { id: "incumbent" as const, label: "Incumbents", count: blueprint.players.filter(p => p.type === "incumbent").length },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setActiveType(opt.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        activeType === opt.id
                          ? "border-indigo-400/40 bg-indigo-500/20 text-indigo-200"
                          : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
                      }`}
                    >
                      {opt.label}
                      <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{opt.count}</span>
                    </button>
                  ))}
                </div>

                {/* Cards grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredPlayers.map((p, idx) => (
                    <BattleCard key={`${p.name}-${idx}`} player={p} delay={idx * 0.08} />
                  ))}
                </div>

                {filteredPlayers.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center">
                    <p className="text-sm text-white/40">No competitors match this filter.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── MATRIX SECTION ── */}
            {activeSection === "matrix" && (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Positioning matrix */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 overflow-x-auto">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Positioning matrix</p>
                  <table className="w-full min-w-[700px] border-separate border-spacing-y-2 text-left text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-white/50 font-semibold rounded-l-lg bg-white/4">Dimension</th>
                        <th className="px-3 py-2 text-white/50 font-semibold bg-white/4">Our claim</th>
                        <th className="px-3 py-2 text-white/50 font-semibold bg-white/4">Competitor reality</th>
                        <th className="px-3 py-2 text-white/50 font-semibold rounded-r-lg bg-white/4">Gap action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blueprint.matrix.map((row, idx) => (
                        <motion.tr
                          key={`${row.dimension}-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="group"
                        >
                          <td className="px-3 py-3 font-medium text-white rounded-l-lg bg-black/20 border-l border-y border-white/6 group-hover:bg-white/[0.04] transition-colors">{row.dimension}</td>
                          <td className="px-3 py-3 text-white/70 bg-black/20 border-y border-white/6 group-hover:bg-white/[0.04] transition-colors">{row.ourClaim}</td>
                          <td className="px-3 py-3 text-white/60 bg-black/20 border-y border-white/6 group-hover:bg-white/[0.04] transition-colors">{row.competitorReality}</td>
                          <td className="px-3 py-3 text-indigo-300 font-medium rounded-r-lg bg-black/20 border-r border-y border-white/6 group-hover:bg-white/[0.04] transition-colors">{row.gapAction}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top threat spotlight */}
                {topThreat && (
                  <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-br from-rose-500/10 to-orange-500/5 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Crosshair className="w-4 h-4 text-rose-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-200/80">Top threat spotlight</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-base font-bold text-white mb-1">{topThreat.name}</p>
                        <p className="text-xs text-white/60 mb-3">{topThreat.positioning}</p>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Threat: {topThreat.threatLevel}/10</span>
                          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Risk: {topThreat.switchingRisk}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-2.5">
                          <p className="text-[10px] font-semibold text-emerald-300/70 mb-0.5">Their strength</p>
                          <p className="text-xs text-emerald-200/80">{topThreat.strength}</p>
                        </div>
                        <div className="rounded-lg border border-indigo-500/15 bg-indigo-500/5 p-2.5">
                          <p className="text-[10px] font-semibold text-indigo-300/70 mb-0.5">How we win</p>
                          <p className="text-xs text-indigo-200/80">{topThreat.howWeWin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PLAYBOOK SECTION ── */}
            {activeSection === "playbook" && (
              <motion.div
                key="playbook"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Win / Loss scenarios */}
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Win scenarios</p>
                    </div>
                    <div className="space-y-3">
                      {blueprint.winLoss.filter(s => s.scenario === "win").map((s, idx) => (
                        <motion.div
                          key={`win-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5"
                        >
                          <p className="text-xs text-white/75 mb-1.5"><span className="text-emerald-300 font-medium">Trigger:</span> {s.trigger}</p>
                          <p className="text-xs text-white/60"><span className="text-indigo-300 font-medium">Playbook:</span> {s.playbook}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Loss scenarios</p>
                    </div>
                    <div className="space-y-3">
                      {blueprint.winLoss.filter(s => s.scenario === "loss").map((s, idx) => (
                        <motion.div
                          key={`loss-${idx}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3.5"
                        >
                          <p className="text-xs text-white/75 mb-1.5"><span className="text-rose-300 font-medium">Trigger:</span> {s.trigger}</p>
                          <p className="text-xs text-white/60"><span className="text-indigo-300 font-medium">Playbook:</span> {s.playbook}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Intelligence backlog */}
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-4 h-4 text-violet-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Intelligence backlog</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {blueprint.intelligenceTasks.map((task, idx) => (
                      <motion.div
                        key={`${task.task}-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="rounded-xl border border-white/8 bg-black/20 p-4"
                      >
                        <p className="text-xs font-semibold text-white mb-2">{task.task}</p>
                        <div className="space-y-1">
                          <p className="text-[11px] text-white/50">
                            <span className="text-white/70 font-medium">Source:</span> {task.source}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/60">
                              <Calendar className="w-2.5 h-2.5" />
                              {task.timebox}
                            </span>
                            <span className="text-[10px] text-indigo-300 font-medium">{task.signal}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 90-day plan */}
                <div className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-200/80">90-day execution plan</p>
                  </div>
                  <div className="space-y-3">
                    {blueprint.ninetyDayPlan.map((step, idx) => (
                      <motion.div
                        key={`${step}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/15 text-[10px] font-bold text-indigo-200">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed pt-0.5">{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </StudioChrome>
  );
}
