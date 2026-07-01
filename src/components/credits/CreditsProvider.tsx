"use client";

/**
 * CreditsProvider — single client source of truth for auth + credit balance,
 * read from the SERVER (`GET /api/credits`). Replaces the old localStorage
 * credit store: the number shown here is the real server balance, so it can't
 * be edited by clearing storage. Paid calls return the new balance, which the
 * UI pushes back via `setBalance` for an instant update (no refetch needed).
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type CreditsState = {
  configured: boolean;
  authed: boolean;
  balance: number | null;
  email: string | null;
  name: string | null;
  loading: boolean;
};

type CreditsContextValue = {
  state: CreditsState;
  refresh: () => Promise<void>;
  setBalance: (n: number | null) => void;
};

const INITIAL: CreditsState = { configured: false, authed: false, balance: null, email: null, name: null, loading: true };

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CreditsState>(INITIAL);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      const j = (await res.json()) as Partial<CreditsState>;
      setState({
        configured: !!j.configured,
        authed: !!j.authed,
        balance: typeof j.balance === "number" ? j.balance : null,
        email: j.email ?? null,
        name: j.name ?? null,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Keep the balance fresh after a spend/top-up when the user returns to the tab.
    function onFocus() {
      if (document.visibilityState === "visible") void refresh();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh]);

  const setBalance = useCallback((n: number | null) => {
    setState((s) => ({ ...s, balance: n }));
  }, []);

  return (
    <CreditsContext.Provider value={{ state, refresh, setBalance }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCreditsState(): CreditsContextValue {
  const ctx = useContext(CreditsContext);
  if (!ctx) {
    // Safe default if used outside the provider (e.g. isolated stories).
    return { state: { ...INITIAL, loading: false }, refresh: async () => {}, setBalance: () => {} };
  }
  return ctx;
}
