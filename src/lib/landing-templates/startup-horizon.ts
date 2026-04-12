/**
 * Startup Horizon — "Sunrise"
 * Warm coral–amber gradient hero, bold cards, energetic startup feel.
 */
export const STARTUP_HORIZON_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap" rel="stylesheet">
  <style>
    :root{
      --cream:#fffbf7;--ink:#1e293b;--muted:rgba(30,41,59,0.65);--faint:rgba(30,41,59,0.4);
      --coral:#f97316;--rose:#fb7185;--amber:#fbbf24;
      --max:1100px;--r:22px;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:"Plus Jakarta Sans",system-ui,sans-serif;background:var(--cream);color:var(--ink);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;}
    .wrap{max-width:var(--max);margin:0 auto;padding:0 clamp(1.1rem,4vw,2rem);}

    header{position:sticky;top:0;z-index:40;background:rgba(255,251,247,0.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(251,113,133,0.12);}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{font-weight:800;font-size:1.05rem;letter-spacing:-0.03em;color:var(--ink);text-decoration:none;}
    .nav-links{display:none;gap:1.75rem;}
    @media(min-width:880px){.nav-links{display:flex;}}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.86rem;font-weight:600;}
    .nav-links a:hover{color:var(--coral);}
    .nav-cta{padding:0.5rem 1.15rem;border-radius:999px;font-weight:700;font-size:0.82rem;text-decoration:none;color:#fff;background:linear-gradient(135deg,var(--rose),var(--coral));box-shadow:0 4px 20px rgba(249,115,22,0.35);}
    .nav-toggle{padding:0.4rem 0.8rem;border-radius:10px;border:1px solid rgba(249,115,22,0.25);background:#fff;cursor:pointer;font-size:0.78rem;}
    @media(min-width:880px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.45rem;padding-bottom:1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;}
    @media(min-width:880px){.nav-mobile{display:none!important;}}

    .hero-shell{
      position:relative;overflow:hidden;
      background:linear-gradient(135deg,#fff7ed 0%,#ffedd5 32%,#fecdd3 68%,#fde68a 100%);
    }
    .hero-shell::before{
      content:"";position:absolute;inset:0;pointer-events:none;
      background:
        radial-gradient(ellipse 70% 55% at 85% 15%,rgba(251,113,133,0.35),transparent 58%),
        radial-gradient(ellipse 50% 45% at 10% 80%,rgba(249,115,22,0.18),transparent 55%);
    }
    .hero-blobs{position:absolute;inset:0;pointer-events:none;overflow:hidden;}
    .hero-blobs span{position:absolute;border-radius:50%;filter:blur(60px);opacity:0.55;}
    .hero-blobs span:nth-child(1){width:min(70vw,480px);height:min(70vw,480px);background:rgba(253,186,116,0.5);top:-20%;right:-15%;}
    .hero-blobs span:nth-child(2){width:min(55vw,380px);height:min(55vw,380px);background:rgba(251,113,133,0.35);bottom:-10%;left:-10%;}
    .hero{padding:clamp(2.5rem,8vw,4.5rem) 0 clamp(2rem,6vw,3.5rem);position:relative;z-index:1;}
    .hero-grid{display:grid;gap:2rem;align-items:center;}
    @media(min-width:880px){.hero-grid{grid-template-columns:1.05fr 0.95fr;gap:2.5rem;}}
    .pill{display:inline-flex;align-items:center;gap:0.35rem;padding:0.35rem 0.9rem;border-radius:999px;background:rgba(255,255,255,0.75);border:1px solid rgba(249,115,22,0.2);font-size:0.72rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#c2410c;margin-bottom:1rem;}
    h1{font-size:clamp(2.15rem,5vw,3.45rem);font-weight:800;line-height:1.06;letter-spacing:-0.038em;margin-bottom:0.9rem;color:#0f172a;text-wrap:balance;
      text-shadow:0 1px 0 rgba(255,255,255,0.5);}
    .lead{font-size:1.05rem;color:var(--muted);max-width:44ch;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.65rem;margin-top:1.4rem;}
    .btn{display:inline-flex;padding:0.8rem 1.35rem;border-radius:12px;font-weight:700;font-size:0.88rem;text-decoration:none;}
    .btn-hot{background:linear-gradient(135deg,var(--rose),var(--coral));color:#fff;box-shadow:0 8px 28px rgba(249,115,22,0.4);}
    .btn-soft{background:#fff;color:#0f172a;border:1.5px solid rgba(15,23,42,0.08);}

    .hero-card{
      border-radius:var(--r);overflow:hidden;background:#fff;
      box-shadow:0 28px 70px -24px rgba(249,115,22,0.45),0 0 0 1px rgba(255,255,255,0.9),0 0 80px -30px rgba(251,113,133,0.35);
      transform:rotate(-1.25deg);transition:transform .4s cubic-bezier(0.22,1,0.36,1);
    }
    @media(min-width:880px){.hero-card:hover{transform:rotate(0deg) scale(1.01);}}
    .hero-card .hero-visual img{width:100%;height:auto;display:block;aspect-ratio:4/3;object-fit:cover;}
    .hero-card .hero-visual:empty{min-height:240px;background:linear-gradient(160deg,#fecdd3,#fde68a);}
    .hero-card .photo-credit{font-size:0.7rem;color:var(--faint);padding:0.5rem 0.85rem;text-align:center;background:#fafafa;}

    .marquee-wrap{margin-top:-1px;border-top:1px solid rgba(249,115,22,0.18);border-bottom:1px solid rgba(249,115,22,0.18);
      background:linear-gradient(90deg,rgba(255,255,255,0.65),rgba(255,251,247,0.9),rgba(255,255,255,0.65));overflow:hidden;position:relative;}
    .marquee-wrap::before,.marquee-wrap::after{content:"";position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none;}
    .marquee-wrap::before{left:0;background:linear-gradient(90deg,rgba(255,251,247,1),transparent);}
    .marquee-wrap::after{right:0;background:linear-gradient(270deg,rgba(255,251,247,1),transparent);}
    .marquee{display:flex;gap:3rem;padding:0.85rem 0;animation:marq 28s linear infinite;white-space:nowrap;font-size:0.78rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(194,65,12,0.5);}
    @keyframes marq{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    .marquee span{opacity:0.9;}

    .trust-strip{padding:1.75rem 0 2.25rem;background:linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,251,247,0.3));}
    .trust-card{max-width:760px;margin:0 auto;padding:1.35rem 1.4rem;border-radius:20px;border:1px solid rgba(249,115,22,0.18);background:rgba(255,255,255,0.85);box-shadow:0 14px 40px -22px rgba(249,115,22,0.2);display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem 1.5rem;text-align:center;}
    .trust-spark{flex-shrink:0;opacity:0.85;}
    .trust-eyebrow{font-size:0.7rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#c2410c;margin-bottom:0.35rem;}
    .trust-main{font-size:0.95rem;color:var(--muted);line-height:1.55;max-width:46ch;}
    .hero-spark{position:absolute;top:0;right:0;width:56px;opacity:0.5;pointer-events:none;}
    .hero .hero-grid>div:first-child{position:relative;}

    #features{padding:3.5rem 0;}
    .feat-head{text-align:center;margin-bottom:2rem;}
    .eyebrow{font-size:0.72rem;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:var(--coral);}
    .sec-title{font-size:clamp(1.55rem,3vw,2.1rem);font-weight:800;margin:0.5rem 0;}
    .feat-grid{display:grid;gap:1.15rem;counter-reset:feat;}
    @media(min-width:720px){.feat-grid{grid-template-columns:repeat(3,1fr);}}
    .feat{
      position:relative;padding:1.55rem 1.3rem 1.45rem;border-radius:20px;background:#fff;border:1px solid rgba(249,115,22,0.14);
      box-shadow:0 14px 44px -20px rgba(15,23,42,0.14);overflow:hidden;transition:transform .25s,box-shadow .25s;counter-increment:feat;
    }
    .feat::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,var(--rose),var(--coral),var(--amber));}
    .feat:hover{transform:translateY(-4px);box-shadow:0 22px 50px -22px rgba(249,115,22,0.28);}
    .feat h3{font-size:1.02rem;margin-bottom:0.4rem;display:flex;align-items:center;gap:0.5rem;}
    .feat h3::before{content:counter(feat,decimal-leading-zero);font-size:0.68rem;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--coral),var(--rose));padding:0.2rem 0.45rem;border-radius:6px;letter-spacing:0.02em;}
    .feat p{font-size:0.86rem;color:var(--muted);line-height:1.62;}

    #problem{padding:3rem 0;background:linear-gradient(180deg,#fffefb,#fff7ed);}
    .problem-inner{max-width:700px;margin:0 auto;text-align:center;}
    .problem-body{color:var(--muted);margin:1rem 0;}
    .pull{font-weight:600;font-style:italic;color:#c2410c;}

    #how{padding:3rem 0;}
    .steps{display:grid;gap:1.25rem;}
    @media(min-width:768px){.steps{grid-template-columns:repeat(3,1fr);}}
    .step{
      text-align:center;padding:1.5rem 1rem;border-radius:var(--r);
      background:linear-gradient(180deg,#fff,#fffbf7);border:1px solid rgba(251,113,133,0.15);
    }
    .step .badge{width:2.5rem;height:2.5rem;margin:0 auto 0.75rem;border-radius:50%;background:linear-gradient(135deg,var(--amber),var(--coral));color:#fff;font-weight:800;font-size:0.95rem;display:flex;align-items:center;justify-content:center;}
    .step h3{font-size:1rem;margin-bottom:0.35rem;}
    .step p{font-size:0.85rem;color:var(--muted);}

    #faq{padding:2.5rem 0 3rem;}
    .faq-head{text-align:center;margin-bottom:1.75rem;}
    .faq-list{max-width:680px;margin:0 auto;}
    details{border:1px solid rgba(249,115,22,0.15);border-radius:14px;margin-bottom:0.55rem;background:#fff;padding:0 0.25rem;}
    details summary{cursor:pointer;padding:1rem;font-weight:700;font-size:0.92rem;list-style:none;display:flex;justify-content:space-between;}
    details summary::-webkit-details-marker{display:none;}
    details .a{padding:0 1rem 1rem;font-size:0.86rem;color:var(--muted);}

    #cta{padding:1rem 0 4rem;}
    .cta{
      max-width:540px;margin:0 auto;text-align:center;padding:2.35rem 1.6rem;border-radius:var(--r);
      background:linear-gradient(155deg,#0c1222 0%,#1e293b 50%,#0f172a 100%);color:#f8fafc;
      box-shadow:0 28px 60px -18px rgba(15,23,42,0.55),0 0 0 1px rgba(255,255,255,0.06),0 0 100px -40px rgba(249,115,22,0.25);
      position:relative;overflow:hidden;
    }
    .cta::before{content:"";position:absolute;top:-50%;left:-30%;width:80%;height:100%;background:radial-gradient(circle,rgba(251,113,133,0.12),transparent 65%);pointer-events:none;}
    .cta h2{font-size:1.55rem;margin-bottom:0.45rem;}
    .cta .sub{opacity:0.85;font-size:0.92rem;}
    .cta .note{font-size:0.75rem;opacity:0.55;margin:1rem 0 0.5rem;}
    .email-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-top:0.5rem;}
    .email-row input{flex:1;min-width:200px;max-width:260px;padding:0.75rem 1rem;border-radius:12px;border:none;font:inherit;}
    .email-row .btn-hot{cursor:pointer;border:none;}

    footer{padding:2rem 0;text-align:center;font-size:0.78rem;color:var(--faint);}
    :focus-visible{outline:2px solid var(--coral);outline-offset:2px;}
  </style>
</head>
<body>
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
      <a class="nav-cta" href="#cta" style="margin-top:0.4rem;display:inline-block;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <div class="hero-shell">
    <div class="hero-blobs" aria-hidden="true"><span></span><span></span></div>
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="hero-spark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4l3 12 12 3-12 3-3 12-3-12-12-3 12-3 3-12z" fill="url(#sp1)" opacity="0.85"/><defs><linearGradient id="sp1" x1="12" y1="12" x2="36" y2="36"><stop stop-color="#fb7185"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs></svg></div>
          <p class="pill">%%FLOAT_CARD_TITLE%%</p>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-ctas">
            <a class="btn btn-hot" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-soft" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>
        <div class="hero-card">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>
    <div class="marquee-wrap" aria-hidden="true">
      <div class="marquee">
        <span>%%BENEFITS_EYEBROW%%</span><span>%%BENEFITS_TITLE%%</span><span>%%FEATURE1_TITLE%%</span><span>%%FEATURE2_TITLE%%</span><span>%%FEATURE3_TITLE%%</span>
        <span>%%BENEFITS_EYEBROW%%</span><span>%%BENEFITS_TITLE%%</span><span>%%FEATURE1_TITLE%%</span><span>%%FEATURE2_TITLE%%</span><span>%%FEATURE3_TITLE%%</span>
      </div>
    </div>
    <section class="trust-strip" id="trust" aria-label="Social proof">
      <div class="wrap">
        <div class="trust-card">
          <div class="trust-spark" aria-hidden="true"><svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" stroke="url(#sc)" stroke-width="1.5" opacity="0.35"/><path d="M22 6v8M22 30v8M6 22h8M30 22h8" stroke="#f97316" stroke-width="2" stroke-linecap="round"/><defs><linearGradient id="sc" x1="2" y1="22" x2="42" y2="22"><stop stop-color="#fb7185"/><stop offset="1" stop-color="#fbbf24"/></linearGradient></defs></svg></div>
          <div>
            <p class="trust-eyebrow">%%SOCIAL_PROOF_EYEBROW%%</p>
            <p class="trust-main">%%SOCIAL_PROOF_MAIN%%</p>
          </div>
        </div>
      </div>
    </section>
  </div>

  <main>
    <section id="features">
      <div class="wrap feat-head">
        <p class="eyebrow">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title">%%BENEFITS_TITLE%%</h2>
      </div>
      <div class="wrap feat-grid">
        <div class="feat"><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
        <div class="feat"><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
        <div class="feat"><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap problem-inner">
        <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
        <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
        <p class="problem-body">%%PROBLEM_BODY%%</p>
        <p class="pull">%%PROBLEM_QUOTE%%</p>
      </div>
    </section>

    <section id="how">
      <div class="wrap feat-head">
        <p class="eyebrow">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap steps">
        <div class="step"><div class="badge">1</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
        <div class="step"><div class="badge">2</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
        <div class="step"><div class="badge">3</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
      </div>
    </section>

    <section id="faq">
      <div class="wrap faq-head">
        <p class="eyebrow">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title">%%FAQ_TITLE%%</h2>
      </div>
      <div class="wrap faq-list">
        <details><summary>%%FAQ1_Q%%</summary><div class="a">%%FAQ1_A%%</div></details>
        <details><summary>%%FAQ2_Q%%</summary><div class="a">%%FAQ2_A%%</div></details>
        <details><summary>%%FAQ3_Q%%</summary><div class="a">%%FAQ3_A%%</div></details>
      </div>
    </section>

    <section id="cta">
      <div class="wrap">
        <div class="cta">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p class="sub">%%CTA_FINAL_SUB%%</p>
          <p class="note">%%FLOAT_CARD_TITLE%%</p>
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
    var h=document.querySelector("[data-tpl-nav]");
    if(h){
      var t=h.querySelector("[data-tpl-nav-toggle]");
      var m=h.querySelector("[data-tpl-nav-mobile]");
      if(t&&m){t.addEventListener("click",function(){m.classList.toggle("open");});}
      document.querySelectorAll('a[href^="#"]').forEach(function(a){
        a.addEventListener("click",function(){if(m&&m.classList.contains("open"))m.classList.remove("open");});
      });
    }
  })();
  </script>
</body>
</html>`;
