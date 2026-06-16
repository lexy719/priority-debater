import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landing Page Builder",
  description: "A conversion page built from your brand and product copy — preview live and export to HTML, WordPress or Shopify.",
  robots: { index: false, follow: false },
};

export default function LandingBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
