import type { MetadataRoute } from "next";

const BASE = "https://priority-debater.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
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
        "/flowtest",
        "/resultstest",
        "/test",
        "/test-100",
        "/auth/",
      ],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
