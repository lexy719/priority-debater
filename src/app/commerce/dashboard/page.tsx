"use client";

/**
 * /commerce/dashboard — the Command Center (§1.7 / §4.4). The home base:
 *   1. "Your Environment" strip — module tiles, live numbers or unlock conditions
 *   2. "Today's Actions" — ONE ranked list across every module (primary surface)
 *   3. Studio content queue — drafts/scheduled/published, inline lane
 *   4. Product grid — red invisible / blue at-risk / black winning, by €-impact
 *
 * Empty state hosts the page's single yellow CTA (CONNECT) + a ghost
 * "LOAD DEMO STORE" (explicit, never auto-seeded).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Lock } from "lucide-react";
import { CommerceShell } from "@/components/commerce/Shell";
import { useCommerceStore, setActiveStoreId } from "@/lib/commerce/data/useCommerceStore";
import { seedDemoData } from "@/lib/commerce/data/seed";
import { computeBillingRecord, periodOf, updateContentItem } from "@/lib/commerce/data/store";
import { buildTodaysActions, type TodayAction } from "@/lib/commerce/actions";
import type { ContentItem, ModuleKey, Product } from "@/lib/commerce/data/types";

/* §1.6 unlock-threshold copy for locked tiles. */
const MODULE_META: Record<ModuleKey, { label: string; lockedNote: string }> = {
  visibility: { label: "Visibility", lockedNote: "Unlocks with your first scan" },
  fixes: { label: "Recovery", lockedNote: "Unlocks with your first scan" },
  attribution: { label: "Attribution", lockedNote: "Unlocks once orders are tracked" },
  content: { label: "Content", lockedNote: "Growth tier — unlocks immediately" },
  return_risk: { label: "Return-Risk", lockedNote: "Unlocks at 30 days connected + 10 recorded returns" },
  autonomy: { label: "Autonomy", lockedNote: "Unlocks after 10 approved-unedited pushes" },
};

const SCORE_STYLE: Record<Product["current_score"], { label: string; cls: string }> = {
  invisible: { label: "Invisible", cls: "text-white bg-fk-red" },
  at_risk: { label: "At risk", cls: "text-white bg-fk-blue" },
  winning: { label: "Winning", cls: "text-fk-cream bg-fk-black" },
};

export default function CommandCenter() {
  const router = useRouter();
  const s = useCommerceStore();

  if (s.loading) return <CommerceShell><div className="p-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</div></CommerceShell>;

  if (!s.store) {
    return (
      <CommerceShell>
        <div className="mx-auto flex max-w-[860px] flex-col items-start px-6 py-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">Command Center</div>
          <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.75rem)] uppercase leading-[0.95]">
            No store connected yet
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-white/60">
            Connect your store to import the catalog and unlock fixes — or load the demo store to
            explore the Command Center with sample data first.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/commerce/connect"
              className="inline-flex items-center gap-3 px-8 py-4 font-mono text-[12px] font-bold uppercase tracking-[0.2em] no-underline"
              style={{ background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }}
            >
              Connect your store <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => { const store = seedDemoData(); setActiveStoreId(store.id); s.refresh(); }}
              className="cursor-pointer border border-white/25 bg-transparent px-6 py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 hover:border-white hover:text-white"
              style={{ transition: "none", borderRadius: 0 }}
            >
              Load demo store
            </button>
          </div>
        </div>
      </CommerceShell>
    );
  }

  const period = periodOf(new Date().toISOString());
  const billing = computeBillingRecord(s.store.id, period);
  const actions = buildTodaysActions(s);
  const riskPrevented = s.returnRiskEvents.reduce((sum, r) => sum + r.probability * 40, 0);
  const drafts = s.contentItems.filter((c) => c.status === "draft").length;

  const tileNumber: Partial<Record<ModuleKey, string>> = {
    visibility: `${s.products.filter((p) => p.current_score !== "winning").length} flagged`,
    fixes: `€${billing?.billable_revenue ?? 0} recovered`,
    attribution: `${s.attributionEvents.length} events`,
    content: `${drafts} drafts`,
    return_risk: `€${Math.round(riskPrevented)} prevented`,
  };

  return (
    <CommerceShell isDemo={s.isDemo} onDemoCleared={s.refresh}>
      {/* Header row */}
      <div className="mx-auto max-w-[1400px] px-5 pb-2 pt-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
              Command Center — {s.store.name}
            </div>
            <h1 className="mt-2 font-display text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95]">
              Today
            </h1>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
            {period} · plan {s.store.plan} · {s.products.length} products
          </div>
        </div>

        {/* 1 — Your Environment strip (§1.6) */}
        <div className="mt-8 grid grid-cols-2 gap-px bg-fk-ink-border sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(MODULE_META) as ModuleKey[]).map((key) => {
            const unlocked = s.moduleUnlocks.find((m) => m.module === key)?.unlocked ?? false;
            const meta = MODULE_META[key];
            return (
              <div key={key} className={`bg-fk-card-dark p-4 ${unlocked ? "" : "opacity-45"}`}>
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                  {meta.label}
                  {!unlocked && <Lock className="h-3 w-3" />}
                </div>
                {unlocked ? (
                  <div className="mt-2 font-mono text-sm text-fk-cream">{tileNumber[key] ?? "Live"}</div>
                ) : (
                  <div className="mt-2 font-mono text-[10px] leading-relaxed text-white/45">{meta.lockedNote}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 — Today's Actions: the primary work surface */}
      <section className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
          Today&apos;s actions — every module, one list, ranked by impact
        </div>
        {actions.length === 0 ? (
          <p className="mt-6 font-mono text-[12px] text-white/50">
            Nothing pending. Run a re-scan or check the Monitor for new signals.
          </p>
        ) : (
          <div className="mt-6 space-y-px bg-fk-ink-border">
            {actions.map((a, i) => (
              <ActionRow key={a.id} action={a} isTop={i === 0} onApproveContent={(id) => {
                updateContentItem(id, { status: "scheduled", scheduled_for: new Date(Date.now() + 86_400_000).toISOString() });
                s.refresh();
              }} onOpen={(href) => router.push(href)} />
            ))}
          </div>
        )}
      </section>

      {/* 3 — Studio queue lane */}
      <section id="studio" className="mx-auto max-w-[1400px] px-5 pb-10 lg:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">
          Studio queue — drafted / scheduled / published
        </div>
        <div className="mt-6 grid gap-px bg-fk-ink-border md:grid-cols-3">
          {(["draft", "scheduled", "published"] as ContentItem["status"][]).map((st) => (
            <div key={st} className="bg-fk-card-dark p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{st}</div>
              <div className="mt-3 space-y-3">
                {s.contentItems.filter((c) => c.status === st).map((c) => (
                  <div key={c.id} className="border-l-2 pl-3" style={{ borderColor: st === "published" ? "var(--fk-green)" : st === "scheduled" ? "var(--fk-blue)" : "var(--fk-amber)" }}>
                    <div className="text-sm leading-snug text-fk-cream">{c.title}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{c.type}</div>
                  </div>
                ))}
                {s.contentItems.filter((c) => c.status === st).length === 0 && (
                  <div className="font-mono text-[11px] text-white/30">—</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4 — Product grid (cream, secondary browsing surface) */}
      <section className="bg-fk-cream text-fk-black">
        <div className="mx-auto max-w-[1400px] px-5 py-12 lg:px-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-black/50">
            Catalog — sorted by €-impact
          </div>
          <div className="mt-6 grid gap-px bg-black/15 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...s.products]
              .sort((a, b) => (b.estimated_monthly_loss ?? 0) - (a.estimated_monthly_loss ?? 0))
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/commerce/product/${p.id}`}
                  className="group bg-fk-cream p-5 no-underline text-fk-black hover:bg-fk-black hover:text-fk-cream"
                  style={{ transition: "none" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${SCORE_STYLE[p.current_score].cls}`}>
                      {SCORE_STYLE[p.current_score].label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="mt-3 text-base font-semibold leading-snug">{p.title}</div>
                  <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] opacity-60">
                    {p.estimated_monthly_loss ? `€${p.estimated_monthly_loss}/mo at risk` : "No estimate yet"}
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </CommerceShell>
  );
}

function ActionRow({
  action,
  isTop,
  onApproveContent,
  onOpen,
}: {
  action: TodayAction;
  isTop: boolean;
  onApproveContent: (contentId: string) => void;
  onOpen: (href: string) => void;
}) {
  const kindColor: Record<TodayAction["kind"], string> = {
    fix: "var(--fk-red)",
    content: "var(--fk-amber)",
    restock: "var(--fk-blue)",
    return_risk: "var(--fk-amber)",
  };
  const isApprove = action.kind === "content" && action.contentId;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-fk-card-dark p-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="w-20 shrink-0 font-mono text-[11px]" style={{ color: kindColor[action.kind] }}>
          {action.figure}
        </span>
        <span className="truncate text-sm text-fk-cream">{action.title}</span>
      </div>
      {isApprove ? (
        <button
          type="button"
          onClick={() => onApproveContent(action.contentId!)}
          className="shrink-0 cursor-pointer border border-white/25 bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80 hover:border-white hover:text-white"
          style={{ transition: "none", borderRadius: 0 }}
        >
          {action.cta}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onOpen(action.href)}
          className={`shrink-0 cursor-pointer border-0 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] ${
            isTop ? "" : "border border-white/25 bg-transparent text-white/80 hover:border-white hover:text-white"
          }`}
          style={isTop
            ? { background: "var(--fk-yellow)", color: "var(--fk-black)", borderRadius: 0 }
            : { transition: "none", borderRadius: 0, border: "1px solid rgba(255,255,255,0.25)" }}
        >
          {action.cta}
        </button>
      )}
    </div>
  );
}
