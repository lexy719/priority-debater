/**
 * Minimal Slate — Ultra-clean monochrome design with sharp typography,
 * generous whitespace, Swiss-style grid, subtle micro-interactions,
 * elegant line decorations, progressive disclosure FAQ.
 * Inspired by Apple, Notion, Linear, and Dieter Rams.
 */
export const MINIMAL_SLATE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#fafafa;
      --card:#ffffff;
      --text:#111111;
      --muted:#6b7280;
      --faint:#9ca3af;
      --accent:#111111;
      --accent2:#374151;
      --highlight:#3b82f6;
      --border:rgba(0,0,0,0.07);
      --border-hover:rgba(0,0,0,0.14);
      --radius:16px;
      --radius-sm:10px;
      --max:1060px;
      --heading:"Space Grotesk",system-ui,sans-serif;
      --body:"Inter",system-ui,sans-serif;
      --ease:cubic-bezier(0.4,0,0.2,1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{
      font-family:var(--body);background:var(--bg);color:var(--text);
      font-size:1rem;line-height:1.65;
      -webkit-font-smoothing:antialiased;overflow-x:hidden;
    }

    /* ═══ SUBTLE GRAIN ═══ */
    .grain{
      pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.02;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ═══ SCROLL REVEAL ═══ */
    .rv{opacity:0;transform:translateY(28px);transition:opacity 0.7s var(--ease),transform 0.7s var(--ease);}
    .rv.on{opacity:1;transform:translateY(0);}
    .rv-d1{transition-delay:0.1s;}.rv-d2{transition-delay:0.2s;}.rv-d3{transition-delay:0.3s;}

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.5rem);position:relative;z-index:2;}

    /* ═══ HEADER ═══ */
    header{
      position:sticky;top:0;z-index:50;
      border-bottom:1px solid var(--border);
      background:rgba(250,250,250,0.88);
      backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);
    }
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{
      font-family:var(--heading);font-weight:700;font-size:1.15rem;
      letter-spacing:-0.04em;text-decoration:none;color:var(--text);
    }
    .nav-links{display:none;gap:2rem;align-items:center;}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.85rem;font-weight:500;transition:color 0.2s;}
    .nav-links a:hover{color:var(--text);}
    .nav-cta{
      padding:0.5rem 1.15rem;border-radius:8px;font-weight:600;font-size:0.85rem;
      text-decoration:none;color:#fff;background:var(--accent);
      transition:all 0.2s var(--ease);
    }
    .nav-cta:hover{background:var(--accent2);transform:translateY(-1px);}
    .nav-toggle{
      display:flex;padding:0.45rem 0.75rem;border:1px solid var(--border);
      border-radius:8px;background:var(--card);color:var(--text);
      cursor:pointer;font-size:0.85rem;font-family:var(--body);
    }
    @media(min-width:900px){.nav-links{display:flex;}.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.75rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;padding:0.3rem 0;transition:color 0.2s;}
    .nav-mobile a:hover{color:var(--text);}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:0.45rem;
      padding:0.8rem 1.6rem;border-radius:var(--radius-sm);font-weight:600;font-size:0.92rem;
      text-decoration:none;border:none;cursor:pointer;font-family:var(--body);
      transition:all 0.25s var(--ease);position:relative;
    }
    .btn-primary{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);}
    .btn-primary:hover{background:var(--accent2);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.12);}
    .btn-ghost{background:transparent;border:1.5px solid var(--border-hover);color:var(--text);}
    .btn-ghost:hover{background:rgba(0,0,0,0.02);border-color:rgba(0,0,0,0.2);transform:translateY(-1px);}

    /* ═══ HERO — Massive centered typography ═══ */
    .hero{
      padding:clamp(6rem,14vw,10rem) 0 clamp(3rem,7vw,5rem);
      text-align:center;position:relative;z-index:2;
    }
    .hero-badge{
      display:inline-flex;align-items:center;gap:0.5rem;
      padding:0.38rem 0.85rem;border-radius:999px;
      border:1px solid var(--border);background:var(--card);
      font-size:0.78rem;font-weight:500;color:var(--muted);margin-bottom:2rem;
      box-shadow:0 1px 3px rgba(0,0,0,0.04);
    }
    .hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--highlight);box-shadow:0 0 6px var(--highlight);}

    .hero h1{
      font-family:var(--heading);
      font-size:clamp(3.2rem,8.5vw,5.8rem);font-weight:700;
      line-height:0.98;letter-spacing:-0.06em;
      margin:0 auto 1.75rem;max-width:13ch;color:var(--text);
    }
    .hero .lead{color:var(--muted);font-size:clamp(1.05rem,2.2vw,1.22rem);max-width:46ch;margin:0 auto 2.75rem;line-height:1.75;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.85rem;justify-content:center;margin-bottom:clamp(3.5rem,8vw,6rem);}

    /* Hero visual — clean rounded frame */
    .hero-visual-wrap{position:relative;max-width:920px;margin:0 auto;}
    .hero-visual{
      border-radius:var(--radius);overflow:hidden;
      border:1px solid var(--border);background:var(--card);
      box-shadow:0 40px 80px -24px rgba(0,0,0,0.1),0 0 0 1px rgba(255,255,255,0.8) inset;
      transition:box-shadow 0.4s var(--ease);
    }
    .hero-visual:hover{box-shadow:0 48px 100px -20px rgba(0,0,0,0.14),0 0 0 1px rgba(255,255,255,0.8) inset;}
    .hero-visual img{width:100%;max-height:480px;object-fit:cover;display:block;}
    .photo-credit{font-size:0.7rem;color:var(--faint);padding:0.5rem 0.85rem;background:rgba(255,255,255,0.8);}
    .photo-credit a{color:var(--muted);}

    /* ═══ SECTIONS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .divider{border:none;border-top:1px solid var(--border);margin:0;}
    .eyebrow{
      font-family:var(--body);font-size:0.72rem;font-weight:600;
      letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);margin:0 0 0.85rem;
    }
    .sec-title{
      font-family:var(--heading);font-size:clamp(2rem,4.5vw,3rem);
      font-weight:700;letter-spacing:-0.05em;line-height:1.04;margin:0 0 1.25rem;
    }

    /* ═══ PROBLEM — Centered block ═══ */
    .problem-block{max-width:640px;}
    .sec-body{color:var(--muted);font-size:1.05rem;max-width:56ch;line-height:1.8;}
    .pullquote{
      margin-top:2.5rem;padding:2rem 2.25rem;border-radius:var(--radius);
      background:var(--card);border:1px solid var(--border);
      color:var(--text);font-size:1.1rem;line-height:1.6;font-style:italic;
      position:relative;
      box-shadow:0 12px 40px -16px rgba(0,0,0,0.06);
    }
    .pullquote::before{
      content:'';position:absolute;top:0;left:2rem;right:2rem;height:2px;
      background:linear-gradient(90deg,transparent,var(--text),transparent);opacity:0.08;
    }

    /* ═══ FEATURES — Swiss grid cards ═══ */
    .features-band{background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
    .f-grid{display:grid;gap:1px;margin-top:2.5rem;background:var(--border);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
    @media(min-width:640px){.f-grid{grid-template-columns:repeat(3,1fr);}}
    .f-cell{
      padding:2.25rem 2rem;background:var(--card);
      transition:background 0.3s var(--ease);position:relative;
    }
    .f-cell:hover{background:var(--bg);}
    .f-num{
      font-family:var(--heading);font-size:3.5rem;font-weight:700;
      line-height:1;color:var(--text);opacity:0.06;margin-bottom:1rem;
    }
    .f-cell h3{font-family:var(--heading);font-size:1.1rem;font-weight:600;letter-spacing:-0.03em;margin:0 0 0.5rem;}
    .f-cell p{margin:0;color:var(--muted);font-size:0.92rem;line-height:1.65;}

    /* ═══ HOW IT WORKS — Minimal numbered list ═══ */
    .how-list{margin-top:3rem;max-width:640px;}
    .how-item{
      display:grid;grid-template-columns:48px 1fr;gap:1.5rem;
      padding:2rem 0;border-bottom:1px solid var(--border);
      transition:padding-left 0.3s var(--ease);
    }
    .how-item:hover{padding-left:8px;}
    .how-item:last-child{border-bottom:none;}
    .how-num{
      font-family:var(--heading);font-size:1.5rem;font-weight:700;
      color:var(--text);opacity:0.15;padding-top:2px;
    }
    .how-item h3{font-family:var(--heading);font-size:1.08rem;font-weight:600;letter-spacing:-0.03em;margin:0 0 0.45rem;}
    .how-item p{margin:0;color:var(--muted);font-size:0.92rem;line-height:1.65;}

    /* ═══ FAQ ═══ */
    .faq-list{margin-top:2.25rem;max-width:640px;display:flex;flex-direction:column;gap:0;}
    .faq-item{border-bottom:1px solid var(--border);transition:background 0.3s;}
    .faq-item:first-child{border-top:1px solid var(--border);}
    .faq-item:hover{background:var(--card);}
    .faq-item[open]{background:var(--card);}
    .faq-item summary{
      cursor:pointer;padding:1.25rem 0;font-weight:600;font-size:0.97rem;
      list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;
      transition:color 0.2s;
    }
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary .arr{
      width:20px;height:20px;flex-shrink:0;stroke:var(--faint);fill:none;
      stroke-width:2;stroke-linecap:round;transition:transform 0.3s var(--ease),stroke 0.3s;
    }
    .faq-item[open] summary .arr{transform:rotate(180deg);stroke:var(--text);}
    .faq-item[open] summary{color:var(--text);}
    .faq-item .ans{padding:0 0 1.35rem;color:var(--muted);font-size:0.92rem;line-height:1.7;}

    /* ═══ CTA ═══ */
    .cta-final{text-align:center;padding:clamp(5rem,10vw,8rem) 0;}
    .cta-card{
      max-width:580px;margin:0 auto;padding:clamp(3rem,7vw,4.5rem) clamp(2rem,5vw,3rem);
      border-radius:var(--radius);background:var(--text);color:#fff;
      box-shadow:0 40px 80px -24px rgba(0,0,0,0.25);
      position:relative;overflow:hidden;
    }
    .cta-card::before{
      content:'';position:absolute;top:0;right:0;
      width:300px;height:300px;border-radius:50%;
      background:radial-gradient(circle,rgba(59,130,246,0.15),transparent 60%);
      pointer-events:none;
    }
    .cta-card h2{font-family:var(--heading);font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:700;letter-spacing:-0.04em;margin:0 0 0.6rem;position:relative;}
    .cta-card>p{margin:0 0 1.75rem;color:rgba(255,255,255,0.6);font-size:0.98rem;line-height:1.6;position:relative;}
    .cta-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;position:relative;}
    .cta-row input{
      flex:1 1 200px;min-width:0;padding:0.75rem 1rem;border-radius:8px;
      border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);
      color:#fff;font:inherit;font-size:0.9rem;outline:none;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .cta-row input::placeholder{color:rgba(255,255,255,0.35);}
    .cta-row input:focus{border-color:var(--highlight);box-shadow:0 0 0 3px rgba(59,130,246,0.2);}
    .cta-row .btn-primary{background:#fff;color:var(--text);}
    .cta-row .btn-primary:hover{background:rgba(255,255,255,0.9);}

    /* ═══ FOOTER ═══ */
    footer{padding:2.75rem 0;border-top:1px solid var(--border);color:var(--faint);font-size:0.85rem;text-align:center;position:relative;z-index:2;}

    ::selection{background:rgba(59,130,246,0.15);color:var(--text);}
    :focus-visible{outline:2px solid var(--highlight);outline-offset:2px;}
  </style>
</head>
<body>
  <div class="grain" aria-hidden="true"></div>

  <header data-tpl-nav>
    <div class="wrap nav-inner">
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
    <nav class="nav-mobile wrap" data-tpl-nav-mobile>
      <a href="#problem">%%NAV_PROBLEM%%</a>
      <a href="#features">%%NAV_FEATURES%%</a>
      <a href="#how">%%NAV_HOW%%</a>
      <a href="#faq">%%NAV_FAQ%%</a>
      <a class="nav-cta" href="#cta" style="margin-top:0.5rem;text-align:center;display:block;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap">
        <div class="hero-badge rv"><span class="dot"></span>%%FLOAT_CARD_TITLE%%</div>
        <h1 class="rv rv-d1">%%HERO_HEADLINE%%</h1>
        <p class="lead rv rv-d2">%%HERO_SUB%%</p>
        <div class="hero-ctas rv rv-d2">
          <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
          <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
        </div>
        <div class="hero-visual-wrap rv rv-d3">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>

    <hr class="divider">

    <section id="problem">
      <div class="wrap">
        <div class="problem-block">
          <p class="eyebrow rv">%%PROBLEM_EYEBROW%%</p>
          <h2 class="sec-title rv">%%PROBLEM_TITLE%%</h2>
          <p class="sec-body rv rv-d1">%%PROBLEM_BODY%%</p>
          <blockquote class="pullquote rv rv-d2">%%PROBLEM_QUOTE%%</blockquote>
        </div>
      </div>
    </section>

    <section id="features" class="features-band">
      <div class="wrap">
        <p class="eyebrow rv">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title rv">%%BENEFITS_TITLE%%</h2>
        <div class="f-grid">
          <div class="f-cell rv rv-d1">
            <div class="f-num">01</div>
            <h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="f-cell rv rv-d2">
            <div class="f-num">02</div>
            <h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="f-cell rv rv-d3">
            <div class="f-num">03</div>
            <h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap">
        <p class="eyebrow rv">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title rv">%%HOW_TITLE%%</h2>
        <div class="how-list">
          <div class="how-item rv rv-d1">
            <div class="how-num">01</div>
            <div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          </div>
          <div class="how-item rv rv-d2">
            <div class="how-num">02</div>
            <div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          </div>
          <div class="how-item rv rv-d3">
            <div class="how-num">03</div>
            <div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
          </div>
        </div>
      </div>
    </section>

    <hr class="divider">

    <section id="faq">
      <div class="wrap">
        <p class="eyebrow rv">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title rv">%%FAQ_TITLE%%</h2>
        <div class="faq-list">
          <details class="faq-item rv rv-d1"><summary><span>%%FAQ1_Q%%</span><svg class="arr" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ1_A%%</div></details>
          <details class="faq-item rv rv-d2"><summary><span>%%FAQ2_Q%%</span><svg class="arr" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ2_A%%</div></details>
          <details class="faq-item rv rv-d3"><summary><span>%%FAQ3_Q%%</span><svg class="arr" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ3_A%%</div></details>
        </div>
      </div>
    </section>

    <section id="cta" class="cta-final">
      <div class="wrap">
        <div class="cta-card rv">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <form class="cta-row" action="#" method="get" onsubmit="return false;">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-primary">%%FLOAT_CTA_LABEL%%</button>
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
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("on");obs.unobserve(e.target);}});
    },{threshold:0.08,rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll(".rv").forEach(function(el){obs.observe(el);});
  })();
  </script>
</body>
</html>`;
