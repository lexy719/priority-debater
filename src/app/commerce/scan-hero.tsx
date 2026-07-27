"use client";

/**
 * The scan, in the hero.
 *
 * Commerce's front door used to be a button that promised an audit on the next
 * page. Every click between a visitor and the one thing that works on a
 * stranger's store is a chance to lose them — and the audit needs nothing from
 * them but a domain, so there is no reason to ask for it twice.
 *
 * A plain form with a GET action: it works with JavaScript off, it is a real
 * link an agent can follow, and the destination page starts the audit itself.
 */

import { useState } from "react";

const PAPER = "#F5F3ED", INKB = "#111111", FAINTB = "#9B968A";
const MONO = "var(--app-font-mono), ui-monospace, monospace";

export default function ScanHero() {
  const [url, setUrl] = useState("");

  return (
    <div className="mt-9">
      <form action="/commerce/visibility" method="GET" className="flex flex-wrap items-center gap-3">
        <input
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="yourstore.com"
          inputMode="url"
          aria-label="Your store's web address"
          className="h-[52px] min-w-[260px] flex-1 px-4 text-[15px]"
          style={{ fontFamily: MONO, border: `1px solid ${INKB}`, backgroundColor: "transparent", color: INKB, outline: "none" }}
        />
        <button
          type="submit"
          disabled={!url.trim()}
          className="h-[52px] px-6 text-[12.5px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: INKB, color: PAPER }}
        >
          CHECK IF AI CAN BUY FROM YOU →
        </button>
      </form>
      <div
        className="mt-3"
        style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINTB }}
      >
        FREE · NO ACCOUNT · EVERY FINDING A REAL HTTP RESPONSE FROM YOUR SERVER
      </div>
    </div>
  );
}
