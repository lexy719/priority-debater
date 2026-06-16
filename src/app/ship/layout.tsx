import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Launch Day",
  description: "A 24-hour launch checklist and the full journey recap that turns your validated idea into a running business.",
  robots: { index: false, follow: false },
};

export default function ShipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
