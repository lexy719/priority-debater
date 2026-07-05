"use client";

/**
 * /commerce/settings — §4.10 + Autonomy Controls (§12.6).
 *
 * AI-channel scan toggles + notification channel are localStorage preferences.
 * Autonomy is per the §12.6 scoping rules: auto-approve is a real risk decision
 * — catalog/store changes can NEVER be auto-approved (hard rule, not a toggle),
 * and content auto-publish requires an approval track record first. Danger zone
 * disconnects credentials / clears the demo, plainly, no dark patterns.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommerceShell } from "@/components/commerce/Shell";
import { useCommerceStore, setActiveStoreId } from "@/lib/commerce/data/useCommerceStore";
import { getAutonomySettings, setAutonomySettings } from "@/lib/commerce/data/store";
import { clearCredentials } from "@/lib/commerce/data/credentials";
import { clearDemoData } from "@/lib/commerce/data/seed";

const PREFS_KEY = "pd-commerce-prefs";

interface Prefs {
  channels: { chatgpt: boolean; gemini: boolean; perplexity: boolean; copilot: boolean };
  notify: "email" | "whatsapp";
}

const DEFAULT_PREFS: Prefs = {
  channels: { chatgpt: true, gemini: true, perplexity: true, copilot: false },
  notify: "email",
};

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Prefs) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

/** §12.6: auto-approve needs a manual-approval track record first. */
const AUTONOMY_TRACK_RECORD = 10;

export default function SettingsPage() {
  const router = useRouter();
  const s = useCommerceStore();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [autonomy, setAutonomy] = useState<{ auto_approve: boolean; max_spend: number | null }>({ auto_approve: false, max_spend: null });

  useEffect(() => {
    setPrefs(readPrefs());
    if (s.store) {
      const a = getAutonomySettings(s.store.id);
      setAutonomy({ auto_approve: a.auto_approve, max_spend: a.max_spend });
    }
  }, [s.store]);

  function savePrefs(next: Prefs) {
    setPrefs(next);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  if (s.loading) return <CommerceShell><div className="p-10 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">Loading…</div></CommerceShell>;
  if (!s.store) {
    return (
      <CommerceShell>
        <div className="mx-auto max-w-[860px] px-6 py-24 font-mono text-[12px] text-white/60">
          No store connected — settings apply per connected store.
        </div>
      </CommerceShell>
    );
  }

  const approvedUnedited = s.fixes.filter((f) => f.status === "pushed").length +
    s.contentItems.filter((c) => c.status !== "draft").length;
  const autonomyEligible = approvedUnedited >= AUTONOMY_TRACK_RECORD;

  const SECTION = "mt-10 border border-fk-ink-border p-5";
  const HEAD = "font-mono text-[10px] uppercase tracking-[0.22em] text-white/45";

  return (
    <CommerceShell isDemo={s.isDemo} onDemoCleared={s.refresh}>
      <div className="mx-auto max-w-[860px] px-5 py-8 lg:px-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/45">Settings — {s.store.name}</div>
        <h1 className="mt-2 font-display text-[clamp(1.75rem,4vw,3rem)] uppercase leading-[0.95]">Settings</h1>

        {/* AI channels */}
        <section className={SECTION}>
          <div className={HEAD}>AI channels to scan & optimize for</div>
          <div className="mt-4 grid grid-cols-2 gap-px bg-fk-ink-border sm:grid-cols-4">
            {(Object.keys(prefs.channels) as (keyof Prefs["channels"])[]).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => savePrefs({ ...prefs, channels: { ...prefs.channels, [ch]: !prefs.channels[ch] } })}
                className={`cursor-pointer border-0 p-3 font-mono text-[11px] uppercase tracking-[0.16em] ${
                  prefs.channels[ch] ? "bg-fk-cream text-fk-black" : "bg-fk-card-dark text-white/40 hover:text-white/70"
                }`}
                style={{ transition: "none", borderRadius: 0 }}
              >
                {ch} {prefs.channels[ch] ? "· on" : "· off"}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className={SECTION}>
          <div className={HEAD}>Notification channel</div>
          <div className="mt-4 flex w-fit gap-px bg-fk-ink-border">
            {(["email", "whatsapp"] as const).map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => savePrefs({ ...prefs, notify: ch })}
                className={`cursor-pointer border-0 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] ${
                  prefs.notify === ch ? "bg-fk-cream text-fk-black" : "bg-fk-card-dark text-white/50 hover:text-white"
                }`}
                style={{ transition: "none", borderRadius: 0 }}
              >
                {ch}
              </button>
            ))}
          </div>
          {prefs.notify === "whatsapp" && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-fk-amber">
              WhatsApp provider not configured yet — TODO stub, email used meanwhile
            </p>
          )}
        </section>

        {/* Autonomy (§12.6) */}
        <section className={SECTION}>
          <div className={HEAD}>Autonomy — what may publish without you</div>
          <p className="mt-3 max-w-lg font-mono text-[12px] leading-relaxed text-white/60">
            Store & catalog changes (fixes, prices, product content) <span className="text-fk-red">always require your approval</span> —
            that can never be switched off. Auto-publish below applies to generated marketing
            content only, and unlocks after {AUTONOMY_TRACK_RECORD} approved items ({approvedUnedited}/{AUTONOMY_TRACK_RECORD} so far).
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!autonomyEligible}
              onClick={() => {
                if (!s.store) return;
                const next = { ...autonomy, auto_approve: !autonomy.auto_approve };
                setAutonomy(next);
                setAutonomySettings(s.store.id, next);
              }}
              className={`cursor-pointer border-0 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-40 ${
                autonomy.auto_approve ? "bg-fk-green text-black" : "bg-fk-card-dark text-white/60"
              }`}
              style={{ transition: "none", borderRadius: 0, border: "1px solid var(--fk-ink-border)" }}
            >
              Auto-publish content: {autonomy.auto_approve ? "on" : "off"}
            </button>
            <label className="flex items-center gap-2 font-mono text-[11px] text-white/50">
              Max spend / action €
              <input
                className="pd2-input w-24 py-2"
                type="number"
                min={0}
                value={autonomy.max_spend ?? ""}
                placeholder="none"
                onChange={(e) => {
                  if (!s.store) return;
                  const v = e.target.value === "" ? null : Math.max(0, Number(e.target.value));
                  const next = { ...autonomy, max_spend: v };
                  setAutonomy(next);
                  setAutonomySettings(s.store.id, next);
                }}
              />
            </label>
          </div>
          {!autonomyEligible && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              Locked until you&apos;ve approved {AUTONOMY_TRACK_RECORD} pieces manually — trust threshold, not a checkbox
            </p>
          )}
        </section>

        {/* Danger zone */}
        <section className="mt-10 border p-5" style={{ borderColor: "var(--fk-red)" }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--fk-red)" }}>Danger zone</div>
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => {
                if (!s.store) return;
                if (s.isDemo) { clearDemoData(); } else { clearCredentials(s.store.id); }
                setActiveStoreId(null);
                router.push("/commerce/dashboard");
              }}
              className="cursor-pointer bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-white"
              style={{ transition: "none", borderRadius: 0, border: "1px solid var(--fk-red)", color: "var(--fk-red)" }}
            >
              {s.isDemo ? "Clear demo store" : "Disconnect store"}
            </button>
          </div>
          <p className="mt-3 max-w-lg font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
            {s.isDemo
              ? "Removes the demo store and all its sample data"
              : "Revokes stored credentials locally. Billing freezes immediately — nothing is estimated after access is lost (§9)"}
          </p>
        </section>
      </div>
    </CommerceShell>
  );
}
