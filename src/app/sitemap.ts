import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://priority-debater.vercel.app";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/validate`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/landing-generator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];
}
