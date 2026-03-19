/**
 * Mandatory design kit for AI-generated landing HTML.
 * The model must embed this CSS verbatim and build markup with `lp-*` classes.
 * Keeps downloads consistent: spacing, type scale, buttons, cards, FAQ, footer.
 */

export const LANDING_PAGE_CLASS_PREFIX = "lp-";

/** Copy formulas + anti-patterns (injected into system prompt). */
export const LANDING_PAGE_COPY_SKILL = `
COPY SKILL (follow strictly):
- Headline: [Strong verb or outcome] + [who it’s for] + [constraint or time]. Never "The future of X" or "AI-powered platform".
- Eyebrow: one line, 3–6 words, specific (e.g. "For B2B sales teams" not "Welcome").
- Subhead: one objection answered or one mechanism (how it works in plain English).
- CTA primary: first person + outcome ("Get my early access" / "See the breakdown").
- CTA secondary: low risk ("How it works" / "Read the FAQ").
- Problem cards: "You …" language; pull pain from STRUCTURED DATA.
- Solution cards: mirror each problem with a named outcome.
- FAQ: real objections from risks + category scores; answers under 3 sentences.
- Stats row: only numbers from report (scores, TAM/SAM/SOM, checklist count). If none, use capability lines ("Full validation report", "6 dimensions scored").
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
  .lp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
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

/* Reveal */
.lp-reveal { opacity: 0; transform: translateY(16px); transition: opacity 0.6s ease, transform 0.6s ease; }
.lp-reveal.is-visible { opacity: 1; transform: translateY(0); }
`.trim();

/** Minimal JS the model should include (vanilla): nav + reveal */
export const LANDING_PAGE_SCRIPT_KIT = `
(function(){
  var nav=document.querySelector("[data-lp-nav]");
  if(nav){
    var t=nav.querySelector("[data-lp-nav-toggle]");
    var m=nav.querySelector("[data-lp-nav-mobile]");
    if(t&&m){ t.addEventListener("click",function(){ m.classList.toggle("is-open"); }); }
  }
  if(window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  var els=document.querySelectorAll(".lp-reveal");
  if(!els.length||!("IntersectionObserver" in window)) { els.forEach(function(el){ el.classList.add("is-visible"); }); return; }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); } });
  },{ rootMargin:"0px 0px -8% 0px", threshold:0.1 });
  els.forEach(function(el){ io.observe(el); });
})();
`.trim();
