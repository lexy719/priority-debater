import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Agents } from "@/components/landing/Agents";
import { Dossier } from "@/components/landing/Dossier";
import { Process } from "@/components/landing/Process";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

import BrandKit from "@/pages/BrandKit";
import LaunchKit from "@/pages/LaunchKit";
import Campaign from "@/pages/Campaign";
import LandingGen from "@/pages/LandingGen";
import Ship from "@/pages/Ship";

const Landing = () => {
  return (
    <main data-testid="landing-page" className="bg-[#f4f4f0]">
      <Navbar />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Agents />
      <Dossier />
      <Process />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/brand-kit" element={<BrandKit />} />
          <Route path="/launch-kit" element={<LaunchKit />} />
          <Route path="/campaign" element={<Campaign />} />
          <Route path="/landing-builder" element={<LandingGen />} />
          <Route path="/ship" element={<Ship />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
