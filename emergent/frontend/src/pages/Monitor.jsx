import { Box, FullNav } from "../components/Nav";
import { Section, Meta } from "../components/Blocks";
import {
  ChartCard,
  DarkTooltip,
  LegendDot,
  Delta,
  Coach,
  monoTick,
  axisLine,
} from "../components/Charts";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
  Tooltip,
} from "recharts";

const stats = [
  { idx: "INDEX 01", color: "#2d6bff", label: "AI VISIBILITY", value: "47", note: "vs 22 last week", green: true, delta: "+25" },
  { idx: "INDEX 02", color: "#22c55e", label: "AGENT VISITS", value: "23", note: "ChatGPT, Gemini, Perplexity", delta: "+9" },
  { idx: "INDEX 03", color: "#f5c842", label: "BUYER INTENT SIGNALS", value: "3", note: "looked like purchases", delta: "+2" },
  { idx: "INDEX 04", color: "#2d6bff", label: "EST. AI REVENUE", value: "€820", note: "AI channel this month", delta: "+€540" },
];

const scoreTrend = [
  { week: "WK 1", you: 22, saatva: 60, colmol: 48, purple: 55 },
  { week: "WK 2", you: 35, saatva: 61, colmol: 50, purple: 56 },
  { week: "WK 3", you: 41, saatva: 63, colmol: 55, purple: 57 },
  { week: "WK 4", you: 47, saatva: 64, colmol: 65, purple: 58 },
];

const agentVisits = [
  { day: "MON", ChatGPT: 2, Gemini: 1, Perplexity: 0 },
  { day: "TUE", ChatGPT: 3, Gemini: 1, Perplexity: 1 },
  { day: "WED", ChatGPT: 1, Gemini: 2, Perplexity: 1 },
  { day: "THU", ChatGPT: 2, Gemini: 0, Perplexity: 1 },
  { day: "FRI", ChatGPT: 3, Gemini: 1, Perplexity: 0 },
  { day: "SAT", ChatGPT: 1, Gemini: 1, Perplexity: 1 },
  { day: "SUN", ChatGPT: 2, Gemini: 1, Perplexity: 0 },
];

const intentFunnel = [
  { stage: "AGENT VISITS", value: 23, color: "#2d6bff" },
  { stage: "PRODUCT VIEWS", value: 14, color: "#2d6bff" },
  { stage: "PRICING CHECKS", value: 6, color: "#f5c842" },
  { stage: "PURCHASE INTENT", value: 3, color: "#22c55e" },
];

const queryCoverage = [
  { q: "SPECIALIST", score: 71, named: true },
  { q: "PORTUGAL MATTRESSES", score: 12, named: false },
  { q: "BEST OVERALL", score: 8, named: false },
  { q: "BUDGET OPTION", score: 5, named: false },
  { q: "LUXURY", score: 0, named: false },
];

const radar = [
  { dim: "CRAWLERS", you: 40, rivals: 90, leader: 98 },
  { dim: "SCHEMA", you: 30, rivals: 85, leader: 95 },
  { dim: "REVIEWS", you: 20, rivals: 80, leader: 92 },
  { dim: "FAQ", you: 25, rivals: 70, leader: 88 },
  { dim: "COMPARISON", you: 15, rivals: 75, leader: 90 },
  { dim: "CITATIONS", you: 10, rivals: 88, leader: 96 },
  { dim: "FRESHNESS", you: 35, rivals: 65, leader: 85 },
  { dim: "PRICING", you: 45, rivals: 78, leader: 93 },
];

const gauge = [{ name: "AI Visibility", value: 47, fill: "#2d6bff" }];

const activity = [
  ["2026-06-21 14:32", "ChatGPT", "'mattress Portugal'", "viewed 3 products"],
  ["2026-06-21 09:15", "Gemini", "'best mattress under €500'", "compared pricing"],
  ["2026-06-20 22:08", "Perplexity", "'colchão king size'", "checked stock"],
  ["2026-06-20 16:44", "ChatGPT", "'memory foam vs hybrid'", "read comparison"],
  ["2026-06-19 11:27", "Gemini", "'mattress free trial Portugal'", "viewed returns"],
  ["2026-06-19 08:03", "Perplexity", "'best value mattress 2026'", "viewed 2 products"],
];

const competitors = [
  { name: "Saatva", rank: "RANK 01", color: "#2d6bff", change: "62 → 64", stats: ["+2 PTS", "NAMED 4/5", "↑ WK"], pill: null },
  { name: "Purple", rank: "RANK 02", color: "#f5c842", change: "58 → 58", stats: ["0 PTS", "NAMED 3/5", "→ WK"], pill: null },
  { name: "Colmol", rank: "RANK 03", color: "#22c55e", change: "51 → 65", stats: ["+14 PTS", "NAMED 3/5", "↑ WK"], pill: "MOVING UP", pillType: "fail" },
  { name: "Your Store", rank: "RANK 05", color: "#2d6bff", change: "22 → 47", stats: ["+25 PTS", "NAMED 0/5", "↑↑ WK"], pill: "FASTEST GROWTH", pillType: "live", you: true },
];

export default function Monitor() {
  return (
    <div className="min-h-screen bg-black">
      <FullNav active="MONITOR" />

      {/* Hero stats + feed (BLACK) */}
      <Section variant="black" testid="monitor-hero">
        <Meta>→ 01 / MONITOR / YOUR STORE IN THE AI CHANNEL</Meta>
        <p className="text-white text-base sm:text-lg max-w-3xl mt-5" data-testid="ai-channel-feed">
          This week, an AI agent visited your store{" "}
          <span className="text-[#2d6bff]">23 times</span>. 3 sessions looked
          like purchase intent — they checked pricing and availability.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8" data-testid="monitor-stats">
          {stats.map((s) => (
            <div key={s.idx} className="bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <div className="flex items-start justify-between mb-5">
                <span className="w-4 h-4 inline-block" style={{ background: s.color }} />
                <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider">{s.idx}</span>
              </div>
              <div className="pd-label mb-3">{s.label}</div>
              <div className="flex items-end gap-2 flex-wrap">
                <div className="font-display text-5xl sm:text-6xl text-white leading-none">{s.value}</div>
                {s.delta && <Delta className="mb-1">{s.delta}</Delta>}
              </div>
              <div className={`font-mono text-[11px] mt-4 ${s.green ? "text-[#22c55e]" : "text-[#888888]"}`}>{s.note}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Intelligence / charts (BLACK) */}
      <Section variant="black" testid="monitor-intelligence">
        <Meta className="mb-6">→ 02 / INTELLIGENCE / DEEP READ</Meta>

        {/* Score trajectory vs rivals — full width */}
        <ChartCard
          title="Score trajectory vs rivals"
          meta="4 WEEKS · 0–100"
          height="h-[360px]"
          testid="chart-trajectory"
          legend={
            <>
              <LegendDot color="#2d6bff" label="You" />
              <LegendDot color="#e8272a" label="Colmol (rising)" />
              <LegendDot color="#888888" label="Saatva" />
              <LegendDot color="#555555" label="Purple" />
            </>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={scoreTrend} margin={{ top: 10, right: 20, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="week" stroke="#555555" tick={monoTick} axisLine={axisLine} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#555555" tick={monoTick} axisLine={axisLine} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ stroke: "#333333" }} />
              <ReferenceLine y={62} stroke="#444444" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="you" name="You" stroke="#2d6bff" strokeWidth={2.5} fill="#2d6bff" fillOpacity={0.14} dot={{ fill: "#2d6bff", r: 3 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="colmol" name="Colmol" stroke="#e8272a" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="saatva" name="Saatva" stroke="#888888" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="purple" name="Purple" stroke="#555555" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Row: gauge + visits + funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <ChartCard title="AI visibility" meta="47 / 100" height="h-[260px]" testid="chart-gauge">
            <div className="relative h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="72%" outerRadius="100%" data={gauge} startAngle={90} endAngle={90 - (360 * 47) / 100}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: "#1a1a1a" }} dataKey="value" cornerRadius={0} isAnimationActive={false} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-5xl text-white leading-none">47</span>
                <span className="font-mono text-[10px] text-[#888888] uppercase mt-1">+25 this week</span>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="AI agent visits"
            meta="LAST 7 DAYS"
            height="h-[260px]"
            testid="chart-visits"
            legend={
              <>
                <LegendDot color="#2d6bff" label="ChatGPT" />
                <LegendDot color="#f5c842" label="Gemini" />
                <LegendDot color="#888888" label="Perplexity" />
              </>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentVisits} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                <CartesianGrid stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="day" stroke="#555555" tick={monoTick} axisLine={axisLine} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#555555" tick={monoTick} axisLine={axisLine} tickLine={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="ChatGPT" stackId="a" fill="#2d6bff" isAnimationActive={false} />
                <Bar dataKey="Gemini" stackId="a" fill="#f5c842" isAnimationActive={false} />
                <Bar dataKey="Perplexity" stackId="a" fill="#888888" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Buyer intent funnel" meta="THIS WEEK" height="h-[260px]" testid="chart-funnel">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={intentFunnel} margin={{ top: 4, right: 30, bottom: 0, left: 0 }}>
                <XAxis type="number" hide domain={[0, 24]} />
                <YAxis type="category" dataKey="stage" width={108} stroke="#555555" tick={{ ...monoTick, fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="value" isAnimationActive={false}>
                  {intentFunnel.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                  <LabelList dataKey="value" position="right" fill="#ffffff" fontFamily="JetBrains Mono, monospace" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row: query coverage + radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <ChartCard title="Buyer query coverage" meta="VISIBILITY PER QUERY · 0–100" height="h-[300px]" testid="chart-coverage">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={queryCoverage} margin={{ top: 4, right: 34, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#1a1a1a" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#555555" tick={monoTick} axisLine={axisLine} tickLine={false} />
                <YAxis type="category" dataKey="q" width={150} stroke="#555555" tick={{ ...monoTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="score" name="Visibility" isAnimationActive={false}>
                  {queryCoverage.map((d, i) => (
                    <Cell key={i} fill={d.named ? "#22c55e" : "#e8272a"} />
                  ))}
                  <LabelList dataKey="score" position="right" fill="#ffffff" fontFamily="JetBrains Mono, monospace" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Agent readiness — you vs rivals"
            meta="6 SIGNALS · 0–100"
            height="h-[300px]"
            testid="chart-radar"
            legend={
              <>
                <LegendDot color="#2d6bff" label="You" />
                <LegendDot color="#e8272a" label="Rival avg" />
              </>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="72%">
                <PolarGrid stroke="#1a1a1a" />
                <PolarAngleAxis dataKey="dim" tick={{ ...monoTick, fontSize: 9 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Radar name="Rival avg" dataKey="rivals" stroke="#e8272a" strokeWidth={1.5} fill="#e8272a" fillOpacity={0.08} isAnimationActive={false} />
                <Radar name="You" dataKey="you" stroke="#2d6bff" strokeWidth={2} fill="#2d6bff" fillOpacity={0.22} isAnimationActive={false} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </Section>

      {/* Activity table (CREAM) */}
      <Section variant="cream" testid="monitor-activity">
        <Meta variant="cream" className="mb-6">→ 03 / AI AGENT ACTIVITY / RAW LOG</Meta>
        <div className="bg-white border border-black/20 overflow-x-auto" data-testid="activity-table">
          <table className="w-full font-mono text-[12px] min-w-[640px]">
            <thead>
              <tr className="text-black/45 uppercase text-[11px] border-b border-black/15">
                <th className="text-left font-normal px-4 py-3">Timestamp</th>
                <th className="text-left font-normal px-4 py-3">Agent</th>
                <th className="text-left font-normal px-4 py-3">Query</th>
                <th className="text-left font-normal px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((row, i) => (
                <tr key={i} className="border-b border-black/10 last:border-0">
                  <td className="px-4 py-3 text-black/55 whitespace-nowrap">{row[0]}</td>
                  <td className="px-4 py-3 text-[#2d6bff] whitespace-nowrap">{row[1]}</td>
                  <td className="px-4 py-3 text-black whitespace-nowrap">{row[2]}</td>
                  <td className="px-4 py-3 text-black/55 whitespace-nowrap">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Competitors this week (BLACK) */}
      <Section variant="black" testid="monitor-competitors">
        <Meta className="mb-6">→ 04 / COMPETITORS THIS WEEK</Meta>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="competitors-week">
          {competitors.map((c) => (
            <div key={c.name} className={`p-5 border flex flex-col ${c.you ? "border-[#2d6bff] bg-[#06080d]" : "border-[#1a1a1a] bg-[#0a0a0a]"}`}>
              <div className="flex items-start justify-between mb-4">
                <span className="w-4 h-4 inline-block" style={{ background: c.color }} />
                <span className="font-mono text-[10px] text-[#888888] uppercase tracking-wider">{c.rank}</span>
              </div>
              <div className="font-bold uppercase text-[15px] tracking-wide text-white">{c.name}</div>
              <div className="font-display text-3xl text-white mt-2">{c.change}</div>
              <div className="font-mono text-[11px] text-[#888888] mt-4">{c.stats.join("  /  ")}</div>
              {c.pill && (
                <span className={`pd-pill mt-4 self-start ${c.pillType === "live" ? "pd-pill-live" : "pd-pill-fail"}`}>{c.pill}</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* This week's move (CREAM, yellow CTA) */}
      <Section variant="cream" testid="monitor-move">
        <Meta variant="cream" className="mb-6">→ 05 / THIS WEEK'S MOVE</Meta>
        <div className="bg-white border border-black/20 p-8 sm:p-12" data-testid="weekly-move">
          <h2 className="font-display uppercase text-black leading-[0.95] text-[clamp(2rem,6vw,4.5rem)]">
            Get cited in one <Box>buying guide.</Box>
          </h2>
          <p className="text-black/55 text-sm sm:text-base mt-6 max-w-2xl">
            AI cites Wirecutter-style listicles. You're not in any of them. This
            week, send 3 outreach emails to bloggers who reviewed your
            competitors. Templates pre-written.
          </p>
          <button className="pd-btn-yellow mt-10" data-testid="outreach-button">
            OPEN THE OUTREACH KIT →
          </button>
        </div>
      </Section>
    </div>
  );
}
