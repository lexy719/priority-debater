/**
 * Bento Prism — "Neon Lattice"
 * Dark glass bento, cyan–magenta accents, centered hero cell with image.
 */
export const BENTO_PRISM_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#030712;--surface:rgba(15,23,42,0.65);--border:rgba(56,189,248,0.22);
      --text:#f1f5f9;--muted:rgba(241,245,249,0.62);--faint:rgba(241,245,249,0.35);
      --c1:#22d3ee;--c2:#e879f9;--c3:#a78bfa;
      --max:1120px;--r:20px;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:Outfit,system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
    .bg{
      position:fixed;inset:0;z-index:0;pointer-events:none;
      background:
        radial-gradient(ellipse 70% 45% at 50% -5%,rgba(34,211,238,0.14),transparent 55%),
        radial-gradient(ellipse 50% 40% at 100% 40%,rgba(232,121,249,0.1),transparent 50%),
        radial-gradient(ellipse 45% 35% at 0% 60%,rgba(167,139,250,0.08),transparent 45%);
    }
    .grid-bg{
      position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0.42;
      background-image:linear-gradient(rgba(56,189,248,0.1) 1px,transparent 1px),
        linear-gradient(90deg,rgba(56,189,248,0.1) 1px,transparent 1px);
      background-size:40px 40px;
      mask-image:radial-gradient(ellipse 85% 65% at 50% 35%,#000 18%,transparent 100%);
    }
    .scanlines{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0.03;
      background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 3px);
      mix-blend-mode:overlay;}
    .wrap{max-width:var(--max);margin:0 auto;padding:0 clamp(1rem,4vw,2rem);position:relative;z-index:2;}

    header{position:sticky;top:0;z-index:40;border-bottom:1px solid rgba(56,189,248,0.15);background:rgba(3,7,18,0.82);backdrop-filter:blur(16px);}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:62px;flex-wrap:wrap;}
    .logo{font-family:"JetBrains Mono",monospace;font-weight:600;font-size:0.95rem;letter-spacing:-0.02em;color:var(--text);text-decoration:none;}
    .logo span{color:var(--c1);}
    .nav-links{display:none;gap:1.5rem;}
    @media(min-width:860px){.nav-links{display:flex;}}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.82rem;font-weight:500;}
    .nav-links a:hover{color:var(--c1);}
    .nav-cta{font-family:"JetBrains Mono",monospace;font-size:0.72rem;padding:0.5rem 1rem;border-radius:8px;border:1px solid var(--border);color:var(--c1);text-decoration:none;background:rgba(34,211,238,0.08);}
    .nav-toggle{padding:0.4rem 0.75rem;border:1px solid var(--border);border-radius:8px;background:var(--surface);color:var(--text);cursor:pointer;font-size:0.75rem;}
    @media(min-width:860px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.45rem;padding-bottom:0.9rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.9rem;}
    @media(min-width:860px){.nav-mobile{display:none!important;}}

    .hero{padding:clamp(2.5rem,8vw,4.5rem) 0 2rem;}
    .bento{
      display:grid;gap:0.85rem;
      grid-template-columns:1fr;
      grid-template-areas:
        "hero"
        "copy"
        "f1"
        "f2"
        "f3";
    }
    @media(min-width:900px){
      .bento{
        grid-template-columns:1fr 1fr 1fr;
        grid-template-rows:auto auto auto;
        grid-template-areas:
          "hero hero copy"
          "hero hero copy"
          "f1 f2 f3";
      }
    }
    .cell{
      position:relative;border-radius:var(--r);border:1px solid var(--border);
      background:linear-gradient(165deg,rgba(255,255,255,0.08),rgba(15,23,42,0.45));
      backdrop-filter:blur(14px) saturate(1.2);overflow:hidden;
      box-shadow:0 0 0 1px rgba(34,211,238,0.06),inset 0 1px 0 rgba(255,255,255,0.06);
    }
    .cell-hero{grid-area:hero;position:relative;min-height:260px;}
    .cell-hero::before{content:"";position:absolute;inset:0;z-index:2;pointer-events:none;background:repeating-linear-gradient(180deg,rgba(3,7,18,0) 0px,rgba(3,7,18,0) 2px,rgba(34,211,238,0.03) 2px,rgba(34,211,238,0.03) 4px);opacity:0.6;}
    @media(min-width:900px){.cell-hero{min-height:320px;}}
    .cell-hero .hero-visual{position:absolute;inset:0;display:flex;flex-direction:column;}
    .cell-hero .hero-visual img{flex:1;min-height:0;width:100%;object-fit:cover;display:block;}
    .cell-hero .hero-visual:empty{background:linear-gradient(135deg,rgba(34,211,238,0.15),rgba(232,121,249,0.12));}
    .cell-hero .photo-credit{flex-shrink:0;font-size:0.62rem;padding:0.4rem 0.6rem;background:rgba(3,7,18,0.88);color:var(--faint);}
    .cell-hero .photo-credit a{color:var(--c1);text-decoration:none;}
    .cell-copy{grid-area:copy;padding:1.5rem 1.35rem;display:flex;flex-direction:column;justify-content:center;}
    .copy-deco{width:72px;margin-bottom:0.65rem;opacity:0.55;}
    .copy-deco svg{width:100%;height:auto;display:block;}
    .eyebrow{font-family:"JetBrains Mono",monospace;font-size:0.65rem;letter-spacing:0.16em;text-transform:uppercase;color:var(--c2);margin-bottom:0.75rem;}
    h1{font-size:clamp(1.9rem,4vw,2.75rem);font-weight:700;line-height:1.08;letter-spacing:-0.035em;margin-bottom:0.85rem;
      background:linear-gradient(135deg,#fff 0%,#e2e8f0 40%,#67e8f9 95%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .lead{color:var(--muted);font-size:0.95rem;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.6rem;margin-top:1.25rem;}
    .btn{display:inline-flex;align-items:center;padding:0.7rem 1.2rem;border-radius:10px;font-weight:600;font-size:0.85rem;text-decoration:none;}
    .btn-a{background:linear-gradient(135deg,var(--c1),var(--c3));color:#030712;box-shadow:0 6px 24px -4px rgba(34,211,238,0.45);transition:transform .2s,box-shadow .2s;}
    .btn-a:hover{transform:translateY(-2px);box-shadow:0 10px 32px -4px rgba(232,121,249,0.4);}
    .btn-b{border:1px solid var(--border);color:var(--text);transition:border-color .2s,background .2s;}
    .btn-b:hover{border-color:rgba(232,121,249,0.45);background:rgba(232,121,249,0.06);}

    .cell-f1{grid-area:f1;padding:1.25rem;}
    .cell-f2{grid-area:f2;padding:1.25rem;}
    .cell-f3{grid-area:f3;padding:1.25rem;}
    .feat-mini h3{font-size:0.95rem;margin-bottom:0.35rem;}
    .feat-mini p{font-size:0.8rem;color:var(--muted);}
    .feat-mini .tag{font-family:"JetBrains Mono",monospace;font-size:0.6rem;color:var(--c1);margin-bottom:0.4rem;}

    .trust-strip{padding:0 0 2rem;}
    .trust-panel{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem 1.5rem;padding:1.2rem 1.25rem;border-radius:var(--r);border:1px solid rgba(34,211,238,0.22);background:rgba(15,23,42,0.55);max-width:800px;margin:0 auto;backdrop-filter:blur(10px);}
    .trust-panel .tp-ico{flex-shrink:0;opacity:0.75;}
    .trust-eyebrow{font-family:"JetBrains Mono",monospace;font-size:0.62rem;letter-spacing:0.14em;color:var(--c1);margin-bottom:0.35rem;}
    .trust-main{font-size:0.88rem;color:var(--muted);line-height:1.55;max-width:48ch;text-align:center;}

    #problem{padding:2.5rem 0;border-top:1px solid rgba(56,189,248,0.12);}
    .problem-inner{max-width:720px;}
    .sec-title{font-size:clamp(1.35rem,2.8vw,1.85rem);font-weight:700;margin-bottom:0.65rem;}
    .problem-body{color:var(--muted);margin:0.75rem 0 1rem;}
    .quote{font-style:italic;border-left:2px solid var(--c2);padding-left:1rem;color:var(--faint);font-size:0.92rem;}

    #how{padding:2.5rem 0;}
    .how-grid{display:grid;gap:1rem;}
    @media(min-width:768px){.how-grid{grid-template-columns:repeat(3,1fr);}}
    .step{
      border-radius:14px;border:1px solid rgba(167,139,250,0.25);
      padding:1.25rem;background:rgba(15,23,42,0.5);
    }
    .step .n{font-family:"JetBrains Mono",monospace;font-size:0.65rem;color:var(--c3);margin-bottom:0.5rem;}
    .step h3{font-size:0.95rem;margin-bottom:0.35rem;}
    .step p{font-size:0.82rem;color:var(--muted);}

    #features{padding:2rem 0 2.5rem;}
    .feat-head{text-align:center;max-width:560px;margin:0 auto;}
    .feat-head .sub{color:var(--muted);font-size:0.88rem;margin-top:0.65rem;line-height:1.55;}

    #faq{padding:2rem 0 3rem;}
    .faq-head{text-align:center;margin-bottom:1.5rem;}
    .faq-list{max-width:700px;margin:0 auto;}
    details{border:1px solid rgba(56,189,248,0.15);border-radius:12px;margin-bottom:0.5rem;background:rgba(15,23,42,0.4);overflow:hidden;}
    details summary{cursor:pointer;padding:0.95rem 1rem;font-weight:600;font-size:0.88rem;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:0.75rem;}
    details summary::after{content:"";width:8px;height:8px;border-right:2px solid var(--c1);border-bottom:2px solid var(--c1);transform:rotate(45deg);transition:transform .2s;flex-shrink:0;opacity:0.8;}
    details[open] summary::after{transform:rotate(225deg);}
    details summary::-webkit-details-marker{display:none;}
    details .faq-a{padding:0 1rem 1rem;font-size:0.82rem;color:var(--muted);line-height:1.6;}

    #cta{padding:1rem 0 4rem;}
    .cta-wrap{
      max-width:560px;margin:0 auto;text-align:center;padding:2rem 1.5rem;border-radius:var(--r);
      border:1px solid rgba(232,121,249,0.35);
      background:linear-gradient(180deg,rgba(232,121,249,0.08),rgba(34,211,238,0.05));
      box-shadow:0 0 80px -20px rgba(232,121,249,0.35);
    }
    .cta-wrap h2{font-size:1.45rem;margin-bottom:0.45rem;}
    .cta-sub{color:var(--muted);font-size:0.88rem;}
    .cta-note{font-size:0.72rem;color:var(--faint);margin:0.85rem 0 0.5rem;}
    .email-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;}
    .email-row input{flex:1;min-width:200px;max-width:260px;padding:0.65rem 0.85rem;border-radius:10px;border:1px solid var(--border);background:rgba(3,7,18,0.6);color:var(--text);font:inherit;}
    .email-row .btn-a{cursor:pointer;border:none;}

    footer{padding:1.5rem 0;text-align:center;font-size:0.75rem;color:var(--faint);}
    :focus-visible{outline:2px solid var(--c1);outline-offset:2px;}
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <div class="grid-bg" aria-hidden="true"></div>
  <div class="scanlines" aria-hidden="true"></div>

  <header data-tpl-nav>
    <div class="wrap nav">
      <a class="logo" href="#">%%BRAND_NAME%%<span>.</span></a>
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
      <a class="nav-cta" href="#cta" style="display:inline-block;margin-top:0.35rem;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap">
        <div class="bento">
          <div class="cell cell-hero">
            %%RAW_HERO_VISUAL%%
          </div>
          <div class="cell cell-copy">
            <div class="copy-deco" aria-hidden="true"><svg viewBox="0 0 88 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8l6 3.5v7L12 22l-6-3.5v-7L12 8z" stroke="url(#hx)" stroke-width="1.2"/><path d="M44 4l6 3.5v7L44 18l-6-3.5v-7L44 4z" stroke="#e879f9" stroke-width="1.2" opacity="0.6"/><path d="M76 10l6 3.5v7L76 24l-6-3.5v-7L76 10z" stroke="#22d3ee" stroke-width="1.2" opacity="0.75"/><defs><linearGradient id="hx" x1="6" y1="8" x2="18" y2="22"><stop stop-color="#22d3ee"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs></svg></div>
            <p class="eyebrow">%%FLOAT_CARD_TITLE%%</p>
            <h1>%%HERO_HEADLINE%%</h1>
            <p class="lead">%%HERO_SUB%%</p>
            <div class="hero-ctas">
              <a class="btn btn-a" href="#cta">%%CTA_PRIMARY%%</a>
              <a class="btn btn-b" href="#how">%%CTA_SECONDARY%%</a>
            </div>
          </div>
          <div class="cell cell-f1 feat-mini"><p class="tag">01</p><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
          <div class="cell cell-f2 feat-mini"><p class="tag">02</p><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
          <div class="cell cell-f3 feat-mini"><p class="tag">03</p><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section class="trust-strip" id="trust" aria-label="Social proof">
      <div class="wrap">
        <div class="trust-panel">
          <div class="tp-ico" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="18" stroke="url(#tp)" stroke-width="1.5" opacity="0.6"/><path d="M20 8v6M20 26v6M8 20h6M26 20h6" stroke="#22d3ee" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/><defs><linearGradient id="tp" x1="2" y1="20" x2="38" y2="20"><stop stop-color="#22d3ee"/><stop offset="1" stop-color="#e879f9"/></linearGradient></defs></svg></div>
          <div>
            <p class="trust-eyebrow">%%SOCIAL_PROOF_EYEBROW%%</p>
            <p class="trust-main">%%SOCIAL_PROOF_MAIN%%</p>
          </div>
        </div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap problem-inner">
        <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
        <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
        <p class="problem-body">%%PROBLEM_BODY%%</p>
        <p class="quote">%%PROBLEM_QUOTE%%</p>
      </div>
    </section>

    <section id="how">
      <div class="wrap">
        <p class="eyebrow" style="text-align:center;">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title" style="text-align:center;margin-bottom:1.5rem;">%%HOW_TITLE%%</h2>
        <div class="how-grid">
          <div class="step"><p class="n">STEP 01</p><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><p class="n">STEP 02</p><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><p class="n">STEP 03</p><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap feat-head">
        <p class="eyebrow" style="text-align:center;">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title">%%BENEFITS_TITLE%%</h2>
        <p class="sub">Everything above rolls up into these three outcomes — scroll up to see each in the grid.</p>
      </div>
    </section>

    <section id="faq">
      <div class="wrap faq-head">
        <p class="eyebrow" style="text-align:center;">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title" style="text-align:center;">%%FAQ_TITLE%%</h2>
      </div>
      <div class="wrap faq-list">
        <details><summary>%%FAQ1_Q%%</summary><div class="faq-a">%%FAQ1_A%%</div></details>
        <details><summary>%%FAQ2_Q%%</summary><div class="faq-a">%%FAQ2_A%%</div></details>
        <details><summary>%%FAQ3_Q%%</summary><div class="faq-a">%%FAQ3_A%%</div></details>
      </div>
    </section>

    <section id="cta">
      <div class="wrap">
        <div class="cta-wrap">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p class="cta-sub">%%CTA_FINAL_SUB%%</p>
          <p class="cta-note">%%FLOAT_CARD_TITLE%%</p>
          <form class="email-row" action="#" method="get" onsubmit="return false;">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-a">%%FLOAT_CTA_LABEL%%</button>
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
