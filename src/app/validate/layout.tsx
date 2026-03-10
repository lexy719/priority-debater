import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validate Idea",
  description: "Submit your startup idea for AI validation. Get a complete viability report in 2 minutes.",
};

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
