import { extractDashboardData } from "@/lib/parse";
import type { DebateSetup } from "@/lib/types";

function truncate(s: string, max: number): string {
  if (!s) return "";
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Structured facts from the validation report so the model stays specific (not generic SaaS filler). */
export function buildValidationBriefForLanding(validationContent: string): string {
  if (!validationContent?.trim()) {
    return "No validation report yet — infer a compelling page from the idea and positioning only, and avoid inventing fake metrics or fake customer counts.";
  }

  const d = extractDashboardData(validationContent);
  const cs = d.categoryScores;
  const lines: string[] = [];

  lines.push("### STRUCTURED DATA (ground truth — weave into copy; do NOT contradict these facts)");
  if (d.score != null) lines.push(`- Overall viability score: **${d.score}/10**`);
  if (d.goNoGoType) lines.push(`- Go/No-Go signal: **${d.goNoGoType.toUpperCase()}**`);
  if (d.summary) lines.push(`- Idea summary: ${truncate(d.summary, 900)}`);
  if (d.verdict) lines.push(`- One-line verdict: ${truncate(d.verdict, 400)}`);
  if (d.strengths.length) lines.push(`- Strengths (use as proof points): ${d.strengths.slice(0, 6).join(" · ")}`);
  if (d.risks.length) lines.push(`- Risks / objections (address in FAQ or objection-handling section): ${d.risks.slice(0, 5).join(" · ")}`);
  if (d.recommendations.length) lines.push(`- Validation / next steps: ${d.recommendations.slice(0, 8).join(" · ")}`);
  if (d.leanCanvas?.uvp) lines.push(`- Unique value proposition: ${truncate(d.leanCanvas.uvp, 500)}`);
  if (d.leanCanvas?.solution) lines.push(`- Solution (Lean Canvas): ${truncate(d.leanCanvas.solution, 400)}`);
  if (d.leanCanvas?.problem) lines.push(`- Problem (Lean Canvas): ${truncate(d.leanCanvas.problem, 400)}`);
  if (d.targetCustomer) lines.push(`- Target customer / ICP: ${truncate(d.targetCustomer, 700)}`);
  if (d.valueProposition) lines.push(`- Value proposition: ${truncate(d.valueProposition, 700)}`);
  if (d.problemSolution) lines.push(`- Problem–solution narrative: ${truncate(d.problemSolution, 900)}`);
  if (d.businessModel) lines.push(`- Business model: ${truncate(d.businessModel, 600)}`);
  if (d.competitiveSummary) lines.push(`- Competitive landscape: ${truncate(d.competitiveSummary, 600)}`);

  lines.push(
    `- Category scores: problem/solution ${cs.problemSolutionFit ?? "n/a"}/10 · market ${cs.marketOpportunity ?? "n/a"}/10 · competition ${cs.competitiveEdge ?? "n/a"}/10 · business model ${cs.businessModel ?? "n/a"}/10 · execution ${cs.teamExecution ?? "n/a"}/10 · timing ${cs.timingTrends ?? "n/a"}/10`
  );

  const { tam, sam, som } = d.tamSamSom;
  if (tam || sam || som) {
    lines.push(`- Market sizing: TAM ${tam ?? "—"} · SAM ${sam ?? "—"} · SOM ${som ?? "—"}`);
  }

  lines.push("");
  lines.push("### FULL REPORT EXCERPT (deeper detail for headlines, sections, FAQ — stay specific)");
  lines.push(validationContent.slice(0, 16000));

  return lines.join("\n");
}

export function landingPageSystemPrompt(): string {
  return `You are a principal designer at a boutique agency that charges $12k–25k for single-page marketing sites (think: Coda, Linear, Notion, early Webflow, Stripe Press). You also ship the front-end yourself.

You combine:
- Ruthless conversion copy (specific, benefit-led, no jargon)
- Editorial typography (dramatic scale, not “default startup”)
- Restraint: motion and effects support the story; they never steal attention

OUTPUT RULES:
- Output ONLY a complete HTML document: <!DOCTYPE html> through </html>
- No markdown, no code fences, no commentary before or after the HTML
- All CSS in one <style> in <head>. One Google Fonts link allowed (pick a distinctive serif + sans OR two sans with real personality — avoid Inter + Roboto as the only pairing)
- Vanilla JS only in one <script> before </body>. No external libraries except Google Fonts
- Semantic HTML5: <header>, <nav>, <main>, <section>, <footer>, <article> where appropriate
- Include <meta charset>, viewport, <title>, meta description, og:title, og:description, theme-color based on the page
- Images: do not use external image URLs; use inline SVG patterns, CSS gradients, div “mockups”, or emoji only where tasteful
- Accessibility: focus-visible styles, sufficient contrast, prefers-reduced-motion: reduce animations for users who need it

COPY RULES (critical):
- Every headline, stat, and testimonial must trace back to STRUCTURED DATA or the report excerpt — never invent traction (“10,000 users”) unless the report says so
- If social proof is thin: use **capability stats** (e.g. “Validation score 7/10”, “6 categories stress-tested”) or realistic waitlist framing — never fake Fortune 500 logos
- Testimonials must read as **plausible early-adopter quotes** tied to the ICP in the report (names can be generic first name + role), or a subtle “illustrative” quote in an HTML comment only — never fake celebrity endorsements

DESIGN QUALITY BAR:
- One clear visual direction (dark editorial OR warm light OR crisp neu-brutalist) that fits the product tone — not a generic “purple gradient SaaS” unless the product is literally that
- Hero: eyebrow + headline + subhead + primary + secondary CTA + one trust row (stats, badges, or checks — from real data)
- Sections: clear vertical rhythm, max-width ~1120–1200px, generous whitespace
- At least: sticky nav, hero, problem, solution, how it works (3 steps), features grid, proof, FAQ, final CTA with email form, footer
- Use CSS variables in :root for colors, radius, spacing, shadows — designer handoff friendly

TECH:
- Responsive: mobile-first, 375 / 768 / 1024+
- At least 5 of: gradient text (background-clip), glass cards, subtle grain/noise, mesh gradient, animated border gradient, intersection observer reveal, scroll-margin for anchors, micro-hover on primary CTA
- Form: method="POST" action="https://formspree.io/f/YOUR_FORM_ID" with email input + submit

Return the raw HTML only. Start with <!DOCTYPE html>.`;
}

export function landingPageUserPrompt(setup: DebateSetup, validationContent: string): string {
  const brief = buildValidationBriefForLanding(validationContent);

  return `Build a **single-page marketing site** that looks like a top-tier agency product — not a template.

**Product / brand**
- Name or topic: "${setup.topic}"
- Core pitch: ${setup.position}
- Extra context: ${setup.context?.trim() || "(none)"}

**Source material (use all of this)**:
${brief}

**Section checklist (adapt order only if it improves clarity for THIS idea):**
1. Sticky nav: logo text, anchors to major sections, primary CTA
2. Hero: eyebrow, headline (≤10 words), subhead, **two** CTAs, trust row from **real** data above
3. Problem: 3 pain cards — language from the report / ICP
4. Solution: mirror those pains with 3 outcomes
5. How it works: 3 steps — numbered, timeline on desktop
6. Features: 6 cards max — grounded in the idea + report
7. Proof: stats from TAM/SAM/SOM or scores + 2–3 short quotes aligned with ICP
8. Pricing OR waitlist: honest — if pre-launch, lead with waitlist + what they get
9. FAQ: 5 questions that reflect real objections from risks + category scores
10. Final CTA + footer with links

**Default accent palette (override via CSS variables if another palette fits the brand better):**
- Primary: #6366f1 · Secondary: #8b5cf6 · Success: #10b981

**Output:** complete HTML only.`;
}
