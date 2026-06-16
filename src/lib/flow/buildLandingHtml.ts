/**
 * Self-contained landing-page HTML generator for the flow's "Landing" stage.
 *
 * Ported from the Emergent mockup (frontend/src/lib/landingHtml.js) but
 * parameterized: instead of importing a hardcoded BRAND/PRODUCT_PAGE it takes
 * the user's real brand name + generated product-page copy, so the live
 * preview and the HTML / WordPress / Shopify exports reflect the actual idea.
 *
 * Output is one self-contained .html string (fonts + styles inlined) — drop it
 * on any host and it works.
 */

import type { ProductPage } from "./types";

export const ARCHETYPES = [
  { id: "brutalist", name: "Bold Brutalist", desc: "High-contrast, editorial, founder energy." },
  { id: "minimal", name: "Clean SaaS", desc: "Soft, trustworthy, conversion-tuned." },
  { id: "editorial", name: "Editorial Serif", desc: "Premium, on a warm brand palette." },
] as const;

export type ArchetypeId = (typeof ARCHETYPES)[number]["id"];

type Theme = {
  fonts: string;
  head: string;
  body: string;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  accent2: string;
  card: string;
  border: string;
  radius: string;
  shadow: string;
  upper: string;
  align: string;
  heroSize: string;
};

const THEMES: Record<ArchetypeId, Theme> = {
  brutalist: {
    fonts: "family=Anton&family=Archivo:wght@400;500;600;700;900",
    head: "'Anton', sans-serif",
    body: "'Archivo', sans-serif",
    bg: "#f4f4f0", fg: "#0a0a0a", muted: "#404040",
    accent: "#ff3b30", accent2: "#ffd60a", card: "#ffffff",
    border: "2px solid #0a0a0a", radius: "0px", shadow: "6px 6px 0 #0a0a0a",
    upper: "uppercase", align: "left", heroSize: "clamp(2.6rem,7vw,5rem)",
  },
  minimal: {
    fonts: "family=Inter:wght@400;500;600;700;800",
    head: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
    bg: "#ffffff", fg: "#0f172a", muted: "#64748b",
    accent: "#2563eb", accent2: "#2563eb", card: "#ffffff",
    border: "1px solid #e2e8f0", radius: "16px", shadow: "0 12px 30px rgba(2,6,23,.08)",
    upper: "none", align: "center", heroSize: "clamp(2.4rem,6vw,4.2rem)",
  },
  editorial: {
    fonts: "family=Spectral:wght@600;700;800&family=Inter:wght@400;500;600",
    head: "'Spectral', serif",
    body: "'Inter', sans-serif",
    bg: "#F3EEE3", fg: "#14110F", muted: "#6b5f4f",
    accent: "#6B1F2A", accent2: "#C8A24B", card: "#ffffff",
    border: "1px solid rgba(20,17,15,.16)", radius: "4px", shadow: "none",
    upper: "none", align: "left", heroSize: "clamp(2.5rem,6.5vw,4.6rem)",
  },
};

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function domainSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "") || "brand";
}

export function buildLandingHtml(
  archetypeId: ArchetypeId,
  args: { name: string; productPage: ProductPage },
): string {
  const t = THEMES[archetypeId] || THEMES.brutalist;
  const p = args.productPage;
  const name = (args.name || "BRAND").trim();
  const slug = domainSlug(name);

  const features = p.valueProps
    .map(
      (v, i) => `
      <div class="card feat">
        <span class="fnum">0${i + 1}</span>
        <h3>${esc(v.title)}</h3>
        <p>${esc(v.body)}</p>
      </div>`,
    )
    .join("");

  const tiers = p.pricing
    .map(
      (pr) => `
      <div class="card tier ${pr.featured ? "tier--hot" : ""}">
        ${pr.featured ? '<span class="badge">Most popular</span>' : ""}
        <span class="tname">${esc(pr.name)}</span>
        <div class="price">${esc(pr.price)}<small>${esc(pr.per || "")}</small></div>
        <span class="tnote">${esc(pr.note)}</span>
        <a class="btn btn--block" href="#cta">${esc(pr.cta)}</a>
      </div>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(name)} — ${esc(p.headline)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?${t.fonts}&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${t.body}; background: ${t.bg}; color: ${t.fg}; line-height: 1.6; }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
  h1,h2,h3 { font-family: ${t.head}; text-transform: ${t.upper}; letter-spacing: -0.01em; line-height: 1.05; }
  a { text-decoration: none; color: inherit; }
  .btn { display:inline-block; font-family:${t.body}; font-weight:700; font-size:14px; padding:14px 26px;
         background:${t.accent}; color:#fff; border:${t.border}; border-radius:${t.radius}; box-shadow:${t.shadow}; }
  .btn--ghost { background:transparent; color:${t.fg}; box-shadow:none; }
  .btn--block { display:block; text-align:center; margin-top:16px; }
  header { display:flex; align-items:center; justify-content:space-between; padding:22px 0; }
  .brand { font-family:${t.head}; font-size:20px; text-transform:${t.upper}; letter-spacing:.12em; }
  nav a { margin-left:22px; font-size:13px; color:${t.muted}; }
  .hero { text-align:${t.align}; padding:70px 0 60px; }
  .hero h1 { font-size:${t.heroSize}; max-width:14ch; ${t.align === "center" ? "margin:0 auto;" : ""} }
  .hero .accent { color:${t.accent}; }
  .hero p { color:${t.muted}; font-size:19px; max-width:52ch; margin:22px 0 30px; ${t.align === "center" ? "margin-left:auto;margin-right:auto;" : ""} }
  .actions { display:flex; gap:14px; ${t.align === "center" ? "justify-content:center;" : ""} flex-wrap:wrap; }
  .grid { display:grid; gap:18px; }
  .feats { grid-template-columns: repeat(3,1fr); padding:30px 0 60px; }
  .tiers { grid-template-columns: repeat(3,1fr); padding:10px 0 70px; align-items:start; }
  .card { background:${t.card}; border:${t.border}; border-radius:${t.radius}; box-shadow:${t.shadow}; padding:26px; }
  .feat h3 { font-size:19px; margin:10px 0 8px; }
  .feat p { color:${t.muted}; font-size:15px; }
  .fnum { font-family:${t.head}; color:${t.accent}; font-size:30px; }
  .section-label { font-size:12px; letter-spacing:.22em; text-transform:uppercase; color:${t.muted}; padding-top:20px; }
  .tier { text-align:${t.align}; position:relative; }
  .tier--hot { background:${t.accent2}; ${archetypeId === "brutalist" ? "color:#0a0a0a;" : ""} }
  .badge { position:absolute; top:-12px; left:24px; background:${t.fg}; color:${t.bg}; font-size:11px; padding:4px 10px; letter-spacing:.1em; text-transform:uppercase; }
  .tname { font-size:13px; letter-spacing:.16em; text-transform:uppercase; color:${t.muted}; }
  .price { font-family:${t.head}; font-size:46px; margin:8px 0; }
  .price small { font-size:13px; color:${t.muted}; font-family:${t.body}; }
  .tnote { font-size:13px; color:${t.muted}; display:block; }
  .cta { text-align:center; padding:64px 24px; background:${t.fg}; color:${t.bg}; border-radius:${t.radius}; margin:0 0 50px; }
  .cta h2 { font-size:clamp(2rem,5vw,3.2rem); }
  .cta .btn { background:${t.accent}; margin-top:22px; border-color:${t.bg}; }
  footer { padding:30px 0 50px; color:${t.muted}; font-size:13px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px; border-top:1px solid ${t.muted}33; }
  @media (max-width:760px){ .feats,.tiers{ grid-template-columns:1fr; } nav{ display:none; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <span class="brand">${esc(name)}</span>
      <nav>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a class="btn" href="#cta" style="padding:10px 18px;">${esc(p.secondaryCta)}</a>
      </nav>
    </header>

    <section class="hero">
      <h1>${esc(p.headline.replace(/\.$/, ""))}<span class="accent">.</span></h1>
      <p>${esc(p.subhead)}</p>
      <div class="actions">
        <a class="btn" href="#cta">${esc(p.primaryCta)}</a>
        <a class="btn btn--ghost" href="#features">${esc(p.secondaryCta)}</a>
      </div>
    </section>

    <div id="features">
      <span class="section-label">Why ${esc(name)}</span>
      <div class="grid feats">${features}</div>
    </div>

    <div id="pricing">
      <span class="section-label">Pricing</span>
      <div class="grid tiers">${tiers}</div>
    </div>

    <section id="cta" class="cta">
      <h2>${esc(p.headline)}</h2>
      <a class="btn" href="mailto:hello@${slug}.com">${esc(p.primaryCta)}</a>
    </section>

    <footer>
      <span>© ${new Date().getFullYear()} ${esc(name)}.</span>
      <span>Built with Priority Debater</span>
    </footer>
  </div>
</body>
</html>`;
}
