import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Validate or generate an idea",
  description:
    "Stress-test a startup idea with scores and risks, or generate tailored ideas from your background. Full report in about one to two minutes.",
};

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
