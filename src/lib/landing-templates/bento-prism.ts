/**
 * Bento Prism — "Mega Dashboard Grid" cyberpunk layout.
 * The entire above-the-fold is a 6-column bento grid mixing hero text,
 * hero image, stat cards, and feature previews. Radically different from
 * saas-nova (split hero) and editorial-aurora (full-bleed hero).
 *
 * Section order: Mega Bento Hero → How-It-Works Timeline → Features →
 * Problem Cinematic Band → FAQ Accordion → CTA Floating Card.
 *
 * Cyberpunk dark theme, neon cyan/violet/emerald, glassmorphism,
 * animated gradient borders, matrix dot grid, scanning line,
 * mouse-follow spotlight, IntersectionObserver scroll reveals.
 */
export const BENTO_PRISM_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <style>
    @property --beam-pos{syntax:"<percentage>";initial-value:0%;inherits:false}
    @property --glow-angle{syntax:"<angle>";initial-value:0deg;inherits:false}

    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --bg:#030712;--bg2:#070b17;
      --glass:rgba(255,255,255,0.04);--glass-hover:rgba(255,255,255,0.07);
      --glass-border:rgba(255,255,255,0.08);--glass-border-hover:rgba(255,255,255,0.16);
      --text:rgba(255,255,255,0.94);--muted:rgba(255,255,255,0.55);--faint:rgba(255,255,255,0.28);
      --cyan:#22d3ee;--cyan-dim:rgba(34,211,238,0.12);--cyan-glow:rgba(34,211,238,0.35);
      --violet:#a78bfa;--violet-dim:rgba(167,139,250,0.12);--violet-glow:rgba(167,139,250,0.35);
      --emerald:#34d399;--emerald-dim:rgba(52,211,153,0.12);--emerald-glow:rgba(52,211,153,0.35);
      --radius:12px;--radius-lg:20px;
      --font:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
    }
    html{scroll-behavior:smooth;background:var(--bg);color:var(--text);font-family:var(--font);}
    body{background:var(--bg);min-height:100vh;overflow-x:hidden;position:relative;}
    img{max-width:100%;display:block;}
    a{color:inherit;text-decoration:none;}

    /* ---- Matrix dot grid background ---- */
    body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;
      background-image:radial-gradient(rgba(255,255,255,0.06) 1px,transparent 1px);
      background-size:28px 28px;}

    /* ---- Scanning line ---- */
    body::after{content:'';position:fixed;top:0;left:0;right:0;height:1px;z-index:9999;pointer-events:none;
      background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:0.35;
      animation:scanline 8s linear infinite;}
    @keyframes scanline{0%{top:-1px}100%{top:100vh}}

    /* ---- Mouse spotlight (set via JS) ---- */
    .spotlight{position:fixed;width:600px;height:600px;border-radius:50%;pointer-events:none;z-index:1;
      background:radial-gradient(circle,rgba(34,211,238,0.06) 0%,transparent 70%);
      transform:translate(-50%,-50%);transition:left 0.3s ease,top 0.3s ease;will-change:left,top;}

    /* ---- Wrap ---- */
    .wrap{max-width:1200px;margin:0 auto;padding:0 1.5rem;position:relative;z-index:2;}

    /* ---- Scroll reveal ---- */
    .rv{opacity:0;transform:translateY(28px);transition:opacity 0.7s cubic-bezier(.22,1,.36,1),transform 0.7s cubic-bezier(.22,1,.36,1);}
    .rv.vis{opacity:1;transform:none;}
    .rv-d1{transition-delay:0.1s}.rv-d2{transition-delay:0.2s}.rv-d3{transition-delay:0.3s}.rv-d4{transition-delay:0.4s}.rv-d5{transition-delay:0.5s}

    /* ---- Header ---- */
    header{position:sticky;top:0;z-index:100;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
      background:rgba(3,7,18,0.75);border-bottom:1px solid var(--glass-border);}
    .hdr-inner{display:flex;align-items:center;justify-content:space-between;height:60px;}
    .logo{font-weight:800;font-size:1.15rem;letter-spacing:-0.02em;
      background:linear-gradient(135deg,var(--cyan),var(--violet));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .nav-desk{display:flex;gap:1.75rem;align-items:center;}
    .nav-desk a{font-size:0.82rem;font-weight:500;color:var(--muted);transition:color 0.2s;}
    .nav-desk a:hover{color:var(--text);}
    .nav-cta{padding:0.4rem 1rem;border-radius:8px;font-weight:600;font-size:0.8rem;
      background:linear-gradient(135deg,var(--cyan),var(--violet));color:#030712 !important;transition:opacity 0.2s;}
    .nav-cta:hover{opacity:0.85;}
    .nav-toggle{display:none;background:none;border:none;color:var(--text);font-size:0.85rem;font-weight:600;cursor:pointer;font-family:var(--font);}
    .nav-mobile{display:none;flex-direction:column;gap:0.75rem;padding:1rem 0 1.25rem;
      border-bottom:1px solid var(--glass-border);}
    .nav-mobile a{font-size:0.9rem;color:var(--muted);font-weight:500;}
    .nav-mobile a:hover{color:var(--text);}
    .nav-mobile.open{display:flex;}
    @media(max-width:768px){.nav-desk{display:none;}.nav-toggle{display:block;}}

    /* ---- Eyebrow ---- */
    .eyebrow{display:flex;align-items:center;gap:0.5rem;font-size:0.75rem;font-weight:700;text-transform:uppercase;
      letter-spacing:0.12em;color:var(--cyan);margin-bottom:0.75rem;}
    .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan-glow);animation:pulse-dot 2s ease infinite;}
    @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.6)}}

    /* ---- Section title ---- */
    .sec-title{font-size:clamp(1.5rem,3.5vw,2.4rem);font-weight:800;letter-spacing:-0.03em;line-height:1.15;max-width:600px;margin-bottom:1rem;}

    /* ============================================
       1. MEGA BENTO HERO — 6 column dashboard grid
       ============================================ */
    .mega-hero{padding:5rem 0 3rem;position:relative;}
    .bento-grid{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:auto auto auto;gap:1rem;}

    .bento-cell{background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-lg);
      padding:1.5rem;position:relative;overflow:hidden;transition:border-color 0.3s,background 0.3s,box-shadow 0.3s;}
    .bento-cell:hover{border-color:var(--glass-border-hover);background:var(--glass-hover);
      box-shadow:0 0 40px rgba(34,211,238,0.04);}

    /* Grid placement */
    .cell-headline{grid-column:1/5;grid-row:1/2;display:flex;flex-direction:column;justify-content:center;padding:2.5rem;}
    .cell-hero-img{grid-column:5/7;grid-row:1/3;padding:0;}
    .cell-stat{grid-column:1/3;grid-row:2/3;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;}
    .cell-feature-peek{grid-column:3/5;grid-row:2/3;}
    .cell-cta-area{grid-column:1/7;grid-row:3/4;display:flex;align-items:center;gap:1rem;padding:1.25rem 2rem;
      background:linear-gradient(135deg,rgba(34,211,238,0.06),rgba(167,139,250,0.06));
      border:1px solid rgba(34,211,238,0.15);}

    .cell-headline h1{font-size:clamp(1.8rem,4.5vw,3.4rem);font-weight:800;letter-spacing:-0.04em;line-height:1.08;
      background:linear-gradient(135deg,#fff 40%,var(--cyan) 70%,var(--violet));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .cell-headline .lead{font-size:clamp(0.95rem,1.4vw,1.15rem);color:var(--muted);line-height:1.6;margin-top:1rem;max-width:520px;}

    /* Hero image cell */
    .cell-hero-img .hero-visual{width:100%;height:100%;min-height:280px;overflow:hidden;border-radius:calc(var(--radius-lg) - 1px);}
    .cell-hero-img .hero-visual img{width:100%;height:100%;object-fit:cover;}
    .photo-credit{position:absolute;bottom:0;left:0;right:0;font-size:0.65rem;color:var(--faint);
      padding:0.4rem 0.75rem;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);}
    .photo-credit a{color:var(--muted);text-decoration:underline;text-underline-offset:2px;}

    /* Stat card */
    .cell-stat .stat-num{font-size:clamp(2.2rem,4vw,3.5rem);font-weight:800;
      background:linear-gradient(135deg,var(--emerald),var(--cyan));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .cell-stat .stat-label{font-size:0.82rem;color:var(--muted);margin-top:0.25rem;font-weight:500;}
    .cell-stat .stat-bar{width:80%;max-width:160px;height:4px;border-radius:4px;background:rgba(255,255,255,0.08);margin-top:0.75rem;overflow:hidden;}
    .cell-stat .stat-bar-fill{height:100%;width:78%;border-radius:4px;
      background:linear-gradient(90deg,var(--emerald),var(--cyan));animation:bar-fill 2s ease forwards;}
    @keyframes bar-fill{from{width:0}to{width:78%}}

    /* Feature peek */
    .cell-feature-peek{display:flex;flex-direction:column;gap:0.6rem;}
    .peek-item{display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0.75rem;border-radius:var(--radius);
      background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);transition:border-color 0.2s;}
    .peek-item:hover{border-color:var(--cyan-dim);}
    .peek-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
    .peek-dot.c{background:var(--cyan);box-shadow:0 0 10px var(--cyan-glow);}
    .peek-dot.v{background:var(--violet);box-shadow:0 0 10px var(--violet-glow);}
    .peek-dot.e{background:var(--emerald);box-shadow:0 0 10px var(--emerald-glow);}
    .peek-text{font-size:0.82rem;font-weight:600;color:var(--text);}

    /* CTA area */
    .cell-cta-area .hero-tag{display:flex;align-items:center;gap:0.5rem;font-size:0.72rem;font-weight:700;
      text-transform:uppercase;letter-spacing:0.1em;color:var(--cyan);flex-shrink:0;}
    .hero-tag .pulse{width:6px;height:6px;border-radius:50%;background:var(--cyan);animation:pulse-dot 2s ease infinite;}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.65rem 1.5rem;border-radius:10px;
      font-size:0.88rem;font-weight:700;cursor:pointer;transition:all 0.25s;border:none;font-family:var(--font);}
    .btn-primary{background:linear-gradient(135deg,var(--cyan),var(--violet));color:#030712;box-shadow:0 0 24px var(--cyan-dim);}
    .btn-primary:hover{box-shadow:0 0 40px var(--cyan-glow);transform:translateY(-1px);}
    .btn-ghost{background:transparent;border:1px solid var(--glass-border);color:var(--text);}
    .btn-ghost:hover{border-color:var(--cyan);color:var(--cyan);}
    .cell-cta-area .cta-btns{display:flex;gap:0.75rem;margin-left:auto;}

    @media(max-width:900px){
      .bento-grid{grid-template-columns:1fr 1fr;grid-template-rows:auto;}
      .cell-headline{grid-column:1/-1;grid-row:auto;}
      .cell-hero-img{grid-column:1/-1;grid-row:auto;min-height:220px;}
      .cell-stat{grid-column:1/2;grid-row:auto;}
      .cell-feature-peek{grid-column:2/3;grid-row:auto;}
      .cell-cta-area{grid-column:1/-1;grid-row:auto;flex-wrap:wrap;}
      .cell-cta-area .cta-btns{margin-left:0;}
    }
    @media(max-width:520px){
      .bento-grid{grid-template-columns:1fr;}
      .cell-stat,.cell-feature-peek{grid-column:1/-1;}
    }

    /* ============================================
       2. HOW IT WORKS — Timeline with beam line
       ============================================ */
    .how-sec{padding:5rem 0;position:relative;}
    .timeline{display:flex;gap:0;position:relative;margin-top:2.5rem;}
    .timeline::before{content:'';position:absolute;top:38px;left:0;right:0;height:2px;
      background:linear-gradient(90deg,var(--cyan-dim),var(--violet-dim),var(--emerald-dim));border-radius:2px;}
    .timeline::after{content:'';position:absolute;top:37px;left:0;height:4px;width:60px;border-radius:4px;
      background:linear-gradient(90deg,var(--cyan),var(--violet));
      box-shadow:0 0 20px var(--cyan-glow),0 0 40px var(--violet-glow);
      animation:beam-slide 4s ease-in-out infinite;}
    @keyframes beam-slide{0%{left:0}50%{left:calc(100% - 60px)}100%{left:0}}

    .tl-step{flex:1;text-align:center;padding:0 1rem;position:relative;}
    .tl-num{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:0.85rem;font-weight:800;margin:0 auto 1.25rem;position:relative;z-index:2;
      background:var(--bg);border:2px solid var(--glass-border);}
    .tl-step:nth-child(1) .tl-num{border-color:var(--cyan);color:var(--cyan);box-shadow:0 0 16px var(--cyan-dim);}
    .tl-step:nth-child(2) .tl-num{border-color:var(--violet);color:var(--violet);box-shadow:0 0 16px var(--violet-dim);}
    .tl-step:nth-child(3) .tl-num{border-color:var(--emerald);color:var(--emerald);box-shadow:0 0 16px var(--emerald-dim);}
    .tl-step h3{font-size:1rem;font-weight:700;margin-bottom:0.4rem;}
    .tl-step p{font-size:0.85rem;color:var(--muted);line-height:1.55;}
    @media(max-width:640px){.timeline{flex-direction:column;gap:2rem;}
      .timeline::before,.timeline::after{display:none;}
      .tl-step{text-align:left;display:flex;gap:1rem;align-items:flex-start;padding:0;}
      .tl-num{margin:0;flex-shrink:0;}}

    /* ============================================
       3. FEATURES — Glassmorphism gradient borders
       ============================================ */
    .feat-sec{padding:5rem 0;}
    .feat-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem;margin-top:2.5rem;}
    .feat-card{position:relative;border-radius:var(--radius-lg);padding:2px;
      background:conic-gradient(from var(--glow-angle),var(--cyan),var(--violet),var(--emerald),var(--cyan));
      animation:rotate-border 6s linear infinite;}
    @keyframes rotate-border{to{--glow-angle:360deg}}
    .feat-card-inner{background:rgba(7,11,23,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      border-radius:calc(var(--radius-lg) - 2px);padding:2rem 1.5rem;height:100%;
      display:flex;flex-direction:column;gap:0.6rem;}
    .feat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;}
    .feat-icon.ic1{background:var(--cyan-dim);color:var(--cyan);}
    .feat-icon.ic2{background:var(--violet-dim);color:var(--violet);}
    .feat-icon.ic3{background:var(--emerald-dim);color:var(--emerald);}
    .feat-card-inner h3{font-size:1.05rem;font-weight:700;}
    .feat-card-inner p{font-size:0.85rem;color:var(--muted);line-height:1.6;}
    @media(max-width:720px){.feat-cards{grid-template-columns:1fr;}}

    /* ============================================
       4. PROBLEM — Cinematic dark band pull quote
       ============================================ */
    .prob-sec{padding:5rem 0;position:relative;overflow:hidden;
      background:linear-gradient(180deg,var(--bg) 0%,rgba(10,5,28,0.9) 30%,rgba(10,5,28,0.9) 70%,var(--bg) 100%);}
    .prob-sec::before{content:'';position:absolute;inset:0;
      background:radial-gradient(ellipse 80% 50% at 50% 50%,rgba(167,139,250,0.08),transparent);pointer-events:none;}
    .prob-inner{max-width:760px;margin:0 auto;text-align:center;}
    .prob-body{font-size:1rem;color:var(--muted);line-height:1.7;margin-bottom:2rem;}
    .pullquote{font-size:clamp(1.2rem,2.5vw,1.8rem);font-weight:700;font-style:italic;line-height:1.35;
      color:var(--text);position:relative;padding:1.5rem 2rem;
      border-left:3px solid var(--violet);
      background:linear-gradient(135deg,rgba(167,139,250,0.06),transparent);border-radius:0 var(--radius) var(--radius) 0;}

    /* ============================================
       5. FAQ — Accordion with neon glow
       ============================================ */
    .faq-sec{padding:5rem 0;}
    .faq-list{max-width:700px;margin:2rem auto 0;display:flex;flex-direction:column;gap:0.75rem;}
    .faq-item{border:1px solid var(--glass-border);border-radius:var(--radius);overflow:hidden;transition:border-color 0.3s,box-shadow 0.3s;}
    .faq-item.open{border-color:var(--cyan);box-shadow:0 0 24px var(--cyan-dim);}
    .faq-q{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;cursor:pointer;
      font-weight:600;font-size:0.92rem;background:var(--glass);transition:background 0.2s;user-select:none;}
    .faq-q:hover{background:var(--glass-hover);}
    .faq-q .chevron{font-size:0.75rem;color:var(--muted);transition:transform 0.3s;}
    .faq-item.open .faq-q .chevron{transform:rotate(180deg);color:var(--cyan);}
    .faq-a{max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(.22,1,.36,1),padding 0.3s;}
    .faq-item.open .faq-a{max-height:300px;padding:0 1.25rem 1.25rem;}
    .faq-a p{font-size:0.85rem;color:var(--muted);line-height:1.65;}

    /* ============================================
       6. CTA — Floating glass card + border beam
       ============================================ */
    .cta-sec{padding:5rem 0 4rem;}
    .cta-card{max-width:600px;margin:0 auto;position:relative;border-radius:var(--radius-lg);padding:2px;
      background:conic-gradient(from var(--glow-angle),var(--cyan),var(--violet),var(--emerald),var(--cyan));
      animation:rotate-border 5s linear infinite;}
    .cta-card-inner{background:rgba(7,11,23,0.95);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
      border-radius:calc(var(--radius-lg) - 2px);padding:3rem 2.5rem;text-align:center;}
    .cta-card-inner h2{font-size:clamp(1.4rem,3vw,2rem);font-weight:800;letter-spacing:-0.03em;margin-bottom:0.6rem;
      background:linear-gradient(135deg,#fff,var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .cta-card-inner>p{color:var(--muted);font-size:0.92rem;margin-bottom:0.5rem;}
    .cta-label{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--violet);margin-bottom:1.25rem;}
    .cta-form{display:flex;gap:0.5rem;max-width:400px;margin:0 auto;}
    .cta-form input{flex:1;padding:0.7rem 1rem;border-radius:10px;border:1px solid var(--glass-border);
      background:var(--glass);color:var(--text);font-size:0.88rem;font-family:var(--font);outline:none;transition:border-color 0.2s;}
    .cta-form input:focus{border-color:var(--cyan);}
    .cta-form button{flex-shrink:0;}

    /* ---- Footer ---- */
    footer{border-top:1px solid var(--glass-border);padding:1.5rem 0;text-align:center;
      font-size:0.75rem;color:var(--faint);position:relative;z-index:2;}

    /* ---- Ambient orbs ---- */
    .orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;opacity:0.35;z-index:0;}
    .orb-c{width:500px;height:500px;background:var(--cyan);top:-200px;right:-100px;}
    .orb-v{width:400px;height:400px;background:var(--violet);bottom:-150px;left:-80px;}
  </style>
</head>
<body>
  <!-- Spotlight (follows mouse) -->
  <div class="spotlight" id="spot"></div>

  <!-- Ambient orbs -->
  <div class="orb orb-c"></div>
  <div class="orb orb-v"></div>

  <!-- ======== HEADER ======== -->
  <header data-tpl-nav>
    <div class="wrap hdr-inner">
      <a class="logo" href="#">%%BRAND_NAME%%</a>
      <nav class="nav-desk">
        <a href="#how">%%NAV_HOW%%</a>
        <a href="#features">%%NAV_FEATURES%%</a>
        <a href="#problem">%%NAV_PROBLEM%%</a>
        <a href="#faq">%%NAV_FAQ%%</a>
        <a class="nav-cta" href="#cta">%%NAV_CTA%%</a>
      </nav>
      <button type="button" class="nav-toggle" data-tpl-nav-toggle aria-label="Menu">Menu</button>
    </div>
    <nav class="nav-mobile wrap" data-tpl-nav-mobile>
      <a href="#how">%%NAV_HOW%%</a>
      <a href="#features">%%NAV_FEATURES%%</a>
      <a href="#problem">%%NAV_PROBLEM%%</a>
      <a href="#faq">%%NAV_FAQ%%</a>
      <a class="nav-cta" href="#cta" style="margin-top:0.5rem;text-align:center;display:block;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <!-- ======== 1. MEGA BENTO HERO ======== -->
  <section class="mega-hero">
    <div class="wrap">
      <div class="bento-grid">

        <!-- Headline cell (4 cols) -->
        <div class="bento-cell cell-headline rv">
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
        </div>

        <!-- Hero image cell (2 cols, 2 rows) -->
        <div class="bento-cell cell-hero-img rv rv-d1">
          <div class="hero-visual">
            %%RAW_HERO_VISUAL%%
          </div>
        </div>

        <!-- Stat card -->
        <div class="bento-cell cell-stat rv rv-d2">
          <div class="stat-num">10x</div>
          <div class="stat-label">Faster Results</div>
          <div class="stat-bar"><div class="stat-bar-fill"></div></div>
        </div>

        <!-- Feature peek -->
        <div class="bento-cell cell-feature-peek rv rv-d3">
          <div class="peek-item"><span class="peek-dot c"></span><span class="peek-text">%%FEATURE1_TITLE%%</span></div>
          <div class="peek-item"><span class="peek-dot v"></span><span class="peek-text">%%FEATURE2_TITLE%%</span></div>
          <div class="peek-item"><span class="peek-dot e"></span><span class="peek-text">%%FEATURE3_TITLE%%</span></div>
        </div>

        <!-- CTA bar spanning full width -->
        <div class="bento-cell cell-cta-area rv rv-d4">
          <div class="hero-tag"><span class="pulse"></span>%%FLOAT_CARD_TITLE%%</div>
          <div class="cta-btns">
            <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ======== 2. HOW IT WORKS (timeline beam) ======== -->
  <section class="how-sec" id="how">
    <div class="wrap">
      <p class="eyebrow rv" style="justify-content:center;"><span class="dot"></span>%%HOW_EYEBROW%%</p>
      <h2 class="sec-title rv" style="margin:0 auto;text-align:center;">%%HOW_TITLE%%</h2>
      <div class="timeline">
        <div class="tl-step rv rv-d1">
          <div class="tl-num">1</div>
          <h3>%%HOW_STEP1_TITLE%%</h3>
          <p>%%HOW_STEP1_BODY%%</p>
        </div>
        <div class="tl-step rv rv-d2">
          <div class="tl-num">2</div>
          <h3>%%HOW_STEP2_TITLE%%</h3>
          <p>%%HOW_STEP2_BODY%%</p>
        </div>
        <div class="tl-step rv rv-d3">
          <div class="tl-num">3</div>
          <h3>%%HOW_STEP3_TITLE%%</h3>
          <p>%%HOW_STEP3_BODY%%</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ======== 3. FEATURES (glassmorphism gradient border) ======== -->
  <section class="feat-sec" id="features">
    <div class="wrap">
      <p class="eyebrow rv"><span class="dot"></span>%%BENEFITS_EYEBROW%%</p>
      <h2 class="sec-title rv">%%BENEFITS_TITLE%%</h2>
      <div class="feat-cards">
        <div class="feat-card rv rv-d1">
          <div class="feat-card-inner">
            <div class="feat-icon ic1">&#9670;</div>
            <h3>%%FEATURE1_TITLE%%</h3>
            <p>%%FEATURE1_BODY%%</p>
          </div>
        </div>
        <div class="feat-card rv rv-d2">
          <div class="feat-card-inner">
            <div class="feat-icon ic2">&#9670;</div>
            <h3>%%FEATURE2_TITLE%%</h3>
            <p>%%FEATURE2_BODY%%</p>
          </div>
        </div>
        <div class="feat-card rv rv-d3">
          <div class="feat-card-inner">
            <div class="feat-icon ic3">&#9670;</div>
            <h3>%%FEATURE3_TITLE%%</h3>
            <p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ======== 4. PROBLEM (cinematic dark band) ======== -->
  <section class="prob-sec" id="problem">
    <div class="wrap prob-inner">
      <p class="eyebrow rv" style="justify-content:center;"><span class="dot"></span>%%PROBLEM_EYEBROW%%</p>
      <h2 class="sec-title rv" style="margin:0 auto 1rem;text-align:center;">%%PROBLEM_TITLE%%</h2>
      <p class="prob-body rv rv-d1">%%PROBLEM_BODY%%</p>
      <blockquote class="pullquote rv rv-d2">%%PROBLEM_QUOTE%%</blockquote>
    </div>
  </section>

  <!-- ======== 5. FAQ (neon accordion) ======== -->
  <section class="faq-sec" id="faq">
    <div class="wrap">
      <p class="eyebrow rv"><span class="dot"></span>%%FAQ_EYEBROW%%</p>
      <h2 class="sec-title rv">%%FAQ_TITLE%%</h2>
      <div class="faq-list">
        <div class="faq-item rv rv-d1">
          <div class="faq-q"><span>%%FAQ1_Q%%</span><span class="chevron">&#9660;</span></div>
          <div class="faq-a"><p>%%FAQ1_A%%</p></div>
        </div>
        <div class="faq-item rv rv-d2">
          <div class="faq-q"><span>%%FAQ2_Q%%</span><span class="chevron">&#9660;</span></div>
          <div class="faq-a"><p>%%FAQ2_A%%</p></div>
        </div>
        <div class="faq-item rv rv-d3">
          <div class="faq-q"><span>%%FAQ3_Q%%</span><span class="chevron">&#9660;</span></div>
          <div class="faq-a"><p>%%FAQ3_A%%</p></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ======== 6. CTA (floating glass card) ======== -->
  <section class="cta-sec" id="cta">
    <div class="wrap">
      <div class="cta-card rv">
        <div class="cta-card-inner">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <p class="cta-label">%%FLOAT_CARD_TITLE%%</p>
          <div class="cta-form">
            <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
            <button type="button" class="btn btn-primary">%%FLOAT_CTA_LABEL%%</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <footer><div class="wrap">%%FOOTER_LINE%%</div></footer>

  <script>
  (function(){
    /* ---- Mobile nav toggle ---- */
    var h=document.querySelector("[data-tpl-nav]");
    if(h){
      var t=h.querySelector("[data-tpl-nav-toggle]");
      var m=h.querySelector("[data-tpl-nav-mobile]");
      if(t&&m){t.addEventListener("click",function(){m.classList.toggle("open");});}
      m&&m.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){m.classList.remove("open");});});
    }

    /* ---- Scroll reveal (IntersectionObserver) ---- */
    var rvEls=document.querySelectorAll(".rv");
    if("IntersectionObserver" in window){
      var obs=new IntersectionObserver(function(entries){
        entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("vis");obs.unobserve(e.target);}});
      },{threshold:0.12,rootMargin:"0px 0px -40px 0px"});
      rvEls.forEach(function(el){obs.observe(el);});
    }else{rvEls.forEach(function(el){el.classList.add("vis");});}

    /* ---- FAQ accordion ---- */
    document.querySelectorAll(".faq-q").forEach(function(q){
      q.addEventListener("click",function(){
        var item=q.parentElement;
        var wasOpen=item.classList.contains("open");
        document.querySelectorAll(".faq-item.open").forEach(function(o){o.classList.remove("open");});
        if(!wasOpen)item.classList.add("open");
      });
    });

    /* ---- Mouse spotlight ---- */
    var spot=document.getElementById("spot");
    if(spot&&window.matchMedia("(pointer:fine)").matches){
      document.addEventListener("mousemove",function(e){
        spot.style.left=e.clientX+"px";spot.style.top=e.clientY+"px";
      });
    }

    /* ---- Sticky header shadow on scroll ---- */
    var header=document.querySelector("header");
    if(header){
      window.addEventListener("scroll",function(){
        header.style.boxShadow=window.scrollY>20?"0 4px 30px rgba(0,0,0,0.4)":"none";
      },{passive:true});
    }
  })();
  </script>
</body>
</html>`;
