import type { Metadata } from "next";
import DebateChamber from "@/components/chamber/DebateChamber";

export const metadata: Metadata = {
  title: "The Chamber — Debate Mode",
  description: "Live adversarial pressure-testing tribunal for your startup idea.",
};

export default function DebatePage() {
  return <DebateChamber />;
}
