import { NextResponse } from "next/server";
import { fetchLandingPageImages } from "@/lib/landing-images";

export const dynamic = "force-dynamic";

/**
 * Portrait stock photos for template gallery previews, keyed off the user's idea topic.
 * Requires UNSPLASH_ACCESS_KEY; returns [] when unset (client falls back to bundled stills).
 */
export async function GET(request: Request) {
  const topic = new URL(request.url).searchParams.get("topic")?.trim().slice(0, 200) || "";
  const images = await fetchLandingPageImages(topic || "startup business", {
    orientation: "portrait",
    perPage: 6,
  });
  return NextResponse.json({ images });
}
