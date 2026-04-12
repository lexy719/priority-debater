import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guided validation — scores then debate",
  description:
    "Run the full viability report (scores, radar, canvas), then enter debate mode for five persona rounds.",
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
