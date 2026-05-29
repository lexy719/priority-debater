import React from 'react';

// Simple three‑box feature component – responsive grid with glassmorphism style
export function ThreeBoxes() {
  const features = [
    {
      title: 'Instant Validation',
      description: 'Get AI‑driven feedback on your idea in seconds.',
    },
    {
      title: 'Data‑Backed Insights',
      description: 'Leverage market signals to sharpen your pitch.',
    },
    {
      title: 'Export Ready',
      description: 'Download a polished report for investors instantly.',
    },
  ];

  return (
    <section className="bg-paper py-16" id="features">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-ink/15 bg-card p-8 text-center shadow-[8px_8px_0_0_var(--color-ink)] backdrop-blur-sm transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0_0_var(--color-ink)]"
            >
              <h3 className="font-display text-xl text-ink mb-3">{f.title}</h3>
              <p className="text-ink/70 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
