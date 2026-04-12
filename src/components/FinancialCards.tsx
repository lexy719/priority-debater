"use client";

import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Target,
  Percent,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FinancialProjectionRow,
  UnitEconomics,
  BreakEvenData,
  CompetitorEntry,
} from "@/lib/parse";

// ── 3-Year Projection Table ──

export function ProjectionTable({ rows }: { rows: FinancialProjectionRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Metric
            </th>
            {["Year 1", "Year 2", "Year 3"].map((y) => (
              <th
                key={y}
                className="py-3 px-3 text-right text-[11px] font-semibold uppercase tracking-wider text-white/40"
              >
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-white/5 transition-colors hover:bg-white/[0.02]",
                i === 0 && "border-b-white/10",
              )}
            >
              <td className="py-3 pr-4 text-[13px] font-medium text-white/70">
                {row.metric}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-[13px] text-white/50">
                {row.year1}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-[13px] text-white/50">
                {row.year2}
              </td>
              <td className="py-3 px-3 text-right tabular-nums text-[13px] font-semibold text-emerald-400/80">
                {row.year3}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Unit Economics Cards ──

const UE_CONFIG: {
  key: keyof UnitEconomics;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "cac", label: "CAC", icon: <DollarSign className="h-4 w-4" />, color: "text-rose-400" },
  { key: "ltv", label: "LTV", icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-400" },
  {
    key: "ltvCacRatio",
    label: "LTV:CAC",
    icon: <Target className="h-4 w-4" />,
    color: "text-indigo-400",
  },
  {
    key: "paybackPeriod",
    label: "Payback",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-400",
  },
  {
    key: "grossMargin",
    label: "Gross Margin",
    icon: <Percent className="h-4 w-4" />,
    color: "text-sky-400",
  },
  {
    key: "churnRate",
    label: "Churn",
    icon: <Users className="h-4 w-4" />,
    color: "text-orange-400",
  },
  {
    key: "arpu",
    label: "ARPU",
    icon: <Wallet className="h-4 w-4" />,
    color: "text-violet-400",
  },
];

export function UnitEconomicsGrid({ data }: { data: UnitEconomics }) {
  const populated = UE_CONFIG.filter((c) => data[c.key]);
  if (populated.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {populated.map(({ key, label, icon, color }) => {
        // Extract the primary number/value from the string
        const raw = data[key]!;
        const numMatch = raw.match(/^\$?[\d,.]+[kKmMbB%]?/);
        const primary = numMatch ? numMatch[0] : raw.split("—")[0].trim();
        const detail = raw.replace(primary, "").replace(/^[\s—–-]+/, "").trim();

        return (
          <div
            key={key}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5 transition-colors hover:border-white/12"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className={cn("opacity-70", color)}>{icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {label}
              </span>
            </div>
            <p className={cn("text-lg font-bold tabular-nums", color)}>{primary}</p>
            {detail && (
              <p className="mt-1 text-[11px] leading-snug text-white/35">{detail}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Break-Even Visual ──

export function BreakEvenCard({ data }: { data: BreakEvenData }) {
  const hasData = data.point || data.timeline || data.milestone || data.fundingNeed;
  if (!hasData) return null;

  return (
    <div className="rounded-2xl border border-emerald-500/15 bg-linear-to-br from-emerald-500/[0.06] to-teal-500/[0.03] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/15">
          <Target className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Break-Even Analysis</h4>
          <p className="text-[11px] text-white/35">When you stop burning cash</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.point && (
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
              Break-even point
            </p>
            <p className="text-sm font-medium text-white/70">{data.point}</p>
          </div>
        )}
        {data.timeline && (
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70">
              Timeline
            </p>
            <p className="text-sm font-medium text-white/70">{data.timeline}</p>
          </div>
        )}
        {data.milestone && (
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/70">
              Key milestone
            </p>
            <p className="text-sm font-medium text-white/70">{data.milestone}</p>
          </div>
        )}
        {data.fundingNeed && (
          <div className="rounded-xl border border-white/6 bg-white/[0.02] p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400/70">
              Funding need
            </p>
            <p className="text-sm font-medium text-white/70">{data.fundingNeed}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Competitive Matrix ──

export function CompetitiveMatrix({ entries }: { entries: CompetitorEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      {entries.map((e, i) => {
        const isYou =
          /your (app|product|idea|startup)/i.test(e.name) || /^you$/i.test(e.name);
        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border p-4 transition-colors",
              isYou
                ? "border-indigo-500/30 bg-indigo-500/[0.08]"
                : "border-white/8 bg-white/[0.02] hover:border-white/12",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isYou && (
                  <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300">
                    You
                  </span>
                )}
                <h4
                  className={cn(
                    "text-sm font-bold",
                    isYou ? "text-indigo-200" : "text-white/80",
                  )}
                >
                  {e.name}
                </h4>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 text-[13px]">
              <div className="flex gap-2">
                <span className="shrink-0 text-white/30">Approach:</span>
                <span className="text-white/55">{e.approach}</span>
              </div>
              <div className="flex gap-2">
                <span className="shrink-0 text-rose-400/60">Weakness:</span>
                <span className="text-white/45">{e.weakness}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
