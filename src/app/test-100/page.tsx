"use client";

import { useEffect } from "react";
import { useRouter, notFound } from "next/navigation";
import { saveSession } from "@/lib/session";
import type { ValidationSession } from "@/lib/types";

const mockSession: ValidationSession = {
  setup: {
    template: "standard",
    topic: "The Ultimate AI Assistant",
    position: "We build AI that actually works, seamlessly integrating into your workflow.",
    context: "Seed stage startup with strong traction.",
    lens: "investor",
  },
  validationContent: "# Validation Output\n\nThis is a mock validation output.",
  messages: [],
  createdAt: Date.now(),
  dashboardData: {
    score: 100,
    verdict: "GO",
    confidenceLabel: "HIGH",
    confidencePct: 98,
    rankLabel: "Top 1%",
    oneLineThesis: "An unstoppable force in the AI assistant space with flawless execution.",
    scoreHeroBlurb: "Perfect score. The market is ready, the product is flawless, and the team is unmatched.",
    scoreHistory: [
      { v: "v1", score: 80 },
      { v: "v2", score: 90 },
      { v: "v3", score: 100 },
    ],
    categoryScores: {
      problemSolutionFit: 100,
      marketOpportunity: 100,
      competitiveEdge: 100,
      businessModel: 100,
      teamExecution: 100,
      timingTrends: 100,
    },
    rubricBreakdown: [
      { key: "psf", label: "Problem/Solution Fit", weight: 20, score: 100, contribution: 20, reason: "Flawless fit." },
      { key: "mo", label: "Market Opportunity", weight: 20, score: 100, contribution: 20, reason: "Massive TAM." },
      { key: "ce", label: "Competitive Edge", weight: 15, score: 100, contribution: 15, reason: "Deep moat." },
      { key: "bm", label: "Business Model", weight: 15, score: 100, contribution: 15, reason: "Highly profitable." },
      { key: "te", label: "Team Execution", weight: 15, score: 100, contribution: 15, reason: "Stellar track record." },
      { key: "tt", label: "Timing & Trends", weight: 15, score: 100, contribution: 15, reason: "Perfect timing." },
    ],
    market: {
      tam: "100", sam: "50", som: "10",
      cagrPct: 25,
      intro: "The market is expanding rapidly and perfectly positioned for this solution.",
      growth: [
        { year: "2024", tam: 80, sam: 40, som: 5 },
        { year: "2025", tam: 90, sam: 45, som: 7 },
        { year: "2026", tam: 100, sam: 50, som: 10 },
      ],
      signals: [
        { tag: "GROWTH", label: "Market is exploding", weight: "STRONG" },
        { tag: "DEMAND", label: "High organic demand", weight: "STRONG" },
      ],
    },
    risk: {
      intro: "Virtually no risks identified. Flawless execution plan.",
      radar: [
        { dim: "Technical", value: 100, full: 100 },
        { dim: "Market", value: 100, full: 100 },
        { dim: "Execution", value: 100, full: 100 },
        { dim: "Financial", value: 100, full: 100 },
        { dim: "Legal", value: 100, full: 100 },
      ],
      breakdown: [
        { category: "Execution", severity: "LOW", title: "Minor delays", mitigation: "Agile buffers in place" },
      ],
    },
    competition: {
      intro: "You are lightyears ahead of the competition.",
      competitors: [
        { name: "Legacy Corp", focus: "Old tech", price: "$$$", traction: 50, weakness: "Slow" },
        { name: "Startup X", focus: "Niche AI", price: "$$", traction: 30, weakness: "Limited features" },
      ],
      scatter: [
        { x: 20, y: 30, name: "Legacy Corp" },
        { x: 40, y: 50, name: "Startup X" },
        { x: 100, y: 100, name: "You", you: true },
      ],
    },
    revenue: {
      headline: "Unprecedented Growth",
      narrative: "Path to $100M ARR is clear and achievable.",
      projection: [
        { year: "Y1", total: 10, base: 8, expansion: 2 },
        { year: "Y2", total: 30, base: 20, expansion: 10 },
        { year: "Y3", total: 100, base: 60, expansion: 40 },
      ],
      pricingModels: [
        { plan: "Pro", price: "$99/mo", terms: "Per user" },
        { plan: "Enterprise", price: "Custom", terms: "Annual contract" },
      ],
    },
    audience: {
      intro: "Target audience is desperate for this solution.",
      segments: [
        { name: "Enterprise", value: 60, color: "#000" },
        { name: "Mid-Market", value: 30, color: "#333" },
        { name: "SMB", value: 10, color: "#666" },
      ],
      personas: [
        { title: "CTO", org: "Fortune 500", budget: "$1M+", pain: "Inefficiency", why: "Saves time and money" },
      ],
    },
    swot: {
      strengths: ["First mover advantage", "Proprietary AI", "Strong team"],
      weaknesses: ["None identified"],
      opportunities: ["Global expansion", "New verticals"],
      threats: ["Macroeconomic shifts"],
    },
    recommendations: [
      { priority: "P0", title: "Scale Immediately", impact: "High", horizon: "Q1", tags: ["Growth", "Sales"] },
    ],
    personaVerdicts: [
      { name: "The VC", role: "Investor", accent: "red", verdict: "GO", score: 100, quote: "Shut up and take my money." },
    ],
    ticker: ["FUNDING SECURED", "GROWTH EXPLODING", "MARKET DOMINATION"],
  },
};

export default function Test100Page() {
  const router = useRouter();

  useEffect(() => {
    saveSession(mockSession);
    router.push("/results");
  }, [router]);

  if (process.env.NODE_ENV === "production") notFound();

  return <div className="p-10 font-mono text-sm">Injecting 100/100 mock session and redirecting...</div>;
}
