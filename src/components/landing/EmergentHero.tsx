import React, { useState } from "react";
import { Zap, ArrowUpRight, ArrowRight, ChevronDown } from "lucide-react";

import { LandingIdeaValidation } from "@/components/landing/LandingIdeaValidation";

const TICKER_ITEMS = [
  { tag: "LIVE OBJECTIONS", text: "VENDOR FOR A 12% LIFT.", red: true },
  { tag: "ADV", text: "NOTION SHIPS THIS IN A WEEKEND THE SECOND YOU GET TRACTION." },
  { tag: "OPR", text: "THREE ENGINEERS JUST TO KEEP THE PIPELINE ALIVE." },
  { tag: "MNT", text: "PRICING IS WEAK. YOU'RE LEAVING 40% ON THE TABLE." },
  { tag: "CUS", text: "NO SOC-2, NO ANNUAL CONTRACT. EVER." },
  { tag: "INV", text: "TAM FEELS LIKE A FEATURE, NOT A COMPANY." },
  { tag: "ADV", text: "LINEAR IS $8 AND SHIPS WEEKLY. YOU ARE $42." },
  { tag: "OPR", text: "ONBOARDING TAKES 11 DAYS. CHURN STARTS AT DAY 3." },
];

const STAT_ITEMS = [
  {
    id: "01",
    label: "Average Verdict",
    value: "6.2",
    suf: "/10",
    sub: "across 1,247 sessions · last 7d",
    dot: "#0a0a0a",
  },
  {
    id: "02",
    label: "Survival Rate",
    value: "11%",
    suf: "",
    sub: "pitches that pass the panel clean",
    dot: "#ef3b2c",
  },
  {
    id: "03",
    label: "Time to Truth",
    value: "120",
    suf: "s",
    sub: "median session, from pitch to packet",
    dot: "#1e6bf3",
  },
];

const PANEL_ITEMS = [
  {
    tag: "INV",
    color: "#0a0a0a",
    title: "The Investor",
    desc: "Capital efficiency, burn, multiples. Will not sign your deck — only your math.",
    lines: ["TAM stress test", "Unit economics", "Default-alive runway"],
  },
  {
    tag: "CUS",
    color: "#ef3b2c",
    title: "The Customer",
    desc: "The one who would actually swipe a card. Argues every line of your pricing.",
    lines: ["Willingness to pay", "Switching cost", "Buyer vs. user"],
  },
  {
    tag: "OPR",
    color: "#1e6bf3",
    title: "The Operator",
    desc: "Headcount, ops, scaling pains. Asks what breaks when you 10× the load.",
    lines: ["Execution risk", "Hiring plan", "Process debt"],
  },
  {
    tag: "ADV",
    color: "#c8f549",
    title: "The Adversary",
    desc: "Your worst-case competitor with infinite distribution and zero patience.",
    lines: ["Competitive moat", "Distribution war", "Speed-to-copy"],
  },
  {
    tag: "MNT",
    color: "#fdfaf3",
    title: "The Mentor",
    desc: "Founder-market fit, story, narrative. Asks if you are the right person to build this.",
    lines: ["Conviction check", "Insight density", "Long-term arc"],
  },
];

const PRICING_TIERS = [
  {
    name: "Solo",
    price: "0",
    tag: "no card",
    desc: "One full debate per week. For founders kicking tires.",
    feats: ["1 debate / week", "5-panelist verdict", "Markdown export", "Community discord"],
    cta: "Start free",
    dark: false,
  },
  {
    name: "Founder",
    price: "29",
    tag: "most picked",
    desc: "Unlimited debates and the founder report buyers actually read.",
    feats: ["Unlimited debates", "Investor-grade PDF", "Side-by-side iteration", "Objection tracker", "Email + Slack alerts"],
    cta: "Get Founder",
    dark: true,
  },
  {
    name: "Studio",
    price: "99",
    tag: "teams",
    desc: "For accelerators, studios, and serial founders running many pitches.",
    feats: ["10 seats included", "Workspace + analytics", "Custom panelists", "API access", "White-label exports"],
    cta: "Talk to us",
    dark: false,
  },
];

const FAQ_ITEMS = [
  {
    q: "Is this just GPT with a prompt?",
    a: "No. It is a structured debate between five role-specific personas running on Claude Sonnet 4.5, with forced evidence, objection scoring, and a signed verdict — not a single chat turn.",
  },
  {
    q: "How long does a debate take?",
    a: "Median session is 120 seconds from pitch to packet. Long pitches with lots of context can take up to 4 minutes.",
  },
  {
    q: "Can I use my own panelists?",
    a: "Yes on Studio. You can replace any of the five default seats with a custom persona — your CFO, your ICP, your worst-case competitor.",
  },
  {
    q: "Do you store my idea?",
    a: "Only if you opt in. By default, pitches are deleted 24h after the debate. Workspaces can opt in to keep history.",
  },
  {
    q: "What does the verdict actually look like?",
    a: "A 1-page PDF: Kill / Conditional / Ship, a score per panelist, the three sharpest objections, and a 12-week experiment list to flip the verdict.",
  },
];

const PersonaRows = [
  {
    tag: "Pre-Seed",
    title: "You have a deck but no buyers yet.",
    desc: "Find the one objection your investor will use to pass — before they do.",
    out: "1 wedge · 3 risks · 1 next experiment",
  },
  {
    tag: "Seed → A",
    title: "You have early revenue, suspicious churn.",
    desc: "Stress-test the wedge, the pricing, and the GTM motion that is silently leaking.",
    out: "Cohort risk map · pricing teardown",
  },
  {
    tag: "Indie / Solo",
    title: "You are one human against a category.",
    desc: "Get the brutal version of advice without paying $400/h for a 'fractional' anything.",
    out: "12-week kill-or-double plan",
  },
];

const ScoreBar = ({ score, color = "#0a0a0a" }) => (
  <div className="score-bar">
    {Array.from({ length: 10 }).map((_, idx) => (
      <span
        key={idx}
        className="score-segment"
        style={{ background: idx < score ? color : "rgba(0,0,0,0.12)" }}
      />
    ))}
  </div>
);

const EmergentHero = () => {
  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <div className="landing-page">
      <style>{styles}</style>
      <div className="ticker">
        <div className="ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <div key={idx} className="ticker-item">
              <div className={`ticker-tag ${item.red ? "ticker-tag-red" : "ticker-tag-accent"}`}>
                [{item.tag}]
              </div>
              <div className="ticker-text">{item.text}</div>
              <div className="ticker-divider">//</div>
            </div>
          ))}
        </div>
      </div>

      <header className="navbar">
        <div className="navbar-inner">
          <a href="#top" className="logo-link">
            <div className="logo-mark">ID</div>
            <div className="logo-copy">
              <div className="logo-title">IDEA DEBATER</div>
              <div className="logo-subtitle">V.1.0 / 2026</div>
            </div>
          </a>
          <nav className="nav-links">
            {['Features', 'Personas', 'Pricing', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">
                {item}
              </a>
            ))}
          </nav>
          <a href="#validate" className="hero-button hero-button-dark">
            <Zap size={14} className="button-icon" />
            Validate Idea
          </a>
        </div>
      </header>

      <section id="top" className="hero section section-hero paper">
        <div className="section-bg grid-bg" />
        <div className="section-inner">
          <div className="hero-meta">
            <div className="hero-meta-left">
              <span className="hero-status-dot" />
              Stress-Test Mode
              <span className="hero-sep">/</span>
              1,534 Ideas Debated · 7d
              <span className="hero-sep">/</span>
              89% Brutal
            </div>
            <div className="hero-meta-right">
              <span className="live-badge">
                <span className="hero-status-dot" /> LIVE · 18:55
              </span>
            </div>
          </div>
          <div className="section-divider" />
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="section-note">— 01 · Verdict Engine</div>
              <h1 className="hero-title">
                Debate your<br />
                startup idea<br />
                until it<br />
                <span className="red-mark">breaks</span>.
              </h1>
              <div className="hero-description">
                <p>Five ruthless AI advisors. One investor-grade report. Zero sugar-coating.</p>
                <p>Find out if your idea survives the panel — <strong>in 120 seconds.</strong></p>
              </div>
              <div className="hero-actions">
                <a href="#validate" className="hero-button hero-button-dark hero-button-large">
                  Validate My Idea
                  <ArrowRight size={16} />
                </a>
                <a href="#demo" className="hero-button hero-button-light">
                  See a Real Debate
                  <ArrowUpRight size={16} />
                </a>
                <div className="hero-small-note">No card · 120s</div>
              </div>
              <div className="hero-proof">
                <div className="avatar-stack">
                  {[
                    { initials: 'JM', bg: '#0a0a0a', color: '#fff' },
                    { initials: 'RK', bg: '#ef3b2c', color: '#fff' },
                    { initials: 'SN', bg: '#fdfaf3', color: '#0a0a0a' },
                    { initials: 'AT', bg: '#0a0a0a', color: '#fff' },
                    { initials: 'LP', bg: '#c8f549', color: '#0a0a0a' },
                  ].map((profile) => (
                    <span
                      key={profile.initials}
                      className="avatar-mini"
                      style={{ background: profile.bg, color: profile.color }}
                    >
                      {profile.initials}
                    </span>
                  ))}
                </div>
                <div>
                  <div>Used by <span className="inline-highlight">3,400+</span> founders</div>
                  <div className="hero-proof-sub">YC F24 · Antler · On Deck · Indie Hackers</div>
                </div>
                <div className="hero-proof-caption">✦ Claude Sonnet 4.5</div>
              </div>
            </div>
            <div className="hero-card-wrapper">
              <DebateCard />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-stats cream-bg">
        <div className="section-bg grid-bg" />
        <div className="section-inner">
          <div className="stats-grid">
            {STAT_ITEMS.map((item) => (
              <div key={item.id} className="stat-card">
                <div className="stat-card-top">
                  <span>{item.label}</span>
                  <span>{item.id}</span>
                </div>
                <div className="stat-value">
                  {item.value}
                  <span className="stat-suffix">{item.suf}</span>
                </div>
                <div className="section-divider" />
                <div className="stat-card-bottom">
                  <span>{item.sub}</span>
                  <span className="stat-dot" style={{ background: item.dot }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="validate" className="section section-input cream-bg">
        <div className="section-bg grid-bg" />
        <div className="section-inner">
          <div className="input-grid">
            <div className="input-copy">
              <div className="section-note">— 02 · Input</div>
              <h2 className="section-heading">Drop the<br /> pitch. The<br /> panel handles<br /> the rest.</h2>
              <p>Tell us what you are building, who pays, and why now. We turn it into a structured stress test the panel can argue with.</p>
              <ul className="input-list">
                <li>✓ Auto-extracts wedge, ICP, GTM</li>
                <li>✓ Forces evidence on every claim</li>
                <li>✓ No “great idea!” — ever</li>
              </ul>
            </div>
            <LandingIdeaValidation />
          </div>
          <div className="tag-row">
            {['120s avg', 'no card required', 'claude sonnet 4.5', 'pdf export'].map((tag) => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      
    </div>
  );
};

const DebateCard = () => (
  <div className="debate-card">
    <div className="debate-card-back back-1" />
    <div className="debate-card-back back-2" />
    <div className="debate-card-front">
      <div className="tape-label">★ CLAUDE SONNET 4.5</div>
      <div className="debate-header">
        <div className="debate-status">
          <span className="status-dot" />
          Debate Room · Live · 00:42
        </div>
        <div className="debate-session">Session #4127</div>
      </div>
      <div className="debate-pitch">
        <div className="section-note uppercase">Pitch</div>
        <p className="debate-pitch-text">
          “A copilot for product ops teams that auto-writes PRDs from Linear + Notion + Slack.”
        </p>
      </div>
      <div className="section-divider" />
      <div className="persona-table">
        <PersonaRow tag="INV" color="#0a0a0a" name="The Investor" role="Capital Efficiency" score={6} />
        <PersonaRow tag="CUS" color="#ef3b2c" name="The Customer" role="Willingness to Pay" score={5} />
        <PersonaRow tag="OPR" color="#1e6bf3" name="The Operator" role="Execution Risk" score={7} />
        <PersonaRow tag="ADV" color="#c8f549" name="The Adversary" role="Competitive Moat" score={4} />
        <PersonaRow tag="MNT" color="#fdfaf3" name="The Mentor" role="Founder-Market Fit" score={8} />
      </div>
      <div className="objection-box">
        <div className="section-note uppercase">Objection · Customer</div>
        <p className="objection-text">Why would a Series A buyer pay $42/seat when Linear is $8 and ships weekly?</p>
      </div>
      <div className="verdict-grid">
        <div className="verdict-card verdict-card-left">
          <div className="tape-label small">EVIDENCE-FIRST · NO VIBES</div>
          <div className="section-note uppercase">Verdict</div>
          <div className="verdict-value">CONDITIONAL</div>
        </div>
        <div className="verdict-card verdict-card-middle">
          <div className="section-note uppercase">Score</div>
          <div className="verdict-value large">6.0<span className="verdict-suffix">/10</span></div>
        </div>
        <div className="verdict-card verdict-card-right">
          <div className="section-note uppercase">Risk</div>
          <div className="verdict-value risk">HIGH</div>
        </div>
      </div>
    </div>
  </div>
);

const PersonaRow = ({ tag, color, name, role, score }) => (
  <div className="persona-row">
    <div className="persona-avatar" style={{ background: color, color: color === '#0a0a0a' ? '#fff' : '#0a0a0a' }}>
      {tag}
    </div>
    <div className="persona-identity">
      <div className="persona-name">{name}</div>
      <div className="persona-role">{role}</div>
    </div>
    <ScoreBar score={score} color={color} />
    <div className="persona-score">{score}/10</div>
  </div>
);

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; }
html, body { margin:0; padding:0; }
body { background:#f0ebe3; color:#0a0a0a; font-family:'Archivo', sans-serif; }
.landing-page { min-height:100vh; overflow-x:hidden; }
.ticker { width:100%; background:#0a0a0a; color:#f0ebe3; border-top:1px solid #000; border-bottom:1px solid #000; font-family:'JetBrains Mono', monospace; letter-spacing:0.18em; font-size:11px; text-transform:uppercase; overflow:hidden; }
.ticker-track { display:flex; width:max-content; animation:ticker 60s linear infinite; padding:10px 0; }
.ticker-item { display:flex; align-items:center; flex-shrink:0; padding-right:40px; }
.ticker-tag { padding:4px 10px; border-radius:3px; font-weight:700; }
.ticker-tag-red { background:#ef3b2c; color:#fff; }
.ticker-tag-accent { background:#c8f549; color:#0a0a0a; }
.ticker-text { opacity:0.9; }
.ticker-divider { margin:0 24px; opacity:0.4; }

.navbar { width:100%; border-bottom:1px solid rgba(0,0,0,0.9); background:#f0ebe3; position:relative; z-index:20; }
.navbar-inner { max-width:1440px; margin:0 auto; padding:20px 32px; display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap; }
.logo-link { display:flex; align-items:center; gap:14px; text-decoration:none; color:inherit; }
.logo-mark { width:44px; height:44px; background:#0a0a0a; color:#f0ebe3; display:flex; align-items:center; justify-content:center; font-family:'Archivo Black', sans-serif; font-size:18px; }
.logo-copy { line-height:1.1; }
.logo-title { font-family:'JetBrains Mono', monospace; font-size:13px; font-weight:800; letter-spacing:0.18em; }
.logo-subtitle { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.55); }
.nav-links { display:flex; gap:20px; align-items:center; }
.nav-link { text-decoration:none; color:inherit; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; transition:color 0.2s ease; }
.nav-link:hover { color:#ef3b2c; }
.hero-button { display:inline-flex; align-items:center; gap:8px; border:1px solid #000; text-decoration:none; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; padding:14px 18px; transition:transform 0.15s ease, box-shadow 0.15s ease; position:relative; }
.hero-button:hover { transform:translate(-2px,-2px); box-shadow:8px 8px 0 rgba(0,0,0,0.92); }
.hero-button:active { transform:translate(2px,2px); box-shadow:2px 2px 0 rgba(0,0,0,0.92); }
.hero-button-dark { background:#0a0a0a; color:#f0ebe3; }
.hero-button-light { background:#f0ebe3; color:#0a0a0a; }
.hero-button-outline { border-color:rgba(240,235,227,0.4); color:#f0ebe3; background:transparent; }
.hero-button-large { padding-right:26px; }
.button-icon { color:#ef3b2c; }

.section { position:relative; overflow:hidden; }
.section-inner { max-width:1440px; margin:0 auto; padding:56px 32px; position:relative; }
.section-bg { position:absolute; inset:0; pointer-events:none; }
.grid-bg { background-image:linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px); background-size:48px 48px; opacity:0.9; }
.grid-bg-dense { background-image:linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px); background-size:24px 24px; opacity:0.7; }
.paper { background-color:#f0ebe3; background-image:radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.02) 1px, transparent 1px); background-size:6px 6px, 11px 11px; background-position:0 0, 3px 3px; }
.cream-bg { background-color:#f0ebe3; }
.cream-bg-2 { background-color:#ece5d8; }
.section-divider { border-top:1px dashed rgba(0,0,0,0.3); margin:32px 0; }
.section-note { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,0,0,0.6); margin-bottom:16px; }
.red-mark { display:inline-block; background:#ef3b2c; color:#fff; padding:0 5px; }

.hero { padding-bottom:32px; }
.hero-meta { display:flex; justify-content:space-between; gap:16px; align-items:center; flex-wrap:wrap; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,0,0,0.65); margin-bottom:40px; position:relative; z-index:1; }
.hero-meta-left, .hero-meta-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.hero-status-dot, .status-dot { width:6px; height:6px; border-radius:50%; background:#ef3b2c; display:inline-block; }
.hero-sep { margin:0 10px; color:rgba(0,0,0,0.4); }
.live-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; background:#fff; border:1px solid #000; }
.hero-grid { display:grid; grid-template-columns:1.2fr 0.95fr; gap:40px; align-items:start; }
.hero-copy { max-width:calc(100% - 20px); }
.hero-title { font-family:'Archivo Black', sans-serif; font-size:76px; line-height:0.95; margin:0; letter-spacing:-0.05em; }
.hero-description { font-size:16px; line-height:1.65; max-width:680px; color:rgba(0,0,0,0.8); margin-top:24px; }
.hero-description p { margin:0 0 12px; }
.hero-actions { display:flex; flex-wrap:wrap; gap:16px; align-items:center; margin-top:32px; }
.hero-small-note { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.55); }
.hero-proof { display:flex; align-items:center; gap:18px; flex-wrap:wrap; margin-top:36px; }
.avatar-stack { display:flex; align-items:center; gap:-6px; }
.avatar-mini { width:32px; height:32px; border:1px solid #000; display:inline-flex; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-size:10px; font-weight:700; }
.inline-highlight { background:#a5e3ff; padding:0 4px; }
.hero-proof-sub { font-family:'JetBrains Mono', monospace; font-size:9px; letter-spacing:0.18em; margin-top:4px; color:rgba(0,0,0,0.55); }
.hero-proof-caption { margin-left:auto; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.65); }
.hero-card-wrapper { display:flex; justify-content:center; }

.debate-card { position:relative; width:100%; max-width:460px; }
.debate-card-back { position:absolute; inset:0; border:1px solid #000; }
.back-1 { background:#fbf7ef; transform:translate(8px, 8px) rotate(-0.6deg); }
.back-2 { background:#fff; transform:translate(16px, 16px) rotate(1.2deg); }
.debate-card-front { position:relative; background:#fdfaf3; border:1px solid #000; padding:28px; }
.tape-label { position:absolute; top:-14px; right:-16px; background:#fff; border:1px solid #000; padding:6px 10px; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.12em; box-shadow:2px 2px 0 rgba(0,0,0,0.15); }
.tape-label.small { top:-12px; left:20px; right:auto; transform:rotate(-3deg); }
.debate-header { display:flex; justify-content:space-between; align-items:center; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; padding-bottom:14px; border-bottom:1px solid rgba(0,0,0,0.3); margin-bottom:18px; }
.debate-status { display:flex; align-items:center; gap:8px; color:rgba(0,0,0,0.75); }
.debate-session { color:rgba(0,0,0,0.6); }
.debate-pitch .section-note { margin-bottom:10px; }
.debate-pitch-text { margin:0; font-family:'Georgia', serif; font-size:15px; font-style:italic; line-height:1.5; color:rgba(0,0,0,0.85); }
.persona-table { display:grid; gap:10px; margin-top:24px; }
.persona-row { display:flex; align-items:center; gap:12px; padding:14px 0; border-bottom:1px dashed rgba(0,0,0,0.15); }
.persona-row:last-child { border-bottom:none; }
.persona-avatar { min-width:30px; min-height:30px; display:flex; align-items:center; justify-content:center; font-family:'JetBrains Mono', monospace; font-size:9px; font-weight:700; border:1px solid #000; }
.persona-identity { flex:1; min-width:0; }
.persona-name { font-family:'Archivo', sans-serif; font-size:15px; line-height:1.1; margin-bottom:4px; }
.persona-role { font-family:'JetBrains Mono', monospace; font-size:9px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(0,0,0,0.55); }
.score-bar { display:flex; gap:2px; }
.score-segment { width:10px; height:14px; display:inline-block; }
.persona-score { width:36px; text-align:right; font-family:'JetBrains Mono', monospace; font-size:10px; color:rgba(0,0,0,0.7); }
.objection-box { margin-top:26px; background:#f5ecd9; border:1px solid rgba(0,0,0,0.25); padding:16px; }
.objection-text { margin:0; font-family:'JetBrains Mono', monospace; font-size:13px; line-height:1.5; color:rgba(0,0,0,0.85); }
.verdict-grid { display:grid; grid-template-columns:1fr 1fr 1fr; border:1px solid #000; margin-top:20px; }
.verdict-card { padding:18px; border-right:1px solid #000; }
.verdict-card:last-child { border-right:none; }
.verdict-card-left { position:relative; }
.verdict-value { font-family:'Archivo Black', sans-serif; font-size:18px; margin-top:8px; line-height:1; }
.verdict-value.large { font-size:24px; }
.verdict-suffix { font-family:'JetBrains Mono', monospace; font-size:12px; color:rgba(0,0,0,0.5); margin-left:4px; }
.verdict-value.risk { color:#ef3b2c; }

.stats-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:20px; }
.stat-card { background:#fdfaf3; border:1px solid #000; padding:28px; box-shadow:3px 3px 0 rgba(0,0,0,0.12); position:relative; }
.stat-card-top { display:flex; justify-content:space-between; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.6); }
.stat-value { margin-top:26px; font-family:'Archivo Black', sans-serif; font-size:72px; line-height:0.95; }
.stat-suffix { font-family:'JetBrains Mono', monospace; font-size:18px; color:rgba(0,0,0,0.55); margin-left:6px; }
.stat-card-bottom { display:flex; justify-content:space-between; align-items:center; margin-top:18px; font-family:'JetBrains Mono', monospace; font-size:11px; color:rgba(0,0,0,0.65); }
.stat-dot { width:10px; height:10px; border-radius:50%; }

.input-grid { display:grid; grid-template-columns:1fr 1.2fr; gap:40px; align-items:start; }
.input-copy { max-width:560px; }
.section-heading { font-family:'Archivo Black', sans-serif; font-size:56px; line-height:0.95; margin:0; }
.input-copy p { margin:0 0 18px; font-size:15px; line-height:1.7; color:rgba(0,0,0,0.75); }
.input-list { margin:24px 0 0; padding:0; list-style:none; display:grid; gap:10px; font-family:'JetBrains Mono', monospace; font-size:12px; }
.input-card { background:#fdfaf3; border:1px solid #000; box-shadow:3px 3px 0 rgba(0,0,0,0.12); padding:26px; }
.input-card-top { display:flex; justify-content:space-between; align-items:center; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,0,0,0.55); border-bottom:1px dashed rgba(0,0,0,0.3); padding-bottom:14px; }
textarea { width:100%; min-height:260px; margin-top:18px; background:transparent; border:none; resize:none; outline:none; font-family:'JetBrains Mono', monospace; font-size:13px; line-height:1.7; color:rgba(0,0,0,0.85); }
textarea::placeholder { color:rgba(0,0,0,0.4); }
.input-card-bottom { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-top:18px; }
.small-note { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.15em; color:rgba(0,0,0,0.55); max-width:320px; }
.cta-button { display:inline-flex; align-items:center; gap:8px; border:1px solid #000; padding:12px 18px; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; cursor:pointer; }
.cta-button-disabled { background:rgba(0,0,0,0.08); color:rgba(0,0,0,0.6); border-color:rgba(0,0,0,0.25); cursor:not-allowed; }
.tag-row { margin-top:24px; display:flex; flex-wrap:wrap; gap:10px; }
.tag-pill { display:inline-flex; padding:10px 14px; border:1px solid rgba(0,0,0,0.8); background:#fdfaf3; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; box-shadow:3px 3px 0 rgba(0,0,0,0.12); }

.section-heading-row { display:flex; justify-content:space-between; gap:40px; align-items:flex-end; flex-wrap:wrap; margin-bottom:40px; }
.section-copy { max-width:460px; font-size:14px; line-height:1.75; color:rgba(0,0,0,0.75); }
.panel-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; }
.panel-card { background:#fdfaf3; border:1px solid #000; padding:26px; box-shadow:3px 3px 0 rgba(0,0,0,0.12); position:relative; }
.panel-card-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.panel-index { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.55); }
.panel-card h3 { margin:0 0 12px; font-size:28px; line-height:1.05; font-family:'Archivo Black', sans-serif; }
.panel-card p { margin:0 0 18px; line-height:1.65; color:rgba(0,0,0,0.8); }
.features-list { list-style:none; margin:0; padding:0; display:grid; gap:8px; font-family:'JetBrains Mono', monospace; font-size:11px; color:rgba(0,0,0,0.7); }
.panel-card-dark { background:#0a0a0a; color:#f0ebe3; }
.panel-card-dark p { color:rgba(240,235,227,0.8); }
.panel-card-note { color:rgba(240,235,227,0.6); }
.panel-dark-title { font-size:36px; line-height:1.03; margin:14px 0 0; }
.panel-link { display:inline-flex; align-items:center; gap:8px; margin-top:22px; padding:10px 16px; border:1px solid #f0ebe3; color:#f0ebe3; text-decoration:none; font-family:'JetBrains Mono', monospace; font-size:11px; text-transform:uppercase; }
.panel-card-anchor { position:absolute; top:-24px; right:-24px; width:96px; height:96px; background:#ef3b2c; opacity:0.35; transform:rotate(25deg); }

.section-personas .section-title-row { margin-bottom:32px; }
.persona-stack { display:grid; gap:18px; }
.persona-card { display:grid; grid-template-columns:1fr; gap:12px; background:#fdfaf3; border:1px solid #000; padding:24px; box-shadow:3px 3px 0 rgba(0,0,0,0.12); }
.persona-tag { display:inline-block; font-family:'JetBrains Mono', monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; border:1px solid #000; padding:8px 12px; }
.persona-card h3 { margin:0; font-size:26px; line-height:1.1; font-family:'Archivo Black', sans-serif; }
.persona-description { color:rgba(0,0,0,0.75); font-size:13px; line-height:1.7; }
.persona-out { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(0,0,0,0.65); border-top:1px dashed rgba(0,0,0,0.3); padding-top:14px; }

.pricing-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px; }
.price-card { position:relative; border:1px solid #000; padding:28px; box-shadow:3px 3px 0 rgba(0,0,0,0.12); }
.price-card-light { background:#fdfaf3; color:#0a0a0a; }
.price-card-dark { background:#0a0a0a; color:#f0ebe3; }
.price-label { position:absolute; top:-14px; right:18px; background:#ef3b2c; color:#fff; padding:6px 10px; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; transform:rotate(3deg); border:1px solid #000; }
.price-card-top { display:flex; justify-content:space-between; align-items:center; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; opacity:0.75; }
.price-value { margin:24px 0 14px; font-family:'Archivo Black', sans-serif; font-size:72px; line-height:0.95; }
.price-value span { font-family:'JetBrains Mono', monospace; font-size:14px; opacity:0.6; margin-left:8px; }
.price-card p { margin:0 0 20px; line-height:1.7; color:inherit; opacity:0.85; }
.price-card .section-divider { margin:20px 0; }
.price-card .features-list { gap:10px; }
.cta-button { margin-top:22px; width:100%; justify-content:center; }
.cta-button-light { background:#f0ebe3; color:#0a0a0a; border-color:#f0ebe3; }
.cta-button-dark { background:#0a0a0a; color:#f0ebe3; border-color:#000; }

.faq-inner { display:grid; grid-template-columns:1fr 1.2fr; gap:40px; align-items:start; }
.faq-side { max-width:420px; }
.faq-list { display:grid; gap:16px; }
.faq-card { width:100%; text-align:left; background:#fdfaf3; border:1px solid #000; padding:20px; box-shadow:3px 3px 0 rgba(0,0,0,0.12); cursor:pointer; border-radius:4px; }
.faq-card-header { display:flex; justify-content:space-between; gap:16px; align-items:center; }
.faq-number { display:inline-block; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.5); margin-right:10px; }
.faq-question { display:inline-block; font-family:'Archivo Black', sans-serif; font-size:20px; line-height:1.1; margin-top:-2px; }
.faq-icon { transition:transform 0.2s ease; }
.faq-icon.expanded { transform:rotate(180deg); }
.faq-answer { margin-top:18px; padding-top:18px; border-top:1px dashed rgba(0,0,0,0.25); font-size:14px; line-height:1.7; color:rgba(0,0,0,0.75); }

.cta-section { background:#0a0a0a; color:#f0ebe3; border-top:1px solid #000; border-bottom:1px solid #000; overflow:hidden; }
.final-overlay { position:absolute; inset:0; background-image:linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px); background-size:48px 48px; opacity:0.08; }
.final-inner { position:relative; text-align:center; padding-top:80px; padding-bottom:80px; }
.final-tag { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.3em; text-transform:uppercase; color:rgba(240,235,227,0.6); margin-bottom:24px; }
.final-title { font-family:'Archivo Black', sans-serif; font-size:88px; line-height:0.9; margin:0; }
.final-copy { margin:28px auto 0; max-width:720px; font-size:15px; line-height:1.8; color:rgba(240,235,227,0.75); }
.final-actions { display:flex; justify-content:center; flex-wrap:wrap; gap:18px; margin-top:34px; }
.final-button { box-shadow:6px 6px 0 #ef3b2c; }
.final-button-outline { border-color:rgba(240,235,227,0.25); }
.final-caption { margin-top:20px; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:rgba(240,235,227,0.55); }

.footer { border-top:1px solid #000; background:#f0ebe3; }
.footer-inner { max-width:1440px; margin:0 auto; padding:48px 32px 24px; display:grid; grid-template-columns:1.5fr 1fr 1fr 1fr; gap:26px; }
.footer-brand { display:flex; align-items:flex-start; gap:14px; }
.logo-mark.small { width:40px; height:40px; font-size:16px; }
.footer-copy { margin-top:14px; max-width:360px; line-height:1.7; color:rgba(0,0,0,0.7); }
.footer-links { display:flex; gap:22px; flex-wrap:wrap; }
.footer-column { min-width:140px; }
.footer-head { font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(0,0,0,0.55); margin-bottom:12px; }
.footer-column ul { margin:0; padding:0; list-style:none; display:grid; gap:8px; }
.footer-column a { text-decoration:none; color:inherit; transition:color 0.2s ease; }
.footer-column a:hover { color:#ef3b2c; }
.footer-bottom { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; padding:18px 32px 36px; font-family:'JetBrains Mono', monospace; font-size:10px; letter-spacing:0.22em; color:rgba(0,0,0,0.55); }

@media (max-width: 1120px) {
  .hero-grid, .input-grid, .faq-inner { grid-template-columns:1fr; }
  .section-inner { padding:48px 24px; }
  .stats-grid { grid-template-columns:1fr; }
  .pricing-grid { grid-template-columns:1fr; }
  .footer-inner { grid-template-columns:1fr; }
}
@media (max-width: 760px) {
  .navbar-inner { padding:20px 20px; }
  .hero-title { font-size:48px; }
  .section-heading { font-size:42px; }
  .hero-actions { flex-direction:column; align-items:flex-start; }
  .hero-proof { flex-direction:column; align-items:flex-start; }
  .debate-card { max-width:100%; }
  .stats-grid { grid-template-columns:1fr; }
  .section-inner { padding:36px 18px; }
  .hero-meta { flex-direction:column; align-items:flex-start; }
  .panel-grid, .persona-stack, .pricing-grid { grid-template-columns:1fr; }
  .final-title { font-size:56px; }
}
@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
`;

export default EmergentHero;
