/**
 * Minimal Slate — "Swiss Mono"
 * Black / white / gray, large type, thin rules, almost no decoration.
 */
export const MINIMAL_SLATE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#f7f7f5;--fg:#0a0a0a;--muted:rgba(10,10,10,0.52);--line:rgba(10,10,10,0.09);--max:960px;--display:"Space Grotesk",system-ui,sans-serif;}
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:Inter,system-ui,sans-serif;background-color:var(--bg);color:var(--fg);font-size:15px;line-height:1.65;-webkit-font-smoothing:antialiased;}
    body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.5;
      background-image:radial-gradient(rgba(10,10,10,0.07) 1px,transparent 1px);background-size:20px 20px;}
    .wrap{max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,5vw,2.5rem);position:relative;z-index:1;}

    header{position:sticky;top:0;z-index:30;background:rgba(247,247,245,0.88);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
    .nav{display:flex;align-items:center;justify-content:space-between;min-height:56px;flex-wrap:wrap;gap:0.75rem;}
    .logo{font-weight:600;font-size:0.95rem;letter-spacing:-0.02em;text-decoration:none;color:var(--fg);}
    .nav-links{display:none;gap:1.75rem;}
    @media(min-width:820px){.nav-links{display:flex;}}
    .nav-links a{font-size:0.78rem;font-weight:500;color:var(--muted);text-decoration:none;text-transform:uppercase;letter-spacing:0.08em;}
    .nav-links a:hover{color:var(--fg);}
    .nav-cta{font-size:0.78rem;font-weight:600;text-decoration:none;color:var(--fg);border-bottom:1px solid var(--fg);padding-bottom:1px;}
    .nav-toggle{font-size:0.72rem;padding:0.35rem 0.65rem;border:1px solid var(--line);background:transparent;cursor:pointer;}
    @media(min-width:820px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.4rem;padding:0 0 0.75rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{font-size:0.85rem;color:var(--muted);text-decoration:none;}
    @media(min-width:820px){.nav-mobile{display:none!important;}}

    .hero{padding:clamp(3rem,12vw,5.5rem) 0;}
    .hero-grid{display:grid;gap:2.5rem;align-items:start;}
    @media(min-width:860px){.hero-grid{grid-template-columns:1.15fr 0.85fr;gap:3rem;}}
    .kicker{font-size:0.65rem;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);margin-bottom:1.25rem;}
    h1{font-family:var(--display);font-size:clamp(2.05rem,4.6vw,3.15rem);font-weight:700;line-height:1.02;letter-spacing:-0.045em;margin-bottom:1rem;text-wrap:balance;}
    .lead{font-size:1rem;color:var(--muted);max-width:40ch;}
    .hero-ctas{margin-top:1.5rem;display:flex;gap:0.75rem;flex-wrap:wrap;}
    .btn{display:inline-flex;padding:0.65rem 0;font-size:0.8rem;font-weight:600;text-decoration:none;}
    .btn-p{border-bottom:2px solid var(--fg);color:var(--fg);}
    .btn-s{color:var(--muted);}

    .visual{border:1px solid var(--line);background:#fff;position:relative;box-shadow:12px 12px 0 rgba(10,10,10,0.06);transition:box-shadow .3s,transform .3s;}
    .visual::before{content:"";position:absolute;inset:-1px;border:1px solid rgba(10,10,10,0.04);pointer-events:none;transform:translate(4px,4px);z-index:-1;}
    @media(hover:hover){.visual:hover{box-shadow:16px 16px 0 rgba(10,10,10,0.08);transform:translate(-2px,-2px);}}
    .visual .hero-visual img{width:100%;display:block;aspect-ratio:5/4;object-fit:cover;}
    .visual .hero-visual:empty{min-height:280px;background:linear-gradient(145deg,#d4d4d4 0%,#f5f5f5 50%,#e8e8e8 100%);}
    .visual .photo-credit{font-size:0.65rem;color:var(--muted);padding:0.5rem 0.65rem;border-top:1px solid var(--line);}
    .visual .photo-credit a{color:var(--fg);}

    .hero-accent-mn{position:absolute;top:0;right:0;width:64px;opacity:0.22;pointer-events:none;}
    .hero-accent-mn svg{width:100%;height:auto;display:block;}
    .hero .hero-grid>div:first-child{position:relative;}

    .trust-strip{padding:2rem 0 2.5rem;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#fff;}
    .trust-row{max-width:640px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:baseline;gap:0.75rem 1.25rem;justify-content:center;text-align:center;}
    .trust-eyebrow{font-family:var(--display);font-size:0.72rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);}
    .trust-main{font-size:0.92rem;color:var(--fg);max-width:42ch;line-height:1.55;}
    .trust-mark{flex-shrink:0;width:28px;height:2px;background:var(--fg);opacity:0.2;align-self:center;}

    .block{padding:3rem 0;border-top:1px solid var(--line);}
    .sec-h{font-size:0.65rem;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-bottom:0.75rem;}
    h2{font-family:var(--display);font-size:clamp(1.38rem,2.6vw,1.85rem);font-weight:600;letter-spacing:-0.035em;margin-bottom:0.75rem;}
    .body-text{color:var(--muted);max-width:58ch;}
    .quote{margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid var(--line);font-size:0.95rem;color:var(--fg);font-style:italic;}

    .grid3{display:grid;gap:1.5rem;}
    @media(min-width:700px){.grid3{grid-template-columns:repeat(3,1fr);}}
    .cell{padding:1.35rem 0 0;border-top:2px solid var(--fg);position:relative;}
    .cell::before{content:attr(data-i);font-family:var(--display);font-size:clamp(2.5rem,6vw,3.5rem);font-weight:700;line-height:1;color:rgba(10,10,10,0.06);position:absolute;top:0.5rem;right:0;pointer-events:none;}
    .cell h3{font-size:0.9rem;font-weight:600;margin-bottom:0.4rem;}
    .cell p{font-size:0.82rem;color:var(--muted);}

    .steps{display:grid;gap:0;}
    @media(min-width:768px){.steps{grid-template-columns:repeat(3,1fr);}}
    .step{padding:1.5rem 0;border-top:1px solid var(--line);}
    @media(min-width:768px){.step{border-left:1px solid var(--line);padding:1.5rem;border-top:1px solid var(--line);}.step:first-child{border-left:none;}}
    .step .n{font-size:0.65rem;font-weight:600;letter-spacing:0.12em;color:var(--muted);margin-bottom:0.5rem;}
    .step h3{font-size:0.95rem;margin-bottom:0.35rem;}
    .step p{font-size:0.82rem;color:var(--muted);}

    .faq details{border-bottom:1px solid var(--line);}
    .faq summary{cursor:pointer;padding:1rem 0;font-weight:500;font-size:0.9rem;list-style:none;display:flex;justify-content:space-between;}
    .faq summary::-webkit-details-marker{display:none;}
    .faq .a{padding:0 0 1rem;font-size:0.82rem;color:var(--muted);}

    .cta-block{padding:3rem 0 4rem;text-align:center;border-top:1px solid var(--line);}
    .cta-block h2{margin-bottom:0.5rem;}
    .cta-block .sub{color:var(--muted);font-size:0.9rem;}
    .cta-block .note{font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin:1.25rem 0 0.5rem;}
    .email-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;max-width:400px;margin:0.75rem auto 0;}
    .email-row input{flex:1;min-width:180px;padding:0.65rem 0.75rem;border:1px solid var(--line);background:#fff;font:inherit;font-size:0.85rem;}
    .email-row button{padding:0.65rem 1rem;border:none;background:var(--fg);color:var(--bg);font:inherit;font-size:0.8rem;font-weight:600;cursor:pointer;}

    footer{padding:1.5rem 0;font-size:0.7rem;color:var(--muted);text-align:center;border-top:1px solid var(--line);}
    :focus-visible{outline:2px solid var(--fg);outline-offset:2px;}
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
      <a class="nav-cta" href="#cta">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="hero-accent-mn" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="8" width="48" height="48" stroke="var(--fg)" stroke-width="1" opacity="0.2"/><path d="M16 32h32M32 16v32" stroke="var(--fg)" stroke-width="1" opacity="0.15"/></svg></div>
          <p class="kicker">%%FLOAT_CARD_TITLE%%</p>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-ctas">
            <a class="btn btn-p" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-s" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>
        <div class="visual">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>

    <section class="trust-strip" id="trust" aria-label="Social proof">
      <div class="wrap">
        <div class="trust-row">
          <span class="trust-mark" aria-hidden="true"></span>
          <div>
            <p class="trust-eyebrow">%%SOCIAL_PROOF_EYEBROW%%</p>
            <p class="trust-main">%%SOCIAL_PROOF_MAIN%%</p>
          </div>
          <span class="trust-mark" aria-hidden="true"></span>
        </div>
      </div>
    </section>

    <section id="problem" class="block">
      <div class="wrap">
        <p class="sec-h">%%PROBLEM_EYEBROW%%</p>
        <h2>%%PROBLEM_TITLE%%</h2>
        <p class="body-text">%%PROBLEM_BODY%%</p>
        <p class="quote">%%PROBLEM_QUOTE%%</p>
      </div>
    </section>

    <section id="features" class="block">
      <div class="wrap">
        <p class="sec-h">%%BENEFITS_EYEBROW%%</p>
        <h2>%%BENEFITS_TITLE%%</h2>
        <div class="grid3" style="margin-top:2rem;">
          <div class="cell" data-i="I"><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
          <div class="cell" data-i="II"><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
          <div class="cell" data-i="III"><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="how" class="block">
      <div class="wrap">
        <p class="sec-h">%%HOW_EYEBROW%%</p>
        <h2>%%HOW_TITLE%%</h2>
        <div class="steps" style="margin-top:2rem;">
          <div class="step"><p class="n">01</p><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><p class="n">02</p><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><p class="n">03</p><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="faq" class="block">
      <div class="wrap">
        <p class="sec-h">%%FAQ_EYEBROW%%</p>
        <h2>%%FAQ_TITLE%%</h2>
        <div class="faq" style="margin-top:1.5rem;max-width:640px;">
          <details><summary>%%FAQ1_Q%%</summary><div class="a">%%FAQ1_A%%</div></details>
          <details><summary>%%FAQ2_Q%%</summary><div class="a">%%FAQ2_A%%</div></details>
          <details><summary>%%FAQ3_Q%%</summary><div class="a">%%FAQ3_A%%</div></details>
        </div>
      </div>
    </section>

    <section id="cta" class="cta-block">
      <div class="wrap">
        <h2>%%CTA_FINAL_TITLE%%</h2>
        <p class="sub">%%CTA_FINAL_SUB%%</p>
        <p class="note">%%FLOAT_CARD_TITLE%%</p>
        <form class="email-row" action="#" method="get" onsubmit="return false;">
          <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
          <button type="button">%%FLOAT_CTA_LABEL%%</button>
        </form>
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
