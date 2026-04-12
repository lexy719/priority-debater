/**
 * SaaS Nova — "Obsidian Flow"
 * Single-file landing: dark mesh, glass cards, sharp typography.
 * Slots match merge-landing / landing-template-prompt (unchanged).
 */
export const SAAS_NOVA_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%BRAND_NAME%%</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#020205;--bg2:#0a0a10;--surface:rgba(255,255,255,0.045);--border:rgba(255,255,255,0.09);
      --text:#f4f4f8;--muted:rgba(244,244,248,0.62);--faint:rgba(244,244,248,0.38);
      --a1:#6366f1;--a2:#a855f7;--a3:#22d3ee;--glow:rgba(99,102,241,0.4);
      --max:1120px;--r:20px;--ease:cubic-bezier(0.22,1,0.36,1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{font-family:"DM Sans",system-ui,sans-serif;background:var(--bg);color:var(--text);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
    .mesh{position:fixed;inset:0;z-index:0;pointer-events:none;background:
      radial-gradient(ellipse 90% 55% at 15% -15%,rgba(99,102,241,0.42),transparent 58%),
      radial-gradient(ellipse 70% 45% at 95% 5%,rgba(34,211,238,0.14),transparent 52%),
      radial-gradient(ellipse 55% 40% at 50% 105%,rgba(168,85,247,0.2),transparent 48%),
      linear-gradient(180deg,#020205 0%,#06060c 50%,#020205 100%);
    }
    .grain{position:fixed;inset:0;z-index:1;pointer-events:none;opacity:0.055;mix-blend-mode:overlay;background:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
    .orbs{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden;}
    .orbs span{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.5;animation:drift 22s ease-in-out infinite;}
    .orbs span:nth-child(1){width:min(55vw,420px);height:min(55vw,420px);background:radial-gradient(circle,rgba(99,102,241,0.55),transparent 70%);top:-8%;left:-10%;animation-delay:0s;}
    .orbs span:nth-child(2){width:min(45vw,360px);height:min(45vw,360px);background:radial-gradient(circle,rgba(34,211,238,0.35),transparent 70%);bottom:15%;right:-5%;animation-delay:-7s;}
    .orbs span:nth-child(3){width:min(35vw,280px);height:min(35vw,280px);background:radial-gradient(circle,rgba(168,85,247,0.4),transparent 70%);top:45%;left:35%;animation-delay:-14s;}
    @keyframes drift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(3%,2%) scale(1.05)}66%{transform:translate(-2%,-3%) scale(0.95)}}

    .wrap{max-width:var(--max);margin:0 auto;padding:0 clamp(1.1rem,4vw,2rem);position:relative;z-index:2;}
    header{position:sticky;top:0;z-index:40;border-bottom:1px solid var(--border);background:rgba(2,2,5,0.78);backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px);box-shadow:0 1px 0 rgba(99,102,241,0.06);}
    .nav{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{font-family:Syne,sans-serif;font-weight:800;font-size:1.05rem;letter-spacing:-0.03em;color:var(--text);text-decoration:none;}
    .nav-links{display:none;gap:1.75rem;align-items:center;}
    @media(min-width:880px){.nav-links{display:flex;}}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.88rem;font-weight:500;transition:color .2s;}
    .nav-links a:hover{color:var(--text);}
    .nav-cta{padding:0.5rem 1.1rem;border-radius:999px;font-weight:600;font-size:0.82rem;text-decoration:none;color:#fff;background:linear-gradient(135deg,var(--a1),var(--a2));box-shadow:0 4px 24px var(--glow);transition:transform .2s var(--ease),box-shadow .2s;}
    .nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 32px rgba(99,102,241,0.45);}
    .nav-toggle{display:flex;padding:0.4rem 0.75rem;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text);cursor:pointer;font-size:0.8rem;}
    @media(min-width:880px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.6rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;padding:0.35rem 0;}
    @media(min-width:880px){.nav-mobile{display:none!important;}}

    .hero{padding:clamp(3.5rem,10vw,6.5rem) 0 3rem;position:relative;}
    .hero::before{content:"";position:absolute;top:20%;left:50%;width:min(120%,800px);height:60%;transform:translateX(-50%);background:radial-gradient(ellipse at center,rgba(99,102,241,0.08),transparent 65%);pointer-events:none;}
    .hero-grid{display:grid;gap:2.5rem;align-items:center;}
    @media(min-width:860px){.hero-grid{grid-template-columns:1.05fr 0.95fr;gap:3rem;}}
    .hero-copy{position:relative;}
    .hero-accent-svg{position:absolute;top:-0.75rem;right:0;width:min(42%,110px);opacity:0.4;pointer-events:none;}
    .hero-accent-svg svg{width:100%;height:auto;display:block;filter:drop-shadow(0 4px 12px rgba(99,102,241,0.45));}

    .trust-strip{padding:0 0 2.75rem;}
    .trust-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1rem 1.75rem;padding:1.4rem 1.35rem;border-radius:var(--r);border:1px solid var(--border);background:linear-gradient(165deg,rgba(99,102,241,0.1),rgba(255,255,255,0.03));max-width:860px;margin:0 auto;box-shadow:0 20px 50px -28px rgba(99,102,241,0.25);}
    .trust-copy{text-align:center;flex:1;min-width:min(100%,260px);}
    .trust-eyebrow{font-size:0.68rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#a5b4fc;margin-bottom:0.4rem;}
    .trust-main{font-size:0.95rem;color:var(--muted);line-height:1.55;max-width:52ch;margin:0 auto;}
    .trust-stars{display:flex;gap:0.12rem;color:#fbbf24;font-size:0.85rem;letter-spacing:0.05em;line-height:1;opacity:0.9;text-shadow:0 0 20px rgba(251,191,36,0.35);}
    .eyebrow{display:inline-flex;align-items:center;gap:0.4rem;padding:0.35rem 0.85rem;border-radius:999px;border:1px solid rgba(99,102,241,0.35);background:rgba(99,102,241,0.1);font-size:0.72rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#a5b4fc;margin-bottom:1.25rem;}
    .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,var(--a3),var(--a1));animation:pulse 2.2s ease-in-out infinite;}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
    h1{font-family:Syne,sans-serif;font-size:clamp(2.25rem,5.5vw,3.6rem);font-weight:800;line-height:1.05;letter-spacing:-0.035em;margin-bottom:1.1rem;background:linear-gradient(135deg,#fff 0%,#c4b5fd 45%,#67e8f9 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .lead{font-size:clamp(1rem,2.2vw,1.15rem);color:var(--muted);line-height:1.7;max-width:46ch;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:1.75rem;}
    .btn{display:inline-flex;align-items:center;justify-content:center;padding:0.85rem 1.5rem;border-radius:12px;font-weight:600;font-size:0.9rem;text-decoration:none;transition:transform .2s,border-color .2s,background .2s;}
    .btn-primary{background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;border:none;box-shadow:0 6px 28px rgba(99,102,241,0.35);}
    .btn-primary:hover{transform:translateY(-2px);}
    .btn-ghost{background:transparent;border:1.5px solid rgba(255,255,255,0.18);color:var(--text);}
    .btn-ghost:hover{border-color:rgba(255,255,255,0.35);background:rgba(255,255,255,0.04);}

    .hero-visual-wrap{position:relative;border-radius:var(--r);padding:1px;background:linear-gradient(135deg,rgba(99,102,241,0.65),rgba(34,211,238,0.35),rgba(168,85,247,0.55));animation:float 7s ease-in-out infinite;box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 32px 80px -28px rgba(99,102,241,0.55),0 0 120px -40px rgba(34,211,238,0.25);}
    @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    .hero-visual-inner{border-radius:calc(var(--r) - 1px);overflow:hidden;background:var(--bg2);position:relative;}
    .hero-visual-inner::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(2,2,5,0.15) 0%,transparent 40%,transparent 60%,rgba(2,2,5,0.35) 100%);border-radius:inherit;}
    .hero-visual-inner .hero-visual{width:100%;min-height:min(52vw,360px);}
    .hero-visual-inner .hero-visual img{width:100%;height:auto;display:block;aspect-ratio:16/10;object-fit:cover;}
    .hero-visual-inner .photo-credit{font-size:0.72rem;color:var(--faint);padding:0.55rem 0.85rem;text-align:center;line-height:1.4;}
    .hero-visual-inner .photo-credit a{color:#a5b4fc;text-decoration:none;border-bottom:1px solid rgba(165,180,252,0.35);}

    .sec-title{font-family:Syne,sans-serif;font-size:clamp(1.5rem,3vw,2.1rem);font-weight:700;letter-spacing:-0.03em;margin-bottom:0.75rem;}
    .feat-deco{width:48px;height:2px;margin:0.75rem auto 0;background:linear-gradient(90deg,transparent,var(--a1),var(--a3),transparent);border-radius:2px;opacity:0.85;}

    #features{padding:4rem 0;position:relative;}
    #features::before{content:"";position:absolute;left:50%;top:0;transform:translateX(-50%);width:min(100%,900px);height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,0.35),transparent);}
    .feat-head{text-align:center;margin-bottom:2.75rem;}
    .bento{display:grid;gap:1rem;grid-template-columns:1fr;}
    @media(min-width:720px){.bento{grid-template-columns:repeat(3,1fr);grid-template-areas:"a a b" "a a c";}}
    .bento .c1{@media(min-width:720px){grid-area:a;}}
    .bento .c2{@media(min-width:720px){grid-area:b;}}
    .bento .c3{@media(min-width:720px){grid-area:c;}}
    .card{
      position:relative;border-radius:var(--r);padding:1.55rem 1.4rem;height:100%;
      background:linear-gradient(155deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 100%);
      border:1px solid var(--border);
      transition:transform .3s var(--ease),box-shadow .3s,border-color .3s;
    }
    .card::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(145deg,rgba(99,102,241,0.45),rgba(34,211,238,0.12),rgba(168,85,247,0.25));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0.65;pointer-events:none;}
    .card:hover{transform:translateY(-5px) scale(1.01);border-color:rgba(99,102,241,0.45);box-shadow:0 28px 60px -24px rgba(99,102,241,0.45),0 0 0 1px rgba(99,102,241,0.12);}
    .card h3{font-family:Syne,sans-serif;font-size:1.06rem;margin-bottom:0.5rem;}
    .card p{font-size:0.88rem;color:var(--muted);line-height:1.62;}
    .fi{margin-bottom:1rem;}
    .fn{display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:12px;font-family:Syne,sans-serif;font-size:0.8rem;font-weight:800;letter-spacing:-0.02em;
      background:linear-gradient(145deg,rgba(99,102,241,0.35),rgba(34,211,238,0.12));
      border:1px solid rgba(99,102,241,0.35);color:#e0e7ff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.12);}

    #problem{padding:4rem 0;background:linear-gradient(180deg,rgba(10,10,16,0.98),rgba(3,3,6,0.96));border-top:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;overflow:hidden;}
    #problem::after{content:"?";position:absolute;right:clamp(-1rem,8vw,4rem);top:50%;transform:translateY(-50%);font-family:Syne,sans-serif;font-size:clamp(8rem,28vw,16rem);font-weight:800;line-height:1;color:rgba(99,102,241,0.04);pointer-events:none;}
    .problem-inner{max-width:720px;position:relative;z-index:1;}
    .problem-body{color:var(--muted);margin:1rem 0 1.25rem;font-size:1.02rem;line-height:1.75;}
    .pullquote{position:relative;padding:1.1rem 1.1rem 1.1rem 1.35rem;font-style:italic;color:#c4b5fd;font-size:0.98rem;line-height:1.55;background:rgba(99,102,241,0.08);border-radius:12px;border:1px solid rgba(99,102,241,0.2);}
    .pullquote::before{content:"\\201C";position:absolute;left:0.5rem;top:0.35rem;font-size:1.75rem;font-family:Georgia,serif;opacity:0.35;line-height:1;}

    #how{padding:4rem 0;}
    .how-head{text-align:center;margin-bottom:2.25rem;}
    .steps{display:grid;gap:1.25rem;position:relative;}
    @media(min-width:768px){.steps{grid-template-columns:repeat(3,1fr);gap:1.5rem;}}
    @media(min-width:768px){.steps::before{content:"";position:absolute;top:2.25rem;left:12%;right:12%;height:1px;background:linear-gradient(90deg,transparent,rgba(99,102,241,0.35),rgba(34,211,238,0.25),transparent);z-index:0;}}
    .step{position:relative;border-radius:var(--r);border:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));padding:1.55rem 1.4rem;z-index:1;}
    .step-num{width:2.35rem;height:2.35rem;border-radius:11px;background:linear-gradient(135deg,var(--a1),var(--a2));color:#fff;font-weight:800;font-size:0.88rem;display:flex;align-items:center;justify-content:center;margin-bottom:0.9rem;font-family:Syne,sans-serif;box-shadow:0 8px 24px -6px rgba(99,102,241,0.55);}
    .step h3{font-family:Syne,sans-serif;font-size:1rem;margin-bottom:0.45rem;}
    .step p{font-size:0.86rem;color:var(--muted);}

    #faq{padding:3rem 0 4rem;}
    .faq-head{text-align:center;margin-bottom:2rem;}
    .faq-list{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:0.65rem;}
    details.faq{border-radius:16px;border:1px solid var(--border);background:linear-gradient(165deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015));overflow:hidden;backdrop-filter:blur(8px);}
    details.faq[open]{border-color:rgba(99,102,241,0.35);box-shadow:0 16px 40px -24px rgba(99,102,241,0.25);}
    details.faq summary{cursor:pointer;padding:1.05rem 1.2rem;font-weight:600;font-size:0.92rem;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:0.75rem;}
    details.faq summary::-webkit-details-marker{display:none;}
    details.faq summary svg{width:18px;height:18px;stroke:var(--muted);flex-shrink:0;transition:transform .2s;}
    details.faq[open] summary svg{transform:rotate(180deg);}
    .faq-a{padding:0 1.15rem 1.1rem;font-size:0.88rem;color:var(--muted);line-height:1.65;}

    #cta{padding:2rem 0 4.5rem;}
    .cta-box{max-width:560px;margin:0 auto;border-radius:calc(var(--r) + 6px);padding:2px;background:linear-gradient(135deg,var(--a1),var(--a3),var(--a2),var(--a2));background-size:200% 200%;animation:grad 8s ease infinite;}
    @keyframes grad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    .cta-inner{border-radius:var(--r);background:radial-gradient(ellipse 120% 80% at 50% -20%,rgba(99,102,241,0.12),transparent 50%),var(--bg2);padding:2.25rem 1.85rem;text-align:center;border:1px solid rgba(255,255,255,0.08);box-shadow:0 24px 80px -30px rgba(99,102,241,0.35);}
    .cta-inner h2{font-family:Syne,sans-serif;font-size:1.5rem;margin-bottom:0.5rem;}
    .cta-sub{color:var(--muted);font-size:0.92rem;margin-bottom:0.35rem;}
    .cta-label{font-size:0.75rem;color:var(--faint);margin:1rem 0 0.65rem;}
    .email-row{display:flex;flex-wrap:wrap;gap:0.6rem;justify-content:center;margin-top:0.5rem;}
    .email-row input{flex:1;min-width:200px;max-width:280px;padding:0.75rem 1rem;border-radius:12px;border:1px solid var(--border);background:rgba(0,0,0,0.45);color:var(--text);font:inherit;transition:border-color .2s,box-shadow .2s;}
    .email-row input:focus{outline:none;border-color:rgba(99,102,241,0.5);box-shadow:0 0 0 3px rgba(99,102,241,0.15);}
    .email-row input::placeholder{color:var(--faint);}
    .email-row .btn-primary{cursor:pointer;border:none;}

    footer{padding:2rem 0 2.5rem;border-top:1px solid var(--border);text-align:center;font-size:0.8rem;color:var(--faint);background:linear-gradient(180deg,transparent,rgba(99,102,241,0.03));}
    :focus-visible{outline:2px solid var(--a1);outline-offset:2px;}
  </style>
</head>
<body>
  <div class="mesh" aria-hidden="true"></div>
  <div class="grain" aria-hidden="true"></div>
  <div class="orbs" aria-hidden="true"><span></span><span></span><span></span></div>

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
      <a class="nav-cta" href="#cta" style="margin-top:0.5rem;text-align:center;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <div class="hero-accent-svg" aria-hidden="true"><svg viewBox="0 0 100 72" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 36 L35 18 L65 50 L90 28" stroke="url(#s1)" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="36" r="5" fill="#6366f1"/><circle cx="35" cy="18" r="5" fill="#6366f1" fill-opacity="0.55"/><circle cx="65" cy="50" r="5" fill="#22d3ee" fill-opacity="0.75"/><circle cx="90" cy="28" r="5" fill="#a855f7"/><defs><linearGradient id="s1" x1="0" y1="0" x2="100" y2="0"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs></svg></div>
          <div class="eyebrow"><span class="dot"></span> %%FLOAT_CARD_TITLE%%</div>
          <h1>%%HERO_HEADLINE%%</h1>
          <p class="lead">%%HERO_SUB%%</p>
          <div class="hero-ctas">
            <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
            <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
          </div>
        </div>
        <div class="hero-visual-wrap">
          <div class="hero-visual-inner">
            %%RAW_HERO_VISUAL%%
          </div>
        </div>
      </div>
    </section>

    <section class="trust-strip" id="trust" aria-label="Social proof">
      <div class="wrap">
        <div class="trust-row">
          <div class="trust-stars" aria-hidden="true">★★★★★</div>
          <div class="trust-copy">
            <p class="trust-eyebrow">%%SOCIAL_PROOF_EYEBROW%%</p>
            <p class="trust-main">%%SOCIAL_PROOF_MAIN%%</p>
          </div>
        </div>
      </div>
    </section>

    <section id="features">
      <div class="wrap feat-head">
        <p class="eyebrow" style="margin-bottom:0.75rem;"><span class="dot"></span> %%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title">%%BENEFITS_TITLE%%</h2>
        <div class="feat-deco" aria-hidden="true"></div>
      </div>
      <div class="wrap bento">
        <div class="card c1"><div class="fi"><span class="fn">01</span></div><h3>%%FEATURE1_TITLE%%</h3><p>%%FEATURE1_BODY%%</p></div>
        <div class="card c2"><div class="fi"><span class="fn">02</span></div><h3>%%FEATURE2_TITLE%%</h3><p>%%FEATURE2_BODY%%</p></div>
        <div class="card c3"><div class="fi"><span class="fn">03</span></div><h3>%%FEATURE3_TITLE%%</h3><p>%%FEATURE3_BODY%%</p></div>
      </div>
    </section>

    <section id="problem">
      <div class="wrap problem-inner">
        <p class="eyebrow"><span class="dot"></span> %%PROBLEM_EYEBROW%%</p>
        <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
        <p class="problem-body">%%PROBLEM_BODY%%</p>
        <blockquote class="pullquote">%%PROBLEM_QUOTE%%</blockquote>
      </div>
    </section>

    <section id="how">
      <div class="wrap how-head">
        <p class="eyebrow"><span class="dot"></span> %%HOW_EYEBROW%%</p>
        <h2 class="sec-title">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap steps">
        <div class="step"><div class="step-num">1</div><h3>%%HOW_STEP1_TITLE%%</h3><p>%%HOW_STEP1_BODY%%</p></div>
        <div class="step"><div class="step-num">2</div><h3>%%HOW_STEP2_TITLE%%</h3><p>%%HOW_STEP2_BODY%%</p></div>
        <div class="step"><div class="step-num">3</div><h3>%%HOW_STEP3_TITLE%%</h3><p>%%HOW_STEP3_BODY%%</p></div>
      </div>
    </section>

    <section id="faq">
      <div class="wrap faq-head">
        <p class="eyebrow"><span class="dot"></span> %%FAQ_EYEBROW%%</p>
        <h2 class="sec-title">%%FAQ_TITLE%%</h2>
      </div>
      <div class="wrap faq-list">
        <details class="faq"><summary>%%FAQ1_Q%% <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></summary><div class="faq-a">%%FAQ1_A%%</div></details>
        <details class="faq"><summary>%%FAQ2_Q%% <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></summary><div class="faq-a">%%FAQ2_A%%</div></details>
        <details class="faq"><summary>%%FAQ3_Q%% <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></summary><div class="faq-a">%%FAQ3_A%%</div></details>
      </div>
    </section>

    <section id="cta">
      <div class="wrap">
        <div class="cta-box">
          <div class="cta-inner">
            <h2>%%CTA_FINAL_TITLE%%</h2>
            <p class="cta-sub">%%CTA_FINAL_SUB%%</p>
            <p class="cta-label">%%FLOAT_CARD_TITLE%%</p>
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
