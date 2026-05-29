import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/landing/Nav";
import { Ticker } from "@/components/landing/Ticker";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { Input } from "@/components/landing/Input";
import { Capabilities } from "@/components/landing/Capabilities";
import { Engine } from "@/components/landing/Engine";
import { RiskBreaks } from "@/components/landing/RiskBreaks";
import { Packet } from "@/components/landing/Packet";
import { Compare } from "@/components/landing/Compare";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { Cta, Footer } from "@/components/landing/Cta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Idea Debater — Debate your startup idea until it breaks" },
      { name: "description", content: "Five ruthless AI advisors. One investor-grade report. Find out if your startup idea survives the panel in 120 seconds." },
      { property: "og:title", content: "Idea Debater — A verdict on your startup, in 120 seconds." },
      { property: "og:description", content: "Five ruthless AI advisors. One investor-grade report. Zero sugar-coating." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Ticker />
      <Nav />
      <Hero />
      <Stats />
      <Input />
      <Capabilities />
      <Engine />
      <RiskBreaks />
      <Packet />
      <Compare />
      <Pricing />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
