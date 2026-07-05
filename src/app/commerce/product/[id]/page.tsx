"use client";

/**
 * /commerce/product/[id] — product detail + fix view (§4.5).
 *
 * Split mono diff: LEFT = current content as AI agents read it (red-highlighted
 * gaps), RIGHT = the proposed fix. Two tabs, same diff pattern:
 *   Content     — title + body copy
 *   Agent-Ready — JSON-LD structured data (§12.1: second lens, same engine)
 *
 * Generate → POST /api/commerce/fix/generate (OpenAI) → createFix(draft).
 * Push     → POST /api/commerce/fix/push → connector.writeFix returns the
 *            reversible `previous` snapshot, persisted on the Fix.
 * Export   → platforms without write access get "DOWNLOAD FIX" (CSV), §0.1.
 * Revert   → same push route with `previous` + reverted flag.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Download, RotateCcw } from "lucide-react";
import { CommerceShell } from "@/components/commerce/Shell";
import { useCommerceStore } from "@/lib/commerce/data/useCommerceStore";
import { createFix, updateFix, updateProduct } from "@/lib/commerce/data/store";
import { getCredentials } from "@/lib/commerce/data/credentials";
import { exportFixes } from "@/lib/commerce/connectors/generic";
import type { Fix, Product } from "@/lib/commerce/data/types";
import type { ConnectorProduct, FixFields, WriteFixData } from "@/lib/commerce/connectors/types";

type Tab = "content" | "agent_ready";

interface GeneratedFix {
  title: string;
  body_html: string;
  jsonld: string;
  rationale: string;
}

/** Content gaps we can detect locally (the scan flags more, this is honest UI). */
function detectGaps(p: Product): string[] {
  const gaps: string[] = [];
  const text = (p.description ?? "").trim();
  if (text.length < 80) gaps.push("Description too thin for AI agents to quote (under 80 chars)");
  if (!/(material|wax|cotton|linen|leather|glass|steel|wool|soy)/i.test(text)) gaps.push("No materials/ingredients named");
  if (!/(cm|mm|ml|g|kg|size|dimension|hours|weight)/i.test(text)) gaps.push("No dimensions / quantities / burn time");
  if (!/(ship|deliver|return)/i.test(text)) gaps.push("No shipping or returns guidance");
  gaps.push("No Product JSON-LD structured data detected");
  return gaps;
}

export default function ProductFixPage() {
  const { id } = useParams<{ id: string }>();
  const s = useCommerceStore();
  const [tab, setTab] = useState<Tab>("content");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pushedAt, setPushedAt] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedFix | null>(null);

  const product = s.products.find((p) => p.id === id) ?? null;
  const draftFix = useMemo(
    () => s.fixes.find((f) => f.product_id === id && f.status === "draft" && f.payload?.fields) ?? null,
    [s.fixes, id],
  );
  const pushedFix = useMemo(
    () => s.fixes.find((f) => f.product_id === id && f.status === "pushed" && f.payload?.previous) ?? null,
    [s.fixes, id],
  );

  if (s.loading) return <CommerceShell><div className="p-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</div></CommerceShell>;
  if (!s.store || !product) {
    return (
      <CommerceShell isDemo={s.isDemo}>
        <div className="mx-auto max-w-[860px] px-6 py-24">
          <h1 className="font-display text-3xl uppercase">Product not found</h1>
          <Link href="/commerce/dashboard" className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60 no-underline hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Command Center
          </Link>
        </div>
      </CommerceShell>
    );
  }

  const gaps = detectGaps(product);
  const proposal: GeneratedFix | null =
    generated ??
    (draftFix?.payload?.fields
      ? {
          title: draftFix.payload.fields.title ?? product.title,
          body_html: draftFix.payload.fields.body_html ?? "",
          jsonld: draftFix.payload.fields.jsonld ?? "",
          rationale: draftFix.description,
        }
      : null);
  const credentials = getCredentials(s.store.id);
  const canWrite = !s.isDemo && !!credentials && (credentials.platform === "shopify" || credentials.platform === "woo");

  async function generate() {
    if (!product) return;
    setBusy("generate");
    setError(null);
    const res = await fetch("/api/commerce/fix/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        product: { title: product.title, description: product.description ?? "", body_html: product.body_html ?? "", url: product.url },
        gaps,
        storeName: s.store?.name,
      }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError(res?.detail ?? "Generation failed — try again.");
      return;
    }
    const fix = res.fix as GeneratedFix;
    setGenerated(fix);
    createFix({
      store_id: s.store!.id,
      product_id: product.id,
      type: "description",
      title: `Rewrite "${product.title}" for AI visibility`,
      description: fix.rationale || "AI-generated content fix",
      status: "draft",
      payload: { fields: { title: fix.title, body_html: fix.body_html, jsonld: fix.jsonld } },
    });
    s.refresh();
  }

  async function push() {
    if (!product || !proposal || !credentials) return;
    setBusy("push");
    setError(null);
    const fields: FixFields = {
      title: proposal.title,
      body_html: proposal.body_html,
      ...(proposal.jsonld
        ? { metafields: [{ namespace: "pd_commerce", key: "json_ld", type: "json", value: proposal.jsonld }] }
        : {}),
    };
    const res = await fetch("/api/commerce/fix/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ref: credentials, productExternalId: product.external_id, fields }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError(res?.detail ?? "Push failed — nothing was changed on your store.");
      return;
    }
    const data = res as WriteFixData & { ok: true };
    if (draftFix) {
      updateFix(draftFix.id, {
        status: "pushed",
        payload: { ...draftFix.payload, previous: { title: data.previous.title, body_html: data.previous.body_html } },
      });
    }
    updateProduct(product.id, {
      title: proposal.title,
      body_html: proposal.body_html,
      description: proposal.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      current_score: "at_risk", // re-scored on next scan; pushing ≠ instantly winning
    });
    setPushedAt(new Date().toISOString());
    setGenerated(null);
    s.refresh();
  }

  async function revert(fix: Fix) {
    if (!product || !credentials || !fix.payload?.previous) return;
    setBusy("revert");
    setError(null);
    const res = await fetch("/api/commerce/fix/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ref: credentials,
        productExternalId: product.external_id,
        fields: fix.payload.previous,
        reverted: true,
      }),
    }).then((r) => r.json()).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      setError(res?.detail ?? "Revert failed — the pushed version is still live.");
      return;
    }
    updateFix(fix.id, { status: "rejected", payload: { ...fix.payload, pushed_reverted: true } });
    updateProduct(product.id, {
      title: fix.payload.previous.title ?? product.title,
      body_html: fix.payload.previous.body_html ?? product.body_html,
    });
    setPushedAt(null);
    s.refresh();
  }

  function download() {
    if (!product || !proposal) return;
    const asConnectorProduct: ConnectorProduct = {
      external_id: product.external_id ?? product.id,
      title: product.title,
      url: product.url,
      description: product.description ?? "",
      body_html: product.body_html ?? "",
      handle: "",
      price: null, image: null, vendor: null, product_type: null, status: null, updated_at: null,
    };
    const csv = exportFixes([asConnectorProduct], [
      {
        productExternalId: asConnectorProduct.external_id,
        fields: {
          title: proposal.title,
          body_html: proposal.body_html,
          metafields: proposal.jsonld ? [{ namespace: "pd_commerce", key: "json_ld", type: "json", value: proposal.jsonld }] : [],
        },
      },
    ]);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pd-fix-${(product.external_id ?? product.id).replace(/[^a-z0-9-]/gi, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    if (draftFix) updateFix(draftFix.id, { status: "pushed" }); // export-mode "applied by merchant"
    s.refresh();
  }

  const scoreColor = product.current_score === "invisible" ? "var(--fk-red)" : product.current_score === "at_risk" ? "var(--fk-blue)" : "var(--fk-green)";

  return (
    <CommerceShell isDemo={s.isDemo} onDemoCleared={s.refresh}>
      <div className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
        <Link href="/commerce/dashboard" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/45 no-underline hover:text-white">
          <ArrowLeft className="h-3.5 w-3.5" /> Command Center
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white" style={{ background: scoreColor }}>
              {product.current_score.replace("_", " ")}
            </span>
            <h1 className="mt-3 max-w-3xl font-display text-[clamp(1.5rem,3.5vw,2.75rem)] uppercase leading-[0.95]">
              {product.title}
            </h1>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
            {product.estimated_monthly_loss ? `€${product.estimated_monthly_loss}/mo at risk · ` : ""}
            <a href={product.url} target="_blank" rel="noreferrer" className="text-white/60 underline-offset-2 hover:text-white">view live</a>
          </div>
        </div>

        {/* Post-push confirmation (§4.5) */}
        {pushedAt && (
          <div className="mt-6 flex items-center justify-between gap-4 p-4 font-mono text-[12px]" style={{ background: "var(--fk-blue)", color: "#fff" }}>
            <span>LIVE. We&apos;ll show impact within 7 days.</span>
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">{pushedAt}</span>
          </div>
        )}
        {error && <p className="mt-6 border border-fk-red/40 p-3 font-mono text-[12px] text-fk-red">{error}</p>}

        {/* Tabs */}
        <div className="mt-8 flex border-b border-fk-ink-border">
          {(["content", "agent_ready"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer border-0 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] ${
                tab === t ? "bg-fk-cream text-fk-black" : "bg-transparent text-white/50 hover:text-white"
              }`}
              style={{ transition: "none", borderRadius: 0 }}
            >
              {t === "content" ? "Content" : "Agent-Ready"}
            </button>
          ))}
        </div>

        {/* Diff panes */}
        <div className="grid gap-px bg-fk-ink-border md:grid-cols-2">
          {/* LEFT — current, with red gaps */}
          <div className="bg-fk-card-dark p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Current — what AI agents read
            </div>
            {tab === "content" ? (
              <>
                <div className="mt-4 font-mono text-[13px] leading-relaxed text-white/80">{product.title}</div>
                <div className="mt-3 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-white/60">
                  {(product.description ?? "").trim() || "(empty description)"}
                </div>
                <div className="mt-5 space-y-1">
                  {gaps.map((g) => (
                    <div key={g} className="border-l-2 pl-3 font-mono text-[11px] leading-relaxed" style={{ borderColor: "var(--fk-red)", color: "var(--fk-red)" }}>
                      {g}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 font-mono text-[12px] leading-relaxed text-white/60">
                <div className="border-l-2 pl-3" style={{ borderColor: "var(--fk-red)", color: "var(--fk-red)" }}>
                  No Product JSON-LD found — an AI shopping agent cannot read price, availability
                  or attributes programmatically (§12.1).
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — proposed */}
          <div className="bg-fk-card-dark p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
              Proposed fix
            </div>
            {!proposal ? (
              <div className="mt-4">
                <p className="font-mono text-[12px] leading-relaxed text-white/50">
                  Generate a rewrite that names the attributes, use-cases and policies AI agents
                  look for — in your voice, reviewed by you before anything goes live.
                </p>
                <button
                  type="button"
                  onClick={() => void generate()}
                  disabled={busy !== null}
                  className="mt-6 inline-flex cursor-pointer items-center gap-3 border-0 px-6 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
                  style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
                >
                  {busy === "generate" ? "Generating…" : "Generate fix"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : tab === "content" ? (
              <>
                <div className="mt-4 font-mono text-[13px] leading-relaxed" style={{ color: "var(--fk-green)" }}>{proposal.title}</div>
                <div
                  className="prose-invert mt-3 max-w-none font-mono text-[12px] leading-relaxed text-white/85 [&_li]:mt-1 [&_p]:mt-2"
                  dangerouslySetInnerHTML={{ __html: proposal.body_html }}
                />
                {proposal.rationale && (
                  <p className="mt-4 border-t border-fk-ink-border pt-3 font-mono text-[11px] text-white/45">{proposal.rationale}</p>
                )}
              </>
            ) : (
              <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/80">
                {proposal.jsonld || "(no structured data generated)"}
              </pre>
            )}
          </div>
        </div>

        {/* Action bar */}
        {proposal && (
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {canWrite ? (
              <button
                type="button"
                onClick={() => void push()}
                disabled={busy !== null}
                className="inline-flex cursor-pointer items-center gap-3 border-0 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
                style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
              >
                {busy === "push" ? "Pushing…" : `Push to ${credentials?.platform === "shopify" ? "Shopify" : "WooCommerce"}`}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={download}
                className="inline-flex cursor-pointer items-center gap-3 border-0 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em]"
                style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
              >
                Download fix <Download className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => void generate()}
              disabled={busy !== null}
              className="cursor-pointer border border-white/25 bg-transparent px-6 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 hover:border-white hover:text-white disabled:opacity-50"
              style={{ transition: "none", borderRadius: 0 }}
            >
              Regenerate
            </button>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
              {canWrite ? "Reversible — we snapshot the current version before pushing" : "Export mode — apply it yourself, nothing touches your store"}
            </span>
          </div>
        )}

        {/* Pushed fix — revert */}
        {pushedFix && canWrite && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border border-fk-ink-border p-4">
            <div className="font-mono text-[11px] text-white/60">
              <span className="uppercase tracking-[0.18em] text-fk-green">Pushed</span> — {pushedFix.title}
              <span className="ml-2 text-white/35">{pushedFix.resolved_at?.slice(0, 16).replace("T", " ")}</span>
            </div>
            <button
              type="button"
              onClick={() => void revert(pushedFix)}
              disabled={busy !== null}
              className="inline-flex cursor-pointer items-center gap-2 border border-white/25 bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 hover:border-fk-red hover:text-fk-red disabled:opacity-50"
              style={{ transition: "none", borderRadius: 0 }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> {busy === "revert" ? "Reverting…" : "Revert"}
            </button>
          </div>
        )}
      </div>
    </CommerceShell>
  );
}
