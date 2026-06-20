import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { CommerceAudit } from "@/components/commerce/CommerceAudit";

export const metadata: Metadata = {
  title: "AI Commerce Audit — Priority Debater",
  description:
    "Score how ChatGPT, Claude, and Gemini see your store, simulate how buyer-agents shop it, and ship the fixes that make AI recommend you instead of your competitors.",
  openGraph: {
    title: "AI Commerce Audit — Priority Debater",
    description: "Eight modules that score, monitor, and fix your store for agentic commerce.",
  },
};

export default function CommercePage() {
  return (
    <main className="min-h-screen bg-[#0c0c0f]">
      <SiteNav subtitle="AI Commerce" />
      <CommerceAudit />
    </main>
  );
}
