import type { MetadataRoute } from "next";

const BASE = "https://priority-debater.vercel.app";

/** AI shopping/retrieval agents — explicitly welcomed, especially on /store/*.
    Agent visibility is the product; blocking these would break it. */
const AI_AGENTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-User", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "GoogleOther",
  "Amazonbot", "meta-externalagent", "cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // AI agents: full read access — published stores must be legible to them.
      { userAgent: AI_AGENTS, allow: "/" },
      {
        userAgent: "*",
        allow: "/",
        // Gated / user-specific / utility routes — no SEO value, keep out of the index.
        disallow: [
          "/api/",
          "/account",
          "/credits",
          "/results",
          "/debate",
          "/brand-kit",
          "/launch-kit",
          "/campaign",
          "/landing-builder",
          "/ship",
          "/pitch",
          "/landing",
          "/resultstest",
          "/auth/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
