"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/dashboard/Navbar";
import TickerTape from "@/components/dashboard/TickerTape";
import ScoreHero from "@/components/dashboard/ScoreHero";
import MetricsStrip from "@/components/dashboard/MetricsStrip";
import MarketSection from "@/components/dashboard/MarketSection";
import RiskSection from "@/components/dashboard/RiskSection";
import CompetitionSection from "@/components/dashboard/CompetitionSection";
import RevenueSection from "@/components/dashboard/RevenueSection";
import AudienceSection from "@/components/dashboard/AudienceSection";
import SWOTSection from "@/components/dashboard/SWOTSection";
import RecommendationsSection from "@/components/dashboard/RecommendationsSection";
import PersonaVerdicts from "@/components/dashboard/PersonaVerdicts";
import Footer from "@/components/dashboard/Footer";
import ResultsEnhancements from "@/components/dashboard/ResultsEnhancements";
import RevealOnScroll from "@/components/dashboard/RevealOnScroll";
import { ResultsDashboardProvider, useResultsDashboard } from "@/context/results-dashboard-context";
import { loadSessionWithStatus } from "@/lib/session";
import type { ValidationSession } from "@/lib/types";
import type { ComponentType } from "react";

const TAB_COMPONENTS: Record<string, ComponentType> = {
  market: MarketSection,
  risk: RiskSection,
  competition: CompetitionSection,
  revenue: RevenueSection,
  audience: AudienceSection,
  swot: SWOTSection,
  recommendations: RecommendationsSection,
  personas: PersonaVerdicts,
};

function ResultsReportTabs({ active, setActive }: { active: string; setActive: (v: string) => void }) {
  const { reportTabs } = useResultsDashboard();

  return (
    <Tabs value={active} onValueChange={setActive} id="report-tabs" className="border-b border-black">
      <div className="sticky top-[73px] z-40 border-b-2 border-black bg-black">
        <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
          <div className="flex items-center justify-between gap-6 py-3">
            <div className="font-mono text-[10px] tracking-wider text-white/50">
              REPORT NAVIGATION - S03 TO S10
            </div>
            <div className="hidden font-mono text-[10px] tracking-wider text-white/40 md:block">
              CLICK A SECTION - 08 TABS
            </div>
          </div>
          <TabsList
            data-testid="report-tabs-list"
            className="flex h-auto w-full flex-wrap justify-start gap-0 rounded-none border-0 bg-transparent p-0"
          >
            {reportTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  data-testid={`tab-trigger-${tab.id}`}
                  className="group relative flex-1 min-w-[110px] rounded-none border-r border-white/15 px-4 py-4 font-mono text-[11px] tracking-[0.18em] text-white/55 shadow-none transition-colors hover:bg-white/5 hover:text-white data-[state=active]:bg-[var(--hi)] data-[state=active]:text-black data-[state=active]:shadow-none last:border-r-0"
                >
                  <div className="flex flex-col items-start gap-1 text-left">
                    <span className="font-mono text-[9px] opacity-60 group-data-[state=active]:opacity-80">
                      {tab.num}
                    </span>
                    <span className="font-display text-base tracking-tight">{tab.label}</span>
                  </div>
                </TabsTrigger>
              ))}
          </TabsList>
        </div>
      </div>

      {reportTabs.map((tab) => {
        const Body = TAB_COMPONENTS[tab.id];
        if (!Body) return null;
        return (
          <TabsContent
            key={tab.id}
            value={tab.id}
            data-testid={`tab-content-${tab.id}`}
            className="mt-0 ring-0 focus-visible:ring-0"
          >
            <RevealOnScroll>
              <Body />
            </RevealOnScroll>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export default function ResultsPage() {
  const [active, setActive] = useState("market");
  const [session, setSession] = useState<ValidationSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const r = loadSessionWithStatus();
      setSession(r.status === "loaded" ? r.session : null);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] font-mono text-xs tracking-wider text-black/60">
        LOADING REPORT…
      </div>
    );
  }

  return (
    <ResultsDashboardProvider session={session}>
      <div data-testid="idea-validation-page" className="results-dashboard min-h-screen bg-[var(--paper)] text-black">
        <ResultsEnhancements />
        <Navbar />
        <TickerTape />
        <ScoreHero />
        <TickerTape dark />
        <RevealOnScroll>
          <MetricsStrip />
        </RevealOnScroll>

        <ResultsReportTabs active={active} setActive={setActive} />

        <TickerTape />
        <Footer />
      </div>
    </ResultsDashboardProvider>
  );
}
