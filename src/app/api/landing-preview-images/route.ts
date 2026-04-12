import { NextResponse } from "next/server";
import { fetchLandingPageImages } from "@/lib/landing-images";

export const dynamic = "force-dynamic";

/**
 * Stock photos for template gallery previews (same orientation + pool shape as curated HTML merge).
 * Uses Unsplash when UNSPLASH_ACCESS_KEY is set; otherwise returns the same built-in stills as merge.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const topic = sp.get("topic")?.trim().slice(0, 200) || "";
  const position = sp.get("position")?.trim().slice(0, 2000) || "";
  const { images, usedFallback, category } = await fetchLandingPageImages(topic || "startup business", {
    orientation: "landscape",
    perPage: 10,
    position: position || undefined,
  });
  return NextResponse.json({
    images,
    usedFallback,
    category: { id: category.id, label: category.label },
  });
}
