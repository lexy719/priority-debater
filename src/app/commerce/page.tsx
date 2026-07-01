import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { Landing } from "@/components/commerce/Landing";

export const metadata: Metadata = {
  title: "PD Commerce — See what AI says about your store",
  description:
    "We ask ChatGPT, Perplexity, and Google AI where to buy in your category, show you exactly who they recommend instead of you, and fix it. Free scan, ~45 seconds, no card.",
  openGraph: {
    title: "AI is recommending your competitors. Not you.",
    description: "Run a free AI-visibility scan of your store in 45 seconds.",
  },
};

export default function CommercePage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteNav subtitle="PD Commerce" />
      <Landing />
    </main>
  );
}
