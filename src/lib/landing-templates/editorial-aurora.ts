/**
 * Editorial Aurora — warm paper, Fraunces + DM Sans, editorial SaaS polish.
 * Same %%SLOTS%% as SaaS Nova; AI fills copy only.
 */
export const EDITORIAL_AURORA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700&display=swap" rel="stylesheet">
    <style>
    :root {
      --paper: #f3efe8;
      --paper2: #e8e2d8;
      --card: #fffefb;
      --border: rgba(28, 25, 23, 0.1);
      --text: #1c1917;
      --muted: rgba(28, 25, 23, 0.62);
      --faint: rgba(28, 25, 23, 0.42);
      --accent: #c2410c;
      --accent2: #ea580c;
      --radius: 18px;
      --max: 1040px;
      --serif: "Fraunces", Georgia, "Times New Roman", serif;
      --sans: "DM Sans", system-ui, sans-serif;
    }
    *,*::before,*::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: var(--sans);
      background: var(--paper);
      color: var(--text);
      font-size: 1rem;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .atmosphere {
      pointer-events: none;
      position: fixed;
      inset: 0;
      z-index: 0;
      background:
        radial-gradient(ellipse 90% 60% at 10% 0%, rgba(234, 88, 12, 0.07), transparent 50%),
        radial-gradient(ellipse 70% 50% at 100% 20%, rgba(194, 65, 12, 0.05), transparent 45%),
        radial-gradient(ellipse 50% 40% at 50% 100%, rgba(120, 53, 15, 0.04), transparent 40%);
    }
    .paper-grain {
      pointer-events: none;
      position: fixed;
      inset: 0;
      z-index: 50;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    .wrap { width: 100%; max-width: var(--max); margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2rem); position: relative; z-index: 1; }
    header {
      position: sticky;
      top: 0;
      z-index: 40;
      border-bottom: 1px solid var(--border);
      background: rgba(255, 254, 251, 0.86);
      backdrop-filter: blur(16px);
      box-shadow: 0 1px 0 rgba(255,255,255,0.8) inset;
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
      font-weight: 600;
      font-size: 1.15rem;
      letter-spacing: -0.03em;
      font-family: var(--serif);
      color: var(--text);
      text-decoration: none;
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
      padding: 0.7rem 1.25rem;
      border-radius: 11px;
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
      box-shadow: 0 10px 36px rgba(194, 65, 12, 0.22);
    }
    .btn-primary:hover { filter: brightness(1.05); transform: translateY(-1px); }
    .btn-ghost {
      background: transparent;
      border-color: var(--border);
      color: var(--text);
    }
    .btn-ghost:hover { background: rgba(28, 25, 23, 0.04); }
    .hero { padding: clamp(2rem, 6vw, 4rem) 0 clamp(3rem, 8vw, 5rem); position: relative; z-index: 1; }
    .float-card {
      max-width: 520px;
      margin: 0 auto 2rem;
      padding: 1.1rem 1.35rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 24px 48px -24px rgba(28, 25, 23, 0.12);
    }
    .float-card p { margin: 0 0 0.85rem; font-size: 0.9rem; color: var(--muted); text-align: center; font-weight: 500; }
    .float-row { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .float-row input {
      flex: 1 1 200px;
      min-width: 0;
      padding: 0.65rem 0.9rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: #fff;
      color: var(--text);
      font: inherit;
    }
    .float-row input::placeholder { color: var(--faint); }
    .hero h1 {
      text-align: center;
      font-family: var(--serif);
      font-size: clamp(2.25rem, 5.5vw, 3.35rem);
      font-weight: 600;
      line-height: 1.08;
      letter-spacing: -0.035em;
      margin: 0 0 1rem;
      max-width: 16ch;
      margin-left: auto;
      margin-right: auto;
    }
    .hero .lead {
      text-align: center;
      color: var(--muted);
      font-size: clamp(1.02rem, 2vw, 1.18rem);
      max-width: 44ch;
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
      border-radius: calc(var(--radius) + 4px);
      overflow: hidden;
      border: 1px solid var(--border);
      min-height: 240px;
      background: linear-gradient(145deg, rgba(234, 88, 12, 0.08), rgba(28, 25, 23, 0.04));
      position: relative;
      box-shadow: 0 32px 64px -28px rgba(28, 25, 23, 0.25);
    }
    .hero-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      min-height: 240px;
    }
    .photo-credit { font-size: 0.7rem; color: var(--faint); padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.6); }
    .photo-credit a { color: var(--muted); }
    section { padding: clamp(3rem, 7vw, 5.25rem) 0; position: relative; z-index: 1; }
    .eyebrow {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--faint);
      margin-bottom: 0.75rem;
    }
    .sec-title {
      font-family: var(--serif);
      font-size: clamp(1.75rem, 3.5vw, 2.35rem);
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.12;
      margin: 0 0 1rem;
    }
    .sec-body { color: var(--muted); font-size: 1.05rem; max-width: 58ch; line-height: 1.7; margin: 0; }
    .pullquote {
      margin-top: 1.75rem;
      padding: 1.35rem 1.5rem;
      border-radius: 14px;
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      background: var(--card);
      color: var(--muted);
      font-style: italic;
      font-size: 1.02rem;
      line-height: 1.6;
      box-shadow: 0 12px 32px -20px rgba(28, 25, 23, 0.15);
    }
    .alt-band {
      background: linear-gradient(180deg, var(--paper2) 0%, var(--paper) 100%);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .feature-grid {
      display: grid;
      gap: 1.1rem;
      margin-top: 2rem;
    }
    @media (min-width: 640px) { .feature-grid { grid-template-columns: repeat(3, 1fr); } }
    .feature-card {
      padding: 1.5rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 16px 40px -28px rgba(28, 25, 23, 0.12);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .feature-card:hover { transform: translateY(-3px); box-shadow: 0 24px 48px -24px rgba(28, 25, 23, 0.18); }
    .feature-card h3 { margin: 0 0 0.5rem; font-size: 1.08rem; font-weight: 600; letter-spacing: -0.02em; font-family: var(--serif); }
    .feature-card p { margin: 0; color: var(--muted); font-size: 0.93rem; line-height: 1.55; }
    .how-grid {
      display: grid;
      gap: 1.25rem;
      margin-top: 2rem;
    }
    @media (min-width: 768px) { .how-grid { grid-template-columns: repeat(3, 1fr); } }
    .how-step {
      padding: 1.35rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 8px 24px -16px rgba(28, 25, 23, 0.1);
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
    .how-step h3 { margin: 0 0 0.4rem; font-size: 1rem; font-weight: 600; font-family: var(--serif); }
    .how-step p { margin: 0; color: var(--muted); font-size: 0.9rem; line-height: 1.55; }
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
      padding: clamp(2rem, 4vw, 2.85rem);
      border-radius: calc(var(--radius) + 6px);
      border: 1px solid var(--border);
      background: linear-gradient(165deg, rgba(255, 254, 251, 0.95), rgba(232, 226, 216, 0.9));
      box-shadow: 0 32px 64px -32px rgba(28, 25, 23, 0.2);
    }
    .cta-box h2 { margin: 0 0 0.5rem; font-family: var(--serif); font-size: clamp(1.5rem, 3vw, 1.95rem); letter-spacing: -0.03em; }
    .cta-box p { margin: 0 0 1.25rem; color: var(--muted); font-size: 0.95rem; }
    footer {
      padding: 2rem 0;
      border-top: 1px solid var(--border);
      color: var(--faint);
      font-size: 0.85rem;
      text-align: center;
      background: rgba(255, 254, 251, 0.5);
    }
  </style>
</head>
<body>
  <div class="atmosphere" aria-hidden="true"></div>
  <div class="paper-grain" aria-hidden="true"></div>
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
