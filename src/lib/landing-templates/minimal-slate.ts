/**
 * Minimal Slate — "Editorial Magazine" layout.
 * Ultra-clean LIGHT theme, massive typography, generous whitespace.
 * Text-only hero (NO image). Image appears in standalone showcase section.
 * Swiss minimalism meets Apple.com meets luxury fashion editorial.
 * Space Grotesk headings + Inter body. No neon, no gradients, no glass.
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
      --border:rgba(0,0,0,0.08);
      --border-hover:rgba(0,0,0,0.16);
      --radius:14px;
      --max:1100px;
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

    /* ═══ GRAIN OVERLAY ═══ */
    .grain{
      pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.018;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ═══ SCROLL REVEAL ═══ */
    .rv{opacity:0;transform:translateY(28px);transition:opacity 0.7s var(--ease),transform 0.7s var(--ease);}
    .rv.on{opacity:1;transform:translateY(0);}
    .rv-d1{transition-delay:0.1s;}.rv-d2{transition-delay:0.2s;}.rv-d3{transition-delay:0.3s;}.rv-d4{transition-delay:0.35s;}

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.5rem);position:relative;z-index:2;}
    .wrap-wide{width:100%;max-width:1280px;margin:0 auto;padding:0 clamp(1.25rem,4vw,2.5rem);position:relative;z-index:2;}

    /* ═══ HEADER ═══ */
    header{
      position:sticky;top:0;z-index:50;
      border-bottom:1px solid var(--border);
      background:rgba(250,250,250,0.92);
      backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);
    }
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:60px;flex-wrap:wrap;}
    .logo{
      font-family:var(--heading);font-weight:700;font-size:1.1rem;
      letter-spacing:-0.04em;text-decoration:none;color:var(--text);
    }
    .nav-links{display:none;gap:2.25rem;align-items:center;}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.82rem;font-weight:500;letter-spacing:0.01em;transition:color 0.2s;}
    .nav-links a:hover{color:var(--text);}
    .nav-cta{
      padding:0.45rem 1.1rem;border-radius:8px;font-weight:600;font-size:0.82rem;
      text-decoration:none;color:#fff;background:var(--accent);
      transition:all 0.2s var(--ease);
    }
    .nav-cta:hover{background:var(--accent2);transform:translateY(-1px);}
    .nav-toggle{
      display:flex;padding:0.4rem 0.7rem;border:1px solid var(--border);
      border-radius:8px;background:var(--card);color:var(--text);
      cursor:pointer;font-size:0.82rem;font-family:var(--body);
    }
    @media(min-width:900px){.nav-links{display:flex;}.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.7rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.92rem;padding:0.3rem 0;transition:color 0.2s;}
    .nav-mobile a:hover{color:var(--text);}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:0.4rem;
      padding:0.78rem 1.65rem;border-radius:10px;font-weight:600;font-size:0.9rem;
      text-decoration:none;border:none;cursor:pointer;font-family:var(--body);
      transition:all 0.25s var(--ease);position:relative;
    }
    .btn-primary{background:var(--accent);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);}
    .btn-primary:hover{background:var(--accent2);transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.1);}
    .btn-ghost{background:transparent;border:1.5px solid var(--border-hover);color:var(--text);}
    .btn-ghost:hover{background:rgba(0,0,0,0.02);border-color:rgba(0,0,0,0.22);transform:translateY(-1px);}

    /* ═══ 1. HERO — Text-only, massive typography ═══ */
    .hero{
      padding:clamp(7rem,18vw,13rem) 0 clamp(5rem,10vw,8rem);
      position:relative;z-index:2;
    }
    .hero-inner{max-width:900px;}
    .hero-badge{
      display:inline-flex;align-items:center;gap:0.5rem;
      padding:0.35rem 0.8rem;border-radius:999px;
      border:1px solid var(--border);background:var(--card);
      font-size:0.75rem;font-weight:500;color:var(--muted);margin-bottom:2.5rem;
      box-shadow:0 1px 3px rgba(0,0,0,0.03);
    }
    .hero-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--highlight);box-shadow:0 0 6px var(--highlight);}
    .hero h1{
      font-family:var(--heading);
      font-size:clamp(4rem,10vw,7rem);font-weight:700;
      line-height:0.98;letter-spacing:-0.06em;
      margin:0 0 2rem;color:var(--text);
    }
    .hero .lead{
      color:var(--muted);font-size:clamp(1.05rem,2vw,1.2rem);
      max-width:48ch;line-height:1.8;margin:0 0 3rem;
    }
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.85rem;}

    /* ═══ SECTION GLOBALS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .divider{border:none;border-top:1px solid var(--border);margin:0;}
    .eyebrow{
      font-family:var(--body);font-size:0.7rem;font-weight:600;
      letter-spacing:0.16em;text-transform:uppercase;color:var(--muted);margin:0 0 0.9rem;
    }
    .sec-title{
      font-family:var(--heading);font-size:clamp(1.9rem,4.2vw,2.8rem);
      font-weight:700;letter-spacing:-0.05em;line-height:1.06;margin:0 0 1.2rem;
    }

    /* ═══ 2. PROBLEM — Left-aligned with vertical accent ═══ */
    .problem{border-top:1px solid var(--border);}
    .problem-inner{
      display:grid;grid-template-columns:4px 1fr;gap:clamp(1.5rem,3vw,2.5rem);
      max-width:680px;
    }
    .problem-accent{
      width:4px;background:var(--text);border-radius:2px;
      align-self:stretch;opacity:0.12;
    }
    .problem-content{}
    .sec-body{color:var(--muted);font-size:1.02rem;max-width:54ch;line-height:1.8;}
    .pullquote{
      margin-top:2.25rem;padding:1.75rem 2rem;border-radius:var(--radius);
      background:var(--card);border:1px solid var(--border);
      color:var(--text);font-size:1.05rem;line-height:1.65;font-style:italic;
      position:relative;
      box-shadow:0 8px 32px -12px rgba(0,0,0,0.06);
    }
    .pullquote::before{
      content:'"';position:absolute;top:-0.15em;left:1.5rem;
      font-family:Georgia,serif;font-size:3.5rem;color:var(--text);opacity:0.06;
      line-height:1;
    }

    /* ═══ 3. IMAGE SHOWCASE — Standalone section ═══ */
    .showcase{
      padding:clamp(3rem,7vw,5rem) 0;
      background:var(--bg);position:relative;z-index:2;
    }
    .showcase-frame{
      position:relative;max-width:960px;margin:0 auto;
    }
    .hero-visual{
      border-radius:var(--radius);overflow:hidden;
      border:1px solid var(--border);background:var(--card);
      box-shadow:
        0 2px 4px rgba(0,0,0,0.02),
        0 8px 16px rgba(0,0,0,0.04),
        0 32px 64px -16px rgba(0,0,0,0.08);
      transition:box-shadow 0.5s var(--ease),transform 0.5s var(--ease);
    }
    .hero-visual:hover{
      box-shadow:
        0 2px 4px rgba(0,0,0,0.02),
        0 12px 24px rgba(0,0,0,0.06),
        0 48px 80px -16px rgba(0,0,0,0.12);
      transform:translateY(-4px);
    }
    .hero-visual img{width:100%;max-height:520px;object-fit:cover;display:block;}
    .photo-credit{
      font-size:0.7rem;color:var(--faint);padding:0.55rem 1rem;
      background:rgba(255,255,255,0.85);
    }
    .photo-credit a{color:var(--muted);text-decoration:underline;text-underline-offset:2px;}
    .showcase-caption{
      text-align:center;margin-top:1.25rem;
      font-size:0.78rem;color:var(--faint);letter-spacing:0.04em;
    }

    /* ═══ 4. FEATURES — Swiss grid with 1px borders ═══ */
    .features{border-top:1px solid var(--border);}
    .f-grid{
      display:grid;gap:0;margin-top:2.75rem;
      border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;
    }
    @media(min-width:640px){.f-grid{grid-template-columns:repeat(3,1fr);}}
    .f-cell{
      padding:clamp(1.75rem,3.5vw,2.5rem) clamp(1.5rem,3vw,2.25rem);
      background:var(--card);position:relative;
      transition:background 0.3s var(--ease);
    }
    @media(min-width:640px){
      .f-cell{border-left:1px solid var(--border);}
      .f-cell:first-child{border-left:none;}
    }
    @media(max-width:639px){
      .f-cell+.f-cell{border-top:1px solid var(--border);}
    }
    .f-cell:hover{background:var(--bg);}
    .f-num{
      font-family:var(--heading);font-size:4rem;font-weight:700;
      line-height:1;color:var(--text);opacity:0.04;margin-bottom:1.25rem;
      letter-spacing:-0.04em;
    }
    .f-cell h3{
      font-family:var(--heading);font-size:1.05rem;font-weight:600;
      letter-spacing:-0.03em;margin:0 0 0.55rem;
    }
    .f-cell p{margin:0;color:var(--muted);font-size:0.9rem;line-height:1.7;}

    /* ═══ 5. HOW IT WORKS — Horizontal steps with line ═══ */
    .how{border-top:1px solid var(--border);}
    .how-steps{
      display:grid;grid-template-columns:1fr;gap:0;
      margin-top:3rem;position:relative;
    }
    @media(min-width:740px){
      .how-steps{grid-template-columns:repeat(3,1fr);gap:0;}
    }
    .how-step{
      position:relative;
      padding:0 clamp(1rem,2.5vw,2rem) 2rem;
      transition:transform 0.3s var(--ease);
    }
    .how-step:hover{transform:translateY(-3px);}
    /* Connecting line between steps (desktop) */
    @media(min-width:740px){
      .how-steps::before{
        content:'';position:absolute;top:18px;
        left:calc(100% / 6);right:calc(100% / 6);
        height:1px;background:var(--border);z-index:0;
      }
    }
    .how-step-num{
      display:flex;align-items:center;justify-content:center;
      width:36px;height:36px;border-radius:50%;
      border:1.5px solid var(--border);background:var(--card);
      font-family:var(--heading);font-size:0.82rem;font-weight:700;
      color:var(--text);margin-bottom:1.25rem;position:relative;z-index:1;
      box-shadow:0 2px 8px rgba(0,0,0,0.04);
    }
    .how-step h3{
      font-family:var(--heading);font-size:1.02rem;font-weight:600;
      letter-spacing:-0.03em;margin:0 0 0.45rem;
    }
    .how-step p{margin:0;color:var(--muted);font-size:0.9rem;line-height:1.7;}
    /* Mobile: vertical layout with border-left */
    @media(max-width:739px){
      .how-steps{padding-left:18px;border-left:1px solid var(--border);}
      .how-step{padding:0 0 2.5rem 1.75rem;}
      .how-step-num{position:absolute;left:-18px;top:0;}
      .how-step:hover{transform:translateX(4px);}
    }

    /* ═══ 6. FAQ — Progressive disclosure ═══ */
    .faq{border-top:1px solid var(--border);}
    .faq-list{margin-top:2.25rem;max-width:680px;display:flex;flex-direction:column;}
    .faq-item{border-bottom:1px solid var(--border);transition:background 0.25s;}
    .faq-item:first-child{border-top:1px solid var(--border);}
    .faq-item:hover{background:rgba(0,0,0,0.008);}
    .faq-item[open]{background:var(--card);}
    .faq-item summary{
      cursor:pointer;padding:1.2rem 0;font-weight:600;font-size:0.95rem;
      list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;
      transition:color 0.2s;letter-spacing:-0.01em;
    }
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary .chv{
      width:18px;height:18px;flex-shrink:0;stroke:var(--faint);fill:none;
      stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;
      transition:transform 0.35s var(--ease),stroke 0.3s;
    }
    .faq-item[open] summary .chv{transform:rotate(180deg);stroke:var(--text);}
    .faq-item[open] summary{color:var(--text);}
    .faq-item .ans{
      padding:0 0 1.3rem;color:var(--muted);font-size:0.9rem;line-height:1.75;
      max-width:56ch;
    }

    /* ═══ 7. CTA — Inverted dark card ═══ */
    .cta-section{padding:clamp(5rem,10vw,8rem) 0;text-align:center;}
    .cta-card{
      max-width:560px;margin:0 auto;
      padding:clamp(2.75rem,6vw,4rem) clamp(2rem,5vw,3rem);
      border-radius:var(--radius);
      background:var(--text);color:#fff;
      box-shadow:0 32px 64px -16px rgba(0,0,0,0.2);
      position:relative;overflow:hidden;
    }
    .cta-card h2{
      font-family:var(--heading);font-size:clamp(1.5rem,3.2vw,2rem);
      font-weight:700;letter-spacing:-0.04em;margin:0 0 0.55rem;position:relative;
    }
    .cta-card>p{
      margin:0 0 1.75rem;color:rgba(255,255,255,0.55);
      font-size:0.95rem;line-height:1.65;position:relative;
    }
    .cta-form{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;position:relative;}
    .cta-form input{
      flex:1 1 200px;min-width:0;padding:0.7rem 1rem;border-radius:8px;
      border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.07);
      color:#fff;font:inherit;font-size:0.88rem;outline:none;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .cta-form input::placeholder{color:rgba(255,255,255,0.3);}
    .cta-form input:focus{border-color:var(--highlight);box-shadow:0 0 0 3px rgba(59,130,246,0.2);}
    .cta-form .btn-primary{background:#fff;color:var(--text);}
    .cta-form .btn-primary:hover{background:rgba(255,255,255,0.88);}

    /* ═══ FOOTER ═══ */
    footer{
      padding:2.5rem 0;border-top:1px solid var(--border);
      color:var(--faint);font-size:0.82rem;text-align:center;position:relative;z-index:2;
    }

    ::selection{background:rgba(59,130,246,0.14);color:var(--text);}
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
    <!-- 1. TEXT-ONLY HERO -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-inner">
          <div class="hero-badge rv"><span class="dot"></span>%%FLOAT_CARD_TITLE%%</div>
          <h1 class="rv rv-d1">%%HERO_HEADLINE%%</h1>
          <p class="lead rv rv-d2">%%HERO_SUB%%</p>
          <div class="hero-ctas rv rv-d3">
            <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. PROBLEM — Left-aligned with vertical accent line -->
    <section id="problem" class="problem">
      <div class="wrap">
        <div class="problem-inner">
          <div class="problem-accent rv" aria-hidden="true"></div>
          <div class="problem-content">
            <p class="eyebrow rv">%%PROBLEM_EYEBROW%%</p>
            <h2 class="sec-title rv">%%PROBLEM_TITLE%%</h2>
            <p class="sec-body rv rv-d1">%%PROBLEM_BODY%%</p>
            <blockquote class="pullquote rv rv-d2">%%PROBLEM_QUOTE%%</blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. IMAGE SHOWCASE — Standalone section -->
    <section class="showcase" aria-label="Product preview">
      <div class="wrap-wide">
        <div class="showcase-frame rv">
          <div class="hero-visual">
            %%RAW_HERO_VISUAL%%
          </div>
        </div>
      </div>
    </section>

    <!-- 4. FEATURES — Swiss grid with 1px borders -->
    <section id="features" class="features">
      <div class="wrap">
        <p class="eyebrow rv">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title rv">%%BENEFITS_TITLE%%</h2>
        <div class="f-grid">
          <div class="f-cell rv rv-d1">
            <div class="f-num">01</div>
            <h3>%%FEATURE1_TITLE%%</h3>
            <p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="f-cell rv rv-d2">
            <div class="f-num">02</div>
            <h3>%%FEATURE2_TITLE%%</h3>
            <p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="f-cell rv rv-d3">
            <div class="f-num">03</div>
            <h3>%%FEATURE3_TITLE%%</h3>
            <p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. HOW IT WORKS — Horizontal steps with connecting line -->
    <section id="how" class="how">
      <div class="wrap">
        <p class="eyebrow rv">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title rv">%%HOW_TITLE%%</h2>
        <div class="how-steps">
          <div class="how-step rv rv-d1">
            <div class="how-step-num">1</div>
            <h3>%%HOW_STEP1_TITLE%%</h3>
            <p>%%HOW_STEP1_BODY%%</p>
          </div>
          <div class="how-step rv rv-d2">
            <div class="how-step-num">2</div>
            <h3>%%HOW_STEP2_TITLE%%</h3>
            <p>%%HOW_STEP2_BODY%%</p>
          </div>
          <div class="how-step rv rv-d3">
            <div class="how-step-num">3</div>
            <h3>%%HOW_STEP3_TITLE%%</h3>
            <p>%%HOW_STEP3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <hr class="divider">

    <!-- 6. FAQ — Progressive disclosure with details/summary -->
    <section id="faq" class="faq">
      <div class="wrap">
        <p class="eyebrow rv">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title rv">%%FAQ_TITLE%%</h2>
        <div class="faq-list">
          <details class="faq-item rv rv-d1">
            <summary><span>%%FAQ1_Q%%</span><svg class="chv" viewBox="0 0 18 18"><polyline points="4 6.5 9 11.5 14 6.5"/></svg></summary>
            <div class="ans">%%FAQ1_A%%</div>
          </details>
          <details class="faq-item rv rv-d2">
            <summary><span>%%FAQ2_Q%%</span><svg class="chv" viewBox="0 0 18 18"><polyline points="4 6.5 9 11.5 14 6.5"/></svg></summary>
            <div class="ans">%%FAQ2_A%%</div>
          </details>
          <details class="faq-item rv rv-d3">
            <summary><span>%%FAQ3_Q%%</span><svg class="chv" viewBox="0 0 18 18"><polyline points="4 6.5 9 11.5 14 6.5"/></svg></summary>
            <div class="ans">%%FAQ3_A%%</div>
          </details>
        </div>
      </div>
    </section>

    <!-- 7. CTA — Inverted dark card, centered -->
    <section id="cta" class="cta-section">
      <div class="wrap">
        <div class="cta-card rv">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <form class="cta-form" action="#" method="get" onsubmit="return false;">
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
    /* Mobile nav toggle */
    var h=document.querySelector("[data-tpl-nav]");
    if(h){
      var t=h.querySelector("[data-tpl-nav-toggle]");
      var m=h.querySelector("[data-tpl-nav-mobile]");
      if(t&&m){t.addEventListener("click",function(){m.classList.toggle("open");});}
      document.querySelectorAll('a[href^="#"]').forEach(function(a){
        a.addEventListener("click",function(){if(m&&m.classList.contains("open"))m.classList.remove("open");});
      });
    }
    /* Scroll reveal */
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("on");obs.unobserve(e.target);}});
    },{threshold:0.08,rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll(".rv").forEach(function(el){obs.observe(el);});
  })();
  </script>
</body>
</html>`;
