/**
 * Mandatory design kit for AI-generated landing HTML.
 * The model must embed this CSS verbatim and build markup with `lp-*` classes.
 * Keeps downloads consistent: spacing, type scale, buttons, cards, FAQ, footer.
 */

export const LANDING_PAGE_CLASS_PREFIX = "lp-";

/** Launch-page copy rules — public marketing, not a validation report. */
export const LANDING_PAGE_COPY_SKILL = `
COPY SKILL — **launch-ready for the business** (like a real SaaS homepage, e.g. sparse hero, strong headline, breathing room):

**Forbidden on the page (never show):** viability scores, any "X/10", category scores, GO/NO-GO, "validation report", internal critique language, or anything that sounds like an AI audit. This is **not** Priority Debater’s UI — it is **the business’s** customer-facing site.

**Tone:** confident, clear, benefit-led. Short sentences. Less text overall than a typical template — prefer whitespace, large type, one idea per section.

**Hero:** ≤10-word headline + **one** subhead line + two CTAs (e.g. primary + secondary). Eyebrow: 3–6 words (audience or category). No metrics from internal scoring.

**Body:** 4–6 sections total (nav + hero + value/features + how it works or proof + FAQ + CTA + footer). Skip dense paragraphs; use bullets or 2-line cards.

**Proof:** outcomes ("Ship faster", "Fewer meetings") or **external** market context (TAM/SAM/SOM from brief if provided — OK as market sizing). Optional generic trust ("Built for teams", "Privacy-first") — **no** fake user counts.

**FAQ:** real buyer questions (time, security, fit) — **not** "why is my score low".

**CTAs:** action verbs ("Get started", "Join waitlist", "Book a demo") — not "See validation".
`.trim();

/**
 * Full CSS. Model copies inside <style> first, then may only append small overrides
 * (e.g. :root { --lp-accent: #... }) for brand tint — must not remove rules.
 */
export const LANDING_PAGE_STYLE_KIT = `
/* === LP design kit — do not remove; override tokens in :root only === */
:root {
  --lp-bg: #07070c;
  --lp-bg-elevated: #0e0e16;
  --lp-bg-card: rgba(255, 255, 255, 0.03);
  --lp-border: rgba(255, 255, 255, 0.08);
  --lp-border-strong: rgba(255, 255, 255, 0.12);
  --lp-text: rgba(255, 255, 255, 0.92);
  --lp-muted: rgba(255, 255, 255, 0.55);
  --lp-faint: rgba(255, 255, 255, 0.35);
  --lp-accent: #6366f1;
  --lp-accent-2: #8b5cf6;
  --lp-success: #34d399;
  --lp-radius: 14px;
  --lp-radius-sm: 10px;
  --lp-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  --lp-font: "DM Sans", system-ui, sans-serif;
  --lp-display: "DM Sans", system-ui, sans-serif;
  --lp-max: 1120px;
  --lp-space: clamp(3rem, 8vw, 6rem);
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

body.lp-page {
  margin: 0;
  min-height: 100vh;
  font-family: var(--lp-font);
  background: var(--lp-bg);
  color: var(--lp-text);
  line-height: 1.6;
  font-size: 1.0625rem;
  -webkit-font-smoothing: antialiased;
}

.lp-container { width: 100%; max-width: var(--lp-max); margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2rem); }

/* Nav */
.lp-nav {
  position: sticky; top: 0; z-index: 50;
  border-bottom: 1px solid var(--lp-border);
  background: rgba(7, 7, 12, 0.75);
  backdrop-filter: blur(16px);
}
.lp-nav__inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 64px; max-width: var(--lp-max); margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2rem); }
.lp-nav__logo { font-weight: 700; font-size: 1rem; letter-spacing: -0.03em; color: var(--lp-text); text-decoration: none; }
.lp-nav__links { display: none; gap: 1.75rem; align-items: center; }
@media (min-width: 768px) { .lp-nav__links { display: flex; } }
.lp-nav__links a { color: var(--lp-muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
.lp-nav__links a:hover { color: var(--lp-text); }
.lp-nav__toggle { display: flex; background: transparent; border: 1px solid var(--lp-border); color: var(--lp-text); padding: 0.5rem 0.75rem; border-radius: var(--lp-radius-sm); cursor: pointer; }
@media (min-width: 768px) { .lp-nav__toggle { display: none; } }
.lp-nav__mobile { display: none; flex-direction: column; gap: 0.75rem; padding: 1rem clamp(1.25rem, 4vw, 2rem) 1.25rem; border-top: 1px solid var(--lp-border); background: var(--lp-bg); }
.lp-nav__mobile.is-open { display: flex; }
.lp-nav__mobile a { color: var(--lp-muted); text-decoration: none; font-size: 0.95rem; }

/* Hero */
.lp-hero {
  position: relative;
  padding: clamp(3rem, 10vw, 6rem) 0 calc(var(--lp-space) * 0.85);
  overflow: hidden;
}
.lp-hero__bg {
  pointer-events: none; position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.22), transparent),
    radial-gradient(ellipse 60% 40% at 100% 0%, rgba(139, 92, 246, 0.12), transparent);
}
.lp-hero__grain {
  pointer-events: none; position: absolute; inset: 0; opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.lp-eyebrow {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.85rem; border-radius: 999px;
  border: 1px solid var(--lp-border-strong);
  background: rgba(255,255,255,0.04);
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--lp-muted);
  margin-bottom: 1.25rem;
}
.lp-hero__title {
  font-family: var(--lp-display);
  font-weight: 700;
  font-size: clamp(2.25rem, 5.5vw, 3.5rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
  margin: 0 0 1.25rem;
  max-width: 18ch;
}
.lp-hero__title--gradient {
  background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 40%, var(--lp-accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.lp-hero__lead { font-size: clamp(1.05rem, 2vw, 1.2rem); color: var(--lp-muted); max-width: 42ch; margin: 0 0 2rem; line-height: 1.65; }
.lp-hero__actions { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 2rem; }

/* Buttons */
.lp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.85rem 1.35rem; font-size: 0.95rem; font-weight: 600;
  border-radius: var(--lp-radius-sm); border: 1px solid transparent;
  cursor: pointer; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
  font-family: inherit;
}
.lp-btn:focus-visible { outline: 2px solid var(--lp-accent); outline-offset: 3px; }
.lp-btn--primary {
  background: linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2));
  color: #fff; box-shadow: 0 8px 32px rgba(99, 102, 241, 0.35);
}
.lp-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(99, 102, 241, 0.45); }
.lp-btn--ghost {
  background: rgba(255,255,255,0.05); border-color: var(--lp-border-strong); color: var(--lp-text);
}
.lp-btn--ghost:hover { background: rgba(255,255,255,0.09); }

/* Trust */
.lp-trust { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem 1.5rem; color: var(--lp-faint); font-size: 0.85rem; }
.lp-trust__stat { font-weight: 600; color: var(--lp-muted); }
.lp-trust__sep { opacity: 0.35; }

/* Sections */
.lp-section { padding: var(--lp-space) 0; scroll-margin-top: 72px; }
.lp-section--alt { background: linear-gradient(180deg, var(--lp-bg-elevated) 0%, var(--lp-bg) 100%); border-top: 1px solid var(--lp-border); border-bottom: 1px solid var(--lp-border); }
.lp-section__head { margin-bottom: clamp(2rem, 5vw, 3rem); max-width: 52ch; }
.lp-section__title {
  font-family: var(--lp-display);
  font-size: clamp(1.65rem, 3.5vw, 2.25rem);
  font-weight: 700; letter-spacing: -0.03em; margin: 0 0 0.75rem; line-height: 1.15;
}
.lp-section__lead { margin: 0; color: var(--lp-muted); font-size: 1.05rem; }

/* Grid cards */
.lp-grid { display: grid; gap: 1rem; }
@media (min-width: 640px) { .lp-grid--3 { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 640px) { .lp-grid--2 { grid-template-columns: repeat(2, 1fr); } }

.lp-card {
  padding: 1.5rem;
  border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border);
  background: var(--lp-bg-card);
  backdrop-filter: blur(12px);
  transition: border-color 0.2s, transform 0.2s;
}
.lp-card:hover { border-color: var(--lp-border-strong); transform: translateY(-3px); }
.lp-card__icon { font-size: 1.5rem; margin-bottom: 0.75rem; line-height: 1; }
.lp-card__title { font-size: 1.05rem; font-weight: 600; margin: 0 0 0.5rem; letter-spacing: -0.02em; }
.lp-card__text { margin: 0; font-size: 0.95rem; color: var(--lp-muted); line-height: 1.55; }

/* Steps */
.lp-steps { display: grid; gap: 1.5rem; }
@media (min-width: 900px) {
  .lp-steps { grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
}
.lp-step {
  position: relative; padding: 1.5rem; border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border); background: rgba(255,255,255,0.02);
}
.lp-step__num {
  width: 2.25rem; height: 2.25rem; border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem;
  background: linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2));
  color: #fff; margin-bottom: 1rem;
}
.lp-step__title { font-weight: 600; margin: 0 0 0.5rem; font-size: 1rem; }
.lp-step__text { margin: 0; color: var(--lp-muted); font-size: 0.92rem; }

/* Proof strip */
.lp-proof-bar {
  display: grid; gap: 1rem;
  padding: 1.5rem; border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border);
  background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05));
}
@media (min-width: 768px) { .lp-proof-bar { grid-template-columns: repeat(3, 1fr); text-align: center; } }
.lp-proof-bar__value { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; }
.lp-proof-bar__label { font-size: 0.8rem; color: var(--lp-muted); margin-top: 0.25rem; }

/* Quote */
.lp-quote {
  padding: 1.5rem; border-radius: var(--lp-radius);
  border-left: 3px solid var(--lp-accent);
  background: rgba(255,255,255,0.03);
  font-size: 0.95rem; color: var(--lp-muted);
}
.lp-quote__by { margin-top: 1rem; font-size: 0.8rem; color: var(--lp-faint); }

/* FAQ */
.lp-faq { display: flex; flex-direction: column; gap: 0.5rem; }
.lp-faq details {
  border: 1px solid var(--lp-border); border-radius: var(--lp-radius-sm);
  background: rgba(255,255,255,0.02); overflow: hidden;
}
.lp-faq summary {
  cursor: pointer; padding: 1rem 1.25rem; font-weight: 600; font-size: 0.95rem;
  list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 1rem;
}
.lp-faq summary::-webkit-details-marker { display: none; }
.lp-faq summary::after { content: "+"; font-weight: 400; color: var(--lp-faint); }
.lp-faq details[open] summary::after { content: "−"; }
.lp-faq__body { padding: 0 1.25rem 1.15rem; color: var(--lp-muted); font-size: 0.92rem; line-height: 1.55; }

/* CTA band */
.lp-cta {
  padding: clamp(3rem, 8vw, 5rem) 0;
  text-align: center;
  position: relative; overflow: hidden;
}
.lp-cta__inner {
  position: relative; z-index: 1;
  padding: clamp(2rem, 5vw, 3.5rem);
  border-radius: calc(var(--lp-radius) + 4px);
  border: 1px solid var(--lp-border-strong);
  background: linear-gradient(145deg, rgba(99,102,241,0.15), rgba(14,14,22,0.9));
  box-shadow: var(--lp-shadow);
}
.lp-cta__title { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; margin: 0 0 0.75rem; letter-spacing: -0.03em; }
.lp-cta__lead { color: var(--lp-muted); margin: 0 auto 1.5rem; max-width: 40ch; }
.lp-form { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; max-width: 480px; margin: 0 auto; }
.lp-form input[type="email"] {
  flex: 1 1 220px; padding: 0.85rem 1rem; border-radius: var(--lp-radius-sm);
  border: 1px solid var(--lp-border-strong); background: rgba(0,0,0,0.35); color: var(--lp-text); font: inherit;
}
.lp-form input::placeholder { color: var(--lp-faint); }

/* Footer */
.lp-footer { padding: 2.5rem 0; border-top: 1px solid var(--lp-border); color: var(--lp-faint); font-size: 0.85rem; }
.lp-footer__row { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; align-items: center; }
.lp-footer__links { display: flex; flex-wrap: wrap; gap: 1.25rem; }
.lp-footer a { color: var(--lp-muted); text-decoration: none; }
.lp-footer a:hover { color: var(--lp-text); }

/* Reveal — always visible (iframes / sandboxed previews often break IntersectionObserver). Optional subtle hover only. */
.lp-reveal { opacity: 1; transform: none; }

/* === Layout archetypes (use with body.lp-layout--*) === */
body.lp-layout--centered-editorial .lp-container { max-width: 720px; }
body.lp-layout--centered-editorial .lp-nav__inner { max-width: 1120px; }

/* Split hero */
.lp-hero--split .lp-container { position: relative; z-index: 1; }
.lp-hero__copy { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.lp-hero__split {
  display: grid;
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: center;
}
@media (min-width: 900px) {
  .lp-hero__split { grid-template-columns: 1fr 1fr; }
}
.lp-hero__visual {
  position: relative;
  border-radius: var(--lp-radius);
  overflow: hidden;
  border: 1px solid var(--lp-border);
  background: var(--lp-bg-elevated);
  aspect-ratio: 4/3;
  max-height: min(520px, 70vh);
}
.lp-hero__visual .lp-img { width: 100%; height: 100%; object-fit: cover; }
.lp-hero__visual::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(7,7,12,0.1) 0%, rgba(7,7,12,0.45) 100%);
  pointer-events: none;
}
.lp-photo-credit {
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: var(--lp-faint);
}
.lp-photo-credit a { color: var(--lp-muted); }

/* Images + Ken Burns (subtle, respects reduced motion) */
.lp-img { display: block; max-width: 100%; height: auto; }
@media (prefers-reduced-motion: no-preference) {
  @keyframes lp-kenburns {
    0% { transform: scale(1) translate(0, 0); }
    100% { transform: scale(1.08) translate(-1.5%, 1%); }
  }
  .lp-img-kenburns { animation: lp-kenburns 22s ease-in-out infinite alternate; }
}

/* Bento grid */
.lp-bento {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(120px, auto);
}
@media (max-width: 768px) { .lp-bento { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .lp-bento { grid-template-columns: 1fr; } }
.lp-bento__item {
  padding: 1.25rem;
  border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border);
  background: var(--lp-bg-card);
  min-height: 0;
}
.lp-bento__item--wide { grid-column: span 2; }
.lp-bento__item--tall { grid-row: span 2; }
@media (max-width: 768px) {
  .lp-bento__item--wide { grid-column: span 1; }
  .lp-bento__item--tall { grid-row: span 1; }
}
.lp-bento__item .lp-img { width: 100%; height: 100%; object-fit: cover; border-radius: calc(var(--lp-radius) - 4px); }

/* Magazine */
.lp-section--mag {
  background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
  border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border);
}
.lp-pullquote {
  font-size: clamp(1.25rem, 2.5vw, 1.65rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.35;
  margin: 0;
  padding: 1.5rem 0;
  border-left: 3px solid var(--lp-accent);
  padding-left: 1.25rem;
  color: var(--lp-text);
}

/* Magazine: optional side rail for steps */
.lp-steps--magazine {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
@media (min-width: 900px) {
  .lp-steps--magazine {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    gap: 2.5rem;
    align-items: start;
  }
}

/* Timeline band hero + horizontal steps */
.lp-hero--band {
  padding-top: clamp(4rem, 12vw, 7rem);
  padding-bottom: clamp(3rem, 8vw, 5rem);
}
.lp-hero--band .lp-hero__bg { opacity: 0.9; }

.lp-steps--horizontal {
  display: grid;
  gap: 1rem;
}
@media (min-width: 900px) {
  .lp-steps--horizontal {
    grid-template-columns: repeat(3, 1fr);
    position: relative;
    padding-top: 0.5rem;
  }
  .lp-steps--horizontal::before {
    content: "";
    position: absolute;
    top: 2.5rem;
    left: 8%;
    right: 8%;
    height: 2px;
    background: linear-gradient(90deg, var(--lp-accent), var(--lp-accent-2));
    opacity: 0.35;
    border-radius: 2px;
  }
}

/* === DYNAMIC BACKGROUNDS === */

/* Animated gradient mesh background — apply to .lp-hero or any section */
@keyframes lp-gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.lp-bg-mesh {
  background: linear-gradient(-45deg, var(--lp-bg), rgba(99,102,241,0.12), var(--lp-bg), rgba(139,92,246,0.08));
  background-size: 400% 400%;
  animation: lp-gradient-shift 20s ease infinite;
}

/* Floating orbs — decorative animated blobs behind content */
.lp-orbs { pointer-events: none; position: absolute; inset: 0; overflow: hidden; z-index: 0; }
.lp-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.15;
}
@keyframes lp-float-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}
@keyframes lp-float-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-40px, 30px) scale(0.95); }
  66% { transform: translate(25px, -25px) scale(1.08); }
}
@keyframes lp-float-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(35px, 35px) scale(1.1); }
}
.lp-orb--1 { width: 400px; height: 400px; top: -10%; left: -5%; background: var(--lp-accent); animation: lp-float-1 18s ease-in-out infinite; }
.lp-orb--2 { width: 350px; height: 350px; top: 20%; right: -8%; background: var(--lp-accent-2); animation: lp-float-2 22s ease-in-out infinite; }
.lp-orb--3 { width: 300px; height: 300px; bottom: -5%; left: 30%; background: var(--lp-success); animation: lp-float-3 25s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .lp-orb, .lp-bg-mesh { animation: none !important; }
}

/* Particle dots background — CSS-only */
.lp-particles {
  pointer-events: none; position: absolute; inset: 0; overflow: hidden;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 1px, transparent 1px),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.025) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 120px 120px, 80px 80px, 200px 200px;
}

/* Glassmorphism v2 — more prominent frost */
.lp-glass {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
}

/* Gradient border card — uses pseudo-element for animated border */
.lp-card--glow {
  position: relative;
  background: var(--lp-bg-elevated);
  border: none;
  overflow: hidden;
}
.lp-card--glow::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2), var(--lp-success), var(--lp-accent));
  background-size: 300% 300%;
  animation: lp-gradient-shift 8s ease infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
.lp-card--glow > * { position: relative; z-index: 1; }

/* Animated counter — for stats */
.lp-counter { font-variant-numeric: tabular-nums; }

/* Badge / pill */
.lp-badge {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.75rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 600;
  background: rgba(99,102,241,0.12); color: var(--lp-accent);
  border: 1px solid rgba(99,102,241,0.2);
}
.lp-badge--success { background: rgba(52,211,153,0.12); color: var(--lp-success); border-color: rgba(52,211,153,0.2); }

/* Testimonial card v2 — with avatar and rating */
.lp-testimonial {
  padding: 1.5rem;
  border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border);
  background: var(--lp-bg-card);
}
.lp-testimonial__stars { color: #fbbf24; font-size: 0.85rem; margin-bottom: 0.75rem; letter-spacing: 0.1em; }
.lp-testimonial__text { font-size: 0.95rem; color: var(--lp-muted); line-height: 1.55; margin: 0 0 1rem; font-style: italic; }
.lp-testimonial__author { display: flex; align-items: center; gap: 0.75rem; }
.lp-testimonial__avatar {
  width: 2.5rem; height: 2.5rem; border-radius: 999px;
  background: linear-gradient(135deg, var(--lp-accent), var(--lp-accent-2));
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.85rem; color: #fff;
}
.lp-testimonial__name { font-weight: 600; font-size: 0.85rem; color: var(--lp-text); }
.lp-testimonial__role { font-size: 0.75rem; color: var(--lp-faint); }

/* Comparison table — for competitive positioning */
.lp-compare { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.lp-compare th, .lp-compare td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--lp-border); }
.lp-compare th { font-weight: 600; color: var(--lp-text); background: rgba(255,255,255,0.02); }
.lp-compare td { color: var(--lp-muted); }
.lp-compare .lp-compare__highlight { background: rgba(99,102,241,0.06); }

/* Logo bar / trusted-by */
.lp-logos { display: flex; flex-wrap: wrap; gap: 2rem; align-items: center; justify-content: center; opacity: 0.4; }
.lp-logos span { font-size: 0.95rem; font-weight: 700; letter-spacing: -0.02em; }

/* Feature highlight — icon + title + text with accent left border */
.lp-feature-row {
  display: flex; gap: 1.25rem; align-items: flex-start;
  padding: 1.25rem;
  border-left: 3px solid var(--lp-accent);
  border-radius: 0 var(--lp-radius-sm) var(--lp-radius-sm) 0;
  background: rgba(255,255,255,0.015);
  transition: background 0.2s;
}
.lp-feature-row:hover { background: rgba(255,255,255,0.03); }
.lp-feature-row__icon { font-size: 1.5rem; line-height: 1; flex-shrink: 0; }
.lp-feature-row__title { font-weight: 600; font-size: 1rem; margin: 0 0 0.25rem; }
.lp-feature-row__text { margin: 0; color: var(--lp-muted); font-size: 0.9rem; }

/* Scroll fade-in — works without JS, pure CSS with scroll-timeline (progressive enhancement) */
@supports (animation-timeline: scroll()) {
  .lp-fade-up {
    opacity: 0;
    transform: translateY(20px);
    animation: lp-reveal-up linear forwards;
    animation-timeline: view();
    animation-range: entry 0% entry 30%;
  }
  @keyframes lp-reveal-up {
    to { opacity: 1; transform: translateY(0); }
  }
}

/* === PREMIUM EFFECTS (21st.dev-level) === */

/* Noise texture overlay — adds grain like premium sites */
.lp-noise::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Spotlight cursor follower */
.lp-spotlight {
  position: relative;
  overflow: hidden;
}
.lp-spotlight::before {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  left: var(--mouse-x, 50%);
  top: var(--mouse-y, 50%);
  transition: opacity 0.3s;
  opacity: 0;
  z-index: 1;
}
.lp-spotlight:hover::before { opacity: 1; }

/* Animated gradient border card */
.lp-card--gradient-border {
  position: relative;
  border-radius: 1rem;
  padding: 1px;
  background: linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.4), rgba(236,72,153,0.4));
  background-size: 200% 200%;
  animation: lp-border-shift 4s ease infinite;
}
.lp-card--gradient-border > * {
  background: var(--lp-bg, #0a0a0f);
  border-radius: calc(1rem - 1px);
}
@keyframes lp-border-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Text shimmer/shine effect */
.lp-text-shine {
  background: linear-gradient(90deg, currentColor 40%, rgba(255,255,255,0.8) 50%, currentColor 60%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: lp-text-shine 3s linear infinite;
}
@keyframes lp-text-shine {
  to { background-position: 200% center; }
}

/* Marquee / infinite scroll for logos or badges */
.lp-marquee {
  display: flex;
  overflow: hidden;
  gap: 2rem;
  mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
}
.lp-marquee__track {
  display: flex;
  gap: 2rem;
  animation: lp-scroll 20s linear infinite;
  flex-shrink: 0;
}
@keyframes lp-scroll {
  to { transform: translateX(-50%); }
}

/* Staggered fade-in for lists/grids */
.lp-stagger > * {
  opacity: 0;
  transform: translateY(20px);
  animation: lp-stagger-in 0.5s ease forwards;
}
.lp-stagger > *:nth-child(1) { animation-delay: 0s; }
.lp-stagger > *:nth-child(2) { animation-delay: 0.1s; }
.lp-stagger > *:nth-child(3) { animation-delay: 0.2s; }
.lp-stagger > *:nth-child(4) { animation-delay: 0.3s; }
.lp-stagger > *:nth-child(5) { animation-delay: 0.4s; }
.lp-stagger > *:nth-child(6) { animation-delay: 0.5s; }
@keyframes lp-stagger-in {
  to { opacity: 1; transform: translateY(0); }
}

/* Blob morphing background */
.lp-blob {
  position: absolute;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
  filter: blur(40px);
  animation: lp-morph 8s ease-in-out infinite;
  opacity: 0.3;
}
@keyframes lp-morph {
  0%, 100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; }
  25% { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; }
  50% { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; }
  75% { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; }
}

/* Hover lift card */
.lp-card--lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.lp-card--lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 30px rgba(99,102,241,0.1);
}

/* Smooth number counter (CSS-only with @property) */
@property --lp-num {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}
.lp-counter-css {
  transition: --lp-num 2s ease-out;
  counter-reset: num var(--lp-num);
}
.lp-counter-css::after {
  content: counter(num);
}

@media (prefers-reduced-motion: reduce) {
  .lp-text-shine,
  .lp-marquee__track,
  .lp-stagger > *,
  .lp-blob,
  .lp-card--gradient-border { animation: none !important; }
  .lp-stagger > * { opacity: 1; transform: none; }
}

/* === Enterprise / Semrush-style: demo shell + metrics wall (static HTML, no JS table) === */
.lp-demo-shell {
  border-radius: var(--lp-radius);
  border: 1px solid var(--lp-border);
  background: linear-gradient(180deg, var(--lp-bg-elevated) 0%, rgba(7,7,12,0.98) 100%);
  overflow: hidden;
  box-shadow: var(--lp-shadow);
}
.lp-demo-chrome {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--lp-border);
  background: rgba(255,255,255,0.03);
}
.lp-demo-dot { width: 10px; height: 10px; border-radius: 50%; }
.lp-demo-dot--r { background: #ff5f57; }
.lp-demo-dot--y { background: #febc2e; }
.lp-demo-dot--g { background: #28c840; }
.lp-demo-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.lp-demo-table { width: 100%; min-width: 520px; border-collapse: collapse; font-size: 0.8rem; }
.lp-demo-table th {
  text-align: left;
  padding: 0.65rem 1rem;
  color: var(--lp-faint);
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--lp-border);
  background: rgba(255,255,255,0.02);
}
.lp-demo-table td { padding: 0.65rem 1rem; border-bottom: 1px solid var(--lp-border); color: var(--lp-muted); }
.lp-demo-table tbody tr:hover td { background: rgba(99,102,241,0.04); }
.lp-demo-table .lp-demo-table__num { font-variant-numeric: tabular-nums; color: var(--lp-text); font-weight: 600; }

/* Big-number trust wall (like Semrush metrics row) */
.lp-metric-wall {
  display: grid;
  gap: 1rem;
  padding: clamp(2rem, 5vw, 3rem) 0;
  border-top: 1px solid var(--lp-border);
  border-bottom: 1px solid var(--lp-border);
  background: rgba(255,255,255,0.03);
}
@media (min-width: 768px) {
  .lp-metric-wall { grid-template-columns: repeat(4, 1fr); text-align: center; }
}
.lp-metric-wall__item { padding: 0.5rem; }
.lp-metric-wall__value {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  background: linear-gradient(135deg, var(--lp-text) 0%, var(--lp-accent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.lp-metric-wall__label { font-size: 0.8rem; color: var(--lp-muted); margin-top: 0.35rem; }

/* Section eyebrow + headline stack (editorial SaaS) */
.lp-section-eyebrow {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lp-faint);
  margin-bottom: 0.75rem;
}

/* === Responsive baseline (mobile-first) === */
html { overflow-x: clip; }
body.lp-page { overflow-x: clip; }
.lp-nav__inner { flex-wrap: wrap; row-gap: 0.75rem; }
.lp-hero__title { max-width: 100%; word-wrap: break-word; }
.lp-section__title { word-wrap: break-word; }
.lp-grid {
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .lp-grid--2 { grid-template-columns: repeat(2, 1fr); }
  .lp-grid--3 { grid-template-columns: repeat(3, 1fr); }
}
.lp-metric-wall {
  grid-template-columns: 1fr;
  text-align: left;
}
@media (min-width: 768px) {
  .lp-metric-wall {
    grid-template-columns: repeat(2, 1fr);
    text-align: center;
  }
}
@media (min-width: 1024px) {
  .lp-metric-wall { grid-template-columns: repeat(4, 1fr); }
}
.lp-metric-wall__item { min-width: 0; }
.lp-feature-row { flex-direction: column; gap: 0.75rem; }
@media (min-width: 640px) {
  .lp-feature-row { flex-direction: row; align-items: flex-start; }
}
.lp-compare { display: block; width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.lp-compare-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 0 calc(-1 * clamp(1rem, 4vw, 2rem)); padding: 0 clamp(1rem, 4vw, 2rem); }
.lp-hero__split { grid-template-columns: 1fr; }
@media (min-width: 900px) {
  .lp-hero__split { grid-template-columns: 1fr 1fr; }
}
.lp-hero__visual { max-height: none; aspect-ratio: auto; min-height: 200px; }
@media (min-width: 900px) {
  .lp-hero__visual { aspect-ratio: 4/3; max-height: min(520px, 70vh); }
}
.lp-demo-table { min-width: min(100%, 520px); }
@media (max-width: 639px) {
  .lp-demo-table { font-size: 0.72rem; }
  .lp-demo-table th, .lp-demo-table td { padding: 0.5rem 0.65rem; }
  .lp-hero__lead { max-width: 100%; }
  .lp-section__head { max-width: 100%; }
}
img, video { max-width: 100%; height: auto; }
.lp-bento { grid-template-columns: 1fr; }
@media (min-width: 480px) { .lp-bento { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 768px) { .lp-bento { grid-template-columns: repeat(3, 1fr); } }
`.trim();

/** JS kit: mobile nav + animated counters + nav blur on scroll */
export const LANDING_PAGE_SCRIPT_KIT = `
(function(){
  /* Mobile nav toggle */
  var nav=document.querySelector("[data-lp-nav]");
  if(nav){
    var t=nav.querySelector("[data-lp-nav-toggle]");
    var m=nav.querySelector("[data-lp-nav-mobile]");
    if(t&&m){ t.addEventListener("click",function(){ m.classList.toggle("is-open"); }); }
  }

  /* Animated counters — add data-lp-count="1234" to any element */
  function animateCounters(){
    document.querySelectorAll("[data-lp-count]").forEach(function(el){
      if(el.dataset.lpCounted) return;
      var target=parseInt(el.dataset.lpCount,10);
      if(isNaN(target)) return;
      el.dataset.lpCounted="1";
      var prefix=el.dataset.lpPrefix||"";
      var suffix=el.dataset.lpSuffix||"";
      var duration=1800;
      var start=performance.now();
      function tick(now){
        var p=Math.min((now-start)/duration,1);
        var ease=1-Math.pow(1-p,3);
        el.textContent=prefix+Math.round(target*ease).toLocaleString()+suffix;
        if(p<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }
  if("IntersectionObserver" in window){
    var cObs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ animateCounters(); cObs.unobserve(e.target); } });
    },{threshold:0.3});
    document.querySelectorAll("[data-lp-count]").forEach(function(el){ cObs.observe(el); });
  } else { animateCounters(); }

  /* Smooth scroll for anchor links */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click",function(e){
      var id=a.getAttribute("href");
      if(!id||id==="#") return;
      var target=document.querySelector(id);
      if(target){ e.preventDefault(); target.scrollIntoView({behavior:"smooth",block:"start"}); }
      if(m&&m.classList.contains("is-open")) m.classList.remove("is-open");
    });
  });

  /* Spotlight mouse tracker — cursor-following glow for .lp-spotlight elements */
  document.querySelectorAll('.lp-spotlight').forEach(function(el){
    el.addEventListener('mousemove',function(e){
      var rect=el.getBoundingClientRect();
      el.style.setProperty('--mouse-x',(e.clientX-rect.left)+'px');
      el.style.setProperty('--mouse-y',(e.clientY-rect.top)+'px');
    });
  });
})();
`.trim();
