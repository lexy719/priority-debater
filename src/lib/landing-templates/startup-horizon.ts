/**
 * Startup Horizon — "Immersive Scroll Story" cinematic movie-poster landing page.
 * Outfit font, dark warm theme (#0c0a1a), rose→orange→amber gradient system.
 * Fullscreen hero with background image + gradient mesh overlay,
 * marquee ticker, alternating L/R feature showcase, split-number problem,
 * vertical accordion how-it-works, two-column FAQ grid, pulsing CTA band.
 * Floating 3D card effects, scroll-triggered reveals, parallax-like hero.
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

    /* ═══ ANIMATED GRADIENT MESH (fixed bg) ═══ */
    .gradient-mesh{
      position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;
    }
    .gm-blob{
      position:absolute;border-radius:50%;filter:blur(120px);
      animation:blobFloat 18s ease-in-out infinite;will-change:transform;
    }
    .gm-blob:nth-child(1){
      width:700px;height:700px;top:-18%;left:-8%;
      background:radial-gradient(circle,rgba(244,63,94,0.18),transparent 65%);
      animation-duration:20s;
    }
    .gm-blob:nth-child(2){
      width:550px;height:550px;top:35%;right:-12%;
      background:radial-gradient(circle,rgba(249,115,22,0.15),transparent 65%);
      animation-duration:24s;animation-delay:-6s;
    }
    .gm-blob:nth-child(3){
      width:500px;height:500px;bottom:-12%;left:35%;
      background:radial-gradient(circle,rgba(251,191,36,0.12),transparent 65%);
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

    /* ═══ GRADIENT TEXT HELPER ═══ */
    .grad-text{
      background:linear-gradient(135deg,var(--rose),var(--orange) 55%,var(--amber));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }

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

    /* ═══ FULLSCREEN HERO — cinematic bg image ═══ */
    .hero{
      position:relative;z-index:2;
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      overflow:hidden;
    }
    /* Background image layer */
    .hero .hero-visual{
      position:absolute;inset:0;z-index:0;overflow:hidden;
    }
    .hero .hero-visual img{
      width:100%;height:100%;object-fit:cover;display:block;
      transform:scale(1.05);transition:transform 8s ease-out;
    }
    .hero.on .hero-visual img{transform:scale(1);}
    .photo-credit{
      position:absolute;bottom:0.5rem;right:0.75rem;z-index:6;
      font-size:0.65rem;color:rgba(255,255,255,0.35);
    }
    .photo-credit a{color:rgba(255,255,255,0.5);}
    /* Gradient mesh overlay on top of image */
    .hero-overlay{
      position:absolute;inset:0;z-index:1;
      background:
        linear-gradient(180deg,rgba(12,10,26,0.55) 0%,rgba(12,10,26,0.3) 40%,rgba(12,10,26,0.7) 75%,var(--bg) 100%),
        radial-gradient(ellipse 80% 60% at 30% 20%,rgba(244,63,94,0.2),transparent 60%),
        radial-gradient(ellipse 60% 50% at 70% 60%,rgba(249,115,22,0.15),transparent 55%),
        radial-gradient(ellipse 50% 40% at 50% 80%,rgba(251,191,36,0.1),transparent 50%);
    }
    /* Hero content */
    .hero-content{
      position:relative;z-index:3;text-align:center;
      padding:clamp(7rem,14vh,10rem) clamp(1.25rem,4vw,2.25rem) clamp(4rem,8vh,6rem);
      max-width:860px;
    }
    /* Floating pill badges */
    .hero-pills{
      display:flex;flex-wrap:wrap;gap:0.6rem;justify-content:center;margin-bottom:2rem;
    }
    .hero-pill{
      padding:0.35rem 0.9rem;border-radius:999px;font-size:0.72rem;font-weight:600;
      letter-spacing:0.04em;text-transform:uppercase;
      border:1px solid rgba(244,63,94,0.25);background:rgba(244,63,94,0.08);
      color:var(--rose);backdrop-filter:blur(8px);
    }
    .hero-pill:nth-child(2){border-color:rgba(249,115,22,0.25);background:rgba(249,115,22,0.08);color:var(--orange);}
    .hero-pill:nth-child(3){border-color:rgba(251,191,36,0.25);background:rgba(251,191,36,0.08);color:var(--amber);}

    .hero h1{
      font-size:clamp(2.8rem,8vw,5.5rem);font-weight:900;
      line-height:0.98;letter-spacing:-0.05em;
      margin:0 auto 1.5rem;max-width:16ch;
      background:linear-gradient(135deg,#fff 0%,#fff 20%,var(--rose) 50%,var(--orange) 75%,var(--amber) 100%);
      background-size:200% 200%;animation:heroGrad 10s ease infinite;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      text-shadow:none;
    }
    @keyframes heroGrad{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}

    .hero .lead{
      color:rgba(255,255,255,0.75);font-size:clamp(1.05rem,2.2vw,1.3rem);
      max-width:48ch;margin:0 auto 2.5rem;line-height:1.7;
      text-shadow:0 1px 8px rgba(0,0,0,0.4);
    }
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.85rem;justify-content:center;}

    /* ═══ MARQUEE SOCIAL PROOF TICKER ═══ */
    .marquee-section{
      position:relative;z-index:2;
      padding:1.5rem 0;overflow:hidden;
      border-top:1px solid var(--border);border-bottom:1px solid var(--border);
      background:rgba(12,10,26,0.8);
    }
    .marquee-section::before,.marquee-section::after{
      content:'';position:absolute;top:0;bottom:0;width:100px;z-index:3;pointer-events:none;
    }
    .marquee-section::before{left:0;background:linear-gradient(90deg,var(--bg),transparent);}
    .marquee-section::after{right:0;background:linear-gradient(270deg,var(--bg),transparent);}
    .marquee-track{
      display:flex;gap:2rem;width:max-content;
      animation:marquee 28s linear infinite;
    }
    @keyframes marquee{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
    .marquee-item{
      display:flex;align-items:center;gap:0.5rem;
      padding:0.5rem 1rem;border-radius:999px;
      background:var(--surface);border:1px solid var(--border);
      font-size:0.78rem;font-weight:500;color:var(--muted);white-space:nowrap;
    }
    .marquee-item svg{width:14px;height:14px;stroke:var(--rose);fill:none;stroke-width:2;stroke-linecap:round;}

    /* ═══ SECTIONS — immersive near-viewport slides ═══ */
    section{padding:clamp(5rem,12vw,9rem) 0;position:relative;z-index:2;}
    .eyebrow{
      font-size:0.7rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;
      color:var(--rose);margin-bottom:0.85rem;display:inline-flex;align-items:center;gap:0.5rem;
    }
    .eyebrow::before{content:'';width:24px;height:2px;background:linear-gradient(90deg,var(--rose),var(--orange));border-radius:1px;}
    .sec-title{font-size:clamp(1.85rem,4.5vw,3rem);font-weight:800;letter-spacing:-0.04em;line-height:1.06;margin:0 0 1rem;}
    .sec-body{color:var(--muted);font-size:1.05rem;max-width:56ch;line-height:1.75;}

    /* ═══ FEATURES — Alternating L/R showcase cards ═══ */
    .features-section{
      background:linear-gradient(180deg,transparent,rgba(244,63,94,0.015) 30%,rgba(249,115,22,0.015) 70%,transparent);
    }
    .features-header{text-align:center;margin-bottom:clamp(3rem,7vw,5rem);}
    .feature-showcase{display:flex;flex-direction:column;gap:clamp(3rem,6vw,5rem);}
    .feat-row{
      display:grid;gap:clamp(2rem,4vw,3.5rem);align-items:center;
    }
    @media(min-width:768px){
      .feat-row{grid-template-columns:1fr 1fr;}
      .feat-row.reverse .feat-visual{order:-1;}
    }
    .feat-visual{
      border-radius:var(--radius);overflow:hidden;
      border:1px solid var(--border);
      background:var(--surface);
      transform:perspective(1000px) rotateY(2deg);
      transition:transform 0.6s var(--ease),box-shadow 0.6s var(--ease);
      box-shadow:0 20px 60px -16px rgba(0,0,0,0.5);
    }
    .feat-row.reverse .feat-visual{
      transform:perspective(1000px) rotateY(-2deg);
    }
    .feat-visual:hover{
      transform:perspective(1000px) rotateY(0deg) translateY(-4px);
      box-shadow:0 32px 80px -20px rgba(244,63,94,0.12),0 20px 60px -16px rgba(0,0,0,0.5);
    }
    .feat-visual-inner{
      aspect-ratio:16/10;
      background:linear-gradient(145deg,rgba(244,63,94,0.06),var(--bg) 60%);
      display:flex;align-items:center;justify-content:center;
      padding:2.5rem;
    }
    .feat-icon-circle{
      width:80px;height:80px;border-radius:50%;
      background:linear-gradient(135deg,var(--rose-dim),rgba(249,115,22,0.1));
      border:1px solid rgba(244,63,94,0.15);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 40px rgba(244,63,94,0.1);
    }
    .feat-icon-circle svg{width:36px;height:36px;stroke:var(--rose);fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;}
    .feat-row:nth-child(2) .feat-icon-circle{
      background:linear-gradient(135deg,rgba(249,115,22,0.1),rgba(251,191,36,0.08));
      border-color:rgba(249,115,22,0.15);box-shadow:0 0 40px rgba(249,115,22,0.1);
    }
    .feat-row:nth-child(2) .feat-icon-circle svg{stroke:var(--orange);}
    .feat-row:nth-child(3) .feat-icon-circle{
      background:linear-gradient(135deg,rgba(251,191,36,0.1),rgba(244,63,94,0.06));
      border-color:rgba(251,191,36,0.15);box-shadow:0 0 40px rgba(251,191,36,0.1);
    }
    .feat-row:nth-child(3) .feat-icon-circle svg{stroke:var(--amber);}
    .feat-text h3{
      font-size:clamp(1.3rem,2.8vw,1.65rem);font-weight:700;letter-spacing:-0.03em;
      margin:0 0 0.75rem;
    }
    .feat-text p{margin:0;color:var(--muted);font-size:1rem;line-height:1.7;max-width:44ch;}

    /* ═══ PROBLEM — Split number layout ═══ */
    .problem-section{
      border-top:1px solid var(--border);
      border-bottom:1px solid var(--border);
      background:linear-gradient(180deg,rgba(244,63,94,0.02),transparent 50%);
    }
    .problem-split{display:grid;gap:clamp(2rem,4vw,4rem);align-items:start;}
    @media(min-width:768px){.problem-split{grid-template-columns:auto 1fr;gap:clamp(3rem,5vw,5rem);}}
    .problem-number{
      font-size:clamp(6rem,14vw,10rem);font-weight:900;line-height:0.85;
      background:linear-gradient(180deg,rgba(244,63,94,0.25),rgba(244,63,94,0.04));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      user-select:none;
    }
    .problem-content{max-width:560px;}
    /* Warm gradient accent line */
    .accent-line{
      width:60px;height:3px;border-radius:2px;
      background:linear-gradient(90deg,var(--rose),var(--orange),var(--amber));
      margin:1.5rem 0;
    }
    .pullquote{
      margin-top:2rem;padding:1.5rem 2rem;border-radius:var(--radius-sm);
      border:1px solid var(--border);border-left:3px solid var(--rose);
      background:rgba(244,63,94,0.03);color:var(--muted);
      font-style:italic;font-size:0.95rem;line-height:1.65;position:relative;
    }
    .pullquote::before{
      content:'\\201C';position:absolute;top:-8px;left:14px;
      font-size:3rem;font-style:normal;line-height:1;
      background:linear-gradient(135deg,var(--rose),var(--orange));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;opacity:0.4;
    }

    /* ═══ HOW IT WORKS — Vertical accordion ═══ */
    .how-section{}
    .how-header{text-align:center;margin-bottom:clamp(2.5rem,5vw,4rem);}
    .accordion{max-width:720px;margin:0 auto;display:flex;flex-direction:column;gap:0.7rem;}
    .acc-item{
      border:1px solid var(--border);border-radius:var(--radius);
      background:var(--surface);overflow:hidden;
      transition:border-color 0.35s,box-shadow 0.35s;
    }
    .acc-item:hover{border-color:var(--border-hover);}
    .acc-item.active{
      border-color:rgba(244,63,94,0.2);
      box-shadow:0 8px 40px rgba(244,63,94,0.06);
    }
    .acc-trigger{
      cursor:pointer;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;
      background:transparent;border:none;color:var(--text);font:inherit;
      font-weight:600;font-size:1rem;width:100%;text-align:left;
      transition:color 0.3s;
    }
    .acc-trigger:hover{color:var(--rose);}
    .acc-step-num{
      width:38px;height:38px;border-radius:12px;flex-shrink:0;
      background:linear-gradient(135deg,var(--rose-dim),rgba(249,115,22,0.06));
      border:1px solid rgba(244,63,94,0.15);
      display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:0.9rem;
    }
    .acc-step-num span{
      background:linear-gradient(135deg,var(--rose),var(--orange));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .acc-chevron{
      width:20px;height:20px;margin-left:auto;flex-shrink:0;
      stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;
      transition:transform 0.4s var(--ease),stroke 0.3s;
    }
    .acc-item.active .acc-chevron{transform:rotate(180deg);stroke:var(--rose);}
    .acc-item.active .acc-trigger{color:var(--rose);border-bottom:1px solid var(--border);}
    .acc-body{
      max-height:0;overflow:hidden;transition:max-height 0.45s var(--ease);
    }
    .acc-body-inner{
      padding:1.25rem 1.5rem 1.5rem;padding-left:calc(1.5rem + 38px + 1rem);
      color:var(--muted);font-size:0.93rem;line-height:1.7;
    }

    /* ═══ FAQ — Two-column grid ═══ */
    .faq-section{}
    .faq-header{text-align:center;margin-bottom:clamp(2rem,4vw,3rem);}
    .faq-grid{
      display:grid;gap:0.75rem;max-width:880px;margin:0 auto;
    }
    @media(min-width:700px){.faq-grid{grid-template-columns:1fr 1fr;gap:1rem;}}
    .faq-card{
      border:1px solid var(--border);border-radius:var(--radius);
      background:var(--surface);overflow:hidden;
      transition:border-color 0.3s,box-shadow 0.3s;
      transform:perspective(1000px) rotateY(1deg);
    }
    .faq-card:nth-child(even){transform:perspective(1000px) rotateY(-1deg);}
    .faq-card:hover{border-color:var(--border-hover);transform:perspective(1000px) rotateY(0deg);}
    .faq-card[open]{border-color:rgba(244,63,94,0.2);box-shadow:0 0 32px rgba(244,63,94,0.04);transform:perspective(1000px) rotateY(0deg);}
    .faq-card summary{
      cursor:pointer;padding:1.15rem 1.3rem;font-weight:600;font-size:0.92rem;
      list-style:none;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;
    }
    .faq-card summary::-webkit-details-marker{display:none;}
    .faq-card summary .chev{width:18px;height:18px;flex-shrink:0;stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;transition:transform 0.35s var(--ease),stroke 0.3s;}
    .faq-card[open] summary .chev{transform:rotate(180deg);stroke:var(--rose);}
    .faq-card[open] summary{color:var(--rose);border-bottom:1px solid var(--border);}
    .faq-card .ans{padding:1rem 1.3rem 1.15rem;color:var(--muted);font-size:0.9rem;line-height:1.65;}

    /* ═══ CTA — Full-width gradient band with pulsing button ═══ */
    .cta-band{
      padding:clamp(5rem,12vw,8rem) 0;
      text-align:center;
      background:
        linear-gradient(180deg,var(--bg) 0%,rgba(244,63,94,0.05) 30%,rgba(249,115,22,0.06) 60%,var(--bg) 100%);
      border-top:1px solid var(--border);
    }
    .cta-band h2{
      font-size:clamp(2rem,4.5vw,3rem);font-weight:800;letter-spacing:-0.04em;
      line-height:1.06;margin:0 0 0.75rem;
    }
    .cta-band>div>p{margin:0 auto 2rem;color:var(--muted);font-size:1.05rem;max-width:44ch;line-height:1.7;}
    .cta-form{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;max-width:480px;margin:0 auto;}
    .cta-form input{
      flex:1 1 200px;min-width:0;padding:0.75rem 1rem;border-radius:12px;
      border:1px solid var(--border);background:rgba(0,0,0,0.4);
      color:var(--text);font:inherit;font-size:0.9rem;outline:none;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .cta-form input::placeholder{color:var(--faint);}
    .cta-form input:focus{border-color:var(--rose);box-shadow:0 0 0 3px rgba(244,63,94,0.12);}
    /* Pulsing CTA button */
    .btn-pulse{
      animation:ctaPulse 2.5s ease-in-out infinite;
    }
    @keyframes ctaPulse{
      0%,100%{box-shadow:0 4px 24px rgba(244,63,94,0.25);}
      50%{box-shadow:0 4px 36px rgba(244,63,94,0.45),0 0 60px rgba(244,63,94,0.15);}
    }

    /* ═══ FOOTER ═══ */
    footer{padding:2.5rem 0;border-top:1px solid var(--border);color:var(--faint);font-size:0.85rem;text-align:center;position:relative;z-index:2;}

    ::selection{background:rgba(244,63,94,0.25);color:#fff;}
    :focus-visible{outline:2px solid var(--rose);outline-offset:2px;}
    ::-webkit-scrollbar{width:8px;}
    ::-webkit-scrollbar-track{background:var(--bg);}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px;}

    /* ═══ RESPONSIVE FINE-TUNING ═══ */
    @media(max-width:767px){
      .hero{min-height:90vh;}
      .problem-number{font-size:5rem;}
      .feat-visual{transform:none!important;}
      .feat-visual:hover{transform:translateY(-4px)!important;}
      .faq-card,.faq-card:nth-child(even){transform:none;}
      .faq-card:hover,.faq-card[open]{transform:none;}
    }
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
        <a href="#features">%%NAV_FEATURES%%</a>
        <a href="#problem">%%NAV_PROBLEM%%</a>
        <a href="#how">%%NAV_HOW%%</a>
        <a href="#faq">%%NAV_FAQ%%</a>
      </nav>
      <a class="nav-cta" href="#cta">%%NAV_CTA%%</a>
      <button type="button" class="nav-toggle" data-tpl-nav-toggle aria-label="Menu">Menu</button>
    </div>
    <nav class="nav-mobile wrap" data-tpl-nav-mobile>
      <a href="#features">%%NAV_FEATURES%%</a>
      <a href="#problem">%%NAV_PROBLEM%%</a>
      <a href="#how">%%NAV_HOW%%</a>
      <a href="#faq">%%NAV_FAQ%%</a>
      <a class="nav-cta" href="#cta" style="margin-top:0.5rem;text-align:center;display:block;">%%NAV_CTA%%</a>
    </nav>
  </header>

  <main>
    <!-- ═══ 1. FULLSCREEN HERO — image as background ═══ -->
    <section class="hero rv">
      %%RAW_HERO_VISUAL%%
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-pills rv rv-d1">
          <span class="hero-pill">%%FEATURE1_TITLE%%</span>
          <span class="hero-pill">%%FEATURE2_TITLE%%</span>
          <span class="hero-pill">%%FEATURE3_TITLE%%</span>
        </div>
        <h1 class="rv rv-d2">%%HERO_HEADLINE%%</h1>
        <p class="lead rv rv-d3">%%HERO_SUB%%</p>
        <div class="hero-ctas rv rv-d4">
          <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
          <a class="btn btn-ghost" href="#features">%%CTA_SECONDARY%%</a>
        </div>
      </div>
    </section>

    <!-- Marquee social proof ticker -->
    <div class="marquee-section" aria-hidden="true">
      <div class="marquee-track">
        <span class="marquee-item"><svg viewBox="0 0 24 24"><polyline points="22 4 12 14.01 9 11.01"/></svg>%%FEATURE1_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>%%FEATURE2_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>%%FEATURE3_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>%%FLOAT_CARD_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><polyline points="22 4 12 14.01 9 11.01"/></svg>%%FEATURE1_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>%%FEATURE2_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>%%FEATURE3_TITLE%%</span>
        <span class="marquee-item"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>%%FLOAT_CARD_TITLE%%</span>
      </div>
    </div>

    <!-- ═══ 2. FEATURES FIRST — alternating L/R showcase ═══ -->
    <section id="features" class="features-section">
      <div class="wrap">
        <div class="features-header">
          <p class="eyebrow rv" style="justify-content:center;">%%BENEFITS_EYEBROW%%</p>
          <h2 class="sec-title rv grad-text">%%BENEFITS_TITLE%%</h2>
        </div>
        <div class="feature-showcase">
          <!-- Feature 1: visual LEFT, text RIGHT -->
          <div class="feat-row rv">
            <div class="feat-visual">
              <div class="feat-visual-inner">
                <div class="feat-icon-circle">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                </div>
              </div>
            </div>
            <div class="feat-text">
              <h3>%%FEATURE1_TITLE%%</h3>
              <p>%%FEATURE1_BODY%%</p>
            </div>
          </div>
          <!-- Feature 2: text LEFT, visual RIGHT -->
          <div class="feat-row reverse rv">
            <div class="feat-visual">
              <div class="feat-visual-inner">
                <div class="feat-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
              </div>
            </div>
            <div class="feat-text">
              <h3>%%FEATURE2_TITLE%%</h3>
              <p>%%FEATURE2_BODY%%</p>
            </div>
          </div>
          <!-- Feature 3: visual LEFT, text RIGHT -->
          <div class="feat-row rv">
            <div class="feat-visual">
              <div class="feat-visual-inner">
                <div class="feat-icon-circle">
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
              </div>
            </div>
            <div class="feat-text">
              <h3>%%FEATURE3_TITLE%%</h3>
              <p>%%FEATURE3_BODY%%</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 3. PROBLEM — Split number layout ═══ -->
    <section id="problem" class="problem-section">
      <div class="wrap">
        <div class="problem-split">
          <div class="rv">
            <div class="problem-number">01</div>
          </div>
          <div class="problem-content rv rv-d2">
            <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
            <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
            <div class="accent-line"></div>
            <p class="sec-body">%%PROBLEM_BODY%%</p>
            <blockquote class="pullquote">%%PROBLEM_QUOTE%%</blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 4. HOW IT WORKS — Vertical accordion ═══ -->
    <section id="how" class="how-section">
      <div class="wrap">
        <div class="how-header">
          <p class="eyebrow rv" style="justify-content:center;">%%HOW_EYEBROW%%</p>
          <h2 class="sec-title rv grad-text">%%HOW_TITLE%%</h2>
        </div>
        <div class="accordion">
          <div class="acc-item active rv rv-d1">
            <button class="acc-trigger" type="button">
              <span class="acc-step-num"><span>1</span></span>
              <span>%%HOW_STEP1_TITLE%%</span>
              <svg class="acc-chevron" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </button>
            <div class="acc-body"><div class="acc-body-inner">%%HOW_STEP1_BODY%%</div></div>
          </div>
          <div class="acc-item rv rv-d2">
            <button class="acc-trigger" type="button">
              <span class="acc-step-num"><span>2</span></span>
              <span>%%HOW_STEP2_TITLE%%</span>
              <svg class="acc-chevron" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </button>
            <div class="acc-body"><div class="acc-body-inner">%%HOW_STEP2_BODY%%</div></div>
          </div>
          <div class="acc-item rv rv-d3">
            <button class="acc-trigger" type="button">
              <span class="acc-step-num"><span>3</span></span>
              <span>%%HOW_STEP3_TITLE%%</span>
              <svg class="acc-chevron" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </button>
            <div class="acc-body"><div class="acc-body-inner">%%HOW_STEP3_BODY%%</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ 5. FAQ — Two-column grid ═══ -->
    <section id="faq" class="faq-section">
      <div class="wrap">
        <div class="faq-header">
          <p class="eyebrow rv" style="justify-content:center;">%%FAQ_EYEBROW%%</p>
          <h2 class="sec-title rv grad-text">%%FAQ_TITLE%%</h2>
        </div>
        <div class="faq-grid">
          <details class="faq-card rv rv-d1"><summary><span>%%FAQ1_Q%%</span><svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ1_A%%</div></details>
          <details class="faq-card rv rv-d2"><summary><span>%%FAQ2_Q%%</span><svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ2_A%%</div></details>
          <details class="faq-card rv rv-d3"><summary><span>%%FAQ3_Q%%</span><svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg></summary><div class="ans">%%FAQ3_A%%</div></details>
        </div>
      </div>
    </section>

    <!-- ═══ 6. CTA — Full-width gradient band ═══ -->
    <section id="cta" class="cta-band">
      <div class="wrap rv">
        <h2 class="grad-text">%%CTA_FINAL_TITLE%%</h2>
        <p>%%CTA_FINAL_SUB%%</p>
        <form class="cta-form" action="#" method="get" onsubmit="return false;">
          <input type="email" name="email" placeholder="%%EMAIL_PLACEHOLDER%%" autocomplete="email">
          <button type="button" class="btn btn-primary btn-pulse">%%FLOAT_CTA_LABEL%%</button>
        </form>
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

    /* Scroll reveal with IntersectionObserver */
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("on");obs.unobserve(e.target);}});
    },{threshold:0.08,rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll(".rv").forEach(function(el){obs.observe(el);});

    /* Accordion toggle */
    document.querySelectorAll(".acc-trigger").forEach(function(btn){
      btn.addEventListener("click",function(){
        var item=btn.parentElement;
        var body=item.querySelector(".acc-body");
        var isActive=item.classList.contains("active");
        /* Close all */
        document.querySelectorAll(".acc-item").forEach(function(ai){
          ai.classList.remove("active");
          ai.querySelector(".acc-body").style.maxHeight=null;
        });
        /* Open clicked if was closed */
        if(!isActive){
          item.classList.add("active");
          body.style.maxHeight=body.scrollHeight+"px";
        }
      });
    });
    /* Auto-expand first accordion item */
    var firstBody=document.querySelector(".acc-item.active .acc-body");
    if(firstBody){firstBody.style.maxHeight=firstBody.scrollHeight+"px";}
  })();
  </script>
</body>
</html>`;
