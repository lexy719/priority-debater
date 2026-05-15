/**
 * Minimal Slate - "Frame"
 * Still restrained, but rebuilt with stronger swiss-system composition,
 * asymmetry, framing, and more premium whitespace discipline.
 */
export const MINIMAL_SLATE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#f4f2ee;--paper:#fbfaf8;--ink:#111111;--muted:rgba(17,17,17,0.62);--faint:rgba(17,17,17,0.38);
      --line:rgba(17,17,17,0.09);--line-2:rgba(17,17,17,0.14);
      --max:1080px;--radius:22px;--radius-sm:14px;
      --shadow:0 16px 40px -30px rgba(17,17,17,0.22);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);line-height:1.6;-webkit-font-smoothing:antialiased}
    .grain{position:fixed;inset:0;pointer-events:none;opacity:0.18;background-image:radial-gradient(rgba(17,17,17,0.08) 1px,transparent 1px);background-size:18px 18px}
    .wrap{width:min(var(--max),calc(100% - 2rem));margin:0 auto;position:relative;z-index:1}

    header{position:sticky;top:0;z-index:30;background:rgba(244,242,238,0.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:66px;flex-wrap:wrap}
    .logo{text-decoration:none;font-family:"Space Grotesk",Inter,sans-serif;font-size:0.98rem;font-weight:700;letter-spacing:-0.03em}
    .nav-links{display:none;gap:1.6rem}
    @media(min-width:900px){.nav-links{display:flex}}
    .nav-links a{text-decoration:none;color:var(--muted);font-size:0.8rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase}
    .nav-links a:hover{color:var(--ink)}
    .nav-cta{text-decoration:none;color:var(--ink);font-size:0.8rem;font-weight:800;border-bottom:2px solid var(--ink);padding-bottom:0.08rem}
    .nav-toggle{display:inline-flex;padding:0.45rem 0.78rem;border:1px solid var(--line-2);background:transparent;border-radius:12px;font-size:0.76rem;cursor:pointer}
    @media(min-width:900px){.nav-toggle{display:none}}
    .nav-mobile{display:none;flex-direction:column;gap:0.5rem;padding:0 0 1rem}
    .nav-mobile.open{display:flex}
    .nav-mobile a{text-decoration:none;color:var(--muted)}
    @media(min-width:900px){.nav-mobile{display:none!important}}

    .hero{padding:clamp(3rem,10vw,6rem) 0 2rem}
    .hero-grid{display:grid;gap:1.3rem}
    @media(min-width:980px){.hero-grid{grid-template-columns:1.15fr 0.85fr;align-items:start}}
    .eyebrow{font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:1rem}
    h1{font-family:"Space Grotesk",Inter,sans-serif;font-size:clamp(2.7rem,5.4vw,5rem);font-weight:700;line-height:0.92;letter-spacing:-0.065em;max-width:9ch}
    .lead{margin-top:1rem;max-width:40ch;font-size:1rem;color:var(--muted)}
    .hero-actions{display:flex;flex-wrap:wrap;gap:0.8rem;margin-top:1.5rem}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.9rem 1.2rem;border-radius:14px;text-decoration:none;font-size:0.88rem;font-weight:800}
    .btn-dark{background:var(--ink);color:var(--paper)}
    .btn-line{border:1px solid var(--line-2);background:rgba(255,255,255,0.52);color:var(--ink)}
    .hero-copy{display:grid;gap:1.1rem}
    .hero-note{display:grid;gap:0.8rem}
    @media(min-width:640px){.hero-note{grid-template-columns:repeat(2,1fr)}}
    .hero-note .card{padding:1rem;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,0.45)}
    .hero-note .k{font-size:0.7rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--faint);margin-bottom:0.35rem}
    .hero-note p{font-size:0.88rem;color:var(--muted)}

    .frame{padding:1px;border-radius:28px;background:linear-gradient(135deg,rgba(17,17,17,0.26),rgba(17,17,17,0.04));box-shadow:var(--shadow)}
    .frame-inner{border-radius:27px;background:var(--paper);overflow:hidden}
    .frame-top{display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem;border-bottom:1px solid var(--line)}
    .frame-top .k{font-size:0.76rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--faint)}
    .frame-top .dots{display:flex;gap:0.4rem}.frame-top .dots span{width:9px;height:9px;border-radius:999px;background:rgba(17,17,17,0.14)}
    .frame-body{display:grid;gap:1rem;padding:1rem}
    .hero-visual-shell{overflow:hidden;border-radius:20px;border:1px solid var(--line);background:#efebe6;min-height:300px}
    .hero-visual-shell .hero-visual img{display:block;width:100%;height:100%;min-height:300px;object-fit:cover}
    .hero-visual-shell .hero-visual:empty{min-height:300px;background:linear-gradient(135deg,#ebe6de,#f9f7f3)}
    .photo-credit{padding:0.68rem 0.85rem;border-top:1px solid var(--line);font-size:0.68rem;color:var(--faint)}
    .photo-credit a{color:var(--ink)}
    .info-grid{display:grid;gap:0.8rem}
    @media(min-width:640px){.info-grid{grid-template-columns:repeat(3,1fr)}}
    .info{padding:0.95rem;border-radius:16px;border:1px solid var(--line);background:#fff}
    .info .v{font-family:"Space Grotesk",Inter,sans-serif;font-size:1.45rem;font-weight:700;letter-spacing:-0.05em}
    .info .l{margin-top:0.2rem;font-size:0.78rem;color:var(--faint)}

    .proof{padding:0.8rem 0 3rem}
    .proof-shell{display:grid;gap:1rem}
    @media(min-width:860px){.proof-shell{grid-template-columns:0.95fr 1.05fr;align-items:center}}
    .proof-card,.quote-card{padding:1.1rem 1.15rem;border-radius:20px;border:1px solid var(--line);background:rgba(255,255,255,0.52)}
    .proof-card .k{font-size:0.72rem;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:var(--faint);margin-bottom:0.45rem}
    .proof-card p{color:var(--muted)}
    .quote-card p{font-family:"Space Grotesk",Inter,sans-serif;font-size:1.1rem;line-height:1.5;letter-spacing:-0.03em}

    section{padding:4.5rem 0;border-top:1px solid var(--line)}
    .section-grid{display:grid;gap:2rem}
    @media(min-width:900px){.section-grid{grid-template-columns:0.75fr 1.25fr}}
    .section-label{font-size:0.72rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:0.8rem}
    h2{font-family:"Space Grotesk",Inter,sans-serif;font-size:clamp(1.9rem,3.7vw,3rem);font-weight:700;line-height:0.94;letter-spacing:-0.055em}
    .section-copy p{color:var(--muted)}
    .section-copy p + p{margin-top:1rem}

    .feature-grid{display:grid;gap:1rem}
    @media(min-width:760px){.feature-grid{grid-template-columns:repeat(3,1fr)}}
    .feature{padding-top:1rem;border-top:2px solid var(--ink);position:relative}
    .feature::after{content:attr(data-n);position:absolute;top:0.7rem;right:0;font-family:"Space Grotesk",Inter,sans-serif;font-size:2.8rem;font-weight:700;line-height:1;color:rgba(17,17,17,0.06)}
    .feature h3{font-size:1rem;font-weight:800;margin-bottom:0.35rem;position:relative;z-index:1}
    .feature p{font-size:0.9rem;color:var(--muted);position:relative;z-index:1}

    .steps{display:grid;gap:1rem}
    @media(min-width:860px){.steps{grid-template-columns:repeat(3,1fr)}}
    .step{padding:1.15rem 0;border-top:1px solid var(--line)}
    @media(min-width:860px){.step{padding:1.2rem 1rem;border-left:1px solid var(--line)}.step:first-child{border-left:none}}
    .step .n{font-size:0.72rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--faint);margin-bottom:0.5rem}
    .step h3{font-size:1rem;font-weight:800;margin-bottom:0.3rem}
    .step p{font-size:0.9rem;color:var(--muted)}

    .faq{display:grid;gap:0}
    .faq details{border-bottom:1px solid var(--line)}
    .faq summary{list-style:none;cursor:pointer;padding:1rem 0;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:0.94rem;font-weight:800}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:"+";font-size:1rem;color:var(--faint)}
    .faq details[open] summary::after{content:"−"}
    .faq .a{padding:0 0 1rem;font-size:0.9rem;color:var(--muted)}

    .cta{padding-top:1rem;padding-bottom:5rem}
    .cta-shell{padding:2.4rem 1.2rem;border-radius:28px;border:1px solid var(--line-2);background:linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.46));text-align:center;box-shadow:var(--shadow)}
    .cta-shell h2{max-width:12ch;margin:0 auto 0.6rem}
    .cta-shell p{max-width:40ch;margin:0 auto;color:var(--muted)}
    .cta-note{margin-top:1rem;font-size:0.72rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:var(--faint)}
    .email-row{display:flex;flex-wrap:wrap;justify-content:center;gap:0.65rem;margin-top:1.15rem}
    .email-row input{width:min(100%,280px);padding:0.95rem 1rem;border-radius:14px;border:1px solid var(--line-2);background:#fff;color:var(--ink);font:inherit}
    .email-row button{border:none;cursor:pointer}

    footer{padding:1.6rem 0 2.4rem;border-top:1px solid var(--line);text-align:center;font-size:0.78rem;color:var(--faint)}
    :focus-visible{outline:2px solid var(--ink);outline-offset:3px}
  </style>
</head>
<body>
  <div class="grain" aria-hidden="true"></div>

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
      <a class="nav-cta" href="#cta">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <div class="eyebrow">%%FLOAT_CARD_TITLE%%</div>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-actions">
            <a class="btn btn-dark" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-line" href="#how">%%CTA_SECONDARY%%</a>
          </div>
          <div class="hero-note">
            <div class="card"><div class="k">Perspective</div><p>%%BENEFITS_TITLE%%</p></div>
            <div class="card"><div class="k">Why it lands</div><p>Minimal is stronger when the composition carries the drama.</p></div>
          </div>
        </div>
        <div class="frame">
          <div class="frame-inner">
            <div class="frame-top">
              <div class="dots"><span></span><span></span><span></span></div>
              <div class="k">%%BRAND_NAME%% preview</div>
            </div>
            <div class="frame-body">
              <div class="hero-visual-shell">%%RAW_HERO_VISUAL%%</div>
              <div class="info-grid">
                <div class="info"><div class="v">01</div><div class="l">Direct promise</div></div>
                <div class="info"><div class="v">02</div><div class="l">Quiet proof</div></div>
                <div class="info"><div class="v">03</div><div class="l">Clean action</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="proof" id="trust" aria-label="Social proof">
      <div class="wrap proof-shell">
        <div class="proof-card"><div class="k">%%SOCIAL_PROOF_EYEBROW%%</div><p>%%SOCIAL_PROOF_MAIN%%</p></div>
        <div class="quote-card"><p>%%PROBLEM_QUOTE%%</p></div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap section-grid">
        <div>
          <div class="section-label">%%PROBLEM_EYEBROW%%</div>
          <h2>%%PROBLEM_TITLE%%</h2>
        </div>
        <div class="section-copy">
          <p>%%PROBLEM_BODY%%</p>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap section-grid">
        <div>
          <div class="section-label">%%BENEFITS_EYEBROW%%</div>
          <h2>%%BENEFITS_TITLE%%</h2>
        </div>
        <div class="feature-grid">
          <div class="feature" data-n="01"><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
          <div class="feature" data-n="02"><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
          <div class="feature" data-n="03"><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap section-grid">
        <div>
          <div class="section-label">%%HOW_EYEBROW%%</div>
          <h2>%%HOW_TITLE%%</h2>
        </div>
        <div class="steps">
          <div class="step"><div class="n">Step 01</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><div class="n">Step 02</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><div class="n">Step 03</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="faq">
      <div class="wrap section-grid">
        <div>
          <div class="section-label">%%FAQ_EYEBROW%%</div>
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
            <button type="button" class="btn btn-dark">%%FLOAT_CTA_LABEL%%</button>
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
