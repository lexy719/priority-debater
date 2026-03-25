/**
 * Startup Horizon — Bold gradient-heavy startup template with large hero,
 * animated gradient mesh, floating 3D cards, marquee social proof ticker,
 * staggered feature showcase, numbered process with progress bar,
 * and pulsing CTA. Inspired by Stripe, Vercel, and Arc browser marketing.
 */
export const STARTUP_HORIZON_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#0c0a1a;
      --surface:rgba(255,255,255,0.04);
      --surface-hover:rgba(255,255,255,0.07);
      --border:rgba(255,255,255,0.06);
      --border-hover:rgba(255,255,255,0.12);
      --text:rgba(255,255,255,0.94);
      --muted:rgba(255,255,255,0.55);
      --faint:rgba(255,255,255,0.3);
      --rose:#f43f5e;
      --rose-dim:rgba(244,63,94,0.12);
      --orange:#f97316;
      --amber:#fbbf24;
      --radius:18px;
      --radius-sm:12px;
      --max:1120px;
      --ease:cubic-bezier(0.4,0,0.2,1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{
      font-family:"Outfit",system-ui,sans-serif;
      background:var(--bg);color:var(--text);
      font-size:1rem;line-height:1.6;
      -webkit-font-smoothing:antialiased;overflow-x:hidden;
    }

    /* ═══ ANIMATED GRADIENT MESH ═══ */
    .gradient-mesh{
      position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;
    }
    .gm-blob{
      position:absolute;border-radius:50%;filter:blur(100px);
      animation:blobFloat 18s ease-in-out infinite;will-change:transform;
    }
    .gm-blob:nth-child(1){
      width:700px;height:700px;top:-20%;left:-5%;
      background:radial-gradient(circle,rgba(244,63,94,0.2),transparent 65%);
      animation-duration:20s;
    }
    .gm-blob:nth-child(2){
      width:550px;height:550px;top:30%;right:-15%;
      background:radial-gradient(circle,rgba(249,115,22,0.18),transparent 65%);
      animation-duration:24s;animation-delay:-6s;
    }
    .gm-blob:nth-child(3){
      width:500px;height:500px;bottom:-15%;left:40%;
      background:radial-gradient(circle,rgba(251,191,36,0.14),transparent 65%);
      animation-duration:22s;animation-delay:-12s;
    }
    @keyframes blobFloat{
      0%,100%{transform:translate(0,0) scale(1);}
      33%{transform:translate(50px,-60px) scale(1.08);}
      66%{transform:translate(-40px,40px) scale(0.94);}
    }

    /* Noise */
    .noise{
      pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.03;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ═══ SCROLL REVEAL ═══ */
    .rv{opacity:0;transform:translateY(36px);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease);}
    .rv.on{opacity:1;transform:translateY(0);}
    .rv-d1{transition-delay:0.1s;}.rv-d2{transition-delay:0.2s;}.rv-d3{transition-delay:0.3s;}.rv-d4{transition-delay:0.4s;}

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.25rem);position:relative;z-index:2;}

    /* ═══ HEADER ═══ */
    header{
      position:sticky;top:0;z-index:50;
      border-bottom:1px solid var(--border);
      background:rgba(12,10,26,0.65);
      backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);
    }
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{
      font-weight:800;font-size:1.15rem;letter-spacing:-0.04em;text-decoration:none;
      background:linear-gradient(135deg,var(--rose),var(--orange));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .nav-links{display:none;gap:2rem;align-items:center;}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.85rem;font-weight:500;transition:color 0.2s;}
    .nav-links a:hover{color:var(--text);}
    .nav-cta{
      padding:0.5rem 1.15rem;border-radius:10px;font-weight:600;font-size:0.85rem;
      text-decoration:none;color:#fff;
      background:linear-gradient(135deg,var(--rose),var(--orange));
      box-shadow:0 0 24px rgba(244,63,94,0.2);transition:all 0.25s var(--ease);
    }
    .nav-cta:hover{box-shadow:0 0 40px rgba(244,63,94,0.35);transform:translateY(-1px);}
    .nav-toggle{
      display:flex;padding:0.5rem 0.75rem;border:1px solid var(--border);
      border-radius:10px;background:transparent;color:var(--text);
      cursor:pointer;font-size:0.85rem;font-family:inherit;
    }
    @media(min-width:900px){.nav-links{display:flex;}.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.75rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;
      padding:0.8rem 1.6rem;border-radius:var(--radius-sm);font-weight:600;font-size:0.92rem;
      text-decoration:none;border:1px solid transparent;cursor:pointer;font-family:inherit;
      transition:all 0.3s var(--ease);white-space:nowrap;position:relative;overflow:hidden;
    }
    .btn-primary{
      background:linear-gradient(135deg,var(--rose),var(--orange));color:#fff;
      box-shadow:0 4px 24px rgba(244,63,94,0.25);
    }
    .btn-primary::before{
      content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
      transition:left 0.5s;
    }
    .btn-primary:hover::before{left:100%;}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 36px rgba(244,63,94,0.35);}
    .btn-ghost{background:rgba(255,255,255,0.04);border-color:var(--border);color:var(--text);}
    .btn-ghost:hover{background:rgba(255,255,255,0.08);border-color:var(--border-hover);transform:translateY(-1px);}

    /* ═══ HERO ═══ */
    .hero{
      padding:clamp(5rem,12vw,9rem) 0 clamp(3rem,7vw,5rem);
      text-align:center;position:relative;z-index:2;
    }
    .hero::before{
      content:'';position:absolute;top:-300px;left:50%;transform:translateX(-50%);
      width:1100px;height:800px;
      background:radial-gradient(ellipse 60% 50%,rgba(244,63,94,0.12),transparent 55%),
                  radial-gradient(ellipse 40% 40% at 65% 30%,rgba(249,115,22,0.08),transparent 50%);
      pointer-events:none;z-index:-1;
    }

    .hero-tag{
      display:inline-flex;align-items:center;gap:0.55rem;
      padding:0.4rem 1rem 0.4rem 0.65rem;border-radius:999px;
      border:1px solid rgba(244,63,94,0.2);background:rgba(244,63,94,0.06);
      font-size:0.78rem;font-weight:600;color:var(--rose);margin-bottom:2rem;
    }
    .hero-tag .dot{
      width:7px;height:7px;border-radius:50%;background:var(--rose);
      box-shadow:0 0 10px var(--rose);animation:dotPulse 2s ease infinite;
    }
    @keyframes dotPulse{0%,100%{box-shadow:0 0 8px var(--rose);}50%{box-shadow:0 0 20px var(--rose),0 0 40px rgba(244,63,94,0.3);}}

    .hero h1{
      font-size:clamp(3rem,7.5vw,5rem);font-weight:900;
      line-height:1.02;letter-spacing:-0.05em;
      margin:0 auto 1.5rem;max-width:14ch;
      background:linear-gradient(135deg,#fff 0%,#fff 25%,var(--rose) 55%,var(--orange) 80%,var(--amber) 100%);
      background-size:200% 200%;animation:heroGrad 10s ease infinite;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    @keyframes heroGrad{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}

    .hero .lead{color:var(--muted);font-size:clamp(1.05rem,2.2vw,1.25rem);max-width:46ch;margin:0 auto 2.5rem;line-height:1.75;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.85rem;justify-content:center;margin-bottom:2rem;}

    /* Marquee social proof ticker */
    .marquee-wrap{overflow:hidden;margin-bottom:clamp(2.5rem,6vw,4rem);position:relative;}
    .marquee-wrap::before,.marquee-wrap::after{
      content:'';position:absolute;top:0;bottom:0;width:80px;z-index:3;pointer-events:none;
    }
    .marquee-wrap::before{left:0;background:linear-gradient(90deg,var(--bg),transparent);}
    .marquee-wrap::after{right:0;background:linear-gradient(270deg,var(--bg),transparent);}
    .marquee-track{
      display:flex;gap:2rem;width:max-content;
      animation:marquee 25s linear infinite;
    }
    @keyframes marquee{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
    .marquee-item{
      display:flex;align-items:center;gap:0.5rem;
      padding:0.55rem 1.1rem;border-radius:999px;
      background:var(--surface);border:1px solid var(--border);
      font-size:0.8rem;font-weight:500;color:var(--muted);white-space:nowrap;
    }
    .marquee-item svg{width:14px;height:14px;stroke:var(--rose);fill:none;stroke-width:2;stroke-linecap:round;}

    /* Hero visual */
    .hero-visual-wrap{position:relative;max-width:900px;margin:0 auto;}
    .hero-visual-wrap::before{
      content:'';position:absolute;inset:-3px;border-radius:calc(var(--radius) + 6px);
      background:linear-gradient(135deg,var(--rose),var(--orange),var(--amber),var(--rose));
      background-size:300% 300%;animation:borderAnim 5s ease infinite;z-index:-1;opacity:0.5;filter:blur(1px);
    }
    @keyframes borderAnim{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
    .hero-visual{
      border-radius:calc(var(--radius) + 3px);overflow:hidden;min-height:240px;
      border:1px solid rgba(244,63,94,0.12);
      background:linear-gradient(145deg,rgba(244,63,94,0.06),var(--bg));
      box-shadow:0 40px 100px -20px rgba(0,0,0,0.5),0 0 120px -40px rgba(244,63,94,0.12);
    }
    .hero-visual img{width:100%;height:100%;object-fit:cover;display:block;min-height:240px;}
    .photo-credit{font-size:0.7rem;color:var(--faint);padding:0.5rem 0.75rem;}
    .photo-credit a{color:var(--muted);}

    /* ═══ SECTIONS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .eyebrow{
      font-size:0.7rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;
      color:var(--rose);margin-bottom:0.85rem;display:inline-flex;align-items:center;gap:0.5rem;
    }
    .eyebrow::before{content:'';width:24px;height:2px;background:linear-gradient(90deg,var(--rose),var(--orange));border-radius:1px;}
    .sec-title{font-size:clamp(1.85rem,4vw,2.75rem);font-weight:700;letter-spacing:-0.04em;line-height:1.08;margin:0 0 1rem;}
    .sec-body{color:var(--muted);font-size:1.05rem;max-width:56ch;line-height:1.75;}

    /* ═══ PROBLEM ═══ */
    .problem-grid{display:grid;gap:3rem;align-items:start;}
    @media(min-width:768px){.problem-grid{grid-template-columns:1.2fr 1fr;gap:clamp(3rem,6vw,5rem);}}
    .pullquote{
      margin-top:2rem;padding:1.75rem 2rem;border-radius:var(--radius);
      border:1px solid var(--border);border-left:3px solid var(--rose);
      background:rgba(244,63,94,0.04);color:var(--muted);
      font-style:italic;font-size:1rem;line-height:1.65;position:relative;
    }
    .pullquote::before{
      content:'\\201C';position:absolute;top:-12px;left:16px;
      font-size:3.5rem;font-style:normal;line-height:1;
      background:linear-gradient(135deg,var(--rose),var(--orange));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;opacity:0.4;
    }

    /* ═══ FEATURES — Staggered cards ═══ */
    .features-band{
      background:linear-gradient(180deg,rgba(244,63,94,0.025),transparent 40%,transparent 60%,rgba(249,115,22,0.02));
      border-top:1px solid var(--border);border-bottom:1px solid var(--border);
    }
    .feature-stack{display:grid;gap:1.25rem;margin-top:2.5rem;}
    @media(min-width:768px){.feature-stack{grid-template-columns:repeat(3,1fr);gap:1.5rem;}}
    .f-card{
      padding:2rem 1.75rem;border-radius:var(--radius);
      border:1px solid var(--border);background:var(--surface);
      position:relative;overflow:hidden;
      transition:transform 0.35s var(--ease),border-color 0.35s,box-shadow 0.35s;
    }
    .f-card::before{
      content:'';position:absolute;top:0;left:0;right:0;height:3px;
      background:linear-gradient(90deg,var(--rose),var(--orange),var(--amber));
      opacity:0;transition:opacity 0.3s;
    }
    .f-card:hover::before{opacity:1;}
    .f-card:hover{transform:translateY(-5px);border-color:rgba(244,63,94,0.2);box-shadow:0 16px 48px rgba(244,63,94,0.08);}
    /* Stagger offset on desktop */
    @media(min-width:768px){
      .f-card:nth-child(2){transform:translateY(24px);}
      .f-card:nth-child(2):hover{transform:translateY(19px);}
    }
    .f-icon{
      width:48px;height:48px;border-radius:14px;
      background:linear-gradient(135deg,var(--rose-dim),rgba(249,115,22,0.08));
      border:1px solid rgba(244,63,94,0.12);
      display:flex;align-items:center;justify-content:center;margin-bottom:1.2rem;
    }
    .f-icon svg{width:22px;height:22px;stroke:var(--rose);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
    .f-card h3{margin:0 0 0.6rem;font-size:1.08rem;font-weight:650;letter-spacing:-0.02em;}
    .f-card p{margin:0;color:var(--muted);font-size:0.92rem;line-height:1.6;}

    /* ═══ HOW IT WORKS — Progress bar steps ═══ */
    .steps{margin-top:3rem;}
    .step-row{
      display:grid;gap:2rem;padding:2rem 0;
      border-bottom:1px solid var(--border);
      transition:background 0.3s;
    }
    .step-row:last-child{border-bottom:none;}
    .step-row:hover{background:rgba(255,255,255,0.015);}
    @media(min-width:640px){.step-row{grid-template-columns:80px 1fr;gap:2.5rem;align-items:start;}}
    .step-badge{
      width:56px;height:56px;border-radius:16px;
      background:linear-gradient(135deg,var(--rose-dim),rgba(249,115,22,0.06));
      border:1px solid rgba(244,63,94,0.15);
      display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:1.1rem;
      background-clip:padding-box;
    }
    .step-badge span{
      background:linear-gradient(135deg,var(--rose),var(--orange));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .step-text h3{margin:0 0 0.5rem;font-size:1.08rem;font-weight:650;letter-spacing:-0.02em;}
    .step-text p{margin:0;color:var(--muted);font-size:0.92rem;line-height:1.65;max-width:52ch;}

    /* ═══ FAQ ═══ */
    .faq-list{margin-top:2.25rem;max-width:700px;display:flex;flex-direction:column;gap:0.6rem;}
    .faq-item{
      border:1px solid var(--border);border-radius:var(--radius-sm);
      background:var(--surface);overflow:hidden;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .faq-item:hover{border-color:var(--border-hover);}
    .faq-item[open]{border-color:rgba(244,63,94,0.2);box-shadow:0 0 40px rgba(244,63,94,0.04);}
    .faq-item summary{
      cursor:pointer;padding:1.15rem 1.35rem;font-weight:600;font-size:0.95rem;
      list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;
    }
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary .chev{width:20px;height:20px;flex-shrink:0;stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;transition:transform 0.35s var(--ease),stroke 0.3s;}
    .faq-item[open] summary .chev{transform:rotate(180deg);stroke:var(--rose);}
    .faq-item[open] summary{color:var(--rose);border-bottom:1px solid var(--border);}
    .faq-item .ans{padding:1.1rem 1.35rem 1.25rem;color:var(--muted);font-size:0.92rem;line-height:1.65;}

    /* ═══ CTA ═══ */
    .cta-final{text-align:center;padding:clamp(5rem,10vw,8rem) 0;}
    .cta-card{
      max-width:640px;margin:0 auto;padding:clamp(2.5rem,6vw,3.5rem);
      border-radius:var(--radius);position:relative;overflow:hidden;
      background:linear-gradient(160deg,rgba(244,63,94,0.08),rgba(249,115,22,0.06),rgba(12,10,26,0.95));
      border:1px solid rgba(244,63,94,0.15);
      box-shadow:0 40px 80px -24px rgba(244,63,94,0.1);
    }
    .cta-card::before{
      content:'';position:absolute;inset:-1px;border-radius:inherit;padding:1px;
      background:linear-gradient(135deg,rgba(244,63,94,0.35),transparent 50%,rgba(249,115,22,0.25));
      -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
      mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
      -webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;
    }
    .cta-card h2{margin:0 0 0.65rem;font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:700;letter-spacing:-0.04em;}
    .cta-card>p{margin:0 0 1.75rem;color:var(--muted);font-size:0.98rem;line-height:1.6;}
    .cta-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;}
    .cta-row input{
      flex:1 1 200px;min-width:0;padding:0.72rem 1rem;border-radius:10px;
      border:1px solid var(--border);background:rgba(0,0,0,0.5);
      color:var(--text);font:inherit;font-size:0.9rem;outline:none;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .cta-row input::placeholder{color:var(--faint);}
    .cta-row input:focus{border-color:var(--rose);box-shadow:0 0 0 3px rgba(244,63,94,0.12);}

    /* ═══ FOOTER ═══ */
    footer{padding:2.5rem 0;border-top:1px solid var(--border);color:var(--faint);font-size:0.85rem;text-align:center;position:relative;z-index:2;}

    ::selection{background:rgba(244,63,94,0.25);color:#fff;}
    :focus-visible{outline:2px solid var(--rose);outline-offset:2px;}
    ::-webkit-scrollbar{width:8px;}
    ::-webkit-scrollbar-track{background:var(--bg);}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px;}
  </style>
</head>
<body>
  <div class="gradient-mesh" aria-hidden="true">
    <div class="gm-blob"></div><div class="gm-blob"></div><div class="gm-blob"></div>
  </div>
  <div class="noise" aria-hidden="true"></div>

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
        <div class="hero-tag rv"><span class="dot"></span>%%FLOAT_CARD_TITLE%%</div>
        <h1 class="rv rv-d1">%%HERO_HEADLINE%%</h1>
        <p class="lead rv rv-d2">%%HERO_SUB%%</p>
        <div class="hero-ctas rv rv-d2">
          <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
          <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
        </div>
        <!-- Marquee social proof -->
        <div class="marquee-wrap rv rv-d3">
          <div class="marquee-track">
            <span class="marquee-item"><svg viewBox="0 0 24 24"><polyline points="22 4 12 14.01 9 11.01"/></svg>%%FEATURE1_TITLE%%</span>
            <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>%%FEATURE2_TITLE%%</span>
            <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>%%FEATURE3_TITLE%%</span>
            <span class="marquee-item"><svg viewBox="0 0 24 24"><polyline points="22 4 12 14.01 9 11.01"/></svg>%%FEATURE1_TITLE%%</span>
            <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>%%FEATURE2_TITLE%%</span>
            <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>%%FEATURE3_TITLE%%</span>
          </div>
        </div>
        <div class="hero-visual-wrap rv rv-d4">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap">
        <div class="problem-grid">
          <div class="rv">
            <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
            <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
            <p class="sec-body">%%PROBLEM_BODY%%</p>
          </div>
          <div class="rv rv-d2">
            <blockquote class="pullquote">%%PROBLEM_QUOTE%%</blockquote>
          </div>
        </div>
      </div>
    </section>

    <section id="features" class="features-band">
      <div class="wrap">
        <p class="eyebrow rv">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title rv">%%BENEFITS_TITLE%%</h2>
        <div class="feature-stack">
          <div class="f-card rv rv-d1">
            <div class="f-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg></div>
            <h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="f-card rv rv-d2">
            <div class="f-icon"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
            <h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="f-card rv rv-d3">
            <div class="f-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
            <h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <section id="how">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow rv" style="justify-content:center;">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title rv" style="margin-left:auto;margin-right:auto;">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap">
        <div class="steps">
          <div class="step-row rv rv-d1">
            <div class="step-badge"><span>1</span></div>
            <div class="step-text"><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
          </div>
          <div class="step-row rv rv-d2">
            <div class="step-badge"><span>2</span></div>
            <div class="step-text"><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
          </div>
          <div class="step-row rv rv-d3">
            <div class="step-badge"><span>3</span></div>
            <div class="step-text"><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
          </div>
        </div>
      </div>
    </section>

    <section id="faq">
      <div class="wrap">
        <p class="eyebrow rv">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title rv">%%FAQ_TITLE%%</h2>
        <div class="faq-list">
          <details class="faq-item rv rv-d1"><summary><span>%%FAQ1_Q%%</span><svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ1_A%%</div></details>
          <details class="faq-item rv rv-d2"><summary><span>%%FAQ2_Q%%</span><svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ2_A%%</div></details>
          <details class="faq-item rv rv-d3"><summary><span>%%FAQ3_Q%%</span><svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ3_A%%</div></details>
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
