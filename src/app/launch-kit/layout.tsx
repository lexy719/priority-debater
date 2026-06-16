import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Launch Kit",
  description: "Product-page copy, three acquisition channels and a ready-to-send outreach pack, generated from your idea.",
  robots: { index: false, follow: false },
};

export default function LaunchKitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
