/**
 * Bento Prism — midnight glass, cyan–violet mesh, asymmetric benefit grid.
 * Same %%SLOTS%% as SaaS Nova; AI fills copy only.
 */
export const BENTO_PRISM_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <style>
    :root {
      --bg: #030712;
      --bg2: #0a0f1e;
      --card: rgba(255,255,255,0.035);
      --card2: rgba(255,255,255,0.055);
      --border: rgba(255,255,255,0.09);
      --text: rgba(255,255,255,0.94);
      --muted: rgba(255,255,255,0.55);
      --faint: rgba(255,255,255,0.35);
      --cyan: #22d3ee;
      --violet: #a78bfa;
      --radius: 20px;
      --max: 1120px;
    }
    *,*::before,*::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: "Plus Jakarta Sans", system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 1rem;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .mesh {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 100% 80% at 0% 0%, rgba(34, 211, 238, 0.09), transparent 55%),
        radial-gradient(ellipse 80% 60% at 100% 10%, rgba(167, 139, 250, 0.1), transparent 50%),
        radial-gradient(ellipse 60% 50% at 50% 100%, rgba(34, 211, 238, 0.05), transparent 45%);
    }
    .grid-floor {
      pointer-events: none;
      position: fixed;
      inset: 0;
      z-index: 0;
      opacity: 0.04;
      background-image:
        linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .wrap { width: 100%; max-width: var(--max); margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2rem); position: relative; z-index: 1; }
    header {
      position: sticky;
      top: 0;
      z-index: 40;
      border-bottom: 1px solid var(--border);
      background: rgba(3, 7, 18, 0.75);
      backdrop-filter: blur(20px);
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 64px;
      flex-wrap: wrap;
    }
    .logo {
      font-weight: 700;
      font-size: 1.05rem;
      letter-spacing: -0.04em;
      color: var(--text);
      text-decoration: none;
      background: linear-gradient(135deg, #fff, var(--cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .nav-links { display: none; gap: 1.75rem; align-items: center; }
    @media (min-width: 900px) { .nav-links { display: flex; } }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; }
    .nav-links a:hover { color: var(--text); }
    .nav-toggle {
      display: flex;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--card);
      color: var(--text);
      cursor: pointer;
      font-size: 0.85rem;
    }
    @media (min-width: 900px) { .nav-toggle { display: none; } }
    .nav-mobile {
      display: none;
      width: 100%;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0 0 1rem;
    }
    .nav-mobile.open { display: flex; }
    .nav-mobile a { color: var(--muted); text-decoration: none; font-size: 0.95rem; }
    @media (min-width: 900px) { .nav-mobile { display: none !important; } }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.7rem 1.2rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      border: 1px solid transparent;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--cyan), #06b6d4);
      color: #030712;
      box-shadow: 0 0 40px rgba(34, 211, 238, 0.2);
    }
    .btn-primary:hover { filter: brightness(1.1); }
    .btn-ghost {
      background: transparent;
      border-color: var(--border);
      color: var(--text);
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.14); }
    .hero { padding: clamp(2rem, 6vw, 4rem) 0 clamp(3rem, 8vw, 5rem); position: relative; z-index: 1; }
    .float-card {
      max-width: 520px;
      margin: 0 auto 2rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card2);
      backdrop-filter: blur(12px);
      box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.06) inset;
    }
    .float-card p { margin: 0 0 0.85rem; font-size: 0.9rem; color: var(--muted); text-align: center; }
    .float-row { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .float-row input {
      flex: 1 1 200px;
      min-width: 0;
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: rgba(0,0,0,0.4);
      color: var(--text);
      font: inherit;
    }
    .float-row input::placeholder { color: var(--faint); }
    .hero h1 {
      text-align: center;
      font-size: clamp(2.1rem, 5vw, 3.2rem);
      font-weight: 700;
      line-height: 1.08;
      letter-spacing: -0.04em;
      margin: 0 0 1rem;
      max-width: 18ch;
      margin-left: auto;
      margin-right: auto;
    }
    .hero .lead {
      text-align: center;
      color: var(--muted);
      font-size: clamp(1rem, 2vw, 1.12rem);
      max-width: 42ch;
      margin: 0 auto 1.75rem;
      line-height: 1.65;
    }
    .hero-ctas { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .hero-split {
      display: grid;
      gap: clamp(2rem, 4vw, 3rem);
      align-items: center;
      margin-top: clamp(2rem, 5vw, 3.5rem);
    }
    @media (min-width: 900px) {
      .hero-split { grid-template-columns: 1.05fr 0.95fr; }
      .hero h1, .hero .lead { text-align: left; margin-left: 0; margin-right: 0; }
      .hero-ctas { justify-content: flex-start; }
      .float-card { margin-left: 0; margin-right: 0; }
    }
    .hero-visual {
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
      min-height: 240px;
      background: linear-gradient(145deg, rgba(34, 211, 238, 0.12), rgba(167, 139, 250, 0.08));
      position: relative;
      box-shadow: 0 24px 80px -24px rgba(34, 211, 238, 0.15), 0 0 0 1px rgba(167, 139, 250, 0.08) inset;
    }
    .hero-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      min-height: 240px;
    }
    .photo-credit { font-size: 0.7rem; color: var(--faint); padding: 0.5rem 0.75rem; }
    .photo-credit a { color: var(--muted); }
    section { padding: clamp(3rem, 7vw, 5rem) 0; position: relative; z-index: 1; }
    .eyebrow {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--cyan);
      margin-bottom: 0.75rem;
    }
    .sec-title {
      font-size: clamp(1.65rem, 3.5vw, 2.15rem);
      font-weight: 700;
      letter-spacing: -0.035em;
      line-height: 1.12;
      margin: 0 0 1rem;
    }
    .sec-body { color: var(--muted); font-size: 1.02rem; max-width: 60ch; line-height: 1.65; margin: 0; }
    .pullquote {
      margin-top: 1.5rem;
      padding: 1.25rem 1.35rem;
      border-radius: 16px;
      border: 1px solid var(--border);
      border-left: 3px solid var(--violet);
      background: var(--card2);
      color: var(--muted);
      font-style: italic;
      font-size: 0.98rem;
      line-height: 1.55;
    }
    .alt-band {
      background: linear-gradient(180deg, rgba(167, 139, 250, 0.04) 0%, transparent 100%);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .feature-grid {
      display: grid;
      gap: 1rem;
      margin-top: 2rem;
    }
    @media (min-width: 900px) {
      .feature-grid {
        grid-template-columns: 1.15fr 1fr 1fr;
        grid-template-rows: auto auto;
      }
      .feature-card:first-child {
        grid-row: span 2;
        align-self: stretch;
      }
    }
    @media (min-width: 640px) and (max-width: 899px) {
      .feature-grid { grid-template-columns: repeat(2, 1fr); }
      .feature-card:first-child { grid-column: span 2; }
    }
    .feature-card {
      padding: 1.4rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover {
      border-color: rgba(34, 211, 238, 0.25);
      box-shadow: 0 0 48px -20px rgba(34, 211, 238, 0.12);
    }
    .feature-card h3 { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 600; letter-spacing: -0.02em; }
    .feature-card p { margin: 0; color: var(--muted); font-size: 0.92rem; line-height: 1.55; }
    .how-grid {
      display: grid;
      gap: 1rem;
      margin-top: 2rem;
    }
    @media (min-width: 768px) { .how-grid { grid-template-columns: repeat(3, 1fr); } }
    .how-step {
      padding: 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card2);
    }
    .how-step .num {
      width: 2rem; height: 2rem;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      background: linear-gradient(135deg, var(--violet), var(--cyan));
      color: #030712;
      margin-bottom: 0.75rem;
    }
    .how-step h3 { margin: 0 0 0.4rem; font-size: 0.98rem; font-weight: 600; }
    .how-step p { margin: 0; color: var(--muted); font-size: 0.88rem; line-height: 1.5; }
    details {
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--card);
      margin-bottom: 0.5rem;
    }
    details summary {
      cursor: pointer;
      padding: 1rem 1.15rem;
      font-weight: 600;
      font-size: 0.95rem;
      list-style: none;
    }
    details summary::-webkit-details-marker { display: none; }
    details[open] summary { border-bottom: 1px solid var(--border); }
    details .ans { padding: 0 1.15rem 1rem; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
    .cta-final {
      text-align: center;
      padding: clamp(3rem, 8vw, 5rem) 0;
    }
    .cta-box {
      max-width: 560px;
      margin: 0 auto;
      padding: clamp(2rem, 4vw, 2.75rem);
      border-radius: calc(var(--radius) + 4px);
      border: 1px solid var(--border);
      background: linear-gradient(165deg, rgba(34, 211, 238, 0.1), rgba(167, 139, 250, 0.08));
      box-shadow: 0 32px 80px -32px rgba(167, 139, 250, 0.2);
    }
    .cta-box h2 { margin: 0 0 0.5rem; font-size: clamp(1.4rem, 3vw, 1.85rem); letter-spacing: -0.03em; }
    .cta-box p { margin: 0 0 1.25rem; color: var(--muted); font-size: 0.95rem; }
    footer {
      padding: 2rem 0;
      border-top: 1px solid var(--border);
      color: var(--faint);
      font-size: 0.85rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="mesh" aria-hidden="true"></div>
  <div class="grid-floor" aria-hidden="true"></div>
  <header data-tpl-nav>
    <div class="wrap nav-inner">
      <a class="logo" href="#">%%BRAND_NAME%%</a>
      <nav class="nav-links">
        <a href="#problem">%%NAV_PROBLEM%%</a>
        <a href="#features">%%NAV_FEATURES%%</a>
        <a href="#how">%%NAV_HOW%%</a>
        <a href="#faq">%%NAV_FAQ%%</a>
      </nav>
      <a class="btn btn-primary" href="#cta">%%NAV_CTA%%</a>
      <button type="button" class="nav-toggle" data-tpl-nav-toggle aria-label="Menu">Menu</button>
    </div>
    <nav class="nav-mobile wrap" data-tpl-nav-mobile>
      <a href="#problem">%%NAV_PROBLEM%%</a>
      <a href="#features">%%NAV_FEATURES%%</a>
      <a href="#how">%%NAV_HOW%%</a>
      <a href="#faq">%%NAV_FAQ%%</a>
      <a class="btn btn-primary" href="#cta" style="margin-top:0.5rem;text-align:center;">%%NAV_CTA%%</a>
    </nav>
  </header>
  <main>
    <section class="hero">
      <div class="wrap">
        <div class="float-card">
          <p>%%FLOAT_CARD_TITLE%%</p>
          <form class="float-row" action="#" method="get" onsubmit="return false;">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-primary">%%FLOAT_CTA_LABEL%%</button>
          </form>
        </div>
        <div class="hero-split">
          <div>
            <h1>%%HERO_HEADLINE%%</h1>
            <p class="lead">%%HERO_SUB%%</p>
            <div class="hero-ctas">
              <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
              <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
            </div>
          </div>
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>
    <section id="problem">
      <div class="wrap">
        <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
        <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
        <p class="sec-body">%%PROBLEM_BODY%%</p>
        <blockquote class="pullquote">%%PROBLEM_QUOTE%%</blockquote>
      </div>
    </section>
    <section id="features" class="alt-band">
      <div class="wrap">
        <p class="eyebrow">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title">%%BENEFITS_TITLE%%</h2>
        <div class="feature-grid">
          <div class="feature-card">
            <h3>%%FEATURE1_TITLE%%</h3>
            <p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="feature-card">
            <h3>%%FEATURE2_TITLE%%</h3>
            <p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="feature-card">
            <h3>%%FEATURE3_TITLE%%</h3>
            <p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>
    <section id="how">
      <div class="wrap">
        <p class="eyebrow">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title">%%HOW_TITLE%%</h2>
        <div class="how-grid">
          <div class="how-step"><span class="num">1</span><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="how-step"><span class="num">2</span><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="how-step"><span class="num">3</span><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
        </div>
      </div>
    </section>
    <section id="faq">
      <div class="wrap">
        <p class="eyebrow">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title">%%FAQ_TITLE%%</h2>
        <div style="margin-top:1.5rem;max-width:640px;">
          <details><summary>%%FAQ1_Q%%</summary><div class="ans">%%FAQ1_A%%</div></details>
          <details><summary>%%FAQ2_Q%%</summary><div class="ans">%%FAQ2_A%%</div></details>
          <details><summary>%%FAQ3_Q%%</summary><div class="ans">%%FAQ3_A%%</div></details>
        </div>
      </div>
    </section>
    <section id="cta" class="cta-final">
      <div class="wrap">
        <div class="cta-box">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <form class="float-row" action="#" method="get" onsubmit="return false;">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-primary">%%FLOAT_CTA_LABEL%%</button>
          </form>
        </div>
      </div>
    </section>
  </main>
  <footer>
    <div class="wrap">%%FOOTER_LINE%%</div>
  </footer>
  <script>
    (function(){
      var h=document.querySelector("[data-tpl-nav]");
      if(!h)return;
      var t=h.querySelector("[data-tpl-nav-toggle]");
      var m=h.querySelector("[data-tpl-nav-mobile]");
      if(t&&m){t.addEventListener("click",function(){m.classList.toggle("open");});}
      document.querySelectorAll('a[href^="#"]').forEach(function(a){
        a.addEventListener("click",function(){
          if(m&&m.classList.contains("open"))m.classList.remove("open");
        });
      });
    })();
  </script>
</body>
</html>`;
