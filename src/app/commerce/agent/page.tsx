import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { AgentChat } from "@/components/commerce/AgentChat";

export const metadata: Metadata = {
  title: "PD Agent — fix your AI visibility",
  description:
    "The PD Agent generates store-specific fixes from your real report — buying guides, schema, llms.txt — and gets them ready to publish to Shopify.",
};

export default function CommerceAgentPage() {
  return (
    <div className="chamber-scope min-h-screen bg-background text-foreground">
      <SiteNav subtitle="PD Commerce" />
      <AgentChat />
    </div>
  );
}
