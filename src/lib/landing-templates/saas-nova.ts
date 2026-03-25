/**
 * SaaS Nova — Premium dark SaaS with animated aurora background, floating orbs,
 * gradient mesh, scroll-reveal animations, glassmorphism cards with glow borders,
 * spotlight hero, animated gradient CTAs. Inspired by Linear, Stripe, Vercel.
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
    /* ═══════════════════════════════════════════════════════
       CSS CUSTOM PROPERTIES (Houdini for smooth transitions)
       ═══════════════════════════════════════════════════════ */
    @property --aurora-1 { syntax: "<color>"; initial-value: #7c3aed; inherits: false; }
    @property --aurora-2 { syntax: "<color>"; initial-value: #4f46e5; inherits: false; }
    @property --aurora-3 { syntax: "<color>"; initial-value: #6d28d9; inherits: false; }
    @property --glow-opacity { syntax: "<number>"; initial-value: 0; inherits: false; }

    :root {
      --bg: #050507;
      --bg2: #0a0a0f;
      --surface: rgba(255,255,255,0.03);
      --surface-hover: rgba(255,255,255,0.06);
      --border: rgba(255,255,255,0.06);
      --border-hover: rgba(255,255,255,0.12);
      --text: rgba(255,255,255,0.93);
      --muted: rgba(255,255,255,0.55);
      --faint: rgba(255,255,255,0.3);
      --accent: #7c3aed;
      --accent2: #a78bfa;
      --accent3: #4f46e5;
      --radius: 16px;
      --radius-lg: 24px;
      --max: 1120px;
      --ease: cubic-bezier(0.4, 0, 0.2, 1);
    }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html{scroll-behavior:smooth;}
    body{
      font-family:Inter,system-ui,-apple-system,sans-serif;
      background:var(--bg);color:var(--text);
      font-size:1rem;line-height:1.6;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
      overflow-x:hidden;
    }

    /* ═══ ANIMATED AURORA BACKGROUND ═══ */
    .aurora{
      position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;
    }
    .aurora-orb{
      position:absolute;border-radius:50%;filter:blur(80px);
      animation:auroraFloat 20s ease-in-out infinite;
      will-change:transform;
    }
    .aurora-orb:nth-child(1){
      width:600px;height:600px;top:-15%;left:-10%;
      background:radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%);
      animation-duration:22s;
    }
    .aurora-orb:nth-child(2){
      width:500px;height:500px;top:20%;right:-15%;
      background:radial-gradient(circle,rgba(79,70,229,0.2),transparent 70%);
      animation-duration:18s;animation-delay:-5s;
    }
    .aurora-orb:nth-child(3){
      width:450px;height:450px;bottom:-10%;left:30%;
      background:radial-gradient(circle,rgba(167,139,250,0.18),transparent 70%);
      animation-duration:25s;animation-delay:-10s;
    }
    .aurora-orb:nth-child(4){
      width:350px;height:350px;top:50%;left:60%;
      background:radial-gradient(circle,rgba(109,40,217,0.15),transparent 70%);
      animation-duration:30s;animation-delay:-15s;
    }
    @keyframes auroraFloat{
      0%,100%{transform:translate(0,0) scale(1);}
      25%{transform:translate(60px,-40px) scale(1.1);}
      50%{transform:translate(-30px,50px) scale(0.95);}
      75%{transform:translate(40px,20px) scale(1.05);}
    }

    /* Noise grain overlay */
    .noise{
      pointer-events:none;position:fixed;inset:0;z-index:1;opacity:0.03;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* Dot grid pattern */
    .dot-grid{
      pointer-events:none;position:fixed;inset:0;z-index:0;opacity:0.025;
      background-image:radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px);
      background-size:32px 32px;
    }

    /* ═══ LAYOUT ═══ */
    .wrap{width:100%;max-width:var(--max);margin:0 auto;padding:0 clamp(1.25rem,4vw,2.25rem);position:relative;z-index:2;}

    /* ═══ SCROLL REVEAL ═══ */
    .reveal{opacity:0;transform:translateY(32px);transition:opacity 0.8s var(--ease),transform 0.8s var(--ease);}
    .reveal.visible{opacity:1;transform:translateY(0);}
    .reveal-delay-1{transition-delay:0.1s;}
    .reveal-delay-2{transition-delay:0.2s;}
    .reveal-delay-3{transition-delay:0.3s;}

    /* ═══ HEADER ═══ */
    header{
      position:sticky;top:0;z-index:50;
      border-bottom:1px solid var(--border);
      background:rgba(5,5,7,0.6);
      backdrop-filter:blur(24px) saturate(1.5);
      -webkit-backdrop-filter:blur(24px) saturate(1.5);
    }
    .nav-inner{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:64px;flex-wrap:wrap;}
    .logo{
      font-weight:700;font-size:1.1rem;letter-spacing:-0.04em;
      text-decoration:none;color:var(--text);
      transition:opacity 0.2s;
    }
    .logo:hover{opacity:0.8;}
    .nav-links{display:none;gap:2rem;align-items:center;}
    @media(min-width:900px){.nav-links{display:flex;}}
    .nav-links a{
      color:var(--muted);text-decoration:none;font-size:0.85rem;font-weight:500;
      transition:color 0.2s;position:relative;
    }
    .nav-links a::after{
      content:'';position:absolute;bottom:-3px;left:0;width:0;height:1.5px;
      background:linear-gradient(90deg,var(--accent),var(--accent2));
      border-radius:1px;transition:width 0.3s var(--ease);
    }
    .nav-links a:hover{color:var(--text);}
    .nav-links a:hover::after{width:100%;}
    .nav-cta{
      padding:0.5rem 1.15rem;border-radius:10px;font-weight:600;font-size:0.85rem;
      text-decoration:none;color:#fff;
      background:linear-gradient(135deg,var(--accent3),var(--accent));
      box-shadow:0 0 20px rgba(124,58,237,0.2),inset 0 1px 0 rgba(255,255,255,0.1);
      transition:all 0.25s var(--ease);
    }
    .nav-cta:hover{box-shadow:0 0 32px rgba(124,58,237,0.35),inset 0 1px 0 rgba(255,255,255,0.1);transform:translateY(-1px);}
    .nav-toggle{
      display:flex;align-items:center;padding:0.5rem 0.8rem;
      border:1px solid var(--border);border-radius:10px;
      background:transparent;color:var(--text);cursor:pointer;
      font-size:0.85rem;font-family:inherit;transition:background 0.2s;
    }
    .nav-toggle:hover{background:rgba(255,255,255,0.04);}
    @media(min-width:900px){.nav-toggle{display:none;}}
    .nav-mobile{display:none;width:100%;flex-direction:column;gap:0.5rem;padding:0.5rem 0 1.25rem;}
    .nav-mobile.open{display:flex;}
    .nav-mobile a{color:var(--muted);text-decoration:none;font-size:0.95rem;padding:0.4rem 0;transition:color 0.2s;}
    .nav-mobile a:hover{color:var(--text);}
    @media(min-width:900px){.nav-mobile{display:none!important;}}

    /* ═══ BUTTONS ═══ */
    .btn{
      display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;
      padding:0.75rem 1.5rem;border-radius:12px;
      font-weight:600;font-size:0.92rem;text-decoration:none;
      border:1px solid transparent;cursor:pointer;font-family:inherit;
      transition:all 0.3s var(--ease);white-space:nowrap;position:relative;overflow:hidden;
    }
    .btn-primary{
      background:linear-gradient(135deg,var(--accent3),var(--accent));
      color:#fff;
      box-shadow:0 1px 3px rgba(0,0,0,0.3),0 8px 28px rgba(124,58,237,0.25),inset 0 1px 0 rgba(255,255,255,0.1);
    }
    .btn-primary::before{
      content:'';position:absolute;inset:0;
      background:linear-gradient(135deg,transparent 40%,rgba(255,255,255,0.15) 50%,transparent 60%);
      transform:translateX(-100%);transition:transform 0.6s;
    }
    .btn-primary:hover::before{transform:translateX(100%);}
    .btn-primary:hover{
      box-shadow:0 1px 3px rgba(0,0,0,0.3),0 14px 40px rgba(124,58,237,0.35),inset 0 1px 0 rgba(255,255,255,0.15);
      transform:translateY(-2px);
    }
    .btn-ghost{background:rgba(255,255,255,0.04);border-color:var(--border);color:var(--text);}
    .btn-ghost:hover{background:rgba(255,255,255,0.08);border-color:var(--border-hover);transform:translateY(-1px);}

    /* ═══ HERO ═══ */
    .hero{padding:clamp(4rem,10vw,7rem) 0 clamp(3rem,8vw,5rem);position:relative;z-index:2;text-align:center;overflow:visible;}

    /* Spotlight effect behind hero */
    .hero::before{
      content:'';position:absolute;top:-200px;left:50%;transform:translateX(-50%);
      width:900px;height:600px;
      background:radial-gradient(ellipse 100% 100%,rgba(124,58,237,0.18),transparent 60%);
      pointer-events:none;z-index:-1;
    }

    /* Floating tag pill */
    .hero-tag{
      display:inline-flex;align-items:center;gap:0.5rem;
      padding:0.45rem 1rem 0.45rem 0.65rem;
      border-radius:999px;border:1px solid rgba(124,58,237,0.25);
      background:rgba(124,58,237,0.08);
      font-size:0.8rem;font-weight:500;color:var(--accent2);
      margin-bottom:1.75rem;
      animation:tagPulse 3s ease-in-out infinite;
    }
    .hero-tag .dot{
      width:7px;height:7px;border-radius:50%;
      background:var(--accent);
      box-shadow:0 0 8px var(--accent);
      animation:dotPulse 2s ease-in-out infinite;
    }
    @keyframes tagPulse{0%,100%{opacity:1;}50%{opacity:0.85;}}
    @keyframes dotPulse{0%,100%{box-shadow:0 0 8px var(--accent);}50%{box-shadow:0 0 16px var(--accent),0 0 32px rgba(124,58,237,0.3);}}

    .hero h1{
      font-size:clamp(2.8rem,7vw,4.5rem);font-weight:800;
      line-height:1.04;letter-spacing:-0.045em;
      margin:0 auto 1.5rem;max-width:16ch;
      background:linear-gradient(135deg,#fff 0%,#fff 30%,#ddd6fe 60%,#a78bfa 80%,#7c3aed 100%);
      background-size:200% 200%;
      animation:gradientText 8s ease infinite;
      -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    }
    @keyframes gradientText{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;};}

    .hero .lead{
      color:var(--muted);font-size:clamp(1.05rem,2.2vw,1.22rem);
      max-width:48ch;margin:0 auto 2.5rem;line-height:1.75;
    }
    .hero-ctas{display:flex;flex-wrap:wrap;gap:0.85rem;justify-content:center;margin-bottom:3rem;}

    /* Social proof bar */
    .social-proof{
      display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.5rem;
      margin-bottom:clamp(2.5rem,6vw,4rem);
    }
    .proof-item{
      display:flex;align-items:center;gap:0.5rem;
      font-size:0.82rem;color:var(--faint);font-weight:500;
    }
    .proof-item svg{width:16px;height:16px;stroke:var(--accent2);fill:none;stroke-width:2;stroke-linecap:round;}
    .proof-divider{width:1px;height:20px;background:var(--border);display:none;}
    @media(min-width:640px){.proof-divider{display:block;}}

    /* Hero visual with floating glow */
    .hero-visual-container{
      position:relative;max-width:880px;margin:0 auto;
    }
    .hero-visual-container::before{
      content:'';position:absolute;inset:-4px;border-radius:calc(var(--radius-lg) + 4px);
      background:linear-gradient(135deg,rgba(124,58,237,0.4),rgba(79,70,229,0.15),rgba(167,139,250,0.3));
      background-size:300% 300%;animation:borderShimmer 6s ease infinite;
      z-index:-1;opacity:0.6;filter:blur(2px);
    }
    @keyframes borderShimmer{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;};}
    .hero-visual{
      border-radius:var(--radius-lg);overflow:hidden;
      border:1px solid rgba(124,58,237,0.15);
      min-height:240px;
      background:linear-gradient(145deg,rgba(124,58,237,0.08),var(--bg));
      box-shadow:0 32px 80px -12px rgba(0,0,0,0.5),0 0 120px -40px rgba(124,58,237,0.2);
    }
    .hero-visual img{width:100%;height:100%;object-fit:cover;display:block;min-height:240px;}
    .photo-credit{font-size:0.7rem;color:var(--faint);padding:0.5rem 0.75rem;}
    .photo-credit a{color:var(--muted);}

    /* ═══ SECTIONS ═══ */
    section{padding:clamp(5rem,10vw,8rem) 0;position:relative;z-index:2;}
    .eyebrow{
      font-size:0.7rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;
      color:var(--accent2);margin-bottom:0.85rem;display:inline-flex;align-items:center;gap:0.5rem;
    }
    .eyebrow::before{content:'';width:24px;height:1.5px;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:1px;}
    .sec-title{
      font-size:clamp(1.85rem,4vw,2.75rem);font-weight:700;
      letter-spacing:-0.04em;line-height:1.08;margin:0 0 1rem;color:var(--text);
    }
    .sec-body{color:var(--muted);font-size:1.05rem;max-width:56ch;line-height:1.75;}

    /* ═══ FLOAT CARD (email) ═══ */
    .float-card{
      max-width:520px;margin:0 auto 2.5rem;padding:1.15rem 1.35rem;
      border-radius:var(--radius);border:1px solid var(--border);
      background:rgba(255,255,255,0.025);
      backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
      box-shadow:0 8px 32px rgba(0,0,0,0.15);
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    .float-card:hover{border-color:rgba(124,58,237,0.2);box-shadow:0 8px 48px rgba(0,0,0,0.2);}
    .float-card p{margin:0 0 0.85rem;font-size:0.88rem;color:var(--muted);text-align:center;}
    .float-row{display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;}
    .float-row input{
      flex:1 1 200px;min-width:0;padding:0.7rem 1rem;
      border-radius:10px;border:1px solid var(--border);
      background:rgba(0,0,0,0.5);color:var(--text);font:inherit;font-size:0.9rem;
      outline:none;transition:border-color 0.3s,box-shadow 0.3s;
    }
    .float-row input::placeholder{color:var(--faint);}
    .float-row input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,58,237,0.15);}

    /* ═══ PROBLEM ═══ */
    .problem-wrap{display:grid;gap:3rem;align-items:start;}
    @media(min-width:768px){.problem-wrap{grid-template-columns:1fr 1fr;gap:clamp(3rem,6vw,5rem);}}
    .pullquote{
      margin-top:2rem;padding:1.5rem 1.75rem;
      border-radius:16px;border:1px solid var(--border);border-left:3px solid var(--accent);
      background:rgba(124,58,237,0.04);color:var(--muted);
      font-style:italic;font-size:1rem;line-height:1.65;position:relative;
    }
    .pullquote::before{
      content:'\\201C';position:absolute;top:-12px;left:16px;
      font-size:3.5rem;font-style:normal;line-height:1;
      background:linear-gradient(135deg,var(--accent),var(--accent2));
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
      opacity:0.4;
    }

    /* ═══ FEATURES — Bento-style grid ═══ */
    .features-band{
      background:linear-gradient(180deg,rgba(124,58,237,0.03),transparent 40%,transparent 60%,rgba(79,70,229,0.02));
      border-top:1px solid var(--border);border-bottom:1px solid var(--border);
    }
    .feature-grid{display:grid;gap:1rem;margin-top:2.5rem;}
    @media(min-width:640px){.feature-grid{grid-template-columns:repeat(6,1fr);}}
    .feature-card{
      padding:1.75rem 1.5rem;border-radius:var(--radius);
      border:1px solid var(--border);background:var(--surface);
      position:relative;overflow:hidden;
      transition:transform 0.35s var(--ease),border-color 0.35s,box-shadow 0.35s,background 0.35s;
    }
    @media(min-width:640px){
      .feature-card:nth-child(1){grid-column:span 4;}
      .feature-card:nth-child(2){grid-column:span 2;}
      .feature-card:nth-child(3){grid-column:span 2;}
    }
    @media(min-width:900px){
      .feature-card:nth-child(1){grid-column:span 3;}
      .feature-card:nth-child(2){grid-column:span 3;}
      .feature-card:nth-child(3){grid-column:span 6;}
    }
    /* Spotlight hover glow */
    .feature-card::before{
      content:'';position:absolute;inset:0;
      background:radial-gradient(600px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(124,58,237,0.06),transparent 40%);
      pointer-events:none;opacity:0;transition:opacity 0.4s;
    }
    .feature-card:hover::before{opacity:1;}
    .feature-card:hover{
      transform:translateY(-4px);
      border-color:rgba(124,58,237,0.25);
      box-shadow:0 12px 48px rgba(124,58,237,0.08),0 0 0 1px rgba(124,58,237,0.08);
      background:var(--surface-hover);
    }
    .feature-icon{
      width:48px;height:48px;border-radius:14px;
      display:flex;align-items:center;justify-content:center;
      background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.08));
      border:1px solid rgba(124,58,237,0.15);
      margin-bottom:1.2rem;
    }
    .feature-icon svg{width:22px;height:22px;fill:none;stroke:var(--accent2);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;}
    .feature-card h3{margin:0 0 0.6rem;font-size:1.08rem;font-weight:650;letter-spacing:-0.02em;}
    .feature-card p{margin:0;color:var(--muted);font-size:0.92rem;line-height:1.6;}

    /* Feature 3 — horizontal layout on desktop */
    @media(min-width:900px){
      .feature-card:nth-child(3){
        display:grid;grid-template-columns:auto 1fr;gap:1.5rem;align-items:center;
        padding:2rem 2.5rem;
      }
      .feature-card:nth-child(3) .feature-icon{margin-bottom:0;width:56px;height:56px;border-radius:16px;}
      .feature-card:nth-child(3) .fc-text h3{margin-bottom:0.4rem;}
    }

    /* ═══ HOW IT WORKS — Horizontal stepped cards ═══ */
    .steps-container{position:relative;margin-top:3rem;}
    .steps-track{display:grid;gap:1.25rem;}
    @media(min-width:768px){.steps-track{grid-template-columns:repeat(3,1fr);gap:1.5rem;}}

    .step-card{
      padding:2rem 1.75rem;border-radius:var(--radius);
      border:1px solid var(--border);background:var(--surface);
      position:relative;overflow:hidden;
      transition:border-color 0.3s,background 0.3s;
    }
    .step-card:hover{border-color:rgba(124,58,237,0.2);background:var(--surface-hover);}
    .step-num{
      display:flex;align-items:center;justify-content:center;
      width:40px;height:40px;border-radius:12px;
      background:linear-gradient(135deg,var(--accent3),var(--accent));
      color:#fff;font-weight:800;font-size:0.9rem;
      box-shadow:0 4px 16px rgba(124,58,237,0.3);
      margin-bottom:1.25rem;
    }
    .step-card h3{margin:0 0 0.6rem;font-size:1.05rem;font-weight:650;letter-spacing:-0.02em;}
    .step-card p{margin:0;color:var(--muted);font-size:0.9rem;line-height:1.65;}

    /* Connecting line between steps */
    @media(min-width:768px){
      .steps-track{position:relative;}
      .step-card:not(:last-child)::after{
        content:'';position:absolute;top:2.7rem;right:-0.75rem;
        width:calc(1.5rem);height:2px;
        background:linear-gradient(90deg,rgba(124,58,237,0.4),rgba(124,58,237,0.1));
        z-index:3;
      }
    }

    /* ═══ FAQ ═══ */
    .faq-grid{display:grid;gap:0.65rem;margin-top:2.25rem;max-width:700px;}
    details{
      border:1px solid var(--border);border-radius:14px;
      background:var(--surface);overflow:hidden;
      transition:border-color 0.3s,box-shadow 0.3s;
    }
    details:hover{border-color:var(--border-hover);}
    details[open]{border-color:rgba(124,58,237,0.2);box-shadow:0 0 40px rgba(124,58,237,0.04);}
    details summary{
      cursor:pointer;padding:1.15rem 1.35rem;
      font-weight:600;font-size:0.95rem;list-style:none;
      display:flex;align-items:center;justify-content:space-between;gap:1rem;
      transition:color 0.2s;
    }
    details summary::-webkit-details-marker{display:none;}
    details summary::marker{display:none;content:'';}
    details summary .chevron{
      width:20px;height:20px;flex-shrink:0;
      stroke:var(--muted);fill:none;stroke-width:2;stroke-linecap:round;
      transition:transform 0.35s var(--ease),stroke 0.3s;
    }
    details[open] summary .chevron{transform:rotate(180deg);stroke:var(--accent2);}
    details[open] summary{color:var(--accent2);border-bottom:1px solid var(--border);}
    details .ans{padding:1.1rem 1.35rem 1.25rem;color:var(--muted);font-size:0.92rem;line-height:1.65;}

    /* ═══ CTA FINAL ═══ */
    .cta-final{text-align:center;padding:clamp(5rem,10vw,8rem) 0;}
    .cta-glow{
      max-width:620px;margin:0 auto;padding:clamp(2.5rem,6vw,3.5rem);
      border-radius:var(--radius-lg);position:relative;overflow:hidden;
      background:rgba(255,255,255,0.02);
    }
    /* Animated gradient border */
    .cta-glow::before{
      content:'';position:absolute;inset:-2px;border-radius:inherit;
      background:conic-gradient(from 0deg,var(--accent),var(--accent3),var(--accent2),var(--accent));
      animation:ctaSpin 4s linear infinite;z-index:-2;
    }
    .cta-glow::after{
      content:'';position:absolute;inset:2px;border-radius:inherit;
      background:var(--bg);z-index:-1;
    }
    @keyframes ctaSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
    /* Fix: the conic gradient trick needs a large pseudo to rotate */
    .cta-glow::before{
      inset:-150%;width:400%;height:400%;
      top:50%;left:50%;transform:translate(-50%,-50%);
      animation:ctaSpin 4s linear infinite;
    }
    .cta-glow{
      border:none;
      /* clip the spinning gradient to just the border area */
      overflow:hidden;
    }
    .cta-glow::after{
      inset:2px;
    }

    .cta-glow h2{
      margin:0 0 0.65rem;
      font-size:clamp(1.6rem,3.5vw,2.2rem);
      font-weight:700;letter-spacing:-0.04em;
      position:relative;z-index:1;
    }
    .cta-glow>p{margin:0 0 1.75rem;color:var(--muted);font-size:0.98rem;line-height:1.6;position:relative;z-index:1;}
    .cta-glow .float-row{position:relative;z-index:1;}

    /* ═══ FOOTER ═══ */
    footer{
      padding:2.5rem 0;border-top:1px solid var(--border);
      color:var(--faint);font-size:0.85rem;text-align:center;
      position:relative;z-index:2;
    }

    /* ═══ UTILITIES ═══ */
    ::selection{background:rgba(124,58,237,0.3);color:#fff;}
    :focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
    ::-webkit-scrollbar{width:8px;}
    ::-webkit-scrollbar-track{background:var(--bg);}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:4px;}
    ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.15);}
  </style>
</head>
<body>
  <!-- Ambient backgrounds -->
  <div class="aurora" aria-hidden="true">
    <div class="aurora-orb"></div>
    <div class="aurora-orb"></div>
    <div class="aurora-orb"></div>
    <div class="aurora-orb"></div>
  </div>
  <div class="dot-grid" aria-hidden="true"></div>
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
        <div class="hero-tag reveal"><span class="dot"></span>%%FLOAT_CARD_TITLE%%</div>
        <h1 class="reveal reveal-delay-1">%%HERO_HEADLINE%%</h1>
        <p class="lead reveal reveal-delay-2">%%HERO_SUB%%</p>
        <div class="hero-ctas reveal reveal-delay-2">
          <a class="btn btn-primary" href="#cta">%%CTA_PRIMARY%%</a>
          <a class="btn btn-ghost" href="#how">%%CTA_SECONDARY%%</a>
        </div>
        <div class="social-proof reveal reveal-delay-3">
          <span class="proof-item">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            %%FEATURE1_TITLE%%
          </span>
          <span class="proof-divider"></span>
          <span class="proof-item">
            <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            %%FEATURE2_TITLE%%
          </span>
          <span class="proof-divider"></span>
          <span class="proof-item">
            <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            %%FEATURE3_TITLE%%
          </span>
        </div>
        <div class="hero-visual-container reveal reveal-delay-3">
          %%RAW_HERO_VISUAL%%
        </div>
      </div>
    </section>

    <!-- ─── Problem ─── -->
    <section id="problem">
      <div class="wrap">
        <div class="problem-wrap">
          <div class="reveal">
            <p class="eyebrow">%%PROBLEM_EYEBROW%%</p>
            <h2 class="sec-title">%%PROBLEM_TITLE%%</h2>
            <p class="sec-body">%%PROBLEM_BODY%%</p>
          </div>
          <div class="reveal reveal-delay-2">
            <blockquote class="pullquote">%%PROBLEM_QUOTE%%</blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Features ─── -->
    <section id="features" class="features-band">
      <div class="wrap">
        <p class="eyebrow reveal">%%BENEFITS_EYEBROW%%</p>
        <h2 class="sec-title reveal">%%BENEFITS_TITLE%%</h2>
        <div class="feature-grid">
          <div class="feature-card reveal reveal-delay-1">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            </div>
            <h3>%%FEATURE1_TITLE%%</h3>
            <p>%%FEATURE1_BODY%%</p>
          </div>
          <div class="feature-card reveal reveal-delay-2">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3>%%FEATURE2_TITLE%%</h3>
            <p>%%FEATURE2_BODY%%</p>
          </div>
          <div class="feature-card reveal reveal-delay-3">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="fc-text">
              <h3>%%FEATURE3_TITLE%%</h3>
              <p>%%FEATURE3_BODY%%</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── How It Works ─── -->
    <section id="how">
      <div class="wrap">
        <div style="text-align:center;margin-bottom:0.5rem;">
          <p class="eyebrow reveal" style="justify-content:center;">%%HOW_EYEBROW%%</p>
          <h2 class="sec-title reveal" style="margin-left:auto;margin-right:auto;">%%HOW_TITLE%%</h2>
        </div>
        <div class="steps-container">
          <div class="steps-track">
            <div class="step-card reveal reveal-delay-1">
              <div class="step-num">1</div>
              <h3>%%HOW_STEP1_TITLE%%</h3>
              <p>%%HOW_STEP1_BODY%%</p>
            </div>
            <div class="step-card reveal reveal-delay-2">
              <div class="step-num">2</div>
              <h3>%%HOW_STEP2_TITLE%%</h3>
              <p>%%HOW_STEP2_BODY%%</p>
            </div>
            <div class="step-card reveal reveal-delay-3">
              <div class="step-num">3</div>
              <h3>%%HOW_STEP3_TITLE%%</h3>
              <p>%%HOW_STEP3_BODY%%</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FAQ ─── -->
    <section id="faq">
      <div class="wrap">
        <p class="eyebrow reveal">%%FAQ_EYEBROW%%</p>
        <h2 class="sec-title reveal">%%FAQ_TITLE%%</h2>
        <div class="faq-grid">
          <details class="reveal reveal-delay-1">
            <summary>
              <span>%%FAQ1_Q%%</span>
              <svg class="chevron" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </summary>
            <div class="ans">%%FAQ1_A%%</div>
          </details>
          <details class="reveal reveal-delay-2">
            <summary>
              <span>%%FAQ2_Q%%</span>
              <svg class="chevron" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </summary>
            <div class="ans">%%FAQ2_A%%</div>
          </details>
          <details class="reveal reveal-delay-3">
            <summary>
              <span>%%FAQ3_Q%%</span>
              <svg class="chevron" viewBox="0 0 20 20"><polyline points="5 7.5 10 12.5 15 7.5"/></svg>
            </summary>
            <div class="ans">%%FAQ3_A%%</div>
          </details>
        </div>
      </div>
    </section>

    <!-- ─── CTA Final ─── -->
    <section id="cta" class="cta-final">
      <div class="wrap">
        <div class="cta-glow reveal">
          <h2>%%CTA_FINAL_TITLE%%</h2>
          <p>%%CTA_FINAL_SUB%%</p>
          <form class="float-row" action="#" method="get" onsubmit="return false;">
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
    document.querySelectorAll(".reveal").forEach(function(el){obs.observe(el);});

    /* Card spotlight follow */
    document.querySelectorAll(".feature-card").forEach(function(card){
      card.addEventListener("mousemove",function(e){
        var r=card.getBoundingClientRect();
        card.style.setProperty("--mouse-x",(e.clientX-r.left)+"px");
        card.style.setProperty("--mouse-y",(e.clientY-r.top)+"px");
      });
    });
  })();
  </script>
</body>
</html>`;
