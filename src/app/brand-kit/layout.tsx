import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Kit",
  description: "Generate your brand identity — name, palette, typography and voice — from your validated idea.",
  robots: { index: false, follow: false },
};

export default function BrandKitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
