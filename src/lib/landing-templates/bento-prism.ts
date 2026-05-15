/**
 * Bento Prism - "Command Grid"
 * More advanced devtool / AI aesthetic with stronger bento composition,
 * terminal chrome, proof tiles, and sharper neon hierarchy.
 */
export const BENTO_PRISM_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#040814;--bg-2:#091121;--surface:rgba(11,17,33,0.82);--surface-2:rgba(255,255,255,0.05);
      --line:rgba(114,231,255,0.18);--line-2:rgba(255,255,255,0.08);
      --text:#eff6ff;--muted:rgba(239,246,255,0.68);--faint:rgba(239,246,255,0.38);
      --cyan:#62e8ff;--violet:#9a7cff;--pink:#ff7ae6;--green:#4ee3a7;
      --max:1160px;--radius:24px;--radius-sm:16px;
      --shadow:0 28px 90px -42px rgba(98,232,255,0.34),0 28px 100px -48px rgba(154,124,255,0.38);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.62;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    .bg{position:fixed;inset:0;pointer-events:none;z-index:0;background:
      radial-gradient(ellipse 70% 55% at 50% -10%,rgba(98,232,255,0.2),transparent 55%),
      radial-gradient(ellipse 50% 45% at 100% 35%,rgba(255,122,230,0.14),transparent 52%),
      radial-gradient(ellipse 55% 50% at 0% 70%,rgba(154,124,255,0.12),transparent 52%),
      linear-gradient(180deg,#040814 0%,#050c18 55%,#040814 100%);
    }
    .grid{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.28;background-image:
      linear-gradient(rgba(98,232,255,0.08) 1px,transparent 1px),
      linear-gradient(90deg,rgba(98,232,255,0.08) 1px,transparent 1px);
      background-size:42px 42px;
      mask-image:radial-gradient(ellipse 80% 68% at 50% 30%,#000 20%,transparent 100%);
    }
    .wrap{width:min(var(--max),calc(100% - 2rem));margin:0 auto;position:relative;z-index:1}

    header{position:sticky;top:0;z-index:30;background:rgba(4,8,20,0.8);backdrop-filter:blur(16px);border-bottom:1px solid rgba(98,232,255,0.08)}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:68px;flex-wrap:wrap}
    .logo{text-decoration:none;font-family:"JetBrains Mono",monospace;font-size:0.92rem;font-weight:700;color:var(--text)}
    .logo span{color:var(--cyan)}
    .nav-links{display:none;gap:1.5rem}
    @media(min-width:920px){.nav-links{display:flex}}
    .nav-links a{text-decoration:none;font-family:"JetBrains Mono",monospace;font-size:0.76rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em}
    .nav-links a:hover{color:var(--cyan)}
    .nav-cta{text-decoration:none;padding:0.62rem 0.95rem;border-radius:12px;border:1px solid rgba(98,232,255,0.26);background:rgba(98,232,255,0.08);color:var(--cyan);font-family:"JetBrains Mono",monospace;font-size:0.76rem;font-weight:700}
    .nav-toggle{display:inline-flex;padding:0.45rem 0.78rem;border:1px solid var(--line);border-radius:12px;background:var(--surface-2);color:var(--text);font-size:0.76rem;cursor:pointer}
    @media(min-width:920px){.nav-toggle{display:none}}
    .nav-mobile{display:none;flex-direction:column;gap:0.5rem;padding:0 0 1rem}
    .nav-mobile.open{display:flex}
    .nav-mobile a{text-decoration:none;color:var(--muted)}
    @media(min-width:920px){.nav-mobile{display:none!important}}

    .hero{padding:clamp(3rem,9vw,5.5rem) 0 2rem}
    .hero-grid{display:grid;gap:1rem}
    @media(min-width:980px){.hero-grid{grid-template-columns:1.1fr 0.9fr;align-items:center}}
    .eyebrow{display:inline-flex;align-items:center;gap:0.5rem;padding:0.35rem 0.85rem;border-radius:999px;border:1px solid rgba(98,232,255,0.22);background:rgba(98,232,255,0.06);font-family:"JetBrains Mono",monospace;font-size:0.68rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--cyan);margin-bottom:1.15rem}
    .eyebrow::before{content:"";width:8px;height:8px;border-radius:999px;background:linear-gradient(135deg,var(--cyan),var(--violet))}
    h1{font-size:clamp(2.5rem,5.4vw,4.6rem);font-weight:800;line-height:0.94;letter-spacing:-0.055em;max-width:10.5ch}
    .grad{background:linear-gradient(135deg,#fff 0%,#cbf4ff 34%,#9a7cff 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .lead{margin-top:1rem;max-width:44ch;font-size:1.03rem;color:var(--muted)}
    .hero-actions{display:flex;flex-wrap:wrap;gap:0.7rem;margin-top:1.45rem}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.92rem 1.25rem;border-radius:14px;text-decoration:none;font-size:0.88rem;font-weight:700}
    .btn-primary{background:linear-gradient(135deg,var(--cyan),var(--violet));color:#08111b;box-shadow:0 18px 42px -22px rgba(98,232,255,0.58)}
    .btn-ghost{border:1px solid rgba(98,232,255,0.22);background:rgba(255,255,255,0.03);color:var(--text)}
    .callouts{display:grid;gap:0.8rem;margin-top:1.4rem}
    @media(min-width:640px){.callouts{grid-template-columns:repeat(2,1fr)}}
    .callout{padding:0.9rem 1rem;border-radius:16px;border:1px solid var(--line-2);background:rgba(255,255,255,0.03)}
    .callout .k{font-family:"JetBrains Mono",monospace;font-size:0.68rem;color:var(--faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.35rem}
    .callout p{font-size:0.88rem;color:var(--muted)}

    .shell{padding:1px;border-radius:28px;background:linear-gradient(135deg,rgba(98,232,255,0.85),rgba(154,124,255,0.5),rgba(255,122,230,0.4));box-shadow:var(--shadow)}
    .shell-inner{border-radius:27px;background:linear-gradient(180deg,#08111d 0%,#060d18 100%);overflow:hidden}
    .shell-top{display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06);font-family:"JetBrains Mono",monospace;font-size:0.74rem;color:var(--faint)}
    .dots{display:flex;gap:0.42rem}.dots span{width:9px;height:9px;border-radius:999px;background:rgba(255,255,255,0.16)}.dots span:nth-child(1){background:#ff6b6b}.dots span:nth-child(2){background:#ffbf69}.dots span:nth-child(3){background:#4ee3a7}
    .shell-content{display:grid;gap:0.9rem;padding:1rem}
    .hero-bento{display:grid;gap:0.9rem}
    @media(min-width:760px){.hero-bento{grid-template-columns:1.25fr 0.75fr}}
    .visual-card,.mini-panel,.quote-panel{border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);border-radius:20px}
    .visual-card{overflow:hidden;min-height:280px}
    .visual-card .hero-visual img{display:block;width:100%;height:100%;min-height:280px;object-fit:cover}
    .visual-card .hero-visual:empty{min-height:280px;background:linear-gradient(135deg,rgba(98,232,255,0.14),rgba(154,124,255,0.12))}
    .photo-credit{padding:0.65rem 0.85rem;border-top:1px solid rgba(255,255,255,0.06);font-size:0.68rem;color:var(--faint)}
    .photo-credit a{color:var(--cyan)}
    .side-stack{display:grid;gap:0.9rem}
    .mini-panel{padding:1rem}
    .mini-panel .k{font-family:"JetBrains Mono",monospace;font-size:0.66rem;color:var(--cyan);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.45rem}
    .mini-panel .v{font-size:1.35rem;font-weight:800;letter-spacing:-0.04em}
    .mini-panel p{margin-top:0.3rem;font-size:0.86rem;color:var(--muted)}
    .quote-panel{padding:1rem 1.05rem;background:linear-gradient(135deg,rgba(154,124,255,0.1),rgba(255,255,255,0.03))}
    .quote-panel p{font-size:0.95rem;color:#d8dfff;font-style:italic;line-height:1.6}

    .proof{padding:0.8rem 0 3rem}
    .proof-row{display:grid;gap:0.9rem}
    @media(min-width:860px){.proof-row{grid-template-columns:1.1fr 0.9fr}}
    .proof-card{padding:1.1rem 1.15rem;border-radius:20px;border:1px solid var(--line-2);background:rgba(255,255,255,0.035)}
    .proof-card .k{font-family:"JetBrains Mono",monospace;font-size:0.68rem;color:var(--cyan);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:0.45rem}
    .proof-card p{color:var(--muted)}
    .metric-grid{display:grid;gap:0.8rem}
    @media(min-width:640px){.metric-grid{grid-template-columns:repeat(3,1fr)}}
    .metric{padding:0.95rem;border-radius:18px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)}
    .metric .v{font-size:1.55rem;font-weight:800;letter-spacing:-0.05em}
    .metric .l{margin-top:0.2rem;font-size:0.78rem;color:var(--faint)}

    section{padding:4.5rem 0}
    .section-head{max-width:54ch;margin-bottom:2rem}
    .section-eyebrow{font-family:"JetBrains Mono",monospace;font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--cyan);margin-bottom:0.75rem}
    h2{font-size:clamp(1.8rem,3.5vw,2.7rem);font-weight:800;line-height:0.98;letter-spacing:-0.05em}
    .section-head p{margin-top:0.7rem;color:var(--muted)}

    .command-grid{display:grid;gap:1rem}
    @media(min-width:860px){.command-grid{grid-template-columns:1.05fr 0.95fr}}
    .feature-grid{display:grid;gap:1rem}
    .feature{padding:1.1rem;border-radius:20px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))}
    .feature .top{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:0.8rem}
    .feature .tag{font-family:"JetBrains Mono",monospace;font-size:0.66rem;color:var(--cyan);text-transform:uppercase;letter-spacing:0.1em}
    .feature .chip{font-family:"JetBrains Mono",monospace;font-size:0.68rem;padding:0.28rem 0.5rem;border-radius:999px;background:rgba(98,232,255,0.08);border:1px solid rgba(98,232,255,0.18);color:var(--cyan)}
    .feature h3{font-size:1rem;font-weight:800;margin-bottom:0.25rem}
    .feature p{font-size:0.9rem;color:var(--muted)}
    .bridge{display:grid;gap:1rem}
    .bridge-card{padding:1.2rem;border-radius:20px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03)}
    .bridge-card .k{font-family:"JetBrains Mono",monospace;font-size:0.68rem;color:var(--faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.45rem}
    .bridge-card .big{font-size:1.85rem;font-weight:800;letter-spacing:-0.05em}
    .bridge-card p{margin-top:0.35rem;color:var(--muted)}

    .steps{display:grid;gap:1rem}
    @media(min-width:860px){.steps{grid-template-columns:repeat(3,1fr)}}
    .step{padding:1.2rem;border-radius:20px;border:1px solid var(--line-2);background:rgba(255,255,255,0.03)}
    .step .n{display:inline-flex;padding:0.3rem 0.52rem;border-radius:10px;background:rgba(154,124,255,0.12);border:1px solid rgba(154,124,255,0.22);font-family:"JetBrains Mono",monospace;font-size:0.68rem;color:#d8dfff;margin-bottom:0.75rem}
    .step h3{font-size:1rem;font-weight:800;margin-bottom:0.3rem}
    .step p{font-size:0.9rem;color:var(--muted)}

    .faq{display:grid;gap:0.7rem}
    .faq details{border-radius:18px;border:1px solid var(--line-2);background:rgba(255,255,255,0.03);overflow:hidden}
    .faq summary{list-style:none;cursor:pointer;padding:1rem 1.1rem;display:flex;justify-content:space-between;gap:1rem;align-items:center;font-size:0.94rem;font-weight:700}
    .faq summary::-webkit-details-marker{display:none}
    .faq summary::after{content:"+";font-family:"JetBrains Mono",monospace;color:var(--cyan);font-size:1rem}
    .faq details[open] summary::after{content:"-"}
    .faq .a{padding:0 1.1rem 1rem;font-size:0.9rem;color:var(--muted)}

    .cta{padding-top:1rem;padding-bottom:5rem}
    .cta-shell{padding:1px;border-radius:28px;background:linear-gradient(135deg,rgba(98,232,255,0.85),rgba(154,124,255,0.48),rgba(255,122,230,0.45));box-shadow:var(--shadow)}
    .cta-inner{border-radius:27px;background:linear-gradient(180deg,#08111d 0%,#050b17 100%);padding:2.5rem 1.3rem;text-align:center}
    .cta-inner h2{max-width:12ch;margin:0 auto 0.6rem}
    .cta-inner p{max-width:40ch;margin:0 auto;color:var(--muted)}
    .cta-note{margin-top:1rem;font-family:"JetBrains Mono",monospace;font-size:0.68rem;color:var(--cyan);letter-spacing:0.12em;text-transform:uppercase}
    .email-row{display:flex;flex-wrap:wrap;justify-content:center;gap:0.65rem;margin-top:1.15rem}
    .email-row input{width:min(100%,280px);padding:0.95rem 1rem;border-radius:14px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:var(--text);font:inherit}
    .email-row input::placeholder{color:var(--faint)}
    .email-row button{border:none;cursor:pointer}

    footer{padding:1.6rem 0 2.4rem;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-family:"JetBrains Mono",monospace;font-size:0.74rem;color:var(--faint)}
    :focus-visible{outline:2px solid var(--cyan);outline-offset:3px}
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <div class="grid" aria-hidden="true"></div>

  <header data-tpl-nav>
    <div class="wrap nav">
      <a class="logo" href="#">%%BRAND_NAME%%<span>_</span></a>
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
          <div class="callouts">
            <div class="callout"><div class="k">Stack fit</div><p>Designed to feel like a real tool surface, not just a brochure block.</p></div>
            <div class="callout"><div class="k">Signal</div><p>Every tile carries useful narrative weight, not decorative filler.</p></div>
          </div>
        </div>
        <div class="shell">
          <div class="shell-inner">
            <div class="shell-top">
              <div class="dots"><span></span><span></span><span></span></div>
              <div>%%BRAND_NAME%% / live preview</div>
            </div>
            <div class="shell-content">
              <div class="hero-bento">
                <div class="visual-card">%%RAW_HERO_VISUAL%%</div>
                <div class="side-stack">
                  <div class="mini-panel"><div class="k">%%BENEFITS_EYEBROW%%</div><div class="v">Core lift</div><p>%%BENEFITS_TITLE%%</p></div>
                  <div class="quote-panel"><p>%%SOCIAL_PROOF_MAIN%%</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="proof" id="trust" aria-label="Social proof">
      <div class="wrap proof-row">
        <div class="proof-card"><div class="k">%%SOCIAL_PROOF_EYEBROW%%</div><p>%%SOCIAL_PROOF_MAIN%%</p></div>
        <div class="metric-grid">
          <div class="metric"><div class="v">01</div><div class="l">Clear workflows</div></div>
          <div class="metric"><div class="v">02</div><div class="l">Lower friction</div></div>
          <div class="metric"><div class="v">03</div><div class="l">Faster handoff</div></div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%BENEFITS_EYEBROW%%</div>
          <h2>%%BENEFITS_TITLE%%</h2>
          <p>A more advanced bento page needs varied module weights, sharper chrome, and content that feels like it belongs inside a product-grade interface.</p>
        </div>
        <div class="command-grid">
          <div class="feature-grid">
            <div class="feature"><div class="top"><div class="tag">Feature 01</div><div class="chip">active</div></div><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
            <div class="feature"><div class="top"><div class="tag">Feature 02</div><div class="chip">queued</div></div><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
            <div class="feature"><div class="top"><div class="tag">Feature 03</div><div class="chip">ready</div></div><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
          </div>
          <div class="bridge">
            <div class="bridge-card"><div class="k">Problem frame</div><div class="big">%%PROBLEM_TITLE%%</div><p>%%PROBLEM_BODY%%</p></div>
            <div class="bridge-card"><div class="k">Key line</div><p style="font-style:italic;color:#dbe7ff">%%PROBLEM_QUOTE%%</p></div>
          </div>
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
          <div class="step"><div class="n">/01</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          <div class="step"><div class="n">/02</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          <div class="step"><div class="n">/03</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
        </div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap">
        <div class="section-head">
          <div class="section-eyebrow">%%PROBLEM_EYEBROW%%</div>
          <h2>Why this system now feels closer to a real launch surface.</h2>
          <p>%%PROBLEM_BODY%%</p>
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
