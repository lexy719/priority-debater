import type { MetadataRoute } from "next";

/** Indexed for launch — workshop / demo routes omitted on purpose */
const routes = ["", "/results"];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://priority-debater.vercel.app";

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
