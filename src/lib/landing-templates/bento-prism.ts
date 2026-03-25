/**
 * Bento Prism — Cyberpunk neon with true 6-column bento grid, animated mesh
 * gradient, scanning line effects, glassmorphism with colored tints,
 * animated gradient borders, matrix dot grid, neon glow interactions.
 * Inspired by 21st.dev, Aceternity UI, Linear, Raycast.
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
    @property --beam-pos{syntax:"<percentage>";initial-value:0%;inherits:false;}

    :root{
      --bg:#030712;
      --bg2:#070b17;
      --glass:rgba(255,255,255,0.035);
      --glass-hover:rgba(255,255,255,0.06);
      --glass-border:rgba(255,255,255,0.07);
      --glass-border-hover:rgba(255,255,255,0.14);
      --text:rgba(255,255,255,0.94);
      --muted:rgba(255,255,255,0.55);
      --faint:rgba(255,255,255,0.28);
      --cyan:#22d3ee;
      --cyan-dim:rgba(34,211,238,0.12);
      --violet:#a78bfa;
      --violet-dim:rgba(167,139,250,0.10);
      --emerald:#34d399;
      --radius:20px;
      --radius-sm:14px;
      --max:1140px;
      --ease:cubic-bezier(0.4,0,0.2,1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{
      font-family:"Plus Jakarta Sans",system-ui,sans-serif;
      background:var(--bg);color:var(--text);
      font-size:1rem;line-height:1.6;
      -webkit-font-smoothing:antialiased;overflow-x:hidden;
    }

    /* ═══ ANIMATED MESH BACKGROUND ═══ */
    .mesh{
      position:fixed;inset:0;pointer-events:none;z-index:0;
      background:
        radial-gradient(ellipse 80% 60% at 15% -10%,rgba(34,211,238,0.12),transparent 50%),
        radial-gradient(ellipse 70% 55% at 90% 15%,rgba(167,139,250,0.14),transparent 45%),
        radial-gradient(ellipse 60% 40% at 50% 100%,rgba(52,211,153,0.08),transparent 40%),
        radial-gradient(ellipse 40% 30% at 5% 80%,rgba(167,139,250,0.06),transparent 35%);
      animation:meshShift 20s ease-in-out infinite alternate;
    }
    @keyframes meshShift{
      0%{filter:hue-rotate(0deg);}
      100%{filter:hue-rotate(15deg);}
    }

    /* Dot grid */
    .dot-grid{
      pointer-events:none;position:fixed;inset:0;z-index:0;opacity:0.03;
      background-image:radial-gradient(rgba(255,255,255,0.6) 1px,transparent 1px);
      background-size:28px 28px;
    }

    /* Scanning line effect */
    .scan-line{
      pointer-events:none;position:fixed;top:0;left:0;right:0;height:1px;z-index:1;
      background:linear-gradient(90deg,transparent,var(--cyan),transparent);
      opacity:0.06;
      animation:scanDown 8s linear infinite;
    }
    @keyframes scanDown{0%{top:0;}100%{top:100vh;}}

    /* Noise */
    .noise{
      pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.025;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* ═══ SCROLL REVEAL ═══ */
    .reveal{opacity:0;transform:translateY(36px);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease);}
    .reveal.vis{opacity:1;transform:translateY(0);}
    .reveal-d1{transition-delay:0.1s;}.reveal-d2{transition-delay:0.2s;}.reveal-d3{transition-delay:0.3s;}.reveal-d4{transition-delay:0.4s;}

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.25rem);position:relative;z-index:2;}

    /* ═══ HEADER ═══ */
    header{
      position:sticky;top:0;z-index:50;
      border-bottom:1px solid var(--glass-border);
      background:rgba(3,7,18,0.65);
      backdrop-filter:blur(24px) saturate(1.3);-webkit-backdrop-filter:blur(24px) saturate(1.3);
    }
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{
      font-weight:800;font-size:1.1rem;letter-spacing:-0.04em;text-decoration:none;
      background:linear-gradient(135deg,#fff 30%,var(--cyan) 70%,var(--violet));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .nav-links{display:none;gap:1.75rem;align-items:center;}
    .nav-links a{color:var(--muted);text-decoration:none;font-size:0.85rem;font-weight:500;transition:color 0.2s;position:relative;}
    .nav-links a::after{
      content:'';position:absolute;bottom:-2px;left:0;width:0;height:1.5px;
      background:linear-gradient(90deg,var(--cyan),var(--violet));border-radius:1px;
      transition:width 0.3s var(--ease);
    }
    .nav-links a:hover{color:var(--text);}
    .nav-links a:hover::after{width:100%;}
    .nav-cta{
      padding:0.5rem 1.15rem;border-radius:10px;font-weight:600;font-size:0.85rem;
      text-decoration:none;color:#030712;
      background:linear-gradient(135deg,var(--cyan),#06b6d4);
      box-shadow:0 0 24px rgba(34,211,238,0.2);
      transition:all 0.25s var(--ease);
    }
    .nav-cta:hover{box-shadow:0 0 40px rgba(34,211,238,0.35);transform:translateY(-1px);}
    .nav-toggle{
      display:flex;padding:0.5rem 0.75rem;border:1px solid var(--glass-border);
      border-radius:10px;background:var(--glass);color:var(--text);
      cursor:pointer;font-size:0.85rem;font-family:inherit;
    }
    @media(min-width:900px){.nav-links{display:flex;}.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.75rem;padding:0 0 1rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:0.45rem;
      padding:0.75rem 1.4rem;border-radius:12px;font-weight:600;font-size:0.9rem;
      text-decoration:none;border:1px solid transparent;cursor:pointer;font-family:inherit;
      transition:all 0.3s var(--ease);white-space:nowrap;position:relative;
    }
    .btn-primary{
      background:linear-gradient(135deg,var(--cyan),#06b6d4);color:#030712;
      box-shadow:0 0 32px rgba(34,211,238,0.18);overflow:hidden;
    }
    .btn-primary::before{
      content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);
      transition:left 0.5s;
    }
    .btn-primary:hover::before{left:100%;}
    .btn-primary:hover{box-shadow:0 0 48px rgba(34,211,238,0.32);transform:translateY(-2px);}
    .btn-ghost{background:transparent;border-color:var(--glass-border);color:var(--text);}
    .btn-ghost:hover{background:rgba(255,255,255,0.05);border-color:var(--glass-border-hover);transform:translateY(-1px);}

    /* ═══ HERO ═══ */
    .hero{padding:clamp(4rem,10vw,7rem) 0 clamp(3rem,7vw,5rem);text-align:center;position:relative;z-index:2;}
    /* Spotlight */
    .hero::before{
      content:'';position:absolute;top:-250px;left:50%;transform:translateX(-50%);
      width:1000px;height:700px;
      background:
        radial-gradient(ellipse 50% 50%,rgba(34,211,238,0.12),transparent 50%),
        radial-gradient(ellipse 40% 40% at 60% 40%,rgba(167,139,250,0.08),transparent 50%);
      pointer-events:none;z-index:-1;
    }

    .hero-tag{
      display:inline-flex;align-items:center;gap:0.6rem;
      padding:0.45rem 1rem 0.45rem 0.7rem;border-radius:999px;
      border:1px solid rgba(34,211,238,0.2);background:rgba(34,211,238,0.06);
      font-size:0.78rem;font-weight:600;color:var(--cyan);margin-bottom:2rem;
    }
    .hero-tag .pulse{
      width:8px;height:8px;border-radius:50%;background:var(--cyan);
      box-shadow:0 0 10px var(--cyan);animation:neonPulse 2s ease infinite;
    }
    @keyframes neonPulse{0%,100%{box-shadow:0 0 10px var(--cyan);}50%{box-shadow:0 0 20px var(--cyan),0 0 40px rgba(34,211,238,0.3);}}

    .hero h1{
      font-size:clamp(2.5rem,6.5vw,4.2rem);font-weight:800;
      line-height:1.04;letter-spacing:-0.045em;
      margin:0 auto 1.25rem;max-width:16ch;
      background:linear-gradient(135deg,var(--cyan) 0%,#fff 35%,#fff 65%,var(--violet) 100%);
      background-size:200% 200%;animation:heroGradient 8s ease infinite;
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    @keyframes heroGradient{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}

    .hero .lead{color:var(--muted);font-size:clamp(1.02rem,2vw,1.18rem);max-width:48ch;margin:0 auto 2.5rem;line-height:1.75;}
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.8rem;justify-content:center;margin-bottom:2.5rem;}

    /* Stat badges */
    .badges{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;margin-bottom:clamp(2.5rem,6vw,4rem);}
    .badge{
      display:inline-flex;align-items:center;gap:0.45rem;
      padding:0.5rem 1rem;border-radius:999px;
      background:var(--glass);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      border:1px solid var(--glass-border);
      font-size:0.8rem;font-weight:500;color:var(--muted);white-space:nowrap;
      transition:border-color 0.3s,color 0.3s;
    }
    .badge:hover{border-color:rgba(34,211,238,0.2);color:var(--text);}
    .badge svg{width:14px;height:14px;stroke:var(--cyan);fill:none;stroke-width:2;stroke-linecap:round;}

    /* Hero visual */
    .hero-visual-wrap{
      position:relative;max-width:780px;margin:0 auto;
    }
    /* Animated gradient border ring */
    .hero-visual-wrap::before{
      content:'';position:absolute;inset:-3px;border-radius:calc(var(--radius) + 7px);
      background:conic-gradient(from var(--beam-pos),var(--cyan),var(--violet),var(--emerald),var(--cyan));
      animation:beamSpin 4s linear infinite;z-index:-1;opacity:0.5;filter:blur(1px);
    }
    @keyframes beamSpin{from{--beam-pos:0%;}to{--beam-pos:100%;}}
    /* Fallback for browsers without @property */
    @supports not (background: paint(id)) {
      .hero-visual-wrap::before{
        background:linear-gradient(135deg,var(--cyan),var(--violet),var(--emerald),var(--cyan));
        background-size:300% 300%;animation:borderShimmer 4s ease infinite;
      }
      @keyframes borderShimmer{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
    }
    .hero-visual{
      border-radius:calc(var(--radius) + 4px);overflow:hidden;min-height:240px;
      border:1px solid rgba(34,211,238,0.1);
      background:linear-gradient(145deg,rgba(34,211,238,0.05),var(--bg));
      box-shadow:0 32px 80px -20px rgba(0,0,0,0.5),0 0 120px -40px rgba(34,211,238,0.15);
    }
    .hero-visual img{width:100%;height:100%;object-fit:cover;display:block;min-height:240px;}
    .photo-credit{font-size:0.7rem;color:var(--faint);padding:0.5rem 0.75rem;}
    .photo-credit a{color:var(--muted);}

    /* ═══ SECTIONS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .eyebrow{
      font-size:0.68rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;
      color:var(--cyan);margin-bottom:0.85rem;display:inline-flex;align-items:center;gap:0.5rem;
    }
    .eyebrow::before{content:'';width:20px;height:1.5px;background:linear-gradient(90deg,var(--cyan),var(--violet));border-radius:1px;}
    .sec-title{
      font-size:clamp(1.8rem,4vw,2.6rem);font-weight:700;
      letter-spacing:-0.04em;line-height:1.08;margin:0 0 1rem;
    }

    /* ═══ PROBLEM — Split glass card ═══ */
    .problem-glass{
      max-width:860px;margin:0 auto;
      padding:clamp(2.25rem,5vw,3.5rem);
      border-radius:calc(var(--radius) + 4px);
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      background:linear-gradient(160deg,rgba(34,211,238,0.04),var(--glass),rgba(167,139,250,0.03));
      border:1px solid var(--glass-border);
      box-shadow:0 0 0 1px rgba(255,255,255,0.02) inset,0 32px 80px -24px rgba(0,0,0,0.3);
      display:grid;gap:2.5rem;
    }
    @media(min-width:768px){.problem-glass{grid-template-columns:1fr 1fr;gap:clamp(2.5rem,5vw,4rem);}}
    .prob-col .eyebrow{text-align:left;}
    .prob-body{color:var(--muted);font-size:1rem;line-height:1.75;margin:0;}
    .pullquote{
      padding:1.5rem 1.75rem;border-radius:var(--radius-sm);
      border:1px solid var(--glass-border);border-left:3px solid var(--cyan);
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      background:rgba(34,211,238,0.03);
      color:var(--muted);font-style:italic;font-size:0.95rem;line-height:1.65;
    }

    /* ═══ FEATURES — TRUE BENTO 6-COL GRID ═══ */
    .bento-section{
      background:linear-gradient(180deg,rgba(34,211,238,0.02),transparent 30%,transparent 70%,rgba(167,139,250,0.02));
      border-top:1px solid var(--glass-border);border-bottom:1px solid var(--glass-border);
    }
    .bento{display:grid;gap:0.85rem;margin-top:2.5rem;}
    @media(min-width:640px){.bento{grid-template-columns:repeat(6,1fr);}}

    .bento-card{
      padding:clamp(1.5rem,3vw,2rem);border-radius:var(--radius);
      border:1px solid var(--glass-border);
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      background:var(--glass);
      position:relative;overflow:hidden;
      transition:transform 0.35s var(--ease),border-color 0.35s,box-shadow 0.35s;
    }
    /* Spotlight hover follow */
    .bento-card::before{
      content:'';position:absolute;inset:0;
      background:radial-gradient(500px circle at var(--mx,50%) var(--my,50%),rgba(34,211,238,0.06),transparent 40%);
      pointer-events:none;opacity:0;transition:opacity 0.4s;
    }
    .bento-card:hover::before{opacity:1;}
    .bento-card:hover{
      transform:translateY(-3px);
      border-color:rgba(34,211,238,0.2);
      box-shadow:0 16px 64px -16px rgba(34,211,238,0.1);
    }

    /* Bento layout */
    @media(min-width:640px){
      .bento-card:nth-child(1){grid-column:span 4;grid-row:span 2;}
      .bento-card:nth-child(2){grid-column:span 2;}
      .bento-card:nth-child(3){grid-column:span 2;}
    }
    @media(min-width:900px){
      .bento-card:nth-child(1){grid-column:span 3;grid-row:span 2;}
      .bento-card:nth-child(2){grid-column:span 3;}
      .bento-card:nth-child(3){grid-column:span 3;}
    }

    /* Card 1 — hero card (tall) */
    .bento-card:nth-child(1){
      display:flex;flex-direction:column;justify-content:center;
      background:linear-gradient(160deg,rgba(34,211,238,0.06),var(--glass),rgba(167,139,250,0.04));
    }
    .bento-card:nth-child(1) .card-icon{width:56px;height:56px;border-radius:16px;}
    .bento-card:nth-child(1) .card-icon svg{width:28px;height:28px;}
    .bento-card:nth-child(1) h3{font-size:1.2rem;}
    .bento-card:nth-child(1) p{font-size:0.98rem;}

    .card-icon{
      width:48px;height:48px;border-radius:14px;
      background:linear-gradient(135deg,var(--cyan-dim),var(--violet-dim));
      border:1px solid rgba(34,211,238,0.12);
      display:flex;align-items:center;justify-content:center;margin-bottom:1.15rem;
    }
    .card-icon svg{width:22px;height:22px;stroke:var(--cyan);fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
    .bento-card h3{margin:0 0 0.55rem;font-size:1.05rem;font-weight:650;letter-spacing:-0.02em;}
    .bento-card p{margin:0;color:var(--muted);font-size:0.9rem;line-height:1.6;}

    /* ═══ HOW IT WORKS — Horizontal timeline ═══ */
    .timeline-section{position:relative;}
    .timeline{display:grid;gap:1.25rem;margin-top:3rem;position:relative;}
    @media(min-width:768px){
      .timeline{grid-template-columns:repeat(3,1fr);gap:0;}
    }
    /* Connecting beam line */
    @media(min-width:768px){
      .timeline::before{
        content:'';position:absolute;top:28px;left:calc(16.67%);right:calc(16.67%);
        height:2px;
        background:linear-gradient(90deg,var(--cyan),var(--violet),var(--emerald));
        border-radius:2px;z-index:0;
      }
    }
    .tl-step{text-align:center;position:relative;z-index:1;padding:0 1.25rem;}
    .tl-dot{
      width:56px;height:56px;border-radius:50%;margin:0 auto 1.5rem;
      background:var(--bg);
      border:2px solid var(--glass-border);
      display:flex;align-items:center;justify-content:center;
      font-weight:800;font-size:1rem;
      position:relative;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .tl-dot span{
      background:linear-gradient(135deg,var(--cyan),var(--violet));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .tl-step:hover .tl-dot{
      border-color:var(--cyan);
      box-shadow:0 0 32px rgba(34,211,238,0.15),0 0 0 4px rgba(34,211,238,0.06);
    }
    .tl-step h3{margin:0 0 0.5rem;font-size:1.05rem;font-weight:650;letter-spacing:-0.02em;}
    .tl-step p{margin:0;color:var(--muted);font-size:0.9rem;line-height:1.6;max-width:32ch;margin-left:auto;margin-right:auto;}

    /* ═══ FAQ — Neon glass accordion ═══ */
    .faq-list{margin-top:2.25rem;max-width:700px;display:flex;flex-direction:column;gap:0.6rem;}
    .faq-item{
      border:1px solid var(--glass-border);border-radius:var(--radius-sm);
      backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
      background:var(--glass);overflow:hidden;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .faq-item:hover{border-color:var(--glass-border-hover);}
    .faq-item[open]{border-color:rgba(34,211,238,0.2);box-shadow:0 0 40px rgba(34,211,238,0.04);}
    .faq-item summary{
      cursor:pointer;padding:1.15rem 1.35rem;font-weight:600;font-size:0.95rem;
      list-style:none;display:flex;align-items:center;justify-content:space-between;gap:1rem;
      transition:color 0.2s;user-select:none;
    }
    .faq-item summary::-webkit-details-marker{display:none;}
    .faq-item summary .chev{
      width:20px;height:20px;flex-shrink:0;stroke:var(--muted);fill:none;
      stroke-width:2;stroke-linecap:round;
      transition:transform 0.35s var(--ease),stroke 0.35s;
    }
    .faq-item[open] summary .chev{transform:rotate(180deg);stroke:var(--cyan);}
    .faq-item[open] summary{color:var(--cyan);border-bottom:1px solid var(--glass-border);}
    .faq-item .ans{padding:1.1rem 1.35rem 1.25rem;color:var(--muted);font-size:0.92rem;line-height:1.65;}

    /* ═══ CTA — Animated border beam ═══ */
    .cta-final{text-align:center;padding:clamp(5rem,10vw,8rem) 0;}
    .cta-box{
      max-width:640px;margin:0 auto;
      padding:clamp(2.5rem,6vw,3.5rem);
      border-radius:calc(var(--radius) + 4px);
      position:relative;overflow:hidden;
      backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
      background:rgba(255,255,255,0.025);
    }
    /* Animated conic gradient border */
    .cta-box::before{
      content:'';position:absolute;inset:-200%;width:500%;height:500%;
      top:50%;left:50%;transform:translate(-50%,-50%);
      background:conic-gradient(from 0deg,transparent,var(--cyan),transparent,var(--violet),transparent);
      animation:ctaRot 5s linear infinite;z-index:-2;
    }
    .cta-box::after{content:'';position:absolute;inset:2px;border-radius:inherit;background:var(--bg);z-index:-1;}
    @keyframes ctaRot{from{transform:translate(-50%,-50%) rotate(0deg);}to{transform:translate(-50%,-50%) rotate(360deg);}}

    .cta-box h2{margin:0 0 0.6rem;font-size:clamp(1.5rem,3.2vw,2rem);font-weight:700;letter-spacing:-0.03em;position:relative;z-index:1;}
    .cta-box>p{margin:0 0 1.75rem;color:var(--muted);font-size:0.95rem;line-height:1.6;position:relative;z-index:1;}
    .cta-label{font-size:0.82rem;color:var(--faint);margin:0 0 0.75rem;font-weight:500;position:relative;z-index:1;}
    .cta-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;position:relative;z-index:1;}
    .cta-row input{
      flex:1 1 200px;min-width:0;padding:0.72rem 1rem;border-radius:10px;
      border:1px solid var(--glass-border);background:rgba(0,0,0,0.5);
      color:var(--text);font:inherit;font-size:0.9rem;outline:none;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .cta-row input::placeholder{color:var(--faint);}
    .cta-row input:focus{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(34,211,238,0.12);}

    /* ═══ FOOTER ═══ */
    footer{
      padding:2.5rem 0;border-top:1px solid var(--glass-border);
      color:var(--faint);font-size:0.85rem;text-align:center;
      position:relative;z-index:2;
    }

    /* ═══ UTILITIES ═══ */
    ::selection{background:rgba(34,211,238,0.25);color:#fff;}
    :focus-visible{outline:2px solid var(--cyan);outline-offset:2px;}
    ::-webkit-scrollbar{width:8px;}
    ::-webkit-scrollbar-track{background:var(--bg);}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:4px;}
    ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.14);}
  </style>
</head>
<body>
  <div class="mesh" aria-hidden="true"></div>
  <div class="dot-grid" aria-hidden="true"></div>
  <div class="scan-line" aria-hidden="true"></div>
  <div class="noise" aria-hidden="true"></div>

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
        <div class="hero-tag reveal"><span class="pulse"></span>%%FLOAT_CARD_TITLE%%</div>
        <h1 class="reveal reveal-d1">%%HERO_HEADLINE%%</h1>
        <p class="lead reveal reveal-d2">%%HERO_SUB%%</p>
        <div class="hero-ctas reveal reveal-d2">
          <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
          <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
        </div>
        <div class="badges reveal reveal-d3">
          <span class="badge">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            %%FEATURE1_TITLE%%
          </span>
          <span class="badge">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            %%FEATURE2_TITLE%%
          </span>
          <span class="badge">
            <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            %%FEATURE3_TITLE%%
          </span>
        </div>
        <div class="hero-visual-wrap reveal reveal-d4">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>

    <!-- ─── Problem ─── -->
    <section id="problem">
      <div class="wrap">
        <div class="problem-glass reveal">
          <div class="prob-col">
            <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
            <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
            <p class="prob-body">%%PROBLEM_BODY%%</p>
          </div>
          <div class="prob-col">
            <blockquote class="pullquote">%%PROBLEM_QUOTE%%</blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Features — Bento grid ─── -->
    <section id="features" class="bento-section">
      <div class="wrap">
        <p class="eyebrow reveal">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title reveal">%%BENEFITS_TITLE%%</h2>
        <div class="bento">
          <div class="bento-card reveal reveal-d1">
            <div class="card-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <h3>%%FEATURE1_TITLE%%</h3>
            <p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="bento-card reveal reveal-d2">
            <div class="card-icon">
              <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3>%%FEATURE2_TITLE%%</h3>
            <p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="bento-card reveal reveal-d3">
            <div class="card-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3>%%FEATURE3_TITLE%%</h3>
            <p>%%FEATURE3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── How It Works — Horizontal timeline ─── -->
    <section id="how" class="timeline-section">
      <div class="wrap" style="text-align:center;">
        <p class="eyebrow reveal" style="justify-content:center;">%%HOW_EYEBROW%%</p>
        <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;">%%HOW_TITLE%%</h2>
      </div>
      <div class="wrap">
        <div class="timeline">
          <div class="tl-step reveal reveal-d1">
            <div class="tl-dot"><span>1</span></div>
            <h3>%%HOW_STEP1_TITLE%%</h3>
            <p>%%HOW_STEP1_BODY%%</p>
          </div>
          <div class="tl-step reveal reveal-d2">
            <div class="tl-dot"><span>2</span></div>
            <h3>%%HOW_STEP2_TITLE%%</h3>
            <p>%%HOW_STEP2_BODY%%</p>
          </div>
          <div class="tl-step reveal reveal-d3">
            <div class="tl-dot"><span>3</span></div>
            <h3>%%HOW_STEP3_TITLE%%</h3>
            <p>%%HOW_STEP3_BODY%%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FAQ ─── -->
    <section id="faq">
      <div class="wrap">
        <p class="eyebrow reveal">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title reveal">%%FAQ_TITLE%%</h2>
        <div class="faq-list">
          <details class="faq-item reveal reveal-d1">
            <summary>
              <span>%%FAQ1_Q%%</span>
              <svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </summary>
            <div class="ans">%%FAQ1_A%%</div>
          </details>
          <details class="faq-item reveal reveal-d2">
            <summary>
              <span>%%FAQ2_Q%%</span>
              <svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </summary>
            <div class="ans">%%FAQ2_A%%</div>
          </details>
          <details class="faq-item reveal reveal-d3">
            <summary>
              <span>%%FAQ3_Q%%</span>
              <svg class="chev" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </summary>
            <div class="ans">%%FAQ3_A%%</div>
          </details>
        </div>
      </div>
    </section>

    <!-- ─── CTA ─── -->
    <section id="cta" class="cta-final">
      <div class="wrap">
        <div class="cta-box reveal">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <p class="cta-label">%%FLOAT_CARD_TITLE%%</p>
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
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add("vis");obs.unobserve(e.target);}});
    },{threshold:0.08,rootMargin:"0px 0px -40px 0px"});
    document.querySelectorAll(".reveal").forEach(function(el){obs.observe(el);});

    /* Card spotlight follow */
    document.querySelectorAll(".bento-card").forEach(function(card){
      card.addEventListener("mousemove",function(e){
        var r=card.getBoundingClientRect();
        card.style.setProperty("--mx",(e.clientX-r.left)+"px");
        card.style.setProperty("--my",(e.clientY-r.top)+"px");
      });
    });
  })();
  </script>
</body>
</html>`;
