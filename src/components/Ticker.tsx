"use client";

import { useFork } from "@/components/home/ForkContext";

export function Ticker() {
  const { fork } = useFork();
  const commerce = fork === "commerce";
  const phrase = commerce
    ? "Audit your store until AI agents recommend it"
    : "Debate your startup idea until it breaks";
  const items = Array.from({ length: 10 });

  return (
    <div className={`overflow-hidden border-y-2 border-ink py-2.5 text-ink ${commerce ? "bg-signal-blue" : "bg-signal-yellow"}`}>
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {items.map((_, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-sm uppercase tracking-[0.06em]">{phrase}</span>
            <span className={commerce ? "text-paper" : "text-signal-red"}>*</span>
          </span>
        ))}
      </div>
    </div>
  );
}
