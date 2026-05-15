/**
 * SaaS Nova - "Signal Deck"
 * Premium product-marketing shell with a dense hero, dashboard stage, bento proof,
 * and stronger 21st.dev-style gradients and cards.
 */
export const SAAS_NOVA_TEMPLATE = `<!DOCTYPE html>
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
      --bg:#05070d;--bg-2:#0b1020;--surface:rgba(255,255,255,0.05);--surface-2:rgba(255,255,255,0.07);
      --line:rgba(255,255,255,0.1);--line-2:rgba(255,255,255,0.16);
      --text:#f7f8fb;--muted:rgba(247,248,251,0.68);--faint:rgba(247,248,251,0.38);
      --accent:#7c6cff;--accent-2:#42c8ff;--accent-3:#af7cff;--success:#55d6a2;
      --max:1180px;--radius:24px;--radius-sm:14px;
      --shadow:0 40px 120px -48px rgba(17,24,39,0.9),0 24px 60px -32px rgba(124,108,255,0.35);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    a{color:inherit}
    .bg{position:fixed;inset:0;pointer-events:none;z-index:0;background:
      radial-gradient(ellipse 80% 60% at 15% -10%,rgba(124,108,255,0.28),transparent 55%),
      radial-gradient(ellipse 55% 50% at 100% 5%,rgba(66,200,255,0.18),transparent 52%),
      radial-gradient(ellipse 60% 45% at 50% 120%,rgba(175,124,255,0.18),transparent 48%),
      linear-gradient(180deg,#05070d 0%,#070b14 45%,#05070d 100%);
    }
    .grid-noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.24;background-image:
      linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px);
      background-size:52px 52px;
      mask-image:radial-gradient(ellipse 82% 72% at 50% 18%,#000 20%,transparent 100%);
    }
    .wrap{width:min(var(--max),calc(100% - 2rem));margin:0 auto;position:relative;z-index:1}

    header{position:sticky;top:0;z-index:30;background:rgba(5,7,13,0.78);backdrop-filter:blur(18px) saturate(1.4);border-bottom:1px solid rgba(255,255,255,0.06)}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:70px;flex-wrap:wrap}
    .logo{text-decoration:none;font-family:Manrope,Inter,sans-serif;font-size:1rem;font-weight:800;letter-spacing:-0.03em}
    .logo-mark{display:inline-flex;align-items:center;gap:0.45rem}
    .logo-mark::before{content:"";width:10px;height:10px;border-radius:999px;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 0 24px rgba(124,108,255,0.55)}
    .nav-links{display:none;gap:1.6rem;align-items:center}
    @media(min-width:920px){.nav-links{display:flex}}
    .nav-links a{text-decoration:none;font-size:0.84rem;font-weight:600;color:var(--muted)}
    .nav-links a:hover{color:var(--text)}
    .nav-cta{text-decoration:none;padding:0.65rem 1rem;border-radius:999px;background:linear-gradient(135deg,var(--accent),var(--accent-3));color:#fff;font-size:0.82rem;font-weight:700;box-shadow:0 12px 36px -16px rgba(124,108,255,0.58)}
    .nav-toggle{display:inline-flex;border:1px solid var(--line);background:var(--surface);color:var(--text);padding:0.48rem 0.8rem;border-radius:12px;font-size:0.76rem;cursor:pointer}
    @media(min-width:920px){.nav-toggle{display:none}}
    .nav-mobile{display:none;flex-direction:column;gap:0.55rem;padding:0 0 1rem}
    .nav-mobile.open{display:flex}
    .nav-mobile a{text-decoration:none;color:var(--muted);font-size:0.95rem}
    @media(min-width:920px){.nav-mobile{display:none!important}}

    .hero{padding:clamp(3.25rem,9vw,6.25rem) 0 2.5rem}
    .hero-grid{display:grid;gap:1.5rem}
    @media(min-width:980px){.hero-grid{grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr);align-items:center}}
    .eyebrow{display:inline-flex;align-items:center;gap:0.5rem;padding:0.38rem 0.9rem;border-radius:999px;border:1px solid rgba(124,108,255,0.28);background:rgba(124,108,255,0.08);font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#c7c2ff;margin-bottom:1.25rem}
    .eyebrow::before{content:"";width:7px;height:7px;border-radius:999px;background:linear-gradient(135deg,var(--accent-2),var(--accent))}
    h1{font-family:Manrope,Inter,sans-serif;font-size:clamp(2.6rem,5.6vw,4.6rem);font-weight:800;line-height:0.96;letter-spacing:-0.05em;max-width:10.5ch}
    .grad{background:linear-gradient(135deg,#fff 0%,#d9e5ff 38%,#87d7ff 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .lead{margin-top:1.1rem;max-width:44ch;font-size:1.05rem;color:var(--muted)}
    .hero-actions{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1.6rem}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.45rem;padding:0.95rem 1.3rem;border-radius:14px;text-decoration:none;font-size:0.9rem;font-weight:700;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
    .btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent-3));color:#fff;box-shadow:0 18px 46px -22px rgba(124,108,255,0.65)}
    .btn-primary:hover{transform:translateY(-2px)}
    .btn-ghost{border:1px solid var(--line-2);background:rgba(255,255,255,0.03);color:var(--text)}
    .btn-ghost:hover{border-color:rgba(255,255,255,0.26)}
    .hero-proof{display:flex;flex-wrap:wrap;gap:1rem 1.5rem;margin-top:1.7rem;font-size:0.82rem;color:var(--faint)}
    .hero-proof strong{display:block;font-size:1rem;color:var(--text)}

    .hero-stage{position:relative;padding:1px;border-radius:28px;background:linear-gradient(135deg,rgba(124,108,255,0.85),rgba(66,200,255,0.4),rgba(175,124,255,0.6));box-shadow:var(--shadow)}
    .hero-stage::after{content:"";position:absolute;inset:-20% -10% auto auto;width:180px;height:180px;border-radius:999px;background:radial-gradient(circle,rgba(66,200,255,0.28),transparent 70%);pointer-events:none}
    .stage-inner{border-radius:27px;overflow:hidden;background:linear-gradient(180deg,#0a0f1e 0%,#070b14 100%);border:1px solid rgba(255,255,255,0.05)}
    .stage-top{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02)}
    .stage-dots{display:flex;gap:0.42rem}
    .stage-dots span{width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,0.18)}
    .stage-dots span:nth-child(1){background:#ff6b6b}.stage-dots span:nth-child(2){background:#ffbf69}.stage-dots span:nth-child(3){background:#55d6a2}
    .stage-label{font-size:0.76rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--faint)}
    .stage-content{display:grid;gap:1rem;padding:1rem}
    .stage-visual{position:relative;overflow:hidden;border-radius:20px;border:1px solid rgba(255,255,255,0.08);background:#0e1320;min-height:260px}
    .stage-visual .hero-visual{position:relative;height:100%}
    .stage-visual .hero-visual img{display:block;width:100%;height:100%;min-height:260px;object-fit:cover}
    .stage-visual .hero-visual:empty{height:100%;background:linear-gradient(135deg,rgba(124,108,255,0.18),rgba(66,200,255,0.12))}
    .stage-visual::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,7,13,0.05),rgba(5,7,13,0.35));pointer-events:none}
    .photo-credit{padding:0.65rem 0.85rem;border-top:1px solid rgba(255,255,255,0.06);font-size:0.68rem;color:var(--faint)}
    .photo-credit a{color:#9edcff;text-decoration:none}
    .mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0.85rem}
    .mini-stat{padding:0.85rem;border-radius:16px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)}
    .mini-stat .k{font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--faint);margin-bottom:0.4rem}
    .mini-stat .v{font-size:1.15rem;font-weight:800;color:var(--text)}

    .trust{padding:0.75rem 0 3rem}
    .trust-shell{display:grid;gap:1rem;padding:1rem 1.1rem;border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))}
    @media(min-width:860px){.trust-shell{grid-template-columns:1.15fr 0.85fr;align-items:center}}
    .trust-copy .k{font-size:0.72rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#9edcff;margin-bottom:0.55rem}
    .trust-copy p{font-size:0.98rem;color:var(--muted);max-width:48ch}
    .metric-row{display:grid;gap:0.75rem}
    @media(min-width:640px){.metric-row{grid-template-columns:repeat(3,1fr)}}
    .metric-card{padding:1rem;border:1px solid rgba(255,255,255,0.08);border-radius:18px;background:rgba(255,255,255,0.03)}
    .metric-card .v{font-family:Manrope,Inter,sans-serif;font-size:1.6rem;font-weight:800;letter-spacing:-0.04em}
    .metric-card .l{margin-top:0.2rem;font-size:0.78rem;color:var(--faint)}

    section{padding:4.5rem 0}
    .section-head{display:flex;flex-direction:column;gap:0.6rem;max-width:54ch;margin-bottom:2rem}
    .section-eyebrow{font-size:0.74rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#9edcff}
    h2{font-family:Manrope,Inter,sans-serif;font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-0.04em;line-height:1.02}
    .section-head p{color:var(--muted)}

    .bento{display:grid;gap:1rem}
    @media(min-width:860px){.bento{grid-template-columns:1.15fr 0.85fr}.bento-right{display:grid;gap:1rem}}
    .panel{position:relative;overflow:hidden;border-radius:24px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025));padding:1.3rem}
    .panel::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at top right,rgba(124,108,255,0.14),transparent 35%);pointer-events:none}
    .feature-stack{display:grid;gap:1rem}
    .feature-item{display:grid;grid-template-columns:auto 1fr;gap:1rem;align-items:start;padding:1rem;border-radius:18px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03)}
    .feature-num{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,rgba(124,108,255,0.22),rgba(66,200,255,0.18));border:1px solid rgba(124,108,255,0.28);font-size:0.76rem;font-weight:800;color:#dcd8ff}
    .feature-item h3{font-size:1rem;font-weight:800;margin-bottom:0.25rem}
    .feature-item p{font-size:0.9rem;color:var(--muted)}
    .insight-card{display:grid;gap:1rem;height:100%}
    .insight-top{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start}
    .insight-k{font-size:0.72rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--faint)}
    .insight-v{font-size:2rem;font-weight:800;letter-spacing:-0.05em}
    .insight-card p{color:var(--muted)}
    .insight-quote{padding:1rem 1.05rem;border-left:2px solid rgba(66,200,255,0.45);background:rgba(255,255,255,0.03);border-radius:0 16px 16px 0;color:#d9e5ff;font-style:italic}

    .steps{display:grid;gap:1rem}
    @media(min-width:860px){.steps{grid-template-columns:repeat(3,1fr)}}
    .step{padding:1.3rem;border-radius:22px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))}
    .step-num{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:999px;background:linear-gradient(135deg,var(--accent-2),var(--accent));font-size:0.82rem;font-weight:800;color:#06111d;margin-bottom:0.85rem}
    .step h3{font-size:1rem;font-weight:800;margin-bottom:0.35rem}
    .step p{font-size:0.9rem;color:var(--muted)}

    .faq{display:grid;gap:0.7rem}
    .faq details{border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,0.03);overflow:hidden}
    .faq summary{display:flex;justify-content:space-between;gap:1rem;align-items:center;list-style:none;cursor:pointer;padding:1rem 1.1rem;font-size:0.95rem;font-weight:700}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:"+";font-size:1.1rem;color:var(--accent-2)}
    .faq details[open] summary::after{content:"−"}
    .faq .a{padding:0 1.1rem 1rem;color:var(--muted);font-size:0.9rem}

    .cta{padding-top:1rem;padding-bottom:5rem}
    .cta-shell{position:relative;padding:1px;border-radius:28px;background:linear-gradient(135deg,rgba(124,108,255,0.9),rgba(66,200,255,0.38),rgba(175,124,255,0.82));box-shadow:var(--shadow)}
    .cta-shell::before{content:"";position:absolute;inset:auto auto 8% 8%;width:160px;height:160px;border-radius:999px;background:radial-gradient(circle,rgba(124,108,255,0.3),transparent 70%)}
    .cta-inner{position:relative;border-radius:27px;background:linear-gradient(180deg,#0b1020 0%,#07111a 100%);padding:2.6rem 1.4rem;text-align:center}
    .cta-inner h2{max-width:12ch;margin:0 auto 0.6rem}
    .cta-inner p{max-width:40ch;margin:0 auto;color:var(--muted)}
    .cta-note{margin-top:1rem;font-size:0.72rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c7c2ff}
    .email-row{display:flex;flex-wrap:wrap;justify-content:center;gap:0.65rem;margin-top:1.2rem}
    .email-row input{width:min(100%,280px);padding:0.95rem 1rem;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font:inherit}
    .email-row input::placeholder{color:var(--faint)}
    .email-row button{border:none;cursor:pointer}

    footer{padding:1.6rem 0 2.4rem;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:0.78rem;color:var(--faint)}
    :focus-visible{outline:2px solid var(--accent-2);outline-offset:3px}
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <div class="grid-noise" aria-hidden="true"></div>

  <header data-tpl-nav>
    <div class="wrap nav">
      <a class="logo" href="#"><span class="logo-mark">%%BRAND_NAME%%</span></a>
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
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">%%FLOAT_CARD_TITLE%%</div>
          <h1><span class="grad">%%HERO_HEADLINE%%</span></h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
          </div>
          <div class="hero-proof">
            <div><strong>Fast setup</strong><span>Built to feel live in minutes, not after a long implementation arc.</span></div>
            <div><strong>Clear value</strong><span>Every section pushes toward outcomes buyers can recognize immediately.</span></div>
          </div>
        </div>
        <div class="hero-stage">
          <div class="stage-inner">
            <div class="stage-top">
              <div class="stage-dots"><span></span><span></span><span></span></div>
              <div class="stage-label">%%BRAND_NAME%% workspace</div>
            </div>
            <div class="stage-content">
              <div class="stage-visual">%%RAW_HERO_VISUAL%%</div>
              <div class="mini-grid">
                <div class="mini-stat"><div class="k">Signal</div><div class="v">01</div></div>
                <div class="mini-stat"><div class="k">Flow</div><div class="v">02</div></div>
                <div class="mini-stat"><div class="k">Lift</div><div class="v">03</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="trust" id="trust" aria-label="Social proof">
      <div class="wrap">
        <div class="trust-shell">
          <div class="trust-copy">
            <div class="k">%%SOCIAL_PROOF_EYEBROW%%</div>
            <p>%%SOCIAL_PROOF_MAIN%%</p>
          </div>
          <div class="metric-row">
            <div class="metric-card"><div class="v">01</div><div class="l">Focused pipeline</div></div>
            <div class="metric-card"><div class="v">02</div><div class="l">Faster decisions</div></div>
            <div class="metric-card"><div class="v">03</div><div class="l">Cleaner handoff</div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%BENEFITS_EYEBROW%%</div>
          <h2>%%BENEFITS_TITLE%%</h2>
          <p>A stronger landing system needs more than a headline and three cards. This layout gives the product a point of view, a proof surface, and a richer visual stage.</p>
        </div>
        <div class="bento">
          <div class="panel">
            <div class="feature-stack">
              <div class="feature-item">
                <div class="feature-num">01</div>
                <div><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
              </div>
              <div class="feature-item">
                <div class="feature-num">02</div>
                <div><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
              </div>
              <div class="feature-item">
                <div class="feature-num">03</div>
                <div><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
              </div>
            </div>
          </div>
          <div class="bento-right">
            <div class="panel insight-card">
              <div class="insight-top">
                <div>
                  <div class="insight-k">Problem frame</div>
                  <div class="insight-v">%%PROBLEM_TITLE%%</div>
                </div>
              </div>
              <p>%%PROBLEM_BODY%%</p>
            </div>
            <div class="panel">
              <div class="insight-k">Signal quote</div>
              <div class="insight-quote">%%PROBLEM_QUOTE%%</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%PROBLEM_EYEBROW%%</div>
          <h2>What changes when the product story is framed around the real friction.</h2>
          <p>%%PROBLEM_BODY%%</p>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%HOW_EYEBROW%%</div>
          <h2>%%HOW_TITLE%%</h2>
          <p>A higher-end template needs motion in the narrative too: clear progression, tighter sequencing, and enough structure to make each step feel believable.</p>
        </div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><div class="step-num">2</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><div class="step-num">3</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
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
          <div class="cta-inner">
            <h2>%%CTA_FINAL_TITLE%%</h2>
            <p>%%CTA_FINAL_SUB%%</p>
            <div class="cta-note">%%FLOAT_CARD_TITLE%%</div>
            <form class="email-row" action="#" method="get" onsubmit="return false;">
              <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
              <button type="button" class="btn btn-primary">%%FLOAT_CTA_LABEL%%</button>
            </form>
          </div>
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
