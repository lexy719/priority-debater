/**
 * Startup Horizon - "Momentum"
 * Bigger startup energy: layered hero, ticker, outcome cards,
 * bright proof wall, and darker CTA finish.
 */
export const STARTUP_HORIZON_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --cream:#fff8f2;--ink:#1c2433;--muted:rgba(28,36,51,0.66);--faint:rgba(28,36,51,0.4);
      --line:rgba(28,36,51,0.09);--line-2:rgba(28,36,51,0.15);
      --coral:#ff7b54;--rose:#ff5ea7;--amber:#ffbd59;--sky:#68c8ff;--dark:#0f1724;
      --max:1160px;--radius:26px;--radius-sm:16px;
      --shadow:0 28px 80px -40px rgba(255,123,84,0.38),0 24px 60px -36px rgba(15,23,36,0.22);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:Inter,system-ui,sans-serif;background:linear-gradient(180deg,#fff8f2 0%,#fff4eb 48%,#fff8f2 100%);color:var(--ink);line-height:1.62;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    .glow{position:fixed;inset:0;pointer-events:none;opacity:0.7;background:
      radial-gradient(ellipse 70% 55% at 100% 0%,rgba(255,94,167,0.18),transparent 58%),
      radial-gradient(ellipse 55% 45% at 0% 24%,rgba(255,189,89,0.2),transparent 56%),
      radial-gradient(ellipse 50% 45% at 50% 100%,rgba(104,200,255,0.12),transparent 55%);
    }
    .wrap{width:min(var(--max),calc(100% - 2rem));margin:0 auto;position:relative;z-index:1}

    header{position:sticky;top:0;z-index:30;background:rgba(255,248,242,0.85);backdrop-filter:blur(14px);border-bottom:1px solid rgba(28,36,51,0.06)}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:70px;flex-wrap:wrap}
    .logo{text-decoration:none;font-family:Manrope,Inter,sans-serif;font-size:1rem;font-weight:800;letter-spacing:-0.03em}
    .nav-links{display:none;gap:1.65rem}
    @media(min-width:920px){.nav-links{display:flex}}
    .nav-links a{text-decoration:none;color:var(--muted);font-size:0.84rem;font-weight:700}
    .nav-links a:hover{color:var(--coral)}
    .nav-cta{text-decoration:none;padding:0.68rem 1rem;border-radius:999px;background:linear-gradient(135deg,var(--rose),var(--coral));color:#fff;font-size:0.82rem;font-weight:800;box-shadow:0 16px 34px -18px rgba(255,123,84,0.45)}
    .nav-toggle{display:inline-flex;padding:0.46rem 0.78rem;border:1px solid var(--line-2);background:#fff;border-radius:12px;font-size:0.76rem;cursor:pointer}
    @media(min-width:920px){.nav-toggle{display:none}}
    .nav-mobile{display:none;flex-direction:column;gap:0.5rem;padding:0 0 1rem}
    .nav-mobile.open{display:flex}
    .nav-mobile a{text-decoration:none;color:var(--muted)}
    @media(min-width:920px){.nav-mobile{display:none!important}}

    .hero-shell{padding:clamp(3rem,9vw,6rem) 0 2rem;overflow:hidden}
    .hero-grid{display:grid;gap:1.2rem}
    @media(min-width:980px){.hero-grid{grid-template-columns:1.05fr 0.95fr;align-items:center}}
    .eyebrow{display:inline-flex;align-items:center;gap:0.5rem;padding:0.38rem 0.9rem;border-radius:999px;background:rgba(255,255,255,0.7);border:1px solid rgba(255,123,84,0.15);font-size:0.7rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#d45f34;margin-bottom:1.15rem}
    .eyebrow::before{content:"";width:8px;height:8px;border-radius:999px;background:linear-gradient(135deg,var(--rose),var(--amber))}
    h1{font-family:Manrope,Inter,sans-serif;font-size:clamp(2.6rem,5.6vw,4.8rem);font-weight:800;line-height:0.95;letter-spacing:-0.055em;max-width:9.8ch}
    .lead{margin-top:1rem;max-width:44ch;font-size:1.06rem;color:var(--muted)}
    .hero-actions{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1.5rem}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.95rem 1.3rem;border-radius:15px;text-decoration:none;font-size:0.9rem;font-weight:800}
    .btn-hot{background:linear-gradient(135deg,var(--rose),var(--coral));color:#fff;box-shadow:0 18px 42px -20px rgba(255,123,84,0.45)}
    .btn-soft{border:1px solid rgba(28,36,51,0.12);background:rgba(255,255,255,0.74);color:var(--ink)}
    .hero-note{display:grid;gap:0.8rem;margin-top:1.45rem}
    @media(min-width:640px){.hero-note{grid-template-columns:repeat(2,1fr)}}
    .hero-note .card{padding:1rem 1.05rem;border-radius:18px;border:1px solid rgba(28,36,51,0.08);background:rgba(255,255,255,0.65);box-shadow:0 16px 34px -26px rgba(28,36,51,0.24)}
    .hero-note .k{font-size:0.72rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#d45f34;margin-bottom:0.35rem}
    .hero-note p{font-size:0.88rem;color:var(--muted)}

    .visual-shell{padding:1px;border-radius:30px;background:linear-gradient(135deg,rgba(255,123,84,0.7),rgba(255,94,167,0.55),rgba(104,200,255,0.4));box-shadow:var(--shadow)}
    .visual-inner{border-radius:29px;background:#fff;overflow:hidden}
    .visual-top{display:flex;align-items:center;justify-content:space-between;padding:0.95rem 1rem;border-bottom:1px solid rgba(28,36,51,0.06);background:linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,248,242,0.8))}
    .visual-top .k{font-size:0.76rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--faint)}
    .dots{display:flex;gap:0.4rem}.dots span{width:10px;height:10px;border-radius:999px}.dots span:nth-child(1){background:#ff6b6b}.dots span:nth-child(2){background:#ffbd59}.dots span:nth-child(3){background:#55d6a2}
    .visual-stage{display:grid;gap:0.9rem;padding:1rem}
    .hero-frame{overflow:hidden;border-radius:22px;border:1px solid rgba(28,36,51,0.08);background:#fff4eb;min-height:300px}
    .hero-frame .hero-visual img{display:block;width:100%;height:100%;min-height:300px;object-fit:cover}
    .hero-frame .hero-visual:empty{min-height:300px;background:linear-gradient(135deg,rgba(255,189,89,0.28),rgba(255,94,167,0.16))}
    .photo-credit{padding:0.7rem 0.85rem;border-top:1px solid rgba(28,36,51,0.06);font-size:0.68rem;color:var(--faint)}
    .photo-credit a{color:var(--coral)}
    .stage-grid{display:grid;gap:0.8rem}
    @media(min-width:640px){.stage-grid{grid-template-columns:repeat(3,1fr)}}
    .stage-card{padding:0.95rem;border-radius:18px;border:1px solid rgba(28,36,51,0.08);background:linear-gradient(180deg,#fff,#fff9f4)}
    .stage-card .v{font-size:1.45rem;font-weight:800;letter-spacing:-0.05em}
    .stage-card .l{margin-top:0.2rem;font-size:0.78rem;color:var(--faint)}

    .ticker{margin-top:2.5rem;border-top:1px solid rgba(255,123,84,0.14);border-bottom:1px solid rgba(255,123,84,0.14);background:rgba(255,255,255,0.5);overflow:hidden}
    .track{display:flex;gap:2.4rem;padding:0.9rem 0;white-space:nowrap;animation:scroll 28s linear infinite;font-size:0.78rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:rgba(212,95,52,0.6)}
    @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

    .proof{padding:2.2rem 0 3rem}
    .proof-shell{display:grid;gap:1rem}
    @media(min-width:860px){.proof-shell{grid-template-columns:0.95fr 1.05fr;align-items:center}}
    .proof-card{padding:1.1rem 1.2rem;border-radius:22px;border:1px solid rgba(28,36,51,0.08);background:rgba(255,255,255,0.7);box-shadow:0 16px 40px -28px rgba(28,36,51,0.18)}
    .proof-card .k{font-size:0.72rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#d45f34;margin-bottom:0.45rem}
    .proof-card p{color:var(--muted)}
    .metric-row{display:grid;gap:0.8rem}
    @media(min-width:640px){.metric-row{grid-template-columns:repeat(3,1fr)}}
    .metric{padding:1rem;border-radius:20px;border:1px solid rgba(28,36,51,0.08);background:rgba(255,255,255,0.78)}
    .metric .v{font-size:1.6rem;font-weight:800;letter-spacing:-0.05em}
    .metric .l{margin-top:0.2rem;font-size:0.78rem;color:var(--faint)}

    section{padding:4.4rem 0}
    .section-head{max-width:56ch;margin-bottom:2rem}
    .section-eyebrow{font-size:0.72rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#d45f34;margin-bottom:0.8rem}
    h2{font-family:Manrope,Inter,sans-serif;font-size:clamp(1.9rem,3.7vw,2.9rem);font-weight:800;line-height:0.98;letter-spacing:-0.05em}
    .section-head p{margin-top:0.7rem;color:var(--muted)}

    .feature-grid{display:grid;gap:1rem}
    @media(min-width:860px){.feature-grid{grid-template-columns:repeat(3,1fr)}}
    .feature{padding:1.2rem;border-radius:22px;border:1px solid rgba(28,36,51,0.08);background:#fff;box-shadow:0 20px 46px -30px rgba(28,36,51,0.16)}
    .feature .top{display:flex;justify-content:space-between;gap:1rem;align-items:center;margin-bottom:0.85rem}
    .feature .n{display:inline-flex;padding:0.3rem 0.55rem;border-radius:999px;background:rgba(255,123,84,0.12);color:#d45f34;font-size:0.68rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase}
    .feature .spark{width:34px;height:34px;border-radius:14px;background:linear-gradient(135deg,var(--amber),var(--rose));opacity:0.88}
    .feature h3{font-size:1rem;font-weight:800;margin-bottom:0.3rem}
    .feature p{font-size:0.9rem;color:var(--muted)}

    .problem-shell{display:grid;gap:1rem}
    @media(min-width:860px){.problem-shell{grid-template-columns:0.9fr 1.1fr;align-items:start}}
    .problem-card,.quote-card{padding:1.25rem;border-radius:22px;border:1px solid rgba(28,36,51,0.08);background:rgba(255,255,255,0.74)}
    .quote-card p{font-size:1.12rem;line-height:1.55;color:#d45f34;font-style:italic;font-weight:600}
    .problem-card p{color:var(--muted)}

    .steps{display:grid;gap:1rem}
    @media(min-width:860px){.steps{grid-template-columns:repeat(3,1fr)}}
    .step{padding:1.2rem;border-radius:22px;border:1px solid rgba(28,36,51,0.08);background:linear-gradient(180deg,#fff,#fff8f2)}
    .step .badge{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:999px;background:linear-gradient(135deg,var(--amber),var(--coral));color:#fff;font-size:0.84rem;font-weight:800;margin-bottom:0.8rem}
    .step h3{font-size:1rem;font-weight:800;margin-bottom:0.3rem}
    .step p{font-size:0.9rem;color:var(--muted)}

    .faq{display:grid;gap:0.7rem}
    .faq details{border-radius:18px;border:1px solid rgba(28,36,51,0.08);background:rgba(255,255,255,0.76);overflow:hidden}
    .faq summary{list-style:none;cursor:pointer;padding:1rem 1.1rem;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:0.94rem;font-weight:800}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:"+";font-size:1.1rem;color:#d45f34}
    .faq details[open] summary::after{content:"−"}
    .faq .a{padding:0 1.1rem 1rem;font-size:0.9rem;color:var(--muted)}

    .cta{padding-top:1rem;padding-bottom:5rem}
    .cta-shell{position:relative;overflow:hidden;border-radius:30px;background:linear-gradient(160deg,#131d2a 0%,#1a2638 48%,#0f1724 100%);color:#eff6ff;padding:2.7rem 1.3rem;text-align:center;box-shadow:0 34px 90px -44px rgba(15,23,36,0.8)}
    .cta-shell::before{content:"";position:absolute;top:-25%;right:-8%;width:220px;height:220px;border-radius:999px;background:radial-gradient(circle,rgba(255,123,84,0.28),transparent 70%)}
    .cta-shell::after{content:"";position:absolute;bottom:-20%;left:-5%;width:220px;height:220px;border-radius:999px;background:radial-gradient(circle,rgba(104,200,255,0.18),transparent 70%)}
    .cta-shell > *{position:relative}
    .cta-shell h2{max-width:12ch;margin:0 auto 0.6rem}
    .cta-shell p{max-width:40ch;margin:0 auto;color:rgba(239,246,255,0.72)}
    .cta-note{margin-top:1rem;font-size:0.72rem;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#ffc6b8}
    .email-row{display:flex;flex-wrap:wrap;justify-content:center;gap:0.65rem;margin-top:1.2rem}
    .email-row input{width:min(100%,290px);padding:0.95rem 1rem;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#eff6ff;font:inherit}
    .email-row input::placeholder{color:rgba(239,246,255,0.42)}
    .email-row button{border:none;cursor:pointer}

    footer{padding:1.6rem 0 2.4rem;border-top:1px solid rgba(28,36,51,0.08);text-align:center;font-size:0.78rem;color:var(--faint)}
    :focus-visible{outline:2px solid var(--coral);outline-offset:3px}
  </style>
</head>
<body>
  <div class="glow" aria-hidden="true"></div>

  <header data-tpl-nav>
    <div class="wrap nav">
      <a class="logo" href="#">%%BRAND_NAME%%</a>
      <nav class="nav-links">
        <a href="#problem">%%NAV_PROBLEM%%</a>
        <a href="#features">%%NAV_FEATURES%%</a>
        <a href="#how">%%NAV_HOW%%</a>
        <a href="#faq">%%NAV_FAQ%%</a>
      </nav>
      <a class="nav-cta" href="#cta">%%NAV_CTA%%</a>
      <button type="button" class="nav-toggle" data-tpl-nav-toggle aria-label="Menu">Menu</button>
    </div>
    <nav class="wrap nav-mobile" data-tpl-nav-mobile>
      <a href="#problem">%%NAV_PROBLEM%%</a>
      <a href="#features">%%NAV_FEATURES%%</a>
      <a href="#how">%%NAV_HOW%%</a>
      <a href="#faq">%%NAV_FAQ%%</a>
      <a class="nav-cta" href="#cta" style="display:inline-flex;margin-top:0.45rem">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero-shell">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">%%FLOAT_CARD_TITLE%%</div>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-actions">
            <a class="btn btn-hot" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-soft" href="#how">%%CTA_SECONDARY%%</a>
          </div>
          <div class="hero-note">
            <div class="card"><div class="k">Energy</div><p>Built to feel like a launch page with momentum, not a flat set of feature rows.</p></div>
            <div class="card"><div class="k">Offer</div><p>%%BENEFITS_TITLE%%</p></div>
          </div>
        </div>
        <div class="visual-shell">
          <div class="visual-inner">
            <div class="visual-top">
              <div class="dots"><span></span><span></span><span></span></div>
              <div class="k">%%BRAND_NAME%% live page</div>
            </div>
            <div class="visual-stage">
              <div class="hero-frame">%%RAW_HERO_VISUAL%%</div>
              <div class="stage-grid">
                <div class="stage-card"><div class="v">01</div><div class="l">Clear promise</div></div>
                <div class="stage-card"><div class="v">02</div><div class="l">Proof-led sections</div></div>
                <div class="stage-card"><div class="v">03</div><div class="l">Confident CTA</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="ticker" aria-hidden="true">
        <div class="track">
          <span>%%BENEFITS_EYEBROW%%</span><span>%%BENEFITS_TITLE%%</span><span>%%FEATURE1_TITLE%%</span><span>%%FEATURE2_TITLE%%</span><span>%%FEATURE3_TITLE%%</span>
          <span>%%BENEFITS_EYEBROW%%</span><span>%%BENEFITS_TITLE%%</span><span>%%FEATURE1_TITLE%%</span><span>%%FEATURE2_TITLE%%</span><span>%%FEATURE3_TITLE%%</span>
        </div>
      </div>
    </section>

    <section class="proof" id="trust" aria-label="Social proof">
      <div class="wrap proof-shell">
        <div class="proof-card"><div class="k">%%SOCIAL_PROOF_EYEBROW%%</div><p>%%SOCIAL_PROOF_MAIN%%</p></div>
        <div class="metric-row">
          <div class="metric"><div class="v">01</div><div class="l">Higher clarity</div></div>
          <div class="metric"><div class="v">02</div><div class="l">Faster pitch</div></div>
          <div class="metric"><div class="v">03</div><div class="l">Stronger momentum</div></div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%BENEFITS_EYEBROW%%</div>
          <h2>%%BENEFITS_TITLE%%</h2>
          <p>These templates now push past simple “three-card startup page” territory and into a stronger, more productized launch aesthetic.</p>
        </div>
        <div class="feature-grid">
          <div class="feature"><div class="top"><div class="n">Feature 01</div><div class="spark"></div></div><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
          <div class="feature"><div class="top"><div class="n">Feature 02</div><div class="spark"></div></div><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
          <div class="feature"><div class="top"><div class="n">Feature 03</div><div class="spark"></div></div><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%PROBLEM_EYEBROW%%</div>
          <h2>%%PROBLEM_TITLE%%</h2>
        </div>
        <div class="problem-shell">
          <div class="problem-card"><p>%%PROBLEM_BODY%%</p></div>
          <div class="quote-card"><p>%%PROBLEM_QUOTE%%</p></div>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%HOW_EYEBROW%%</div>
          <h2>%%HOW_TITLE%%</h2>
        </div>
        <div class="steps">
          <div class="step"><div class="badge">1</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><div class="badge">2</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><div class="badge">3</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="faq">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%FAQ_EYEBROW%%</div>
          <h2>%%FAQ_TITLE%%</h2>
        </div>
        <div class="faq">
          <details><summary>%%FAQ1_Q%%</summary><div class="a">%%FAQ1_A%%</div></details>
          <details><summary>%%FAQ2_Q%%</summary><div class="a">%%FAQ2_A%%</div></details>
          <details><summary>%%FAQ3_Q%%</summary><div class="a">%%FAQ3_A%%</div></details>
        </div>
      </div>
    </section>

    <section id="cta" class="cta">
      <div class="wrap">
        <div class="cta-shell">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <div class="cta-note">%%FLOAT_CARD_TITLE%%</div>
          <form class="email-row" action="#" method="get" onsubmit="return false;">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-hot">%%FLOAT_CTA_LABEL%%</button>
          </form>
        </div>
      </div>
    </section>
  </main>

  <footer><div class="wrap">%%FOOTER_LINE%%</div></footer>

  <script>
  (function(){
    var nav=document.querySelector("[data-tpl-nav]");
    if(!nav)return;
    var toggle=nav.querySelector("[data-tpl-nav-toggle]");
    var mobile=document.querySelector("[data-tpl-nav-mobile]");
    if(toggle&&mobile){toggle.addEventListener("click",function(){mobile.classList.toggle("open");});}
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener("click",function(){if(mobile&&mobile.classList.contains("open"))mobile.classList.remove("open");});
    });
  })();
  </script>
</body>
</html>`;
