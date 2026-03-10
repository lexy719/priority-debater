import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Debate",
  description: "Defend your startup idea. Stress-test your logic with The Adversary.",
};

export default function DebateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
