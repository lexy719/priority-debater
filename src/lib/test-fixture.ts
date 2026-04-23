/**
 * Demo validation report for dev/preview without OpenAI credits.
 * Shape mirrors what the streaming API would produce — parsed by
 * `extractDashboardData` in `src/lib/parse.ts`.
 */

import type { ValidationSession } from "./types";

const DEMO_VALIDATION_MARKDOWN = `### Idea Summary
AsyncStand replaces live daily standups with 15-second async voice updates. Managers receive a morning digest that rolls up blockers, progress, and status flags across the team, with native integrations into Slack and Linear so work context travels with the update.

### One-Line Verdict
Sharp wedge into a genuinely painful meeting, but the asynchronous-standup category is crowded with Slack-native incumbents — distribution, not the product, decides whether this wins.

### Viability Score: 68/100

### Category Scores
- Problem-Solution Fit: 76/100
- Market Opportunity: 62/100
- Competitive Edge: 54/100
- Business Model: 71/100
- Team & Execution: 65/100
- Timing & Trends: 80/100

### Go/No-Go Recommendation
**CAUTION.** The pain is real and the timing is favourable, but the competitive moat is thin. Proceed only if you can show a differentiated wedge — either a vertical (engineering teams on Linear), a workflow (async-first remote orgs), or a data angle (digest quality that existing tools can't match).

### Problem-Solution Fit
Daily standups are one of the most-complained-about rituals in remote engineering teams: 54% of engineers in Stack Overflow's 2024 survey rated them "mostly wasted time." Async voice updates solve three concrete issues — timezone friction, interrupted deep work, and shallow written updates — without requiring teams to abandon the ritual entirely. The remaining risk is behavioural: voice-first requires a culture shift that written-first tools (Geekbot, Standuply) don't.

### Target Customer & ICP
- **Primary:** Engineering managers of distributed teams (8–40 people) across ≥3 timezones, already paying for Slack + Linear.
- **Secondary:** Product managers running async-first product pods at Series B+ startups.
- **Anti-ICP:** Sub-10-person colocated teams — the coordination cost of installing new rituals exceeds the benefit.

### Value Proposition
Reclaim the 30 minutes your team loses to standups every day, without losing the signal that makes them useful.

### Market Opportunity
- **TAM:** $12.4B (global team-collaboration software, Gartner 2024)
- **SAM:** $2.1B (async-first collaboration tools for distributed knowledge teams)
- **SOM:** $48M (realistic 3-year capture: engineering teams on Slack + Linear, 12K companies × ~$4K ACV)

Market is growing at ~14% CAGR, driven by permanent remote/hybrid adoption post-2020. Timing is favourable — async-tool budgets are being carved out of meeting-software spend, and buyers are actively looking for alternatives to Zoom-led rituals.

### Competitive Landscape
| Player | Approach | Weakness |
|---|---|---|
| Geekbot | Text-based Slack bot, simple daily prompts | No voice; poor digest quality; no Linear sync |
| Standuply | Text + polls + retro templates | Heavy UI, feels like a PM tool not a dev tool |
| Range | Beautiful text-first standups + check-ins | Expensive per-seat; weak async for engineering context |
| Loom (informal use) | Video async updates | Not built for standups; no aggregation or digest |
| Slack Huddles | Native lightweight meetings | Synchronous-only; doesn't solve timezone issue |

### Strengths
1. Voice is a genuine differentiator — 3× the information density of typed updates, and feels natural on mobile.
2. Morning digest is a real product surface, not a notification — owners can act on it before their first meeting.
3. Slack + Linear integrations mean zero net-new surface area; installs into existing habits.
4. 15-second hard cap is a forcing function that keeps updates disciplined.

### Risk Flags
1. **Geekbot/Range are incumbents with Slack-native distribution** — they'll add voice in a quarter if this works.
2. **Voice-first has a cultural moat, not a technical one** — replicable by anyone with a TTS pipeline.
3. **Transcription accuracy on accents/jargon** — engineering teams use heavy vocabulary; a 5% word-error rate is felt immediately.
4. **Mobile-first voice capture needs consent workflows** — implications for teams in regulated industries (healthcare, finance).
5. **Digest quality is the real product** — if the summary isn't better than reading 10 messages, adoption stalls in week 3.

### Business Model
B2B SaaS, per-seat, with a team minimum. $8/seat/month, 10-seat minimum = $80 floor. Annual plans at $7/seat/month with 2 months free. Free trial for 14 days, no card required. Enterprise tier ($14/seat) adds SSO, audit logs, and on-prem voice processing.

### Financial Projections
| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Paying teams | 120 | 600 | 2,100 |
| ARR | $140K | $820K | $3.1M |
| Gross margin | 72% | 78% | 81% |
| Burn / month | $65K | $110K | $140K |

### Unit Economics
- **CAC:** $340 (blended; PLG + content)
- **LTV:** $2,850 (24-month average retention, expansion included)
- **LTV:CAC:** 8.4×
- **Payback Period:** 4.2 months
- **Gross Margin:** 78%
- **Churn:** 4.1% monthly (target: under 3.5%)
- **ARPU:** $96/seat/year

### Break-Even Analysis
- **Break-even point:** ~1,450 paying teams (roughly $2.1M ARR)
- **Estimated timeline:** Month 28 from launch, assuming 14% monthly growth through Year 2
- **Key milestone:** First 100 paying teams within 9 months validates PLG motion
- **Funding need:** $1.4M seed runway to reach break-even without bridge

### Lean Canvas
- **Problem:** Daily live standups waste distributed engineering time and interrupt deep work.
- **Solution:** 15-second async voice updates with a manager digest, native to Slack and Linear.
- **Key Metrics:** Daily active posters, digest open rate, seats per team, NRR.
- **Unique Value Proposition:** Reclaim 30 minutes of focus per engineer per day — no new app to open.
- **Unfair Advantage:** Voice-native digest quality that text tools can't replicate; Linear sync that Geekbot/Standuply don't have.
- **Channels:** Product-led (Slack App Directory), engineering-manager content, founder-led sales to YC/early-stage.
- **Customer Segments:** Distributed engineering teams (8–40 people), async-first remote companies.
- **Cost Structure:** Cloud infra + voice transcription (~18% COGS), engineering team (60% burn), content & GTM (22%).
- **Revenue Streams:** Per-seat SaaS ($8/mo), annual plans, enterprise tier.

### Key Assumptions to Validate
1. Engineers will actually record voice updates every day (not just week 1).
2. Digest quality is meaningfully better than reading 10 raw messages.
3. Slack App Directory drives enough qualified installs to validate PLG.
4. Managers pay without executive budget approval at $80/mo starting price.

### Timeline to Launch
- **Weeks 1-4:** Private alpha with 5 teams recruited from personal network; measure daily posting rate.
- **Weeks 5-10:** Closed beta with 25 teams; Slack App Directory submission, billing in place.
- **Week 11-12:** Public launch on Product Hunt + HN; aim for 100 signups in first week.
- **Month 4-6:** Linear sync, enterprise features, first 50 paying teams.

### Top 5 Validation Steps Before Building
1. **Talk to 15 engineering managers** running distributed teams on Slack. Ask what they currently do for standups and what they'd pay to fix it. Reject if fewer than 6 describe real pain.
2. **Build a no-code prototype** (Slack bot + human-in-the-loop digest) and run it with 3 teams for 2 weeks. Measure daily posting rate; target ≥70%.
3. **Call 5 Geekbot/Range customers** and ask specifically why they picked their current tool and what would make them switch. Listen for moat signals.
4. **Price-test at $8 and $14/seat** on a simple landing page with 200 paid-ad clicks per variant. Measure conversion delta and qualitative feedback.
5. **Recruit a design partner** willing to pay $500 upfront for a 3-month pilot with weekly feedback sessions. Cash commitment separates real demand from polite interest.
`;

export const TEST_FIXTURE_SESSION: ValidationSession = {
  setup: {
    template: "validate",
    topic: "AsyncStand — voice standups for remote teams",
    position:
      "15-second async voice updates replace live standups. Managers get a morning digest with blockers and progress, native to Slack and Linear. I'm targeting distributed engineering teams who hate the ritual but can't kill it.",
    context:
      "Solo technical founder, 12 months of runway, ex-staff engineer at a late-stage startup. Shipping in public on Twitter.",
    lens: "investor",
  },
  validationContent: DEMO_VALIDATION_MARKDOWN,
  messages: [
    {
      id: "demo-1",
      role: "opponent",
      content: DEMO_VALIDATION_MARKDOWN,
    },
  ],
  createdAt: Date.now(),
  ideaCategory: { id: "saas", label: "B2B SaaS" },
};
