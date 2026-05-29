"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { Nav } from "@/components/Nav";
import { Input } from "@/components/Input";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Capabilities } from "@/components/Capabilities";
import { Ticker } from "@/components/Ticker";
import { RiskBreaks } from "@/components/RiskBreaks";
import { Engine } from "@/components/Engine";
import { Packet } from "@/components/Packet";
import { Compare } from "@/components/Compare";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Cta, Footer } from "@/components/Cta";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });

  return (
    <main className="app-page-shell min-h-screen overflow-hidden text-[--ink-0]">
      <motion.div
        className="fixed left-0 top-0 z-[60] h-[3px] origin-left bg-[--accent]"
        style={{ scaleX: progress, width: "100%" }}
      />
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
