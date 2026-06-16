"use client";

/**
 * Home — the funnel: Hero → working validator → Chamber showcase → Dossier
 * showcase → How it works → honest pricing → FAQ → CTA. Every CTA routes to a
 * real surface; nothing on this page is decorative-only anymore.
 */

import { motion, useScroll, useSpring } from "framer-motion";
import { SiteNav } from "@/components/SiteNav";
import { Hero } from "@/components/Hero";
import { Ticker } from "@/components/Ticker";
import { ValidateNow } from "@/components/home/ValidateNow";
import { TribunalShowcase } from "@/components/home/TribunalShowcase";
import { DossierShowcase } from "@/components/home/DossierShowcase";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FlowShowcase } from "@/components/home/FlowShowcase";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { Cta, Footer } from "@/components/Cta";
import { Reveal } from "@/components/motion/Reveal";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.25 });

  return (
    <main className="app-page-shell min-h-screen overflow-hidden text-[--ink-0]">
      <motion.div
        className="fixed left-0 top-0 z-[60] h-[3px] origin-left bg-[--accent]"
        style={{ scaleX: progress, width: "100%" }}
      />
      <SiteNav />
      <Hero />
      <Ticker />
      <Reveal><ValidateNow /></Reveal>
      <Reveal><TribunalShowcase /></Reveal>
      <Reveal><DossierShowcase /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal><FlowShowcase /></Reveal>
      <Reveal><Pricing /></Reveal>
      <Reveal><Faq /></Reveal>
      <Reveal><Cta /></Reveal>
      <Footer />
    </main>
  );
}
