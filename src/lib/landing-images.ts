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

function buildSearchQuery(topic: string): string {
  const t = topic.replace(/\s+/g, " ").trim().slice(0, 120);
  return t.length >= 3 ? t : "startup business";
}

/** Search Unsplash; returns 0–4 images. Empty if no key or API error. */
export async function fetchLandingPageImages(topic: string): Promise<LandingImageRef[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (!key) return [];

  const query = buildSearchQuery(topic);
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "4");
  url.searchParams.set("orientation", "landscape");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
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

    return out;
  } catch {
    return [];
  }
}
