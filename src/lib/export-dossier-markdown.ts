import type { ExampleDossier } from "@/lib/example-dossier";

export function dossierSlugForFilename(title: string): string {
  const s = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 72);
  return s || "priority-debater-decision-brief";
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function buildDecisionBriefMarkdown(
  d: ExampleDossier,
  fullReportMarkdown?: string | null
): string {
  const lines: string[] = [
    `# ${d.title}`,
    "",
    `- **Case:** ${d.caseId}`,
    `- **Verdict:** ${d.verdict}`,
    `- **Score:** ${d.score} / 100`,
    "",
    "## Executive read",
    "",
    `*${d.oneLiner}*`,
    "",
    d.thesis,
    "",
    "## Recommendation",
    "",
    d.recommendation,
    "",
    "## Dimension scores",
    "",
    "| Dimension | Score |",
    "| --- | :---: |",
    ...d.scores.map((s) => `| ${s.label} | ${s.score} |`),
    "",
    "## Panel (${d.personas.length} voices)",
    "",
    ...d.personas.flatMap((p) => [
      `### ${p.persona} — ${p.verdict}`,
      "",
      `> ${p.pullQuote}`,
      "",
    ]),
    "## Risks",
    "",
    ...d.risks.map((r) => `- **${r.severity}** (${r.id}) ${r.title}`),
    "",
    "## Next actions",
    "",
    ...d.nextActions.map((a) => `- **${a.id}** (${a.eta}) ${a.text}`),
    "",
  ];

  const trimmedReport = fullReportMarkdown?.trim();
  if (trimmedReport && trimmedReport.length > 0) {
    lines.push("---", "", "## Full panel report (verbatim)", "", trimmedReport, "");
  } else {
    lines.push(
      "---",
      "",
      "_Full streamed report was not attached (e.g. sample dossier). Run **Validate** to generate one._",
      ""
    );
  }

  return lines.join("\n");
}

/** Short summary for share / clipboard (no confidential server — same-browser session only). */
export function buildShareSnippet(d: ExampleDossier, siteUrl?: string): string {
  const origin = siteUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const lines = [
    `Priority Debater · ${d.verdict} (${d.score}/100)`,
    d.title,
    "",
    d.thesis,
    "",
    `Next: ${d.recommendation}`,
    "",
    "---",
    "Generated with Priority Debater — stress-test ideas before you commit.",
    origin ? `${origin}` : "",
    "",
    "Tip: Export Markdown from Results for the full brief.",
  ];
  return lines.filter(Boolean).join("\n").trim();
}

/** Mobile: system share sheet. Desktop: copy summary to clipboard. */
export async function shareOrCopyBrief(d: ExampleDossier): Promise<string> {
  const text = buildShareSnippet(d);
  if (typeof navigator === "undefined") return "";

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: `Priority Debater · ${d.verdict}`,
        text,
      });
      return "Shared.";
    } catch (e) {
      const err = e as { name?: string };
      if (err.name === "AbortError") return "";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "Summary copied — paste into Slack, Notion, or email.";
  } catch {
    return "Could not copy automatically — try Export Markdown.";
  }
}

export function exportBriefToMarkdownFile(d: ExampleDossier, fullReport: string | null | undefined): void {
  const md = buildDecisionBriefMarkdown(d, fullReport);
  downloadTextFile(`${dossierSlugForFilename(d.title)}-brief.md`, md);
}
