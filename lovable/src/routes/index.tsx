import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Priority Debater" },
      {
        name: "description",
        content:
          "Stress-test ideas with a ruthless AI panel. Now extended for AI commerce — audit, monitor, simulate, fix.",
      },
      { property: "og:title", content: "Priority Debater" },
      {
        property: "og:description",
        content:
          "Validate ideas. Now audit your store for agentic commerce.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-start justify-center px-6 py-20 sm:px-10">
        <div className="mb-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="bg-[color:var(--signal-red)] px-1.5 py-0.5 text-primary-foreground">
            ● New
          </span>
          <span>02 / Commerce module shipped</span>
        </div>

        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl">
          <span className="block">VALIDATE IDEAS.</span>
          <span className="block">
            <span className="highlight-red">SELL TO AGENTS.</span>
          </span>
        </h1>

        <p className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Priority Debater stress-tests your idea with a ruthless AI panel.
          The new Commerce module audits how AI sees your store and ships the
          fixes that make agents recommend you instead of your competitors.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/commerce"
            className="inline-flex items-center justify-center gap-2 bg-[color:var(--signal-red)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-primary-foreground"
          >
            Run AI Commerce audit →
          </Link>
          <button className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
            Open validation report
          </button>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
          {[
            { k: "Modules", v: "08" },
            { k: "Avg score lift", v: "+18" },
            { k: "Time to first fix", v: "< 4 min" },
          ].map((s) => (
            <div key={s.k} className="bg-background p-6">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {s.k}
              </div>
              <div className="mt-2 font-display text-4xl text-[color:var(--signal-blue)]">
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
