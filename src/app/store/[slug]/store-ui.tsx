import Link from "next/link";
import type { PublishedStore } from "@/lib/studio/storeRepo";

/**
 * Shared chrome for the published store — server components only, zero client
 * JS. Every page of the generated site uses this header/footer so the store
 * reads as ONE complete website (catalog · gallery · about · shipping · terms).
 */

export const MONO = "ui-monospace, 'JetBrains Mono', Menlo, monospace";

export function mkTheme(s: PublishedStore) {
  const b = s.store.brand;
  return {
    b,
    hair: `${b.ink}22`,
    sub: `${b.ink}90`,
    label: { fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: `${b.ink}90` } as React.CSSProperties,
  };
}

const NAV: [string, string][] = [
  ["", "Catalog"], ["gallery", "Gallery"], ["about", "About"], ["shipping", "Shipping & Returns"], ["terms", "Terms"],
];

export function StoreHeader({ s, active }: { s: PublishedStore; active: string }) {
  const { b, hair, sub } = mkTheme(s);
  return (
    <header style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 18px", borderBottom: `1px solid ${hair}`, padding: "16px 0" }}>
      <Link href={`/store/${s.slug}`} style={{ display: "inline-flex", width: 36, height: 36, alignItems: "center", justifyContent: "center", backgroundColor: b.accent, color: b.onAccent, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>{b.name.slice(0, 2)}</Link>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: b.ink }}>{b.name}</div>
        <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: sub }}>{b.domain}</div>
      </div>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", marginLeft: 8 }}>
        {NAV.map(([path, name]) => (
          <Link key={name} href={`/store/${s.slug}${path ? `/${path}` : ""}`}
            style={{ fontFamily: MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.14em", textDecoration: "none", color: active === path ? b.accent : sub, borderBottom: active === path ? `2px solid ${b.accent}` : "2px solid transparent", paddingBottom: 2 }}>
            {name}
          </Link>
        ))}
      </nav>
      <span style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.16em", color: sub, marginLeft: "auto", border: `1px solid ${hair}`, padding: "5px 10px" }}>
        AGENT-LEGIBLE · SSR · JSON-LD ✓
      </span>
    </header>
  );
}

export function StoreFooter({ s }: { s: PublishedStore }) {
  const { b, hair, sub } = mkTheme(s);
  const link = { fontFamily: MONO, fontSize: 10, color: sub, textDecoration: "none" } as React.CSSProperties;
  return (
    <footer style={{ borderTop: `1px solid ${hair}`, padding: "18px 0", display: "flex", flexWrap: "wrap", gap: "10px 24px", alignItems: "baseline" }}>
      <span style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: sub }}>{b.fullName} · {b.domain}</span>
      <a href={`/store/${s.slug}/feed.jsonl`} style={link}>product feed ↗</a>
      <a href={`/store/${s.slug}/agent-catalog.json`} style={link}>agent-catalog.json ↗</a>
      <a href={`/store/${s.slug}/llms.txt`} style={link}>llms.txt ↗</a>
      <span style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: sub, marginLeft: "auto" }}>
        FABRICATED BY PDR STUDIO · {s.source === "claude" ? "SYNTHESIZED BY CLAUDE" : "STOCK CATALOG"}
      </span>
    </footer>
  );
}
