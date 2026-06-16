"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { ResultsDashboardProvider } from "@/context/results-dashboard-context";
import type { ValidationSession } from "@/lib/types";
import ResultsV2 from "@/components/v2/ResultsV2";

const mock10Session: ValidationSession = {
  setup: {
    template: "standard",
    topic: "A decentralized social network for pets",
    position: "We put pets on the blockchain.",
    context: "Pre-product, pre-revenue. Seeking $5M seed.",
    lens: "investor",
  },
  validationContent: "# Validation Output\n\nThis is a mock validation output.",
  messages: [],
  createdAt: Date.now(),
  dashboardData: {
    score: 10,
    verdict: "NO-GO",
    confidenceLabel: "HIGH",
    confidencePct: 95,
    rankLabel: "Bottom 1%",
    oneLineThesis: "A highly flawed concept with no clear market demand or viable business model.",
    scoreHeroBlurb: "Fundamental flaws across the board. The market size is tiny, technical risk is massive, and the business model is non-existent.",
    scoreHistory: [
      { v: "v1", score: 12 },
      { v: "v2", score: 15 },
      { v: "v3", score: 10 },
    ],
    categoryScores: {
      problemSolutionFit: 10,
      marketOpportunity: 5,
      competitiveEdge: 10,
      businessModel: 5,
      teamExecution: 20,
      timingTrends: 10,
    },
    rubricBreakdown: [
      { key: "psf", label: "Problem/Solution Fit", weight: 20, score: 10, contribution: 2, reason: "A solution in search of a problem." },
      { key: "mo", label: "Market Opportunity", weight: 20, score: 5, contribution: 1, reason: "Extremely niche market." },
      { key: "ce", label: "Competitive Edge", weight: 15, score: 10, contribution: 1.5, reason: "No defensibility." },
      { key: "bm", label: "Business Model", weight: 15, score: 5, contribution: 0.75, reason: "No willingness to pay." },
      { key: "te", label: "Team Execution", weight: 15, score: 20, contribution: 3, reason: "Inexperienced in domain." },
      { key: "tt", label: "Timing & Trends", weight: 15, score: 10, contribution: 1.5, reason: "Too early, or completely irrelevant." },
    ],
    market: {
      tam: "0.5", sam: "0.1", som: "0.01",
      cagrPct: 2,
      intro: "The market for pet blockchains is virtually non-existent.",
      growth: [
        { year: "2024", tam: 0.5, sam: 0.1, som: 0.01 },
        { year: "2025", tam: 0.51, sam: 0.11, som: 0.011 },
        { year: "2026", tam: 0.52, sam: 0.12, som: 0.012 },
      ],
      signals: [
        { tag: "DEMAND", label: "No search volume", weight: "WEAK" },
        { tag: "TREND", label: "Crypto winter", weight: "-STRONG" },
      ],
    },
    risk: {
      intro: "This project is a minefield of existential risks.",
      radar: [
        { dim: "Technical", value: 90, full: 100 },
        { dim: "Market", value: 100, full: 100 },
        { dim: "Execution", value: 80, full: 100 },
        { dim: "Financial", value: 95, full: 100 },
        { dim: "Legal", value: 60, full: 100 },
      ],
      breakdown: [
        { category: "Market", severity: "HIGH", title: "Zero Demand", mitigation: "Pivot immediately" },
        { category: "Financial", severity: "HIGH", title: "High Burn Rate", mitigation: "Cut costs" },
      ],
    },
    competition: {
      intro: "Even without direct competitors, alternatives are vastly superior.",
      competitors: [
        { name: "Instagram (Pets)", focus: "Web2 Social", price: "Free", traction: 100, weakness: "Centralized" },
        { name: "DogPark IRL", focus: "Physical", price: "Free", traction: 90, weakness: "Location bound" },
      ],
      scatter: [
        { x: 90, y: 90, name: "Instagram" },
        { x: 10, y: 10, name: "You", you: true },
      ],
    },
    revenue: {
      headline: "No Path to Monetization",
      narrative: "Pets don't have credit cards. Owners won't pay for this.",
      projection: [
        { year: "Y1", total: 0, base: 0, expansion: 0 },
        { year: "Y2", total: 0.1, base: 0.1, expansion: 0 },
        { year: "Y3", total: 0.2, base: 0.2, expansion: 0 },
      ],
      pricingModels: [
        { plan: "Token", price: "$0.00", terms: "Airdrop" },
      ],
    },
    audience: {
      intro: "Target audience is poorly defined and unwilling to pay.",
      segments: [
        { name: "Crypto Bros", value: 80, color: "#ff3b30" },
        { name: "Pet Owners", value: 20, color: "#666" },
      ],
      personas: [
        { title: "Dog Owner", org: "None", budget: "$0", pain: "None", why: "No reason to use it" },
      ],
    },
    swot: {
      strengths: ["Unique concept"],
      weaknesses: ["No revenue", "No users", "High tech risk"],
      opportunities: ["Pivot to B2B SaaS"],
      threats: ["Running out of money in 3 months"],
    },
    recommendations: [
      { priority: "P0", title: "Hard Pivot", impact: "High", horizon: "Immediate", tags: ["Strategy", "Survival"] },
      { priority: "P1", title: "Return Capital", impact: "High", horizon: "Q1", tags: ["Financial"] },
    ],
    personaVerdicts: [
      { name: "The VC", role: "Investor", accent: "red", verdict: "NO-GO", score: 10, quote: "This is the worst pitch I have ever seen." },
      { name: "The Pragmatist", role: "Customer", accent: "blue", verdict: "NO-GO", score: 5, quote: "Why would I ever use this?" },
    ],
    ticker: ["PIVOT REQUIRED", "HIGH RISK", "ZERO TRACTION", "BURN RATE CRITICAL"],
  },
};

export default function Test10Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Just delay to match the typical loading feel
    queueMicrotask(() => {
      setReady(true);
    });
  }, []);

  if (process.env.NODE_ENV === "production") notFound();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] font-mono text-xs tracking-wider text-black/60">
        LOADING TEST REPORT…
      </div>
    );
  }

  return (
    <ResultsDashboardProvider session={mock10Session}>
      <ResultsV2 />
    </ResultsDashboardProvider>
  );
}
