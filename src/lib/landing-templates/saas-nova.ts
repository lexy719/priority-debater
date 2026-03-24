/**
 * Curated landing template — layout & CSS are fixed; AI fills %%SLOTS%% only.
 * Style inspired by modern dark SaaS marketing pages (strong hero, problem story, benefits).
 */
export const SAAS_NOVA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #060608;
      --bg2: #0c0c10;
      --card: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.08);
      --text: rgba(255,255,255,0.94);
      --muted: rgba(255,255,255,0.55);
      --faint: rgba(255,255,255,0.38);
      --accent: #7c3aed;
      --accent2: #4f46e5;
      --glow: rgba(124, 58, 237, 0.35);
      --radius: 16px;
      --max: 1080px;
    }
    *,*::before,*::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: Inter, system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      font-size: 1rem;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .noise {
      pointer-events: none;
      position: fixed;
      inset: 0;
      z-index: 50;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    .glow-bg {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      background:
        radial-gradient(ellipse 80% 50% at 50% -20%, var(--glow), transparent 55%),
        radial-gradient(ellipse 60% 40% at 100% 10%, rgba(79,70,229,0.12), transparent 50%),
        radial-gradient(ellipse 50% 35% at 0% 80%, rgba(124,58,237,0.08), transparent 45%);
    }
    .wrap { width: 100%; max-width: var(--max); margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2rem); position: relative; z-index: 1; }
    header {
      position: sticky;
      top: 0;
      z-index: 40;
      border-bottom: 1px solid var(--border);
      background: rgba(6,6,8,0.72);
      backdrop-filter: blur(16px);
    }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 64px;
      flex-wrap: wrap;
    }
    .logo { font-weight: 700; font-size: 1.05rem; letter-spacing: -0.03em; color: var(--text); text-decoration: none; }
    .nav-links { display: none; gap: 1.75rem; align-items: center; }
    @media (min-width: 900px) { .nav-links { display: flex; } }
    .nav-links a { color: var(--muted); text-decoration: none; font-size: 0.9rem; font-weight: 500; }
    .nav-links a:hover { color: var(--text); }
    .nav-toggle {
      display: flex;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: transparent;
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
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      border: 1px solid transparent;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent2), var(--accent));
      color: #fff;
      box-shadow: 0 8px 32px rgba(124,58,237,0.25);
    }
    .btn-primary:hover { filter: brightness(1.08); }
    .btn-ghost {
      background: transparent;
      border-color: var(--border);
      color: var(--text);
    }
    .btn-ghost:hover { background: rgba(255,255,255,0.05); }
    .hero { padding: clamp(2rem, 6vw, 4rem) 0 clamp(3rem, 8vw, 5rem); position: relative; z-index: 1; }
    .float-card {
      max-width: 520px;
      margin: 0 auto 2rem;
      padding: 1rem 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      backdrop-filter: blur(12px);
    }
    .float-card p { margin: 0 0 0.85rem; font-size: 0.9rem; color: var(--muted); text-align: center; }
    .float-row { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .float-row input {
      flex: 1 1 200px;
      min-width: 0;
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: rgba(0,0,0,0.35);
      color: var(--text);
      font: inherit;
    }
    .float-row input::placeholder { color: var(--faint); }
    .hero h1 {
      text-align: center;
      font-size: clamp(2.1rem, 5vw, 3.15rem);
      font-weight: 700;
      line-height: 1.1;
      letter-spacing: -0.035em;
      margin: 0 0 1rem;
      max-width: 18ch;
      margin-left: auto;
      margin-right: auto;
    }
    .hero .lead {
      text-align: center;
      color: var(--muted);
      font-size: clamp(1rem, 2vw, 1.15rem);
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
      .hero-split { grid-template-columns: 1fr 1fr; }
      .hero h1, .hero .lead { text-align: left; margin-left: 0; margin-right: 0; }
      .hero-ctas { justify-content: flex-start; }
      .float-card { margin-left: 0; margin-right: 0; }
    }
    .hero-visual {
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
      min-height: 220px;
      background: linear-gradient(145deg, rgba(124,58,237,0.15), rgba(6,6,8,0.9));
      position: relative;
    }
    .hero-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      min-height: 220px;
    }
    .photo-credit { font-size: 0.7rem; color: var(--faint); padding: 0.5rem 0.75rem; }
    .photo-credit a { color: var(--muted); }
    section { padding: clamp(3rem, 7vw, 5rem) 0; position: relative; z-index: 1; }
    .eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--faint);
      margin-bottom: 0.75rem;
    }
    .sec-title {
      font-size: clamp(1.65rem, 3.5vw, 2.1rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin: 0 0 1rem;
    }
    .sec-body { color: var(--muted); font-size: 1.02rem; max-width: 60ch; line-height: 1.65; margin: 0; }
    .pullquote {
      margin-top: 1.5rem;
      padding: 1.25rem 1.35rem;
      border-radius: 12px;
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      background: rgba(255,255,255,0.03);
      color: var(--muted);
      font-style: italic;
      font-size: 0.98rem;
      line-height: 1.55;
    }
    .alt-band {
      background: linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .feature-grid {
      display: grid;
      gap: 1rem;
      margin-top: 2rem;
    }
    @media (min-width: 640px) { .feature-grid { grid-template-columns: repeat(3, 1fr); } }
    .feature-card {
      padding: 1.35rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
    }
    .feature-card h3 { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 600; letter-spacing: -0.02em; }
    .feature-card p { margin: 0; color: var(--muted); font-size: 0.92rem; line-height: 1.55; }
    .how-grid {
      display: grid;
      gap: 1.25rem;
      margin-top: 2rem;
    }
    @media (min-width: 768px) { .how-grid { grid-template-columns: repeat(3, 1fr); } }
    .how-step {
      padding: 1.25rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.02);
    }
    .how-step .num {
      width: 2rem; height: 2rem;
      border-radius: 999px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      background: linear-gradient(135deg, var(--accent2), var(--accent));
      color: #fff;
      margin-bottom: 0.75rem;
    }
    .how-step h3 { margin: 0 0 0.4rem; font-size: 0.98rem; font-weight: 600; }
    .how-step p { margin: 0; color: var(--muted); font-size: 0.88rem; line-height: 1.5; }
    details {
      border: 1px solid var(--border);
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
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
      background: linear-gradient(165deg, rgba(124,58,237,0.12), rgba(6,6,8,0.95));
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
  <div class="glow-bg" aria-hidden="true"></div>
  <div class="noise" aria-hidden="true"></div>
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
