import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { Toolkit } from "@/components/commerce/Toolkit";

export const metadata: Metadata = {
  title: "Fix Toolkit — AI Commerce — Priority Debater",
  description:
    "Generate the agent-ready files your store needs — llms.txt, schema, AI-crawler rules, and a product feed built from your real catalogue. Copy, paste, ship.",
};

export default async function ToolkitPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  return (
    <main className="min-h-screen bg-[#0c0c0f]">
      <SiteNav subtitle="AI Commerce" />
      <Toolkit initialUrl={typeof url === "string" ? url : ""} />
    </main>
  );
}
