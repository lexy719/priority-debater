"use client";

/**
 * useGoogleFonts — dynamically load the brand's AI-chosen fonts at runtime so the
 * Brand Kit actually RENDERS in them (wordmark, type samples), instead of only
 * naming them. Injects a Google Fonts <link> per family; unknown families fall
 * back gracefully to the CSS generic. Links are cached (left in <head>).
 */

import { useEffect } from "react";

export function fontStack(family: string | undefined, generic = "sans-serif"): string {
  if (!family) return generic;
  return `'${family.replace(/['"]/g, "")}', ${generic}`;
}

export function useGoogleFonts(families: (string | undefined)[]): void {
  const key = families.filter(Boolean).join("|");
  useEffect(() => {
    const unique = [...new Set(families.filter((f): f is string => Boolean(f && f.trim())))];
    for (const family of unique) {
      const id = `gfont-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      const fam = encodeURIComponent(family.trim()).replace(/%20/g, "+");
      link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
