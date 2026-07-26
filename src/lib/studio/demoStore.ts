/**
 * Demo autonomous store — a single source used by BOTH the Studio UI and the
 * live agent API routes (src/app/api/store/demo/*), so the store an AI agent
 * fetches over HTTP is the same store the Studio shows.
 *
 * This is the seam where a real, persisted per-business store will slot in once
 * the Business Brain is persisted. For now it's the MERIDIAN demo.
 */

import type { StorefrontInput, StoreProduct } from "./aiStorefront";

export const DEMO_PRODUCTS: StoreProduct[] = [
  { name: "Sprint Roast", description: "A bright single-origin the whole team ships on. Rotating micro-lots.", price: "€18/mo", priceValue: 18, category: "Subscription", sku: "sprint-roast", availability: "InStock" },
  { name: "Decaf Standup", description: "Swiss-water decaf for the afternoon sync — full body, no jitter.", price: "€16/mo", priceValue: 16, category: "Subscription", sku: "decaf-standup", availability: "InStock" },
  { name: "Team Kit", description: "Grinder, kettle, and a starter month for a distributed pod of six.", price: "€120", priceValue: 120, category: "Hardware", sku: "team-kit", availability: "InStock" },
];

export const DEMO_STORE: StorefrontInput = {
  brand: {
    name: "MERIDIAN",
    fullName: "Meridian Coffee Collective",
    domain: "meridian.coffee",
    oneLiner: "Meridian keeps distributed teams caffeinated with single-origin coffee, shipped on their sprint cadence.",
    positioning: "Premium ethical coffee ops",
    audience: "Remote-first teams",
    ink: "#2A1A12",
    bg: "#FBF8F3",
    surface: "#E8D9C4",
    accent: "#B5551D",
    onAccent: "#FFFFFF",
  },
  products: DEMO_PRODUCTS,
};
