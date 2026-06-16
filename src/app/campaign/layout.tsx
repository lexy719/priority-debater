import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign",
  description: "A launch-ready video-ad campaign — four platform cuts with scripts and storyboards, generated from your idea.",
  robots: { index: false, follow: false },
};

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}
