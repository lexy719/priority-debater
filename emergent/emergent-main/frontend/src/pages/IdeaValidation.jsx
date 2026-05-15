import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AppNavbar from "@/components/AppNavbar";
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

export default function IdeaValidation() {
    const [active, setActive] = useState("market");

    return (
        <div data-testid="idea-validation-page" className="min-h-screen bg-[var(--paper)] text-black">
            <AppNavbar />
            <TickerTape />
            <ScoreHero />
            <TickerTape dark />
            <MetricsStrip />

            <Tabs
                value={active}
                onValueChange={setActive}
                id="report-tabs"
                className="border-b border-black"
            >
                {/* Sticky tab bar */}
                <div className="sticky top-[73px] z-40 border-b-2 border-black bg-black">
                    <div className="mx-auto max-w-[1480px] px-6 lg:px-10">
                        <div className="flex items-center justify-between gap-6 py-3">
                            <div className="font-mono text-[10px] tracking-wider text-white/50">
                                ◆ REPORT NAVIGATION · §03 → §10
                            </div>
                            <div className="hidden font-mono text-[10px] tracking-wider text-white/40 md:block">
                                CLICK A SECTION · 08 TABS
                            </div>
                        </div>
                        <TabsList
                            data-testid="report-tabs-list"
                            className="flex h-auto w-full flex-wrap justify-start gap-0 rounded-none border-0 bg-transparent p-0"
                        >
                            {TABS.map((t) => (
                                <TabsTrigger
                                    key={t.id}
                                    value={t.id}
                                    data-testid={`tab-trigger-${t.id}`}
                                    className="group relative flex-1 min-w-[110px] rounded-none border-r border-white/15 px-4 py-4 font-mono text-[11px] tracking-[0.18em] text-white/55 shadow-none transition-colors hover:bg-white/5 hover:text-white data-[state=active]:bg-[var(--hi)] data-[state=active]:text-black data-[state=active]:shadow-none last:border-r-0"
                                >
                                    <div className="flex flex-col items-start gap-1 text-left">
                                        <span className="font-mono text-[9px] opacity-60 group-data-[state=active]:opacity-80">
                                            {t.num}
                                        </span>
                                        <span className="font-display text-base tracking-tight">
                                            {t.label}
                                        </span>
                                    </div>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                </div>

                {/* Tab contents */}
                {TABS.map(({ id, Component }) => (
                    <TabsContent
                        key={id}
                        value={id}
                        data-testid={`tab-content-${id}`}
                        className="mt-0 ring-0 focus-visible:ring-0"
                    >
                        <Component />
                    </TabsContent>
                ))}
            </Tabs>

            <TickerTape />
            <Footer />
        </div>
    );
}
