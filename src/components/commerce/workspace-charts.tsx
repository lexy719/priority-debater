"use client";

/**
 * PD Commerce workspace — recharts visualisations, themed to the chamber palette.
 * Every chart is driven by real report / snapshot data. Concrete hex (not CSS
 * vars) is used so gradients, cells and animations render reliably in recharts.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CommerceSnapshot } from "@/lib/commerce/client-store";
import type { CommerceReport } from "@/lib/commerce/types";

const C = {
  success: "#119464",
  data: "#2563eb",
  warn: "#d98a06",
  danger: "#e23a2e",
  track: "#e8e4dc",
  ink: "#1a1a1a",
  muted: "#6b6580",
  grid: "rgba(0,0,0,0.08)",
};

export function toneHex(n: number): string {
  return n >= 70 ? C.success : n >= 55 ? C.data : n >= 40 ? C.warn : C.danger;
}

const TOOLTIP = {
  background: "#fbfaf6",
  border: "1px solid #1a1a1a",
  borderRadius: 0,
  fontFamily: "var(--app-font-mono)",
  fontSize: 11,
  padding: "6px 10px",
} as const;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const short = (s: string) => (s.length > 10 ? s.slice(0, 9) + "…" : s);

/* ── Visibility trend (Dashboard) ── */
export function TrendArea({ snaps }: { snaps: CommerceSnapshot[] }) {
  const data = snaps.map((s) => ({ d: fmtDate(s.at), Score: s.overall, Google: s.google, AI: s.ai, Agent: s.agent }));
  const color = toneHex(snaps[snaps.length - 1]?.overall ?? 0);
  return (
    <div className="h-44 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="pdTrend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="d" tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} width={26} />
          <Tooltip contentStyle={TOOLTIP} cursor={{ stroke: C.muted, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="Score" stroke={color} strokeWidth={2.5} fill="url(#pdTrend)" dot={{ r: 2.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 4 }} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Channel scores (Dashboard) ── */
export function ChannelBars({ google, ai, agent }: { google: number; ai: number; agent: number }) {
  const data = [
    { name: "GOOGLE", v: google },
    { name: "AI", v: ai },
    { name: "AGENT", v: agent },
  ];
  return (
    <div className="h-36 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 2, right: 34, left: 6, bottom: 2 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: C.ink }} axisLine={false} tickLine={false} width={54} />
          <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="v" barSize={20} background={{ fill: C.track }} label={{ position: "right", fontSize: 11, fill: C.ink }} animationDuration={700}>
            {data.map((d, i) => (
              <Cell key={i} fill={toneHex(d.v)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Share of AI voice (Competitor radar) ── */
type Row = { name: string; share: number; you: boolean };
export function ShareBars({ rows }: { rows: Row[] }) {
  const shares = [...rows].map((r) => r.share).sort((a, b) => a - b);
  const median = shares.length ? shares[Math.floor(shares.length / 2)] : 0;
  const data = rows.map((r) => ({ name: r.you ? "YOU" : short(r.name), share: r.share, you: r.you }));
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 10, left: -18, bottom: 2 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.muted }} axisLine={{ stroke: C.grid }} tickLine={false} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} width={26} />
          <Tooltip contentStyle={TOOLTIP} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <ReferenceLine y={median} stroke={C.warn} strokeDasharray="4 4" />
          <Bar dataKey="share" barSize={38} label={{ position: "top", fontSize: 11, fill: C.ink }} animationDuration={700}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.you ? C.danger : C.data} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Visibility shape radar (Competitor radar) ── */
export function VisibilityRadar({ report }: { report: CommerceReport }) {
  const s = report.scores;
  const check = (kw: string) => (s.agentReadiness.checks.find((c) => c.label.toLowerCase().includes(kw))?.ok ? 100 : 0);
  const data = [
    { axis: "AI Chat", v: s.ai.score },
    { axis: "Google", v: s.google.score },
    { axis: "Agent", v: s.agentReadiness.score },
    { axis: "Schema", v: check("machine") },
    { axis: "Crawlers", v: check("crawlers") },
    { axis: "Manifest", v: check("llms") },
  ];
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="70%">
          <PolarGrid stroke="rgba(0,0,0,0.12)" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: C.ink }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="v" stroke={C.data} fill={C.data} fillOpacity={0.22} strokeWidth={2} animationDuration={700} />
          <Tooltip contentStyle={TOOLTIP} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Per-query sparkline (Query monitor) — fixed size, no ResponsiveContainer ── */
export function MiniSpark({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="font-mono text-[10px] text-muted-foreground">baseline</span>;
  const up = values[values.length - 1] >= values[0];
  const data = values.map((v, i) => ({ i, v }));
  return (
    <LineChart width={80} height={28} data={data} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
      <YAxis hide domain={[0, 100]} />
      <Line dataKey="v" type="monotone" stroke={up ? C.success : C.danger} strokeWidth={1.5} dot={false} isAnimationActive={false} />
    </LineChart>
  );
}
