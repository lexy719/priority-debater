/**
 * PD Agent — shared contract.
 *
 * The agent runs on OpenAI tool-calling (per the all-OpenAI decision — NOT the
 * spec's Claude Agent SDK). "Skills" are server-side prompt modules (see
 * skills.ts) that generate real, store-specific content from a CommerceReport.
 */

export type SkillId =
  | "buying_guide"
  | "product_rewrite"
  | "llms_txt"
  | "schema"
  | "faq"
  | "comparison_page"
  | "competitor_analysis"
  // Marketing / autopilot — strategy-driven output from the scan intelligence.
  | "social_post"
  | "content_calendar"
  | "video_ad_script";

export type ArtifactFormat = "markdown" | "txt" | "json" | "html" | "text";

export interface AgentArtifact {
  skill: SkillId;
  title: string;
  format: ArtifactFormat;
  body: string;
  /** Plain-language steps to put this live (Shopify push is gated until OAuth). */
  installSteps: string[];
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  artifact?: AgentArtifact;
  ts: string;
}

export interface AgentThread {
  id: string;
  userId: string | null;
  reportId: string;
  title: string;
  messages: AgentMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentThreadSummary {
  id: string;
  title: string;
  updatedAt: string;
}
