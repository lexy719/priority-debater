import React from "react";
import { useResultsDashboard } from "@/context/results-dashboard-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/v2/ui/card";
import { Badge } from "@/components/v2/ui/badge";
import { Separator } from "@/components/v2/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/v2/ui/chart";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

export default function ResultsV2() {
  const vm = useResultsDashboard();

  if (!vm.live) {
    return <div className="p-10 font-mono">No live session found...</div>;
  }

  const marketChartConfig = {
    tam: { label: "TAM", color: "var(--ink)" },
    sam: { label: "SAM", color: "var(--cyan-hi)" },
    som: { label: "SOM", color: "var(--danger)" },
  };

  const riskChartConfig = {
    value: { label: "Risk Level", color: "var(--danger)" },
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] font-sans pb-20">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-ink bg-[var(--paper)] p-4 flex justify-between items-center">
        <div className="font-display text-xl font-bold tracking-tight">PRIORITY DEBATER</div>
        <Badge variant="outline" className="font-mono rounded-none border-ink">{vm.overallScore.rank}</Badge>
      </header>

      {/* Hero Section */}
      <section className="border-b border-ink p-6 lg:p-12 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
            <div>
              <h1 className="font-display text-[8rem] leading-none font-bold tracking-tighter">
                {vm.overallScore.score}
                <span className="text-4xl text-danger ml-2 tracking-normal">/100</span>
              </h1>
            </div>
            <div className="text-left md:text-right">
              <div className="font-mono text-xs uppercase tracking-widest text-ink/60 mb-1">Final Verdict</div>
              <div className="font-display text-5xl font-black text-danger tracking-tight">{vm.idea.verdict}</div>
            </div>
          </div>
          
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold mb-4 leading-snug">{vm.idea.title}</h2>
            <p className="font-mono text-base leading-relaxed text-ink/80">{vm.dashboardUi.scoreHeroBlurb}</p>
          </div>
        </div>
      </section>

      {/* Breakdown Section */}
      {vm.rubricBreakdown && (
        <section className="border-b border-ink p-6 lg:p-12">
          <div className="max-w-6xl mx-auto">
            <h3 className="font-mono text-xs uppercase tracking-widest mb-6">Rubric Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vm.rubricBreakdown.map((r, i) => (
                <Card key={i} className="rounded-none border-ink shadow-none">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-display text-lg font-bold">{r.label}</CardTitle>
                      <div className="font-mono text-lg font-bold text-danger">{r.score}</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-xs text-ink/70 leading-relaxed">{r.reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Market Section */}
      <section className="border-b border-ink p-6 lg:p-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-4">Market Assessment</h3>
              <h2 className="font-display text-4xl font-bold mb-4">Market Size & Demand</h2>
              <p className="font-mono text-sm leading-relaxed text-ink/80 mb-8">{vm.marketIntro}</p>
              
              <div className="space-y-4">
                {vm.marketSignals.map((s, i) => (
                  <div key={i} className="flex justify-between items-center border border-ink p-3">
                    <span className="font-mono text-xs uppercase">{s.label}</span>
                    <Badge variant={s.weight.includes("+") || s.weight.includes("STRONG") ? "default" : "secondary"} className="rounded-none">
                      {s.tag}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-8">
              <Card className="rounded-none border-ink shadow-none h-full">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="font-display text-xl">Growth Projection</CardTitle>
                    <span className="font-mono text-xs font-bold text-ink/60">{vm.marketCagrLabel}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    {vm.marketGrowth.length > 0 ? (
                      <ChartContainer config={marketChartConfig} className="h-full w-full">
                        <AreaChart data={vm.marketGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTam" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-tam)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-tam)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSam" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-sam)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-sam)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                          <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {/* @ts-ignore */}
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area type="monotone" dataKey="tam" stroke="var(--color-tam)" fillOpacity={1} fill="url(#colorTam)" />
                          <Area type="monotone" dataKey="sam" stroke="var(--color-sam)" fillOpacity={1} fill="url(#colorSam)" />
                          <Area type="monotone" dataKey="som" stroke="var(--color-som)" fillOpacity={0.8} fill="var(--color-som)" />
                        </AreaChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center font-mono text-sm text-ink/50 border border-dashed border-ink/30">
                        Insufficient data to chart market growth.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Risk Section */}
      <section className="border-b border-ink p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-mono text-xs uppercase tracking-widest mb-4">Risk Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="font-display text-4xl font-bold mb-4">Existential Threats</h2>
              <p className="font-mono text-sm leading-relaxed text-ink/80 mb-8">{vm.riskIntro}</p>
              
              <div className="space-y-4">
                {vm.riskBreakdown.map((r, i) => (
                  <Card key={i} className="rounded-none border-ink shadow-none">
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="font-display text-lg">{r.title}</CardTitle>
                        <Badge variant={r.severity === "HIGH" ? "destructive" : "secondary"} className="rounded-none">{r.severity}</Badge>
                      </div>
                      <CardDescription className="font-mono text-xs">{r.category}</CardDescription>
                    </CardHeader>
                    <Separator className="bg-ink" />
                    <CardContent className="py-4">
                      <div className="font-mono text-xs uppercase text-ink/50 mb-1">Mitigation</div>
                      <div className="font-mono text-sm">{r.mitigation}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center items-center">
              <div className="w-full max-w-md aspect-square">
                {vm.riskRadarHasData ? (
                  <ChartContainer config={riskChartConfig} className="w-full h-full">
                    <RadarChart data={vm.riskRadar} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <PolarGrid stroke="var(--ink)" strokeOpacity={0.2} />
                      <PolarAngleAxis dataKey="dim" tick={{ fill: "var(--ink)", fontSize: 12, fontFamily: "JetBrains Mono" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Risk" dataKey="value" stroke="var(--danger)" fill="var(--danger)" fillOpacity={0.2} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-full flex items-center justify-center font-mono text-sm text-ink/50 border border-dashed border-ink/30">
                    Insufficient data for risk radar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Persona Verdicts */}
      <section className="p-6 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-mono text-xs uppercase tracking-widest mb-6">Persona Verdicts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vm.personaVerdicts.map((p, i) => (
              <Card key={i} className="rounded-none border-2 border-ink shadow-[4px_4px_0_0_var(--ink)] bg-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-display text-2xl font-bold" style={{ color: p.accent }}>{p.name}</CardTitle>
                      <CardDescription className="font-mono uppercase text-xs mt-1">{p.role}</CardDescription>
                    </div>
                    <div className="font-display text-3xl font-black text-danger">{p.verdict}</div>
                  </div>
                </CardHeader>
                <Separator className="bg-ink/20 mb-4" />
                <CardContent>
                  <blockquote className="font-display text-lg leading-snug italic">"{p.quote}"</blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
    </div>
  );
}
