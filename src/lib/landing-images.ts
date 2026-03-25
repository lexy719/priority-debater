/**
 * Optional Unsplash search for landing-page stock imagery.
 * Set UNSPLASH_ACCESS_KEY in env (https://unsplash.com/oauth/applications).
 */

export type LandingImageRef = {
  /** Direct CDN URL (regular size) */
  url: string;
  /** Page on unsplash.com for this photo (attribution link) */
  photoPageUrl: string;
  /** Photographer display name */
  photographer: string;
  /** Photographer profile on Unsplash */
  photographerUrl: string;
  /** Suggested alt text */
  suggestedAlt: string;
};

/**
 * When Unsplash is unavailable (no key, API error, or empty results), templates still need a hero photo.
 * Same pool as client-side template previews so gallery and generated HTML stay consistent.
 */
export const FALLBACK_LANDING_IMAGES: LandingImageRef[] = [
  {
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team collaborating around a laptop",
  },
  {
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Modern workspace",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team meeting",
  },
];

const QUERY_MAX_LEN = 200;

const STOPWORDS = new Set([
  "that", "this", "with", "from", "your", "will", "have", "been", "their", "what", "when", "where",
  "which", "about", "into", "more", "than", "then", "them", "these", "those", "very", "just", "like",
  "also", "only", "some", "such", "make", "made", "many", "using", "used", "team", "teams", "need",
  "help", "helps", "build", "built", "get", "gets", "each", "other", "were", "they", "here", "there",
  "want", "wants", "work", "works", "best", "most", "real", "time", "data", "user", "users",
]);

/**
 * Unsplash search string: product name + salient terms from the pitch so hero imagery matches the idea.
 */
export function buildIdeaImageSearchQuery(topic: string, position?: string): string {
  const t = topic.replace(/\s+/g, " ").trim().slice(0, 100);
  const base = t.length >= 3 ? t : "startup business";
  const raw = (position ?? "").replace(/\s+/g, " ").trim();
  if (raw.length < 18) return base.slice(0, QUERY_MAX_LEN);

  const words = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  const unique = [...new Set(words)].slice(0, 14).join(" ");
  const combined =
    unique.length >= 10 ? `${base} ${unique}` : `${base} ${raw.slice(0, 100)}`;
  const q = combined.slice(0, QUERY_MAX_LEN).trim();
  return q.length >= 3 ? q : base;
}

export type FetchLandingImagesOptions = {
  /** Unsplash API: landscape | portrait | squarish */
  orientation?: "landscape" | "portrait" | "squarish";
  perPage?: number;
  /** Pitch / positioning — blended into the search query for more relevant photos */
  position?: string;
};

export type LandingPageImagesResult = {
  images: LandingImageRef[];
  /** True when no API key, request failed, or search returned zero usable photos */
  usedFallback: boolean;
};

/** Search Unsplash; falls back to stock stills if no key, error, or empty results. */
export async function fetchLandingPageImages(
  topic: string,
  options?: FetchLandingImagesOptions
): Promise<LandingPageImagesResult> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  const perPage = Math.min(30, Math.max(1, options?.perPage ?? 4));
  const sliceFallback = (): LandingImageRef[] =>
    FALLBACK_LANDING_IMAGES.slice(0, Math.min(perPage, FALLBACK_LANDING_IMAGES.length));

  if (!key) return { images: sliceFallback(), usedFallback: true };

  const query = buildIdeaImageSearchQuery(topic, options?.position);
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("orientation", options?.orientation ?? "landscape");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return { images: sliceFallback(), usedFallback: true };
    const data = (await res.json()) as {
      results?: Array<{
        urls?: { regular?: string; small?: string };
        links?: { html?: string; download_location?: string };
        user?: { name?: string; links?: { html?: string } };
        alt_description?: string | null;
        description?: string | null;
      }>;
    };

    const results = data.results ?? [];
    const out: LandingImageRef[] = [];

    for (const photo of results) {
      const imageUrl = photo.urls?.regular || photo.urls?.small;
      const photoPage = photo.links?.html;
      if (!imageUrl || !photoPage) continue;

      const photographer = photo.user?.name?.trim() || "Photographer";
      const photographerUrl = photo.user?.links?.html || "https://unsplash.com";
      const suggestedAlt =
        (photo.alt_description || photo.description || `${query} — ${photographer}`).slice(0, 180);

      out.push({
        url: imageUrl,
        photoPageUrl: photoPage,
        photographer,
        photographerUrl,
        suggestedAlt,
      });

      // API guidelines: register a download per photo displayed
      const dl = photo.links?.download_location;
      if (dl) {
        fetch(dl, { headers: { Authorization: `Client-ID ${key}` }, cache: "no-store" }).catch(() => {});
      }
    }

    return out.length > 0 ? { images: out, usedFallback: false } : { images: sliceFallback(), usedFallback: true };
  } catch {
    return { images: sliceFallback(), usedFallback: true };
  }
}
