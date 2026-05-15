/**
 * Editorial Aurora - "Ledger"
 * More premium editorial composition: serif-led hero, image band, side notes,
 * quote rail, and cleaner magazine-style rhythm.
 */
export const EDITORIAL_AURORA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --paper:#f7f0e7;--paper-2:#fbf7f1;--ink:#1f1a17;--muted:rgba(31,26,23,0.64);--faint:rgba(31,26,23,0.38);
      --line:rgba(31,26,23,0.1);--line-strong:rgba(31,26,23,0.16);
      --accent:#9d4b24;--accent-2:#c57d39;--accent-soft:rgba(157,75,36,0.12);
      --max:1120px;--radius:24px;--radius-sm:16px;
      --shadow:0 22px 60px -36px rgba(31,26,23,0.35);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:Inter,system-ui,sans-serif;background:var(--paper);color:var(--ink);line-height:1.68;-webkit-font-smoothing:antialiased}
    .texture{position:fixed;inset:0;pointer-events:none;opacity:0.24;background-image:radial-gradient(rgba(157,75,36,0.08) 1px,transparent 1px);background-size:22px 22px}
    .wrap{width:min(var(--max),calc(100% - 2rem));margin:0 auto;position:relative;z-index:1}

    header{position:sticky;top:0;z-index:30;background:rgba(247,240,231,0.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:70px;flex-wrap:wrap}
    .logo{text-decoration:none;font-family:Fraunces,Georgia,serif;font-size:1.12rem;font-weight:600;letter-spacing:-0.03em}
    .nav-links{display:none;gap:1.7rem}
    @media(min-width:920px){.nav-links{display:flex}}
    .nav-links a{text-decoration:none;color:var(--muted);font-size:0.84rem;font-weight:600}
    .nav-links a:hover{color:var(--accent)}
    .nav-cta{text-decoration:none;padding:0.62rem 1rem;border-radius:999px;background:var(--ink);color:#fff;font-size:0.82rem;font-weight:700}
    .nav-toggle{display:inline-flex;padding:0.46rem 0.78rem;border:1px solid var(--line-strong);background:var(--paper-2);border-radius:12px;font-size:0.76rem;cursor:pointer}
    @media(min-width:920px){.nav-toggle{display:none}}
    .nav-mobile{display:none;flex-direction:column;gap:0.55rem;padding:0 0 1rem}
    .nav-mobile.open{display:flex}
    .nav-mobile a{text-decoration:none;color:var(--muted)}
    @media(min-width:920px){.nav-mobile{display:none!important}}

    .hero{padding:clamp(3rem,9vw,6rem) 0 2rem}
    .hero-grid{display:grid;gap:2rem}
    @media(min-width:980px){.hero-grid{grid-template-columns:minmax(0,1.1fr) minmax(0,0.9fr);align-items:end}}
    .eyebrow{font-size:0.7rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:1rem}
    h1{font-family:Fraunces,Georgia,serif;font-size:clamp(2.6rem,5.8vw,4.8rem);font-weight:600;line-height:0.95;letter-spacing:-0.05em;max-width:10ch}
    .lead{margin-top:1rem;max-width:43ch;font-size:1.08rem;color:var(--muted)}
    .hero-actions{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1.7rem}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.95rem 1.3rem;border-radius:14px;text-decoration:none;font-size:0.9rem;font-weight:700}
    .btn-fill{background:var(--ink);color:#fff}
    .btn-line{border:1px solid var(--line-strong);color:var(--ink);background:rgba(255,255,255,0.42)}
    .hero-side{display:grid;gap:1rem}
    .hero-note,.hero-pull{padding:1.2rem 1.25rem;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,0.46);box-shadow:var(--shadow)}
    .hero-note .k{font-size:0.7rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--faint);margin-bottom:0.4rem}
    .hero-note p{color:var(--muted)}
    .hero-pull{background:linear-gradient(135deg,rgba(157,75,36,0.08),rgba(255,255,255,0.52));border-color:rgba(157,75,36,0.16)}
    .hero-pull p{font-family:Fraunces,Georgia,serif;font-size:1.18rem;line-height:1.45;color:var(--accent)}

    .image-band{padding:1rem 0 3.5rem}
    .image-shell{overflow:hidden;border-radius:28px;border:1px solid var(--line-strong);background:var(--paper-2);box-shadow:var(--shadow)}
    .image-shell .hero-visual{position:relative}
    .image-shell .hero-visual img{display:block;width:100%;min-height:340px;max-height:620px;object-fit:cover}
    .image-shell .hero-visual:empty{min-height:340px;background:linear-gradient(135deg,#ead7c3,#f7efe4)}
    .image-shell .hero-visual::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(31,26,23,0.02),rgba(31,26,23,0.16));pointer-events:none}
    .photo-credit{padding:0.8rem 1rem;border-top:1px solid var(--line);font-size:0.72rem;color:var(--faint);text-align:center}
    .photo-credit a{color:var(--accent)}

    section{padding:4.5rem 0;border-top:1px solid var(--line)}
    .section-grid{display:grid;gap:2rem}
    @media(min-width:900px){.section-grid{grid-template-columns:0.72fr 1.28fr}}
    .section-label{font-size:0.72rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent);margin-bottom:0.9rem}
    h2{font-family:Fraunces,Georgia,serif;font-size:clamp(1.9rem,3.6vw,3rem);font-weight:600;line-height:1;letter-spacing:-0.04em}
    .body p{font-size:1rem;color:var(--muted)}
    .body p + p{margin-top:1rem}
    .pullquote{margin-top:1.4rem;padding-left:1.2rem;border-left:2px solid rgba(157,75,36,0.28);font-family:Fraunces,Georgia,serif;font-size:1.22rem;line-height:1.5;color:var(--accent)}

    .feature-rail{display:grid;gap:1rem}
    .feature-card{display:grid;gap:0.8rem;padding:1.15rem 1.2rem;border-radius:20px;border:1px solid var(--line);background:rgba(255,255,255,0.5);box-shadow:var(--shadow)}
    @media(min-width:760px){.feature-card{grid-template-columns:auto 1fr;align-items:start}}
    .feature-no{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:999px;background:var(--accent-soft);border:1px solid rgba(157,75,36,0.16);font-size:0.8rem;font-weight:800;color:var(--accent)}
    .feature-card h3{font-family:Fraunces,Georgia,serif;font-size:1.1rem;margin-bottom:0.25rem}
    .feature-card p{font-size:0.92rem;color:var(--muted)}

    .steps{display:grid;gap:1rem}
    @media(min-width:860px){.steps{grid-template-columns:repeat(3,1fr)}}
    .step{padding:1.3rem 1.2rem;border-radius:20px;border:1px solid var(--line);background:rgba(255,255,255,0.46)}
    .step .n{font-family:Fraunces,Georgia,serif;font-size:2rem;line-height:1;color:rgba(157,75,36,0.25);margin-bottom:0.6rem}
    .step h3{font-size:1rem;font-weight:700;margin-bottom:0.35rem}
    .step p{font-size:0.9rem;color:var(--muted)}

    .faq{display:grid;gap:0.7rem}
    .faq details{border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,0.48);overflow:hidden}
    .faq summary{list-style:none;cursor:pointer;padding:1rem 1.15rem;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:0.95rem;font-weight:700}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:"+";font-size:1.2rem;color:var(--accent)}
    .faq details[open] summary::after{content:"−"}
    .faq .a{padding:0 1.15rem 1rem;font-size:0.9rem;color:var(--muted)}

    .cta{padding-top:2rem;padding-bottom:5rem}
    .cta-shell{padding:2rem 1.4rem;border-radius:28px;border:1px solid rgba(157,75,36,0.16);background:linear-gradient(145deg,rgba(255,255,255,0.78),rgba(234,215,195,0.6));box-shadow:0 30px 70px -42px rgba(31,26,23,0.3);text-align:center}
    .cta-shell h2{max-width:13ch;margin:0 auto 0.65rem}
    .cta-shell p{max-width:40ch;margin:0 auto;color:var(--muted)}
    .cta-note{margin-top:1rem;font-size:0.72rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--accent)}
    .email-row{display:flex;flex-wrap:wrap;justify-content:center;gap:0.65rem;margin-top:1.2rem}
    .email-row input{width:min(100%,290px);padding:0.95rem 1rem;border-radius:14px;border:1px solid var(--line-strong);background:#fff;color:var(--ink);font:inherit}
    .email-row button{border:none;cursor:pointer}

    footer{padding:1.6rem 0 2.4rem;border-top:1px solid var(--line);text-align:center;font-size:0.78rem;color:var(--faint)}
    :focus-visible{outline:2px solid var(--accent);outline-offset:3px}
  </style>
</head>
<body>
  <div class="texture" aria-hidden="true"></div>

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
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow">%%FLOAT_CARD_TITLE%%</div>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-actions">
            <a class="btn btn-fill" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-line" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>
        <div class="hero-side">
          <div class="hero-note">
            <div class="k">%%BENEFITS_EYEBROW%%</div>
            <p>%%BENEFITS_TITLE%%</p>
          </div>
          <div class="hero-pull"><p>%%PROBLEM_QUOTE%%</p></div>
        </div>
      </div>
    </section>

    <section class="image-band" style="border-top:none;padding-top:0">
      <div class="wrap">
        <div class="image-shell">%%RAW_HERO_VISUAL%%</div>
      </div>
    </section>

    <section id="problem" style="border-top:none">
      <div class="wrap section-grid">
        <div>
          <div class="section-label">%%PROBLEM_EYEBROW%%</div>
          <h2>%%PROBLEM_TITLE%%</h2>
        </div>
        <div class="body">
          <p>%%PROBLEM_BODY%%</p>
          <div class="pullquote">%%SOCIAL_PROOF_MAIN%%</div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap section-grid">
        <div>
          <div class="section-label">%%BENEFITS_EYEBROW%%</div>
          <h2>%%BENEFITS_TITLE%%</h2>
        </div>
        <div class="feature-rail">
          <div class="feature-card"><div class="feature-no">01</div><div><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div></div>
          <div class="feature-card"><div class="feature-no">02</div><div><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div></div>
          <div class="feature-card"><div class="feature-no">03</div><div><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div></div>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap">
        <div class="section-grid" style="margin-bottom:2rem">
          <div>
            <div class="section-label">%%HOW_EYEBROW%%</div>
            <h2>%%HOW_TITLE%%</h2>
          </div>
          <div class="body"><p>%%SOCIAL_PROOF_EYEBROW%% - the process is framed as a measured sequence, not a loose feature dump.</p></div>
        </div>
        <div class="steps">
          <div class="step"><div class="n">01</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><div class="n">02</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><div class="n">03</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
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
            <button type="button" class="btn btn-fill">%%FLOAT_CTA_LABEL%%</button>
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
