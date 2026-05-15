"use client";

import { Sidebar } from "@/components/v2/sidebar";
import { PageHeader } from "@/components/v2/page-header";
import { Button } from "@/components/v2/button";
import { ArrowRight, Download, Sparkles } from "lucide-react";

const PALETTE = [
  { name: "Canvas", token: "--bg", hex: "#0a0c12", role: "Global background" },
  { name: "Surface 1", token: "--surface-1", hex: "#141822", role: "Primary panel" },
  { name: "Surface 2", token: "--surface-2", hex: "#1b2030", role: "Elevated panel" },
  { name: "Accent", token: "--accent", hex: "#9bb6ff", role: "Primary action" },
  { name: "GO", token: "--go", hex: "#5dde9d", role: "Positive signal" },
  { name: "CAUTION", token: "--caution", hex: "#e9c46c", role: "Warning signal" },
  { name: "NO-GO", token: "--no-go", hex: "#f0799c", role: "Critical signal" },
];

const TYPE = [
  { name: "Display", className: "display", sample: "Decision-first interfaces." },
  { name: "Heading", className: "h1-serif", sample: "Built for sharp judgment." },
  { name: "Body", className: "body", sample: "Readable copy for operational work, not marketing fog." },
  { name: "Mono", className: "caption", sample: "CASE 017 · 26 APR 2026 · LIVE" },
];

export default function StyleguidePage() {
  return (
    <div className="app-page-shell min-h-screen flex text-[--ink-0]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PageHeader
          kicker="Design system"
          title="Midnight Luxe v2"
          actions={
            <>
              <Button variant="ghost" size="sm">
                <Download className="w-3.5 h-3.5" /> Export tokens
              </Button>
              <Button size="sm">
                Apply to new page
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </>
          }
        />

        <main className="px-6 md:px-8 py-10 md:py-12 max-w-[1480px] w-full space-y-10">
          <section className="surface-raised p-8 md:p-10 space-y-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[--ink-2] flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[--accent]" />
              design direction
            </div>
            <h2 className="font-serif text-[clamp(34px,4vw,56px)] leading-[0.95] tracking-[-0.025em]">
              Dark panels, restrained lines, verdict-first hierarchy.
            </h2>
            <p className="text-[15px] leading-[1.7] text-[--ink-1] max-w-[840px]">
              Every product surface should feel operational: high signal density, clear emphasis, and
              deliberate contrast. No decorative noise, no generic gradients, no dead whitespace.
            </p>
          </section>

          <section className="space-y-5">
            <SectionTitle title="Palette tokens" meta={`${PALETTE.length} semantic colors`} />
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 panel-cluster">
              {PALETTE.map((token) => (
                <article key={token.token} className="surface-raised p-5 space-y-4">
                  <div
                    className="h-16 rounded-[--radius] border border-[--line]"
                    style={{ background: `var(${token.token})` }}
                  />
                  <div>
                    <div className="text-[13px] text-[--ink-0]">{token.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2] mt-1">
                      {token.token}
                    </div>
                    <div className="font-mono text-[10px] text-[--ink-2] mt-2">{token.hex}</div>
                    <div className="text-[11px] text-[--ink-1] mt-1">{token.role}</div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <SectionTitle title="Type system" meta="display + body + mono" />
            <div className="surface-raised p-7 md:p-8 space-y-6">
              {TYPE.map((item, i) => (
                <div key={item.name} className={i > 0 ? "pt-6 border-t border-[--line]" : ""}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2] mb-2">
                    {item.name}
                  </div>
                  <div className={item.className}>{item.sample}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h3 className="font-serif text-[30px] leading-[1.05] tracking-[-0.02em]">{title}</h3>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[--ink-2]">{meta}</span>
    </div>
  );
}
