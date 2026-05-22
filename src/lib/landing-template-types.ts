/**
 * Shared types + utilities for the landing-template system.
 * The same `LandingCopy` payload feeds all 4 templates so they're swappable.
 */

import type { LandingImageRef } from "@/lib/landing-images";

export const TEMPLATE_IDS = ["editorial", "warm", "tech", "brutalist"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export interface TemplateDescriptor {
    id: TemplateId;
    label: string;
    tagline: string;
    /** Hex preview swatches for the gallery card */
    swatches: [string, string, string];
    /** One-liner of who/what this template suits */
    bestFor: string;
}

export const TEMPLATE_GALLERY: TemplateDescriptor[] = [
    {
        id: "editorial",
        label: "EDITORIAL",
        tagline: "Magazine layout, serif headlines, cream paper.",
        swatches: ["#f4ef e3", "#0a0a0a", "#ffe600"],
        bestFor: "B2B, consultancies, premium services",
    },
    {
        id: "warm",
        label: "FOUNDER-WARM",
        tagline: "Pastel cards, rounded edges, friendly conversion copy.",
        swatches: ["#fef3c7", "#fed7aa", "#fce7f3"],
        bestFor: "Indie products, SaaS, communities",
    },
    {
        id: "tech",
        label: "TECH-MINIMAL",
        tagline: "Dark mode, gradient hero, dev-grade type.",
        swatches: ["#0b0d12", "#7c3aed", "#22d3ee"],
        bestFor: "Devtools, AI products, infra",
    },
    {
        id: "brutalist",
        label: "BRUTALIST",
        tagline: "Heavy borders, neon yellow, raw mono type.",
        swatches: ["#fefce8", "#0a0a0a", "#ffe600"],
        bestFor: "Bold launches, edgy brands",
    },
];

export interface LandingCopy {
    brand: { name: string; tagline: string };
    hero: {
        kicker: string;
        title: string;
        sub: string;
        primaryCta: string;
        secondaryCta: string;
        proofLine: string;
    };
    problem: { eyebrow: string; title: string; body: string };
    features: { kicker: string; title: string; body: string }[]; // 6
    metrics: { value: string; label: string }[]; // 4
    testimonial: { quote: string; author: string; role: string };
    pricing: { name: string; price: string; period: string; features: string[]; cta: string; featured?: boolean }[]; // 3
    finalCta: { title: string; body: string; cta: string };
    seo: { title: string; description: string };
    /** Stock image search query (one phrase) — fed to /api/landing-preview-images */
    imageQuery: string;
}

export interface TemplateProps {
    copy: LandingCopy;
    images: LandingImageRef[];
    accent: string;
    device: "desktop" | "mobile";
}
