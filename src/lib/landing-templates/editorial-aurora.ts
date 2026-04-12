/**
 * Editorial Aurora — "Meridian"
 * Magazine layout: warm paper, Playfair + DM Sans, full-bleed image band.
 */
export const EDITORIAL_AURORA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
  <style>
    :root{
      --paper:#f9f5f0;--ink:#1c1917;--muted:rgba(28,25,23,0.58);--faint:rgba(28,25,23,0.35);
      --accent:#9a3412;--accent2:#c2410c;--gold:#b45309;--line:rgba(28,25,23,0.1);--card:#fffefb;
      --max:1080px;--serif:"Playfair Display",Georgia,serif;--sans:"DM Sans",system-ui,sans-serif;--display:"Cormorant Garamond",Georgia,serif;
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:var(--sans);background:var(--paper);color:var(--ink);font-size:17px;line-height:1.7;-webkit-font-smoothing:antialiased;}
    body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.4;
      background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%239a3412' stroke-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");}
    .wrap{max-width:var(--max);margin:0 auto;padding:0 clamp(1.1rem,4vw,2rem);position:relative;z-index:1;}
    .rule{border-top:1px solid var(--line);}

    header{position:sticky;top:0;z-index:30;background:rgba(249,245,240,0.88);backdrop-filter:blur(14px) saturate(1.2);border-bottom:1px solid var(--line);box-shadow:0 1px 0 rgba(255,255,255,0.6);}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:68px;flex-wrap:wrap;}
    .logo{font-family:var(--serif);font-weight:700;font-size:1.2rem;letter-spacing:-0.02em;color:var(--ink);text-decoration:none;}
    .nav-links{display:none;gap:2rem;}
    @media(min-width:880px){.nav-links{display:flex;}}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.85rem;font-weight:500;letter-spacing:0.02em;}
    .nav-links a:hover{color:var(--accent);}
    .nav-cta{font-size:0.8rem;font-weight:600;text-decoration:none;color:#fff;background:var(--accent);padding:0.55rem 1.15rem;border-radius:999px;}
    .nav-toggle{display:flex;padding:0.45rem 0.8rem;border:1px solid var(--line);border-radius:8px;background:var(--card);cursor:pointer;font-size:0.78rem;}
    @media(min-width:880px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.5rem;padding-bottom:1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;}
    @media(min-width:880px){.nav-mobile{display:none!important;}}

    .hero-top{padding:clamp(2.5rem,7vw,4.25rem) 0 1.5rem;position:relative;}
    .hero-top .hero-col{position:relative;}
    .hero-accent-ed{position:absolute;top:-0.25rem;right:0;width:min(48%,140px);opacity:0.35;pointer-events:none;}
    .hero-accent-ed svg{width:100%;height:auto;display:block;}
    .hero-top::after{content:"";display:block;width:min(100%,520px);height:1px;margin-top:0.5rem;background:linear-gradient(90deg,var(--gold),transparent);}
    .trust-strip{padding:2.25rem 0 2.75rem;background:linear-gradient(180deg,rgba(243,235,224,0.6),transparent);}
    .trust-inner{max-width:720px;margin:0 auto;text-align:center;padding:1.5rem 1.35rem;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:0 16px 44px -28px rgba(28,25,23,0.12);}
    .trust-eyebrow{font-size:0.68rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--accent2);margin-bottom:0.5rem;}
    .trust-main{font-family:var(--display);font-size:1.15rem;font-style:italic;font-weight:500;color:var(--ink);line-height:1.45;max-width:48ch;margin:0 auto;}
    .trust-flourish{display:flex;justify-content:center;margin-bottom:0.65rem;opacity:0.45;}
    .hero-grid{display:grid;gap:2rem;align-items:end;}
    @media(min-width:900px){.hero-grid{grid-template-columns:1.1fr 0.9fr;gap:3rem;}}
    .kicker{font-size:0.68rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:var(--accent);margin-bottom:1rem;}
    h1{font-family:var(--serif);font-size:clamp(2.45rem,5.5vw,3.85rem);font-weight:600;line-height:1.06;letter-spacing:-0.025em;margin-bottom:1rem;text-wrap:balance;}
    .lead{font-size:1.08rem;color:var(--muted);max-width:42ch;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1.5rem;}
    .btn{display:inline-flex;padding:0.75rem 1.35rem;border-radius:8px;font-weight:600;font-size:0.88rem;text-decoration:none;}
    .btn-fill{background:var(--ink);color:#fff;transition:transform .2s,box-shadow .2s;}
    .btn-fill:hover{transform:translateY(-2px);box-shadow:0 12px 28px -8px rgba(28,25,23,0.35);}
    .btn-line{border:1.5px solid var(--line);color:var(--ink);background:var(--card);transition:border-color .2s,background .2s;}
    .btn-line:hover{border-color:rgba(28,25,23,0.25);background:#fff;}

    .img-band{margin-top:2rem;background:var(--ink);color:#fafaf9;position:relative;}
    .img-band::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(28,25,23,0.35) 0%,transparent 25%,transparent 75%,rgba(28,25,23,0.5) 100%),radial-gradient(ellipse 80% 50% at 50% 100%,rgba(0,0,0,0.25),transparent 55%);}
    .img-band .wrap{padding:0;}
    .img-band .hero-visual{width:100%;position:relative;z-index:1;}
    .img-band .hero-visual:empty{min-height:240px;background:linear-gradient(135deg,#1c1917,#44403c,#292524);}
    .img-band .hero-visual img{width:100%;height:auto;display:block;max-height:min(58vh,540px);object-fit:cover;}
    .img-band .photo-credit{font-size:0.72rem;opacity:0.75;padding:0.75rem 1rem;text-align:center;position:relative;z-index:2;}
    .img-band .photo-credit a{color:#fcd34d;}

    .sec-title{font-family:var(--serif);font-size:clamp(1.75rem,3.2vw,2.35rem);font-weight:600;margin-bottom:0.6rem;}
    .eyebrow{font-size:0.72rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent2);margin-bottom:0.75rem;}

    #problem{padding:4rem 0;}
    .problem-grid{display:grid;gap:2rem;}
    @media(min-width:768px){.problem-grid{grid-template-columns:1fr 1fr;gap:3.5rem;align-items:start;}}
    .problem-body{color:var(--muted);font-size:1.05rem;}
    blockquote.pull{font-family:var(--display);font-size:1.35rem;font-style:italic;font-weight:500;color:var(--accent);margin-top:1.5rem;line-height:1.45;padding:1.25rem 0 0;position:relative;border-top:2px solid rgba(194,65,12,0.25);}
    blockquote.pull::before{content:"\\201C";font-family:var(--serif);font-size:3rem;line-height:1;color:rgba(194,65,12,0.15);position:absolute;left:0;top:0.15rem;}

    #how{padding:3.5rem 0;background:linear-gradient(180deg,#f3ebe0 0%,rgba(249,245,240,0) 85%);}
    .how-head{margin-bottom:2rem;}
    .steps{display:grid;gap:1.5rem;counter-reset:st;}
    @media(min-width:768px){.steps{grid-template-columns:repeat(3,1fr);}}
    .step{padding:1.5rem 0;border-top:1px solid var(--line);position:relative;}
    .step::before{counter-increment:st;content:counter(st,decimal-leading-zero);font-family:var(--serif);font-size:2.5rem;font-weight:600;color:rgba(154,52,18,0.2);line-height:1;display:block;margin-bottom:0.5rem;}
    .step h3{font-family:var(--serif);font-size:1.15rem;margin-bottom:0.4rem;}
    .step p{font-size:0.92rem;color:var(--muted);}

    #features{padding:3.5rem 0;}
    .feat-head{text-align:center;max-width:560px;margin:0 auto 2.5rem;}
    .feat-row{display:grid;gap:1.25rem;}
    @media(min-width:720px){.feat-row{grid-template-columns:repeat(3,1fr);}}
    .feat-card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:1.65rem 1.45rem 1.55rem;box-shadow:0 16px 48px -28px rgba(28,25,23,0.14);position:relative;overflow:hidden;transition:transform .25s,box-shadow .25s;}
    .feat-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--accent2),#fbbf24);}
    .feat-card:hover{transform:translateY(-4px);box-shadow:0 24px 56px -28px rgba(28,25,23,0.2);}
    .feat-card h3{font-family:var(--serif);font-size:1.12rem;margin-bottom:0.45rem;}
    .feat-card p{font-size:0.88rem;color:var(--muted);line-height:1.65;}

    #faq{padding:3rem 0 3.5rem;}
    .faq-head{text-align:center;margin-bottom:2rem;}
    .faq-list{max-width:680px;margin:0 auto;}
    details{border:1px solid var(--line);border-radius:14px;margin-bottom:0.65rem;background:var(--card);padding:0 1rem;box-shadow:0 4px 20px -12px rgba(28,25,23,0.08);}
    details[open]{box-shadow:0 12px 36px -16px rgba(28,25,23,0.12);}
    details summary{cursor:pointer;padding:1.1rem 0;font-family:var(--serif);font-size:1.05rem;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:1rem;align-items:center;}
    details summary::after{content:"+";font-family:var(--sans);font-size:1.25rem;font-weight:400;color:var(--accent2);transition:transform .2s;}
    details[open] summary::after{content:"\\2212";transform:rotate(180deg);}
    details summary::-webkit-details-marker{display:none;}
    details .a{padding:0 0 1.15rem;font-size:0.93rem;color:var(--muted);line-height:1.65;border-top:1px solid rgba(28,25,23,0.06);padding-top:0.75rem;}

    #cta{padding:2rem 0 4rem;}
    .cta-box{
      max-width:520px;margin:0 auto;text-align:center;padding:2.65rem 1.85rem;border-radius:22px;
      border:1px solid var(--line);background:
        linear-gradient(var(--card),var(--card)) padding-box,
        linear-gradient(135deg,rgba(180,83,9,0.35),rgba(194,65,12,0.45),rgba(251,191,36,0.35)) border-box;
      border:1px solid transparent;background-origin:border-box;background-clip:padding-box,border-box;
      box-shadow:0 28px 64px -32px rgba(28,25,23,0.2),inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .cta-box h2{font-family:var(--serif);font-size:1.65rem;margin-bottom:0.5rem;}
    .cta-sub{color:var(--muted);font-size:0.95rem;}
    .cta-note{font-size:0.75rem;color:var(--faint);margin:1rem 0 0.5rem;}
    .email-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-top:0.75rem;}
    .email-row input{flex:1;min-width:200px;max-width:260px;padding:0.7rem 0.9rem;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff;}
    .email-row .btn-fill{cursor:pointer;border:none;}

    footer{padding:2rem 0;text-align:center;font-size:0.78rem;color:var(--faint);}
    :focus-visible{outline:2px solid var(--accent2);outline-offset:2px;}
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
      <a class="nav-cta" href="#cta" style="margin-top:0.35rem;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero-top">
      <div class="wrap hero-grid">
        <div class="hero-col">
          <div class="hero-accent-ed" aria-hidden="true"><svg viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 28c18-16 38-16 56 0s38 16 56 0" stroke="url(#ed1)" stroke-width="1.8" stroke-linecap="round"/><path d="M20 12l8 8-8 8M100 12l-8 8 8 8" stroke="#c2410c" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/><defs><linearGradient id="ed1" x1="4" y1="28" x2="116" y2="28"><stop stop-color="#b45309"/><stop offset="1" stop-color="#c2410c"/></linearGradient></defs></svg></div>
          <p class="kicker">%%FLOAT_CARD_TITLE%%</p>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-ctas">
            <a class="btn btn-fill" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-line" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>
        <div style="font-size:0.85rem;color:var(--muted);line-height:1.6;align-self:end;">
          <p><strong style="color:var(--ink);">%%BENEFITS_EYEBROW%%</strong> — %%BENEFITS_TITLE%%</p>
        </div>
      </div>
    </section>

    <div class="img-band">
      %%RAW_HERO_VISUAL%%
    </div>

    <section class="trust-strip" id="trust" aria-label="Social proof">
      <div class="wrap">
        <div class="trust-inner">
          <div class="trust-flourish" aria-hidden="true"><svg width="72" height="12" viewBox="0 0 72 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 6h70M36 1v10" stroke="#c2410c" stroke-width="1" stroke-linecap="round" opacity="0.4"/></svg></div>
          <p class="trust-eyebrow">%%SOCIAL_PROOF_EYEBROW%%</p>
          <p class="trust-main">%%SOCIAL_PROOF_MAIN%%</p>
        </div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap problem-grid">
        <div>
          <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
          <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
        </div>
        <div>
          <p class="problem-body">%%PROBLEM_BODY%%</p>
          <blockquote class="pull">%%PROBLEM_QUOTE%%</blockquote>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap how-head">
        <p class="eyebrow">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap steps">
        <div class="step"><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
        <div class="step"><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
        <div class="step"><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
      </div>
    </section>

    <section id="features">
      <div class="wrap feat-head">
        <p class="eyebrow">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title">%%BENEFITS_TITLE%%</h2>
      </div>
      <div class="wrap feat-row">
        <div class="feat-card"><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
        <div class="feat-card"><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
        <div class="feat-card"><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
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
        <div class="cta-box">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p class="cta-sub">%%CTA_FINAL_SUB%%</p>
          <p class="cta-note">%%FLOAT_CARD_TITLE%%</p>
          <form class="email-row" action="#" method="get" onsubmit="return false;">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-fill">%%FLOAT_CTA_LABEL%%</button>
          </form>
        </div>
      </div>
    </section>
  </main>

  <footer class="rule"><div class="wrap">%%FOOTER_LINE%%</div></footer>

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
