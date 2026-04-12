import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validation interviews",
  description:
    "Five separate AI interviews — customer, investor, operator, mentor, adversary — to validate and fail-proof your idea.",
};

export default function DebateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
