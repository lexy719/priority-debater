/**
 * Ticker — the yellow marquee band: black display type on signal yellow,
 * repeating the headline with ✦ separators.
 */

const PHRASE = "Debate your startup idea until it breaks";

export function Ticker() {
  const items = Array.from({ length: 10 });
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-signal-yellow py-2.5 text-ink">
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {items.map((_, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-sm uppercase tracking-[0.06em]">{PHRASE}</span>
            <span className="text-signal-red">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
