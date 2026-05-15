import type { DebateSetup } from "@/lib/types";

export type ValidateBriefForm = {
  idea: string;
  pain: string;
  edge: string;
  audience: string;
  whyNow: string;
  constraints: string;
};

export function buildValidateDebateSetup(form: ValidateBriefForm): DebateSetup {
  const chunks = [
    `**Pain**\n${form.pain.trim()}`,
    `**Edge**\n${form.edge.trim()}`,
    `**Buyer**\n${form.audience.trim()}`,
    `**Why now**\n${form.whyNow.trim()}`,
    `**Constraints**\n${form.constraints.trim()}`,
  ];
  const position = chunks.join("\n\n").trim().slice(0, 2000);
  return {
    template: "validate",
    topic: form.idea.trim().slice(0, 500),
    position,
    context: "",
    lens: "investor",
  };
}

/** Single hero pitch — expands into the same `DebateSetup` shape the validation API expects. */
export function buildValidateDebateSetupFromSingleIdea(ideaRaw: string): DebateSetup {
  const idea = ideaRaw.trim();
  const topic = idea.slice(0, 500);
  const detail = idea.slice(0, 1900);
  const position = [
    `**Pain**\n${detail}`,
    `**Edge**\nFounder claims differentiation inside the pitch above — panel to stress-test.`,
    `**Buyer**\nBuyer and user inferred from the pitch above.`,
    `**Why now**\nMarket timing and urgency inferred from the pitch above.`,
    `**Constraints**\nStandard early-stage constraints; refine after first validation pass.`,
  ]
    .join("\n\n")
    .trim()
    .slice(0, 2000);
  return {
    template: "validate",
    topic,
    position,
    context: "",
    lens: "investor",
  };
}
