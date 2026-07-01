"use client";

/**
 * ForkContext — which path the homepage is currently presenting. One marketing
 * page; the hero toggle swaps the section CONTENT between the two products
 * (idea validation ↔ AI commerce) while the layout stays identical. The choice
 * is mirrored in the URL (?fork=commerce) so each mode is shareable/indexable.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Fork = "validate" | "commerce";

const ForkCtx = createContext<{ fork: Fork; setFork: (f: Fork) => void }>({
  fork: "validate",
  setFork: () => {},
});

export function ForkProvider({ children }: { children: ReactNode }) {
  const [fork, setForkState] = useState<Fork>("validate");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("fork") === "commerce") {
      setForkState("commerce");
    }
  }, []);

  function setFork(f: Fork) {
    setForkState(f);
    const url = new URL(window.location.href);
    if (f === "commerce") url.searchParams.set("fork", "commerce");
    else url.searchParams.delete("fork");
    window.history.replaceState({}, "", url.toString());
  }

  return <ForkCtx.Provider value={{ fork, setFork }}>{children}</ForkCtx.Provider>;
}

export function useFork() {
  return useContext(ForkCtx);
}
