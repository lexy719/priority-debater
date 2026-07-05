"use client";

/**
 * useCommerceStore (Phase 6) — the single client seam over the localStorage
 * repository. Every commerce page reads through this hook instead of calling
 * store.ts list functions directly, so swapping to Supabase-backed fetchers
 * later means reimplementing THIS file only (same contract promise as the
 * store.ts header comment).
 *
 * Active-store selection persists in its own localStorage key. `refresh()`
 * re-reads everything after any mutation (mutations still call store.ts
 * functions directly — they're synchronous localStorage writes).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AttributionEvent,
  ContentItem,
  Customer,
  Fix,
  ModuleUnlock,
  Product,
  ReturnRiskEvent,
  Scan,
  Store,
} from "./types";
import {
  getStore,
  listAttributionEvents,
  listContentItems,
  listCustomers,
  listFixes,
  listModuleUnlocks,
  listProducts,
  listReturnRiskEvents,
  listScans,
  listStores,
} from "./store";
import { isDemoStore } from "./seed";

const ACTIVE_KEY = "pd-commerce-active-store";

export function getActiveStoreId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveStoreId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id === null) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}

interface Snapshot {
  store: Store | null;
  products: Product[];
  scans: Scan[];
  fixes: Fix[];
  attributionEvents: AttributionEvent[];
  returnRiskEvents: ReturnRiskEvent[];
  moduleUnlocks: ModuleUnlock[];
  contentItems: ContentItem[];
  customers: Customer[];
}

const EMPTY_SNAPSHOT: Snapshot = {
  store: null,
  products: [],
  scans: [],
  fixes: [],
  attributionEvents: [],
  returnRiskEvents: [],
  moduleUnlocks: [],
  contentItems: [],
  customers: [],
};

export interface CommerceStoreState extends Snapshot {
  /** True until the first client-side read completes (SSR renders nothing). */
  loading: boolean;
  isDemo: boolean;
  refresh: () => void;
}

export function useCommerceStore(): CommerceStoreState {
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const snapshot = useMemo<Snapshot>(() => {
    if (!hydrated) return EMPTY_SNAPSHOT;
    // Resolve the active store: explicit selection, else most-recent store.
    const activeId = getActiveStoreId();
    const store = (activeId ? getStore(activeId) : null) ?? listStores()[0] ?? null;
    if (store && store.id !== activeId) setActiveStoreId(store.id);
    if (!store) return EMPTY_SNAPSHOT;
    return {
      store,
      products: listProducts(store.id),
      scans: listScans(store.id),
      fixes: listFixes(store.id),
      attributionEvents: listAttributionEvents(store.id),
      returnRiskEvents: listReturnRiskEvents(store.id),
      moduleUnlocks: listModuleUnlocks(store.id),
      contentItems: listContentItems(store.id),
      customers: listCustomers(store.id),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, tick]);

  return {
    ...snapshot,
    loading: !hydrated,
    isDemo: isDemoStore(snapshot.store),
    refresh,
  };
}
