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
 * Diverse fallback pool — covers different business categories so the
 * hero image looks reasonable even without an Unsplash API key.
 */
export const FALLBACK_LANDING_IMAGES: LandingImageRef[] = [
  {
    url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Developer working on code at a modern desk",
  },
  {
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Analytics dashboard on a laptop screen",
  },
  {
    url: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Creative brainstorming session with sticky notes",
  },
  {
    url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Team working together on laptops",
  },
  {
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Modern open office space with natural light",
  },
  {
    url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=900&q=85&auto=format&fit=crop",
    photoPageUrl: "https://unsplash.com",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    suggestedAlt: "Software code on a screen in dark mode",
  },
];

const QUERY_MAX_LEN = 200;

/** Words that add noise to image searches and should be filtered out. */
const STOPWORDS = new Set([
  // common English
  "that", "this", "with", "from", "your", "will", "have", "been", "their",
  "what", "when", "where", "which", "about", "into", "more", "than", "then",
  "them", "these", "those", "very", "just", "like", "also", "only", "some",
  "such", "make", "made", "many", "much", "each", "other", "were", "they",
  "here", "there", "want", "wants", "able", "would", "could", "should",
  "does", "doing", "being", "through", "between", "before", "after",
  // business jargon (too generic for image search)
  "product", "service", "services", "solution", "solutions", "platform",
  "company", "business", "startup", "tool", "tools", "software", "system",
  "application", "feature", "features", "customer", "customers", "market",
  "industry", "leverage", "innovative", "innovative", "scalable", "seamless",
  "robust", "cutting-edge", "world-class", "best-in-class", "leading",
  "powerful", "comprehensive", "streamline", "optimize", "enable", "enables",
  "empower", "empowers", "revolutionize", "transform", "transforming",
  // verbs that don't help image search
  "using", "used", "build", "built", "need", "needs", "help", "helps",
  "work", "works", "create", "creating", "provide", "provides", "allow",
  "allows", "offer", "offers", "give", "gives", "take", "takes",
  "get", "gets", "keep", "keeps", "find", "finds", "show", "shows",
  // other noise
  "team", "teams", "user", "users", "people", "way", "ways",
  "best", "most", "real", "time", "data", "based", "first", "well",
  "high", "level", "free", "easy", "fast", "simple", "better", "new",
]);

/**
 * Category detection: match topic + pitch against known verticals
 * to inject better Unsplash search terms.
 */
const CATEGORY_KEYWORDS: Record<string, { patterns: RegExp; searchBoost: string }> = {
  health: {
    patterns: /\b(health|medical|wellness|fitness|doctor|patient|therapy|mental.?health|nutrition|diet|gym|workout|telehealth|pharma|clinic)\b/i,
    searchBoost: "health wellness medical",
  },
  education: {
    patterns: /\b(education|learning|tutor|school|student|course|teaching|edtech|classroom|university|training|lesson|curriculum)\b/i,
    searchBoost: "education learning classroom",
  },
  finance: {
    patterns: /\b(finance|fintech|banking|payment|invest|crypto|trading|insurance|accounting|budget|money|wallet|loan|credit)\b/i,
    searchBoost: "finance technology banking",
  },
  food: {
    patterns: /\b(food|restaurant|recipe|cooking|meal|delivery|kitchen|chef|grocery|dining|catering|menu|eat)\b/i,
    searchBoost: "food cooking restaurant",
  },
  ecommerce: {
    patterns: /\b(ecommerce|e-commerce|shop|store|retail|marketplace|sell|merchant|inventory|dropship|cart|checkout)\b/i,
    searchBoost: "ecommerce shopping online store",
  },
  travel: {
    patterns: /\b(travel|hotel|booking|flight|tourism|vacation|adventure|destination|trip|hostel|airbnb)\b/i,
    searchBoost: "travel destination adventure",
  },
  realestate: {
    patterns: /\b(real.?estate|property|housing|rent|apartment|mortgage|listing|broker|home.?buying)\b/i,
    searchBoost: "real estate property home",
  },
  sustainability: {
    patterns: /\b(sustain|green|eco|climate|solar|renewable|carbon|environment|recycl|clean.?energy)\b/i,
    searchBoost: "sustainability green energy",
  },
  ai: {
    patterns: /\b(artificial.?intelligence|machine.?learning|deep.?learning|neural|nlp|chatbot|automation|ai-powered|gpt|llm)\b/i,
    searchBoost: "artificial intelligence technology",
  },
  saas: {
    patterns: /\b(saas|dashboard|analytics|crm|erp|workflow|project.?management|collaboration|productivity|notion|slack)\b/i,
    searchBoost: "dashboard technology software",
  },
  creative: {
    patterns: /\b(design|creative|art|music|video|photo|content.?creation|media|podcast|streaming|studio|portfolio)\b/i,
    searchBoost: "creative design studio",
  },
  social: {
    patterns: /\b(social|community|network|messaging|chat|forum|dating|connect|influencer|content.?creator)\b/i,
    searchBoost: "social network community",
  },
};

/**
 * Detect the business category from topic + position to boost image relevance.
 */
function detectCategory(topic: string, position?: string): string | null {
  const text = `${topic} ${position ?? ""}`.toLowerCase();
  for (const [, { patterns, searchBoost }] of Object.entries(CATEGORY_KEYWORDS)) {
    if (patterns.test(text)) return searchBoost;
  }
  return null;
}

/**
 * Build an Unsplash search query from the idea's topic + pitch.
 * Uses category detection + keyword extraction for relevant results.
 */
export function buildIdeaImageSearchQuery(topic: string, position?: string): string {
  const t = topic.replace(/\s+/g, " ").trim().slice(0, 80);
  const base = t.length >= 3 ? t : "startup technology";

  // Try category detection first for a focused search
  const categoryBoost = detectCategory(topic, position);

  const raw = (position ?? "").replace(/\s+/g, " ").trim();

  // Extract meaningful keywords from the pitch
  const words = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  const unique = [...new Set(words)].slice(0, 8);

  // Build query: topic + category context + pitch keywords
  const parts: string[] = [base];
  if (categoryBoost) parts.push(categoryBoost);
  if (unique.length >= 2) parts.push(unique.slice(0, 5).join(" "));

  const q = parts.join(" ").slice(0, QUERY_MAX_LEN).trim();
  return q.length >= 3 ? q : "startup technology business";
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
  const perPage = Math.min(30, Math.max(1, options?.perPage ?? 6));
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
        (photo.alt_description || photo.description || `${topic} — ${photographer}`).slice(0, 180);

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
