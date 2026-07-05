"use client";

/**
 * CommerceShell — shared chrome for the commerce app pages (/commerce/*).
 * SiteNav auto-detects the commerce context from the path. When the active
 * store is the demo store, a persistent mono DEMO banner sits under the nav
 * with clear + connect-real-store actions (design-system: hard cuts, no fades).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";
import { clearDemoData } from "@/lib/commerce/data/seed";
import { setActiveStoreId } from "@/lib/commerce/data/useCommerceStore";

export function DemoBanner({ onCleared }: { onCleared?: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fk-ink-border bg-fk-card-dark px-5 py-2 lg:px-8">
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-fk-amber">
        Demo data — this is a sample store, not yours
      </span>
      <span className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
        <Link href="/commerce/connect" className="text-white/70 no-underline hover:text-white">
          Connect your store
        </Link>
        <button
          type="button"
          onClick={() => {
            clearDemoData();
            setActiveStoreId(null);
            onCleared?.();
            router.push("/commerce/dashboard");
          }}
          className="cursor-pointer border border-white/20 bg-transparent px-2 py-1 text-white/60 hover:border-white/60 hover:text-white"
          style={{ transition: "none" }}
        >
          Clear demo
        </button>
      </span>
    </div>
  );
}

export function CommerceShell({
  children,
  subtitle = "AI Commerce",
  isDemo = false,
  onDemoCleared,
}: {
  children: ReactNode;
  subtitle?: string;
  isDemo?: boolean;
  onDemoCleared?: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-fk-black text-fk-cream">
      <SiteNav subtitle={subtitle} />
      {isDemo && <DemoBanner onCleared={onDemoCleared} />}
      {children}
    </div>
  );
}
