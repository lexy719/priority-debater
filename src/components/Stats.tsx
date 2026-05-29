const stats = [
  { idx: "01", label: "Average Verdict", value: "6.2", unit: "/10", sub: "across 1,247 sessions · last 7d", dot: "bg-ink" },
  { idx: "02", label: "Survival Rate", value: "11", unit: "%", sub: "pitches that pass the panel clean", dot: "bg-signal-red" },
  { idx: "03", label: "Time to Truth", value: "120", unit: "s", sub: "median session, from pitch to packet", dot: "bg-signal-blue" },
];

export function Stats() {
  return (
    <section className="border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-px bg-ink/15 md:grid-cols-3 border-x border-ink/15">
        {stats.map((s) => (
          <div key={s.idx} className="bg-paper p-8 lg:p-10">
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>{s.label}</span>
              <span>{s.idx}</span>
            </div>
            <div className="mt-8 flex items-baseline gap-1">
              <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none text-ink">
                {s.value}
              </span>
              <span className="font-mono text-base text-muted-foreground">{s.unit}</span>
            </div>
            <div className="mt-10 flex items-center gap-3 border-t border-dashed border-ink/25 pt-4">
              <span className="font-mono text-[11px] text-muted-foreground">{s.sub}</span>
              <span className={`ml-auto h-2 w-2 rounded-full ${s.dot}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}