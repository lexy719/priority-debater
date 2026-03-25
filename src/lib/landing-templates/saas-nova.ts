/**
 * SaaS Nova — "Split Hero Dark" with Features-FIRST approach.
 * Dark bg #050507, violet/indigo accents, Inter font,
 * aurora orbs, dot grid, noise grain, spotlight mouse-follow,
 * animated gradient h1, shimmer hero image border,
 * bento feature grid, gradient connecting lines on steps.
 */
export const SAAS_NOVA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
  <style>
    @property --aurora-1{syntax:"<color>";initial-value:#7c3aed;inherits:false;}
    @property --aurora-2{syntax:"<color>";initial-value:#4f46e5;inherits:false;}
    @property --glow-opacity{syntax:"<number>";initial-value:0;inherits:false;}

    :root{
      --bg:#050507;--bg2:#0a0a0f;
      --surface:rgba(255,255,255,0.03);--surface-hover:rgba(255,255,255,0.06);
      --border:rgba(255,255,255,0.06);--border-hover:rgba(255,255,255,0.12);
      --text:rgba(255,255,255,0.93);--muted:rgba(255,255,255,0.55);--faint:rgba(255,255,255,0.3);
      --accent:#7c3aed;--accent2:#a78bfa;--accent3:#4f46e5;
      --radius:16px;--radius-lg:24px;--max:1120px;
      --ease:cubic-bezier(0.4,0,0.2,1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{
      font-family:Inter,system-ui,-apple-system,sans-serif;
      background:var(--bg);color:var(--text);font-size:1rem;line-height:1.6;
      -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden;
    }

    /* ═══ AURORA BACKGROUND ═══ */
    .aurora{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
    .aurora-orb{position:absolute;border-radius:50%;filter:blur(80px);animation:af 20s ease-in-out infinite;will-change:transform;}
    .aurora-orb:nth-child(1){width:600px;height:600px;top:-15%;left:-10%;background:radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%);animation-duration:22s;}
    .aurora-orb:nth-child(2){width:500px;height:500px;top:20%;right:-15%;background:radial-gradient(circle,rgba(79,70,229,0.2),transparent 70%);animation-duration:18s;animation-delay:-5s;}
    .aurora-orb:nth-child(3){width:450px;height:450px;bottom:-10%;left:30%;background:radial-gradient(circle,rgba(167,139,250,0.18),transparent 70%);animation-duration:25s;animation-delay:-10s;}
    .aurora-orb:nth-child(4){width:350px;height:350px;top:50%;left:60%;background:radial-gradient(circle,rgba(109,40,217,0.15),transparent 70%);animation-duration:30s;animation-delay:-15s;}
    @keyframes af{0%,100%{transform:translate(0,0) scale(1);}25%{transform:translate(60px,-40px) scale(1.1);}50%{transform:translate(-30px,50px) scale(0.95);}75%{transform:translate(40px,20px) scale(1.05);}}

    /* Noise grain */
    .noise{pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.03;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
    /* Dot grid */
    .dot-grid{pointer-events:none;position:fixed;inset:0;z-index:0;opacity:0.025;background-image:radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px);background-size:32px 32px;}

    /* ═══ SCROLL REVEAL ═══ */
    .reveal{opacity:0;transform:translateY(36px);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease);}
    .reveal.visible{opacity:1;transform:translateY(0);}
    .reveal-d1{transition-delay:0.1s;}.reveal-d2{transition-delay:0.2s;}.reveal-d3{transition-delay:0.3s;}.reveal-d4{transition-delay:0.4s;}
    .reveal-scale{opacity:0;transform:scale(0.95);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease);}
    .reveal-scale.visible{opacity:1;transform:scale(1);}

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.5rem);position:relative;z-index:2;}

    /* ═══ HEADER ═══ */
    header{position:sticky;top:0;z-index:50;border-bottom:1px solid var(--border);background:rgba(5,5,7,0.8);backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);}
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{font-weight:700;font-size:1.15rem;letter-spacing:-0.04em;color:var(--text);text-decoration:none;transition:opacity 0.2s;}
    .logo:hover{opacity:0.7;}
    .nav-links{display:none;gap:2rem;align-items:center;}
    @media(min-width:900px){.nav-links{display:flex;}}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.85rem;font-weight:500;transition:color 0.2s;}
    .nav-links a:hover{color:var(--text);}
    .nav-cta{
      padding:0.5rem 1.15rem;border-radius:10px;font-weight:600;font-size:0.85rem;
      text-decoration:none;color:#fff;
      background:linear-gradient(135deg,var(--accent),var(--accent3));
      box-shadow:0 4px 20px rgba(124,58,237,0.3);transition:all 0.25s var(--ease);
    }
    .nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 32px rgba(124,58,237,0.4);}
    .nav-toggle{display:flex;padding:0.45rem 0.8rem;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);cursor:pointer;font-size:0.85rem;font-family:inherit;transition:background 0.2s;}
    .nav-toggle:hover{background:var(--surface-hover);}
    @media(min-width:900px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.75rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;padding:0.35rem 0;transition:color 0.2s;}
    .nav-mobile a:hover{color:var(--text);}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:0.4rem;padding:0.75rem 1.5rem;border-radius:12px;font-weight:600;font-size:0.9rem;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:all 0.25s var(--ease);position:relative;overflow:hidden;}
    .btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;box-shadow:0 6px 28px rgba(124,58,237,0.3);}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(124,58,237,0.4);}
    .btn-ghost{background:transparent;border:1.5px solid var(--border-hover);color:var(--text);}
    .btn-ghost:hover{background:var(--surface);border-color:rgba(255,255,255,0.2);transform:translateY(-1px);}

    /* ═══ HERO — Split 50/50 ═══ */
    .hero{padding:clamp(4rem,10vw,7rem) 0 clamp(3rem,6vw,5rem);position:relative;z-index:2;}
    .hero-split{display:grid;gap:3rem;align-items:center;}
    @media(min-width:800px){.hero-split{grid-template-columns:1fr 1fr;gap:clamp(2rem,5vw,4rem);}}
    .hero-text{position:relative;}

    /* Floating tag pill */
    .hero-pill{
      display:inline-flex;align-items:center;gap:0.45rem;padding:0.35rem 0.9rem;
      border-radius:999px;border:1px solid rgba(124,58,237,0.25);
      background:rgba(124,58,237,0.08);font-size:0.75rem;font-weight:600;
      color:var(--accent2);margin-bottom:1.5rem;letter-spacing:0.02em;
    }
    .hero-pill .dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse 2s ease-in-out infinite;}
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}

    /* Animated gradient h1 */
    .hero h1{
      font-size:clamp(2.4rem,6vw,3.8rem);font-weight:800;line-height:1.06;
      letter-spacing:-0.04em;margin:0 0 1.25rem;
      background:linear-gradient(135deg,#fff 0%,var(--accent2) 40%,var(--accent) 60%,#fff 100%);
      background-size:300% 300%;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      animation:gradText 6s ease infinite;
    }
    @keyframes gradText{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}

    .hero .lead{color:var(--muted);font-size:clamp(1rem,2vw,1.15rem);line-height:1.7;margin:0 0 2rem;max-width:42ch;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.75rem;}

    /* Hero image with shimmer border */
    .hero-img-wrap{position:relative;border-radius:var(--radius-lg);padding:3px;}
    .hero-img-wrap::before{
      content:'';position:absolute;inset:-1px;border-radius:inherit;z-index:0;
      background:conic-gradient(from 0deg,var(--accent),var(--accent3),var(--accent2),transparent,var(--accent));
      animation:shimmer 4s linear infinite;
    }
    @keyframes shimmer{0%{filter:hue-rotate(0deg);}100%{filter:hue-rotate(360deg);}}
    .hero-img-inner{position:relative;z-index:1;border-radius:calc(var(--radius-lg) - 2px);overflow:hidden;background:var(--bg2);}
    .hero-visual{width:100%;border-radius:calc(var(--radius-lg) - 2px);overflow:hidden;}
    .hero-visual img{width:100%;display:block;object-fit:cover;max-height:480px;}
    .photo-credit{font-size:0.68rem;color:var(--faint);padding:0.4rem 0.75rem;background:rgba(0,0,0,0.5);}
    .photo-credit a{color:var(--muted);}

    /* ═══ SECTIONS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .eyebrow{font-size:0.72rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent2);margin:0 0 0.75rem;display:inline-block;}
    .sec-title{font-size:clamp(2rem,4.5vw,3rem);font-weight:800;letter-spacing:-0.04em;line-height:1.08;margin:0 0 1.25rem;}

    /* ═══ FEATURES — Bento Grid (immediately after hero) ═══ */
    .features-section{padding-top:clamp(2rem,4vw,3rem);}
    .bento{display:grid;gap:1rem;margin-top:2.5rem;}
    @media(min-width:640px){.bento{grid-template-columns:repeat(2,1fr);}}
    .bento-card{
      padding:2rem 1.75rem;border-radius:var(--radius);
      background:var(--surface);border:1px solid var(--border);
      position:relative;overflow:hidden;
      transition:border-color 0.3s,transform 0.3s,box-shadow 0.3s;
    }
    .bento-card:hover{border-color:var(--border-hover);transform:translateY(-4px);box-shadow:0 20px 60px -20px rgba(124,58,237,0.15);}
    /* Spotlight mouse-follow glow — positioned by JS */
    .bento-card .spotlight{
      pointer-events:none;position:absolute;width:300px;height:300px;border-radius:50%;
      background:radial-gradient(circle,rgba(124,58,237,0.12),transparent 70%);
      transform:translate(-50%,-50%);opacity:0;transition:opacity 0.3s;z-index:0;
    }
    .bento-card:hover .spotlight{opacity:1;}
    .bento-card>*:not(.spotlight){position:relative;z-index:1;}
    /* Card 1 spans 2 cols on desktop */
    .bento-card.span2{grid-column:1/-1;}
    @media(min-width:640px){.bento-card.span2{grid-column:span 2;}}
    .bento-card h3{font-size:1.15rem;font-weight:700;letter-spacing:-0.02em;margin:0 0 0.5rem;}
    .bento-card p{color:var(--muted);font-size:0.92rem;line-height:1.65;margin:0;max-width:52ch;}
    .bento-card .card-icon{
      width:40px;height:40px;border-radius:10px;
      background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.1));
      display:flex;align-items:center;justify-content:center;margin-bottom:1.25rem;
      font-size:1.1rem;
    }

    /* ═══ PROBLEM — Full-width dark band ═══ */
    .problem-band{
      background:linear-gradient(180deg,var(--bg2) 0%,rgba(124,58,237,0.04) 50%,var(--bg2) 100%);
      border-top:1px solid var(--border);border-bottom:1px solid var(--border);
    }
    .problem-inner{max-width:720px;margin:0 auto;text-align:center;}
    .problem-body{color:var(--muted);font-size:1.05rem;line-height:1.8;margin:0 0 2rem;}
    .pullquote{
      padding:1.75rem 2rem;border-radius:var(--radius);border-left:3px solid var(--accent);
      background:rgba(255,255,255,0.02);color:var(--text);
      font-style:italic;font-size:1.08rem;line-height:1.65;text-align:left;
      box-shadow:0 16px 48px -16px rgba(0,0,0,0.4);
    }

    /* ═══ HOW IT WORKS — Horizontal step cards with connecting lines ═══ */
    .how-grid{display:grid;gap:1.5rem;margin-top:2.5rem;position:relative;}
    @media(min-width:700px){
      .how-grid{grid-template-columns:repeat(3,1fr);gap:2rem;}
    }
    /* Gradient connecting lines */
    .how-grid::before,.how-grid::after{
      content:'';display:none;position:absolute;top:48px;height:2px;
      background:linear-gradient(90deg,var(--accent),var(--accent3));opacity:0.3;
      pointer-events:none;z-index:0;
    }
    @media(min-width:700px){
      .how-grid::before{display:block;left:calc(33.33% + 12px);width:calc(33.33% - 56px);}
      .how-grid::after{display:block;left:calc(66.66% + 12px);width:calc(33.33% - 56px);}
    }
    .step-card{
      padding:2rem 1.75rem;border-radius:var(--radius);
      background:var(--surface);border:1px solid var(--border);
      position:relative;z-index:1;
      transition:border-color 0.3s,transform 0.3s;
    }
    .step-card:hover{border-color:var(--border-hover);transform:translateY(-3px);}
    .step-num{
      width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:0.85rem;margin-bottom:1.25rem;
      background:linear-gradient(135deg,var(--accent),var(--accent3));color:#fff;
    }
    .step-card h3{font-size:1.05rem;font-weight:700;letter-spacing:-0.02em;margin:0 0 0.5rem;}
    .step-card p{color:var(--muted);font-size:0.9rem;line-height:1.65;margin:0;}

    /* ═══ FAQ — Accordion ═══ */
    .faq-container{max-width:680px;margin:2.25rem auto 0;}
    .faq-item{border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);overflow:hidden;margin-bottom:0.6rem;transition:border-color 0.3s;}
    .faq-item:hover{border-color:var(--border-hover);}
    .faq-item[open]{border-color:rgba(124,58,237,0.25);}
    .faq-item summary{cursor:pointer;padding:1.15rem 1.5rem;font-weight:600;font-size:0.95rem;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;user-select:none;transition:color 0.2s;}
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary .chevron{flex-shrink:0;width:20px;height:20px;stroke:var(--muted);fill:none;stroke-width:2;transition:transform 0.3s var(--ease);}
    .faq-item[open] summary .chevron{transform:rotate(180deg);}
    .faq-item[open] summary{color:var(--accent2);border-bottom:1px solid var(--border);}
    .faq-item .ans{padding:1rem 1.5rem 1.25rem;color:var(--muted);font-size:0.92rem;line-height:1.7;}

    /* ═══ CTA FINAL — Rotating gradient border card ═══ */
    .cta-final{padding:clamp(4rem,10vw,7rem) 0;text-align:center;}
    .cta-card{
      max-width:620px;margin:0 auto;padding:3px;border-radius:var(--radius-lg);position:relative;
      background:conic-gradient(from 0deg,var(--accent),var(--accent3),var(--accent2),transparent,var(--accent));
      animation:shimmer 5s linear infinite;
    }
    .cta-inner{
      background:var(--bg2);border-radius:calc(var(--radius-lg) - 2px);
      padding:clamp(2.5rem,6vw,4rem) clamp(1.75rem,4vw,3rem);
    }
    .cta-inner h2{font-size:clamp(1.6rem,3.5vw,2.3rem);font-weight:800;letter-spacing:-0.04em;margin:0 0 0.6rem;}
    .cta-inner .cta-sub{margin:0 0 1.5rem;color:var(--muted);font-size:0.95rem;line-height:1.6;}
    .cta-inner .float-label{margin:0 0 0.75rem;font-size:0.82rem;font-weight:500;color:var(--faint);}
    .email-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;max-width:420px;margin:0 auto;}
    .email-row input{
      flex:1 1 200px;min-width:0;padding:0.75rem 1rem;border-radius:12px;
      border:1px solid var(--border);background:rgba(255,255,255,0.04);color:var(--text);
      font:inherit;font-size:0.9rem;outline:none;transition:border-color 0.3s,box-shadow 0.3s;
    }
    .email-row input::placeholder{color:var(--faint);}
    .email-row input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,58,237,0.15);}

    /* ═══ FOOTER ═══ */
    footer{padding:2.5rem 0;border-top:1px solid var(--border);color:var(--faint);font-size:0.82rem;text-align:center;position:relative;z-index:2;}

    /* ═══ UTILITIES ═══ */
    ::selection{background:rgba(124,58,237,0.3);color:#fff;}
    :focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
  </style>
</head>
<body>
  <div class="aurora" aria-hidden="true"><div class="aurora-orb"></div><div class="aurora-orb"></div><div class="aurora-orb"></div><div class="aurora-orb"></div></div>
  <div class="dot-grid" aria-hidden="true"></div>
  <div class="noise" aria-hidden="true"></div>

  <!-- Header -->
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
    <!-- Hero — Split 50/50 -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-split">
          <div class="hero-text">
            <div class="hero-pill reveal"><span class="dot"></span> %%FLOAT_CARD_TITLE%%</div>
            <h1 class="reveal reveal-d1">%%HERO_HEADLINE%%</h1>
            <p class="lead reveal reveal-d2">%%HERO_SUB%%</p>
            <div class="hero-ctas reveal reveal-d3">
              <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
              <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
            </div>
          </div>
          <div class="hero-img-wrap reveal-scale reveal-d2">
            <div class="hero-img-inner">
              %%RAW_HERO_VISUAL%%
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features — Bento Grid (immediately after hero) -->
    <section id="features" class="features-section">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;max-width:20ch;">%%BENEFITS_TITLE%%</h2>
      </div>
      <div class="wrap">
        <div class="bento">
          <div class="bento-card span2 reveal reveal-d1">
            <div class="spotlight"></div>
            <div class="card-icon">&#9889;</div>
            <h3>%%FEATURE1_TITLE%%</h3>
            <p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="bento-card reveal reveal-d2">
            <div class="spotlight"></div>
            <div class="card-icon">&#10024;</div>
            <h3>%%FEATURE2_TITLE%%</h3>
            <p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="bento-card reveal reveal-d3">
            <div class="spotlight"></div>
            <div class="card-icon">&#128640;</div>
            <h3>%%FEATURE3_TITLE%%</h3>
            <p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem — Full-width dark band -->
    <section id="problem" class="problem-band">
      <div class="wrap">
        <div class="problem-inner">
          <p class="eyebrow reveal">%%PROBLEM_EYEBROW%%</p>
          <h2 class="sec-title reveal">%%PROBLEM_TITLE%%</h2>
          <p class="problem-body reveal reveal-d1">%%PROBLEM_BODY%%</p>
          <blockquote class="pullquote reveal reveal-d2">%%PROBLEM_QUOTE%%</blockquote>
        </div>
      </div>
    </section>

    <!-- How It Works — Horizontal steps with connecting lines -->
    <section id="how">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap">
        <div class="how-grid">
          <div class="step-card reveal reveal-d1">
            <div class="step-num">1</div>
            <h3>%%HOW_STEP1_TITLE%%</h3>
            <p>%%HOW_STEP1_BODY%%</p>
          </div>
          <div class="step-card reveal reveal-d2">
            <div class="step-num">2</div>
            <h3>%%HOW_STEP2_TITLE%%</h3>
            <p>%%HOW_STEP2_BODY%%</p>
          </div>
          <div class="step-card reveal reveal-d3">
            <div class="step-num">3</div>
            <h3>%%HOW_STEP3_TITLE%%</h3>
            <p>%%HOW_STEP3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;">%%FAQ_TITLE%%</h2>
      </div>
      <div class="faq-container">
        <details class="faq-item reveal reveal-d1">
          <summary><span>%%FAQ1_Q%%</span><svg class="chevron" viewBox="0 0 20 20"><polyline points="5 8 10 13 15 8"/></svg></summary>
          <div class="ans">%%FAQ1_A%%</div>
        </details>
        <details class="faq-item reveal reveal-d2">
          <summary><span>%%FAQ2_Q%%</span><svg class="chevron" viewBox="0 0 20 20"><polyline points="5 8 10 13 15 8"/></svg></summary>
          <div class="ans">%%FAQ2_A%%</div>
        </details>
        <details class="faq-item reveal reveal-d3">
          <summary><span>%%FAQ3_Q%%</span><svg class="chevron" viewBox="0 0 20 20"><polyline points="5 8 10 13 15 8"/></svg></summary>
          <div class="ans">%%FAQ3_A%%</div>
        </details>
      </div>
    </section>

    <!-- CTA Final — Rotating gradient border -->
    <section id="cta" class="cta-final">
      <div class="wrap">
        <div class="cta-card reveal-scale">
          <div class="cta-inner">
            <h2>%%CTA_FINAL_TITLE%%</h2>
            <p class="cta-sub">%%CTA_FINAL_SUB%%</p>
            <p class="float-label">%%FLOAT_CARD_TITLE%%</p>
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
    /* Mobile nav */
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
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("visible");obs.unobserve(e.target);}});
    },{threshold:0.08,rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll(".reveal,.reveal-scale").forEach(function(el){obs.observe(el);});
    /* Spotlight mouse-follow on bento cards */
    document.querySelectorAll(".bento-card").forEach(function(card){
      card.addEventListener("mousemove",function(e){
        var r=card.getBoundingClientRect();
        var s=card.querySelector(".spotlight");
        if(s){s.style.left=(e.clientX-r.left)+"px";s.style.top=(e.clientY-r.top)+"px";}
      });
    });
  })();
  </script>
</body>
</html>`;
