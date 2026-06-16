"use client";

import { SiteNav } from "@/components/SiteNav";
import { FlowTicker } from "./FlowTicker";
import { JourneyStepper, type JourneyStage } from "./JourneyStepper";

export type FlowStage = Extract<JourneyStage, "brand" | "launch" | "campaign" | "landing" | "ship">;

type FlowNavProps = { current?: FlowStage; subtitle?: string };

/**
 * Flow header = the shared SiteNav (one identity across the whole site) plus
 * the idea ticker and the clickable journey stepper that connects every
 * post-validation stage.
 */
export function FlowNav({ current = "brand", subtitle }: FlowNavProps) {
  return (
    <header className="sticky top-0 z-50">
      <SiteNav subtitle={subtitle} sticky={false} />
      <FlowTicker />
      <JourneyStepper current={current} />
    </header>
  );
}
