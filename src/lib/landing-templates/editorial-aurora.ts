/**
 * Editorial Aurora — Luxury editorial with Playfair Display + DM Sans,
 * warm golden atmosphere, immersive typography, grain texture,
 * elegant reveal animations, magazine-style layout, decorative elements.
 * Inspired by premium editorial sites, Notion, Apple marketing pages.
 */
export const EDITORIAL_AURORA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&display=swap" rel="stylesheet">
  <style>
    :root{
      --paper:#faf8f5;
      --paper-warm:#f5f0e8;
      --card:#fffefb;
      --text:#1a1714;
      --muted:rgba(26,23,20,0.58);
      --faint:rgba(26,23,20,0.32);
      --accent:#b45309;
      --accent2:#d97706;
      --accent-soft:rgba(180,83,9,0.08);
      --border:rgba(26,23,20,0.08);
      --border-strong:rgba(26,23,20,0.14);
      --radius:20px;
      --radius-sm:14px;
      --max:1080px;
      --serif:"Playfair Display",Georgia,"Times New Roman",serif;
      --sans:"DM Sans",system-ui,sans-serif;
      --ease:cubic-bezier(0.4,0,0.2,1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{
      font-family:var(--sans);background:var(--paper);color:var(--text);
      font-size:1rem;line-height:1.65;
      -webkit-font-smoothing:antialiased;overflow-x:hidden;
    }

    /* ═══ WARM ATMOSPHERE ═══ */
    .atmosphere{
      pointer-events:none;position:fixed;inset:0;z-index:0;
      background:
        radial-gradient(ellipse 70% 50% at 30% 0%,rgba(217,119,6,0.06),transparent 50%),
        radial-gradient(ellipse 60% 40% at 80% 20%,rgba(245,158,11,0.05),transparent 45%),
        radial-gradient(ellipse 80% 50% at 50% 100%,rgba(180,83,9,0.04),transparent 50%);
    }
    /* Paper grain texture */
    .grain{
      pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.035;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ═══ SCROLL REVEAL ═══ */
    .reveal{opacity:0;transform:translateY(40px);transition:opacity 0.9s var(--ease),transform 0.9s var(--ease);}
    .reveal.visible{opacity:1;transform:translateY(0);}
    .reveal-d1{transition-delay:0.12s;}
    .reveal-d2{transition-delay:0.24s;}
    .reveal-d3{transition-delay:0.36s;}
    .reveal-up{transform:translateY(24px);}
    .reveal-scale{opacity:0;transform:scale(0.96);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease);}
    .reveal-scale.visible{opacity:1;transform:scale(1);}

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.5rem);position:relative;z-index:2;}

    /* ═══ HEADER ═══ */
    header{
      position:sticky;top:0;z-index:50;
      border-bottom:1px solid var(--border);
      background:rgba(250,248,245,0.85);
      backdrop-filter:blur(20px) saturate(1.4);-webkit-backdrop-filter:blur(20px) saturate(1.4);
    }
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:68px;flex-wrap:wrap;}
    .logo{
      font-weight:700;font-size:1.25rem;letter-spacing:-0.03em;
      font-family:var(--serif);color:var(--text);text-decoration:none;
      transition:opacity 0.2s;
    }
    .logo:hover{opacity:0.7;}
    .nav-links{display:none;gap:2rem;align-items:center;}
    @media(min-width:900px){.nav-links{display:flex;}}
    .nav-links a{
      color:var(--muted);text-decoration:none;font-size:0.87rem;font-weight:500;
      transition:color 0.2s;position:relative;
    }
    .nav-links a:hover{color:var(--text);}
    .nav-links a::after{
      content:'';position:absolute;bottom:-2px;left:0;width:0;
      height:1.5px;background:var(--accent2);border-radius:1px;transition:width 0.3s var(--ease);
    }
    .nav-links a:hover::after{width:100%;}
    .nav-cta{
      padding:0.55rem 1.25rem;border-radius:10px;font-weight:600;font-size:0.87rem;
      text-decoration:none;color:#fff;background:var(--accent);
      box-shadow:0 4px 16px rgba(180,83,9,0.2);
      transition:all 0.25s var(--ease);
    }
    .nav-cta:hover{background:var(--accent2);transform:translateY(-1px);box-shadow:0 8px 28px rgba(180,83,9,0.25);}
    .nav-toggle{
      display:flex;padding:0.5rem 0.85rem;border:1px solid var(--border);
      border-radius:10px;background:var(--card);color:var(--text);
      cursor:pointer;font-size:0.85rem;font-family:var(--sans);transition:background 0.2s;
    }
    .nav-toggle:hover{background:var(--paper-warm);}
    @media(min-width:900px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.75rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;padding:0.35rem 0;transition:color 0.2s;}
    .nav-mobile a:hover{color:var(--text);}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:0.45rem;
      padding:0.8rem 1.6rem;border-radius:12px;font-weight:600;font-size:0.93rem;
      text-decoration:none;border:none;cursor:pointer;font-family:var(--sans);
      transition:all 0.25s var(--ease);position:relative;overflow:hidden;
    }
    .btn-primary{
      background:var(--accent);color:#fff;
      box-shadow:0 6px 24px rgba(180,83,9,0.2);
    }
    .btn-primary::after{
      content:'';position:absolute;top:50%;left:50%;width:0;height:0;
      background:rgba(255,255,255,0.15);border-radius:50%;
      transform:translate(-50%,-50%);transition:width 0.5s,height 0.5s;
    }
    .btn-primary:hover::after{width:300px;height:300px;}
    .btn-primary:hover{background:var(--accent2);transform:translateY(-2px);box-shadow:0 12px 40px rgba(180,83,9,0.28);}
    .btn-ghost{
      background:transparent;border:1.5px solid var(--border-strong);color:var(--text);
    }
    .btn-ghost:hover{background:rgba(26,23,20,0.03);border-color:rgba(26,23,20,0.22);transform:translateY(-1px);}

    /* ═══ HERO — Full-width centered, massive typography ═══ */
    .hero{
      padding:clamp(5rem,12vw,9rem) 0 clamp(3rem,6vw,4rem);
      position:relative;z-index:2;text-align:center;overflow:hidden;
    }
    /* Decorative warm glow behind hero text */
    .hero::before{
      content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:800px;height:500px;
      background:radial-gradient(ellipse 100% 100%,rgba(217,119,6,0.08),transparent 60%);
      pointer-events:none;z-index:-1;
    }

    .hero-badge{
      display:inline-flex;align-items:center;gap:0.5rem;
      padding:0.4rem 1rem;border-radius:999px;
      border:1px solid rgba(180,83,9,0.15);background:rgba(180,83,9,0.05);
      font-size:0.78rem;font-weight:600;color:var(--accent);
      margin-bottom:2rem;letter-spacing:0.02em;
    }
    .hero-badge .spark{font-size:0.9rem;}

    .hero h1{
      font-family:var(--serif);
      font-size:clamp(3rem,8vw,5.5rem);font-weight:700;
      line-height:1.02;letter-spacing:-0.04em;
      margin:0 auto 1.5rem;max-width:14ch;color:var(--text);
    }
    .hero h1 em{
      font-style:italic;color:var(--accent);
      background:linear-gradient(135deg,var(--accent),var(--accent2));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }

    .hero .lead{
      color:var(--muted);font-size:clamp(1.08rem,2.5vw,1.3rem);
      max-width:44ch;margin:0 auto 2.5rem;line-height:1.7;
    }
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.85rem;justify-content:center;margin-bottom:clamp(3rem,7vw,5rem);}

    /* Hero visual — large editorial image */
    .hero-visual-wrap{
      position:relative;max-width:960px;margin:0 auto;
    }
    /* Decorative brackets around the image */
    .hero-visual-wrap::before,.hero-visual-wrap::after{
      content:'';position:absolute;width:60px;height:60px;
      border-color:var(--accent);border-style:solid;opacity:0.25;z-index:3;
    }
    .hero-visual-wrap::before{top:-12px;left:-12px;border-width:3px 0 0 3px;border-radius:4px 0 0 0;}
    .hero-visual-wrap::after{bottom:-12px;right:-12px;border-width:0 3px 3px 0;border-radius:0 0 4px 0;}
    .hero-visual{
      width:100%;border-radius:var(--radius);overflow:hidden;
      border:1px solid var(--border);
      box-shadow:0 48px 100px -32px rgba(26,23,20,0.18),0 0 0 1px rgba(255,255,255,0.6) inset;
      background:linear-gradient(155deg,rgba(217,119,6,0.04),rgba(250,248,245,0.8));
    }
    .hero-visual img{width:100%;max-height:480px;object-fit:cover;display:block;}
    .photo-credit{font-size:0.7rem;color:var(--faint);padding:0.5rem 0.85rem;background:rgba(255,255,255,0.7);}
    .photo-credit a{color:var(--muted);}

    /* ═══ SECTIONS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .eyebrow{
      font-size:0.72rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;
      color:var(--accent);margin:0 0 0.85rem;display:inline-block;
    }
    .sec-title{
      font-family:var(--serif);font-size:clamp(2rem,4.5vw,3rem);
      font-weight:700;letter-spacing:-0.04em;line-height:1.06;margin:0 0 1.25rem;
    }

    /* ═══ PROBLEM — Magazine 2-column split ═══ */
    .problem-split{display:block;}
    @media(min-width:768px){
      .problem-split{display:grid;grid-template-columns:2fr 3fr;gap:clamp(3rem,6vw,5rem);align-items:start;}
    }
    .problem-left .sec-title{max-width:14ch;}
    .problem-right{margin-top:1.5rem;}
    @media(min-width:768px){.problem-right{margin-top:0;}}
    .problem-body{color:var(--muted);font-size:1.08rem;line-height:1.8;margin:0 0 2rem;}
    .pullquote{
      padding:2rem 2.25rem;border-radius:var(--radius);
      border:none;border-left:4px solid var(--accent);
      background:var(--card);color:var(--text);
      font-family:var(--serif);font-style:italic;font-size:1.15rem;line-height:1.6;
      box-shadow:0 24px 64px -24px rgba(26,23,20,0.1);position:relative;
    }
    .pullquote::before{
      content:'\\201C';position:absolute;top:-10px;left:20px;
      font-size:4rem;font-family:var(--serif);font-style:normal;
      color:var(--accent);opacity:0.2;line-height:1;
    }

    /* ═══ FEATURES — Alternating image-text rows ═══ */
    .features-section{background:var(--paper-warm);border-top:1px solid var(--border);border-bottom:1px solid var(--border);}
    .features-list{display:flex;flex-direction:column;gap:0;margin-top:2.5rem;}
    .feature-row{
      display:grid;gap:2rem;align-items:center;
      padding:2.5rem 0;border-bottom:1px solid var(--border);
    }
    .feature-row:last-child{border-bottom:none;}
    @media(min-width:640px){.feature-row{grid-template-columns:auto 1fr;gap:2.5rem;}}
    .feature-num{
      font-family:var(--serif);font-size:4.5rem;font-weight:700;
      line-height:1;color:var(--accent);opacity:0.12;
      min-width:80px;text-align:center;
    }
    @media(min-width:640px){.feature-num{text-align:right;}}
    .feature-content h3{
      font-family:var(--serif);font-size:1.2rem;font-weight:600;
      letter-spacing:-0.02em;margin:0 0 0.5rem;
    }
    .feature-content p{margin:0;color:var(--muted);font-size:0.95rem;line-height:1.7;max-width:48ch;}

    /* ═══ HOW IT WORKS — Elegant card grid ═══ */
    .how-grid{display:grid;gap:1.25rem;margin-top:2.5rem;}
    @media(min-width:640px){.how-grid{grid-template-columns:repeat(3,1fr);gap:1.5rem;}}
    .how-card{
      padding:2rem 1.75rem;border-radius:var(--radius);
      background:var(--card);border:1px solid var(--border);
      box-shadow:0 12px 40px -16px rgba(26,23,20,0.08);
      position:relative;overflow:hidden;
      transition:transform 0.3s var(--ease),box-shadow 0.3s;
    }
    .how-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px -20px rgba(26,23,20,0.14);}
    /* Warm accent gradient at top of card */
    .how-card::before{
      content:'';position:absolute;top:0;left:0;right:0;height:3px;
      background:linear-gradient(90deg,var(--accent),var(--accent2),rgba(217,119,6,0.3));
    }
    .how-num{
      font-family:var(--serif);font-size:1.5rem;font-weight:700;
      color:var(--accent);margin-bottom:1rem;
    }
    .how-card h3{
      font-family:var(--serif);font-size:1.1rem;font-weight:600;
      letter-spacing:-0.02em;margin:0 0 0.5rem;
    }
    .how-card p{margin:0;color:var(--muted);font-size:0.92rem;line-height:1.65;}

    /* ═══ FAQ — Elegant warm accordion ═══ */
    .faq-container{max-width:680px;margin:2.25rem auto 0;}
    .faq-item{
      border:1px solid var(--border);border-radius:var(--radius-sm);
      background:var(--card);overflow:hidden;margin-bottom:0.65rem;
      box-shadow:0 4px 16px -8px rgba(26,23,20,0.06);
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .faq-item:hover{border-color:var(--border-strong);}
    .faq-item[open]{border-color:rgba(180,83,9,0.2);box-shadow:0 8px 32px -12px rgba(26,23,20,0.1);}
    .faq-item summary{
      cursor:pointer;padding:1.2rem 1.5rem;font-weight:600;font-size:0.97rem;
      list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;
      transition:color 0.2s;user-select:none;
    }
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary .toggle{
      flex-shrink:0;width:28px;height:28px;border-radius:50%;
      background:var(--accent-soft);display:flex;align-items:center;justify-content:center;
      transition:all 0.3s var(--ease);
    }
    .faq-item summary .toggle svg{
      width:14px;height:14px;stroke:var(--accent);fill:none;stroke-width:2.5;stroke-linecap:round;
      transition:transform 0.35s var(--ease);
    }
    .faq-item[open] summary .toggle{background:var(--accent);transform:rotate(45deg);}
    .faq-item[open] summary .toggle svg{stroke:#fff;}
    .faq-item[open] summary{color:var(--accent);border-bottom:1px solid var(--border);}
    .faq-item .ans{padding:1.1rem 1.5rem 1.35rem;color:var(--muted);font-size:0.93rem;line-height:1.7;}

    /* ═══ CTA FINAL — Warm gradient showcase ═══ */
    .cta-final{padding:clamp(4rem,10vw,7rem) 0;text-align:center;}
    .cta-card{
      max-width:640px;margin:0 auto;padding:clamp(3rem,6vw,4.5rem) clamp(2rem,5vw,3.5rem);
      border-radius:var(--radius);position:relative;overflow:hidden;
      background:linear-gradient(160deg,rgba(245,158,11,0.06),rgba(180,83,9,0.08),rgba(217,119,6,0.04));
      border:1px solid rgba(180,83,9,0.12);
      box-shadow:0 40px 80px -32px rgba(180,83,9,0.12);
    }
    /* Decorative circle ornaments */
    .cta-card::before{
      content:'';position:absolute;top:-60px;right:-60px;
      width:200px;height:200px;border-radius:50%;
      border:1px solid rgba(180,83,9,0.08);pointer-events:none;
    }
    .cta-card::after{
      content:'';position:absolute;bottom:-40px;left:-40px;
      width:150px;height:150px;border-radius:50%;
      border:1px solid rgba(180,83,9,0.06);pointer-events:none;
    }
    .cta-card h2{
      font-family:var(--serif);font-size:clamp(1.7rem,3.5vw,2.4rem);
      font-weight:700;letter-spacing:-0.04em;margin:0 0 0.6rem;position:relative;
    }
    .cta-card .cta-sub{margin:0 0 1.75rem;color:var(--muted);font-size:1rem;line-height:1.6;position:relative;}
    .cta-card .float-label{margin:0 0 0.85rem;font-size:0.85rem;font-weight:500;color:var(--text);opacity:0.6;position:relative;}
    .email-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;max-width:440px;margin:0 auto;position:relative;}
    .email-row input{
      flex:1 1 220px;min-width:0;padding:0.8rem 1.1rem;border-radius:12px;
      border:1px solid rgba(26,23,20,0.1);background:#fff;color:var(--text);
      font:inherit;font-size:0.93rem;outline:none;transition:border-color 0.3s,box-shadow 0.3s;
    }
    .email-row input::placeholder{color:var(--faint);}
    .email-row input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(180,83,9,0.1);}

    /* ═══ FOOTER ═══ */
    footer{
      padding:2.75rem 0;border-top:1px solid var(--border);
      color:var(--faint);font-size:0.85rem;text-align:center;
      position:relative;z-index:2;
    }

    /* ═══ UTILITIES ═══ */
    ::selection{background:rgba(180,83,9,0.15);color:var(--text);}
    :focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
  </style>
</head>
<body>
  <div class="atmosphere" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>

  <!-- ─── Header ─── -->
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
    <!-- ─── Hero ─── -->
    <section class="hero">
      <div class="wrap">
        <div class="hero-badge reveal"><span class="spark">&#10024;</span> %%FLOAT_CARD_TITLE%%</div>
        <h1 class="reveal reveal-d1">%%HERO_HEADLINE%%</h1>
        <p class="lead reveal reveal-d2">%%HERO_SUB%%</p>
        <div class="hero-ctas reveal reveal-d2">
          <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
          <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
        </div>
        <div class="hero-visual-wrap reveal-scale reveal-d3">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>

    <!-- ─── Problem ─── -->
    <section id="problem">
      <div class="wrap">
        <div class="problem-split">
          <div class="problem-left reveal">
            <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
            <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
          </div>
          <div class="problem-right">
            <p class="problem-body reveal reveal-d1">%%PROBLEM_BODY%%</p>
            <blockquote class="pullquote reveal reveal-d2">%%PROBLEM_QUOTE%%</blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Features ─── -->
    <section id="features" class="features-section">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;max-width:18ch;">%%BENEFITS_TITLE%%</h2>
      </div>
      <div class="wrap">
        <div class="features-list">
          <div class="feature-row reveal">
            <div class="feature-num">01</div>
            <div class="feature-content">
              <h3>%%FEATURE1_TITLE%%</h3>
              <p>%%FEATURE1_BODY%%</p>
            </div>
          </div>
          <div class="feature-row reveal reveal-d1">
            <div class="feature-num">02</div>
            <div class="feature-content">
              <h3>%%FEATURE2_TITLE%%</h3>
              <p>%%FEATURE2_BODY%%</p>
            </div>
          </div>
          <div class="feature-row reveal reveal-d2">
            <div class="feature-num">03</div>
            <div class="feature-content">
              <h3>%%FEATURE3_TITLE%%</h3>
              <p>%%FEATURE3_BODY%%</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── How It Works ─── -->
    <section id="how">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap">
        <div class="how-grid">
          <div class="how-card reveal reveal-d1">
            <div class="how-num">01</div>
            <h3>%%HOW_STEP1_TITLE%%</h3>
            <p>%%HOW_STEP1_BODY%%</p>
          </div>
          <div class="how-card reveal reveal-d2">
            <div class="how-num">02</div>
            <h3>%%HOW_STEP2_TITLE%%</h3>
            <p>%%HOW_STEP2_BODY%%</p>
          </div>
          <div class="how-card reveal reveal-d3">
            <div class="how-num">03</div>
            <h3>%%HOW_STEP3_TITLE%%</h3>
            <p>%%HOW_STEP3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FAQ ─── -->
    <section id="faq">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;">%%FAQ_TITLE%%</h2>
      </div>
      <div class="faq-container">
        <details class="faq-item reveal reveal-d1">
          <summary>
            <span>%%FAQ1_Q%%</span>
            <span class="toggle"><svg viewBox="0 0 14 14"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg></span>
          </summary>
          <div class="ans">%%FAQ1_A%%</div>
        </details>
        <details class="faq-item reveal reveal-d2">
          <summary>
            <span>%%FAQ2_Q%%</span>
            <span class="toggle"><svg viewBox="0 0 14 14"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg></span>
          </summary>
          <div class="ans">%%FAQ2_A%%</div>
        </details>
        <details class="faq-item reveal reveal-d3">
          <summary>
            <span>%%FAQ3_Q%%</span>
            <span class="toggle"><svg viewBox="0 0 14 14"><line x1="7" y1="2" x2="7" y2="12"/><line x1="2" y1="7" x2="12" y2="7"/></svg></span>
          </summary>
          <div class="ans">%%FAQ3_A%%</div>
        </details>
      </div>
    </section>

    <!-- ─── CTA Final ─── -->
    <section id="cta" class="cta-final">
      <div class="wrap">
        <div class="cta-card reveal">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p class="cta-sub">%%CTA_FINAL_SUB%%</p>
          <p class="float-label">%%FLOAT_CARD_TITLE%%</p>
          <form class="email-row" action="#" method="get" onsubmit="return false;">
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
  })();
  </script>
</body>
</html>`;
