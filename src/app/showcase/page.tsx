"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import TickerTape from "@/components/dashboard/TickerTape";
import { ResultsDashboardProvider } from "@/context/results-dashboard-context";

const TABS = [
    { id: "market", num: "§03", label: "MARKET", Component: MarketSection },
    { id: "risk", num: "§04", label: "RISK", Component: RiskSection },
    { id: "competition", num: "§05", label: "COMPETITION", Component: CompetitionSection },
    { id: "revenue", num: "§06", label: "REVENUE", Component: RevenueSection },
    { id: "audience", num: "§07", label: "AUDIENCE", Component: AudienceSection },
    { id: "swot", num: "§08", label: "SWOT", Component: SWOTSection },
    { id: "recommendations", num: "§09", label: "ACTIONS", Component: RecommendationsSection },
    { id: "personas", num: "§10", label: "PERSONAS", Component: PersonaVerdicts },
];

export default function ShowcaseResultsPage() {
    const [active, setActive] = useState("market");

    return (
        <ResultsDashboardProvider session={null}>
            <>
                <ScoreHero />
            <TickerTape dark />
            <MetricsStrip />

            <Tabs value={active} onValueChange={setActive} id="showcase-report-tabs" className="border-b border-black">
                <div className="border-b border-black bg-black">
                    <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                        <TabsList className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                            {TABS.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="rounded-none border border-white/10 bg-black px-3 py-3 text-left text-[13px] font-black uppercase tracking-[0.22em] text-white transition hover:bg-white/5 data-[state=active]:bg-white data-[state=active]:text-black"
                                >
                                    <span className="text-[10px] opacity-60">{tab.num}</span>
                                    <div>{tab.label}</div>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </div>

                <div className="mx-auto max-w-[1480px] px-6 py-10 lg:px-10 lg:py-14">
                    {TABS.map(({ id, Component }) => (
                        <TabsContent key={id} value={id} className="space-y-10">
                            <Component />
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
            </>
        </ResultsDashboardProvider>
    );
}
