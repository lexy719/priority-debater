import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validation Results",
  description: "Your startup idea validation report. See viability score, market analysis, and recommendations.",
};

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
