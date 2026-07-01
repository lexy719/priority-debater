import { useNavigate } from "react-router-dom";
import { Box, FullNav, Marquee } from "../components/Nav";
import { Section, Meta } from "../components/Blocks";
import { DarkTooltip, monoTick, axisLine, Coach, Delta } from "../components/Charts";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LabelList,
  Tooltip,
} from "recharts";

const aiAnswers = [
  { n: 1, name: "Saatva", desc: "premium hybrid mattresses, white-glove delivery across Europe." },
  { n: 2, name: "Purple", desc: "gel-grid technology with a generous home trial." },
  { n: 3, name: "Colmol", desc: "established Portuguese manufacturer, wide retail availability." },
  { n: 4, name: "Nectar", desc: "budget-friendly memory foam with frequent promotions." },
  { n: 5, name: "Emma", desc: "popular boxed mattress brand shipping across Iberia." },
];

const queryPills = [
  { q: "Best overall", r: "NOT NAMED", ok: false },
  { q: "Portugal mattresses", r: "NOT NAMED", ok: false },
  { q: "Budget option", r: "NOT NAMED", ok: false },
  { q: "Luxury", r: "NOT NAMED", ok: false },
  { q: "Specialist", r: "MENTIONED", ok: true },
];

const gap = [
  { name: "Saatva", score: 62, color: "#2d6bff" },
  { name: "Purple", score: 58, color: "#2d6bff" },
  { name: "Colmol", score: 51, color: "#2d6bff" },
  { name: "Your Store", score: 22, color: "#e8272a", you: true },
];

const blockers = [
  { name: "AI crawlers blocked", detail: "GPTBot & Google-Extended can't read your store.", sev: "CRITICAL", pts: "+20" },
  { name: "No product schema", detail: "AI can't see your prices, titles or stock.", sev: "CRITICAL", pts: "+18" },
  { name: "Search bots turned away", detail: "robots.txt blocks the exact agents that recommend.", sev: "CRITICAL", pts: "+12" },
  { name: "No off-site citations", detail: "Nobody links to you — AI doesn't trust you yet.", sev: "HIGH", pts: "+14" },
  { name: "No review markup", detail: "Your ratings are invisible when buyers ask.", sev: "HIGH", pts: "+14" },
  { name: "No comparison content", detail: "AI cites comparison pages you don't have.", sev: "MEDIUM", pts: "+11" },
  { name: "No FAQ schema", detail: "Common buyer questions go unanswered.", sev: "MEDIUM", pts: "+9" },
];

const sevColor = { CRITICAL: "#e8272a", HIGH: "#f59e0b", MEDIUM: "#888888" };

export default function Verdict() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <FullNav active="VERDICT" />
      <Marquee text="AI VISIBILITY 22/100 // BOTTOM 22% // 3 COMPETITORS AHEAD // CHATGPT NAMED YOU 0/5 // AGENT READINESS 13/100 //" />

      {/* FACT 1 — The miss (BLACK) */}
      <Section variant="black" testid="verdict-fact-01">
        <Meta>→ 01 / FACT 01 / THE MISS</Meta>
        <h2 className="font-display uppercase text-white leading-[0.95] text-[clamp(2.2rem,6.5vw,5rem)] mt-5">
          We asked AI where to buy. <Box>You weren't named.</Box>
        </h2>
        <p className="text-[#888888] text-sm sm:text-base mt-6 max-w-2xl">
          We asked ChatGPT: <span className="text-white">"Where should I buy a
          mattress in Portugal?"</span> It gave 5 answers. You were not one of
          them.
        </p>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-10 items-start">
          <div className="pd-card p-6 sm:p-8 font-mono" data-testid="ai-chat-card">
            <div className="text-[11px] text-[#555555] uppercase mb-2">Query</div>
            <div className="text-white text-sm border-l-2 border-[#2d6bff] pl-4 mb-8">
              Where should I buy a mattress in Portugal?
            </div>
            <div className="text-[11px] text-[#555555] uppercase mb-3">AI Response · 5 stores named</div>
            <div className="space-y-3 text-[13px] text-[#888888] leading-relaxed">
              {aiAnswers.map((a) => (
                <p key={a.n}>
                  <span className="text-white">{a.n}. {a.name}</span> — {a.desc}
                </p>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-[#1a1a1a] text-[#e8272a] text-[13px]" data-testid="ai-not-mentioned">
              [YOUR STORE: NOT MENTIONED · 0 OF 5]
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] text-[#555555] uppercase mb-3">5 buyer queries tested</div>
            <div className="space-y-2" data-testid="query-pills">
              {queryPills.map((p) => (
                <div key={p.q} className="pd-card px-4 py-3 font-mono text-[12px] flex items-center justify-between">
                  <span className="text-white">{p.q}</span>
                  <span className={p.ok ? "text-[#22c55e]" : "text-[#e8272a]"}>→ {p.r}</span>
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Coach tone="red">
                You're invisible in <span className="text-white font-bold">4 of 5</span> buyer
                journeys. The one you win is a niche almost nobody searches.
              </Coach>
            </div>
          </div>
        </div>
      </Section>

      {/* FACT 2 — The cost (CREAM) */}
      <Section variant="cream" testid="verdict-fact-02">
        <Meta variant="cream">→ 02 / FACT 02 / THE COST</Meta>
        <div className="grid md:grid-cols-3 gap-8 mt-8 items-end">
          <div>
            <div className="font-display text-black leading-none text-[clamp(3rem,9vw,6rem)]">340K</div>
            <p className="text-black/55 text-[13px] mt-3">people in Portugal asked AI shopping questions last month</p>
          </div>
          <div>
            <div className="font-display text-black leading-none text-[clamp(3rem,9vw,6rem)]">2,800</div>
            <p className="text-black/55 text-[13px] mt-3">of those were about mattresses — your category</p>
          </div>
          <div>
            <div className="font-display text-[#e8272a] leading-none text-[clamp(3rem,9vw,6rem)]" data-testid="captured-zero">0</div>
            <p className="text-black/55 text-[13px] mt-3">of them you captured</p>
          </div>
        </div>

        {/* The math */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-12" data-testid="cost-math">
          {[
            { v: "2,800", l: "missed queries" },
            { v: "× 5%", l: "would convert" },
            { v: "× €499", l: "avg order value" },
          ].map((s) => (
            <div key={s.l} className="bg-white border border-black/20 px-5 py-4 flex-1">
              <div className="font-display text-2xl sm:text-3xl text-black">{s.v}</div>
              <div className="font-mono text-[11px] text-black/50 uppercase mt-1">{s.l}</div>
            </div>
          ))}
          <span className="font-display text-2xl text-black/40 self-center hidden sm:block">=</span>
          <div className="bg-[#e8272a] px-6 py-4 flex-1">
            <div className="font-display text-2xl sm:text-3xl text-white">~€14,000</div>
            <div className="font-mono text-[11px] text-white/80 uppercase mt-1">missed every month</div>
          </div>
        </div>
        <div className="mt-6 max-w-2xl">
          <Coach tone="red" variant="cream">
            Every week you wait, that number doesn't pause — it resets and grows.
            This is recurring revenue walking to your rivals.
          </Coach>
        </div>
        <div className="font-mono text-[11px] text-black/40 mt-6">
          Estimate based on category query volume, conversion rates and AOV
        </div>
      </Section>

      {/* FACT 3 — The gap (BLACK) */}
      <Section variant="black" testid="verdict-fact-03">
        <Meta>→ 03 / FACT 03 / THE GAP</Meta>
        <h2 className="font-display uppercase text-white leading-[0.95] text-[clamp(2.2rem,6.5vw,5rem)] mt-5 mb-12">
          Them at the top. <Box>You at the bottom.</Box>
        </h2>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-stretch">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5" data-testid="gap-bars">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-white uppercase tracking-wider">AI visibility score · by store</span>
              <span className="font-mono text-[10px] text-[#888888]">0–100</span>
            </div>
            <div className="h-[320px] mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gap} margin={{ top: 20, right: 10, bottom: 0, left: -14 }}>
                  <CartesianGrid stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="name" stroke="#555555" tick={{ ...monoTick, fontSize: 10 }} axisLine={axisLine} tickLine={false} interval={0} />
                  <YAxis domain={[0, 100]} stroke="#555555" tick={monoTick} axisLine={axisLine} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "#ffffff08" }} />
                  <ReferenceLine y={57} stroke="#e8272a" strokeDasharray="4 4" label={{ value: "RIVAL AVG 57", position: "insideTopRight", fill: "#e8272a", fontFamily: "JetBrains Mono, monospace", fontSize: 10 }} />
                  <Bar dataKey="score" name="Score" isAnimationActive={false}>
                    {gap.map((b, i) => (
                      <Cell key={i} fill={b.color} />
                    ))}
                    <LabelList dataKey="score" position="top" fill="#ffffff" fontFamily="JetBrains Mono, monospace" fontSize={13} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-6">
            <div className="border border-[#e8272a] bg-[#0d0606] p-6" data-testid="gap-callout">
              <div className="font-mono text-[11px] text-[#888888] uppercase tracking-wider mb-2">Gap to leader</div>
              <div className="font-display text-[#e8272a] text-[clamp(3rem,8vw,5rem)] leading-none">−40</div>
              <div className="font-mono text-[12px] text-[#888888] mt-3">points behind Saatva · bottom of 5 stores</div>
            </div>
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-6">
              <div className="font-mono text-[11px] text-[#888888] uppercase tracking-wider mb-2">Below rival average</div>
              <div className="font-display text-white text-[clamp(2.4rem,6vw,4rem)] leading-none">−35</div>
              <div className="font-mono text-[12px] text-[#888888] mt-3">points under the 57 category benchmark</div>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <Coach tone="blue">
            Still behind the leaders — but Colmol sat at exactly 22 eight weeks
            ago. This gap isn't permanent. It's a checklist.
          </Coach>
        </div>
      </Section>

      {/* THE 7 THINGS IN YOUR WAY (CREAM) */}
      <Section variant="cream" testid="verdict-blockers">
        <Meta variant="cream">→ 04 / DIAGNOSIS / THE 7 THINGS IN YOUR WAY</Meta>
        <h2 className="font-display uppercase text-black leading-[0.95] text-[clamp(2rem,6vw,4.5rem)] mt-5">
          Here's what to <Box>fix next.</Box>
        </h2>
        <p className="text-black/55 text-sm sm:text-base mt-6 max-w-2xl">
          Seven concrete blockers stand between you and the answers. Three are
          critical. All seven are fixable — and the agent does every one of them.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-10" data-testid="blocker-cards">
          {blockers.map((b, i) => (
            <div key={b.name} className="bg-white border border-black/20 p-5 flex items-start gap-4">
              <span className="w-4 h-4 mt-1 inline-block shrink-0" style={{ background: sevColor[b.sev] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold uppercase text-[15px] tracking-wide text-black">{b.name}</span>
                  <span className="pd-pill" style={{ background: `${sevColor[b.sev]}1f`, color: sevColor[b.sev] }}>{b.sev}</span>
                </div>
                <div className="text-[13px] text-black/55 mt-1">{b.detail}</div>
              </div>
              <span className="font-mono text-[12px] text-[#22c55e] shrink-0">{b.pts} PTS</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[12px] text-black/60 uppercase">Total recoverable:</span>
          <Delta>+49 visibility points</Delta>
          <span className="font-mono text-[12px] text-black/60 uppercase">→ projected score 71/100</span>
        </div>
      </Section>

      {/* SOFT CTA (BLACK) */}
      <Section variant="black" testid="verdict-cta">
        <div className="text-center">
          <Meta className="mb-6">→ NEXT</Meta>
          <h3 className="font-display uppercase text-white leading-[0.95] text-[clamp(1.8rem,5.5vw,4rem)] max-w-3xl mx-auto">
            See exactly <Box>why.</Box> Then watch it fix.
          </h3>
          <p className="text-[#888888] text-sm sm:text-base mt-6 max-w-xl mx-auto">
            No sign-up. No upgrade. Just the reasons — and an agent that ships
            every fix while you watch the score climb.
          </p>
          <button
            className="pd-btn-yellow text-base px-8 py-4 mt-10"
            onClick={() => navigate("/commerce/agent")}
            data-testid="verdict-fix-button"
          >
            SEE WHY — AND WHAT THE AGENT FIXES FIRST →
          </button>
        </div>
      </Section>
    </div>
  );
}
