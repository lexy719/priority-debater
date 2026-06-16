"use client";

/**
 * /resultstest — standalone preview of the populated results dashboard.
 *
 * Not linked from anywhere. Renders ResultsChamber with the sample DEFAULT_REPORT
 * (enriched with sample provenance + sources) so the full look — Score Lab,
 * provenance panel, charts, share/scorecard — can be reviewed without spending
 * credits. Delete or ignore once the live pipeline is funded.
 */

import { notFound } from "next/navigation";
import ResultsChamber from "@/components/chamber/ResultsChamber";
import { DEFAULT_REPORT, type Report } from "@/components/chamber/report";

const PREVIEW_REPORT: Report = {
  ...DEFAULT_REPORT,
  score: {
    ...DEFAULT_REPORT.score,
    recommendation: "PROCEED CAUTIOUSLY",
    rationale:
      "Strong distribution and timing tailwinds, but the moat is thin and monetization is unproven at the named-buyer level. Score is evidence-limited until a paid pilot lands.",
    evidenceLevel: "moderate",
    webSearchUsed: true,
    fromDebate: true,
    oneAsk: "One signed 24-month contract from a 50+ lawyer Iberian firm at €89/seat would move Monetization and Competitive Advantage the most.",
    sources: [
      { url: "https://www.statista.com/legal-tech-europe", title: "Statista — European legal-tech market sizing" },
      { url: "https://www.clio.com/about/legal-trends/", title: "Clio Legal Trends Report" },
      { url: "https://www.wolterskluwer.com/en/solutions/legal", title: "Wolters Kluwer — Legal software" },
    ],
    assumptions: [
      { area: "market", claim: "Iberian mid-sized legal SaaS TAM ≈ €60M, growing with compliance digitalization.", evidenceToLock: "A third-party TAM figure for PT+ES mid-sized firms.", sourceUrl: "https://www.statista.com/legal-tech-europe", sourceTitle: "Statista" },
      { area: "competition", claim: "Incumbents (Clio, Wolters Kluwer) lack native Iberian AI drafting today.", evidenceToLock: "A feature audit showing no ES/PT AI drafting module shipped." },
      { area: "pricing", claim: "€89/seat/mo is within mid-sized firm SaaS budgets.", evidenceToLock: "A signed order form or LOI at that price." },
    ],
  },
};

const PREVIEW_IDEA = DEFAULT_REPORT.meta.idea.replace(/^"|"$/g, "");

export default function ResultsTestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <ResultsChamber
      report={PREVIEW_REPORT}
      idea={PREVIEW_IDEA}
      position="Founders have a deep EU legal-tech network and two design-partner firms lined up."
      context="Pre-seed. Pilots underway with 3 firms in Lisbon and Madrid."
    />
  );
}
