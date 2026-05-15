import { ButtonLink, PageShell, Panel, WorkspaceHero } from "@/components/premium/primitives";

export function WorkspaceTemplate({
  label,
  title,
  text,
  modules,
}: {
  label: string;
  title: string;
  text: string;
  modules: string[];
}) {
  return (
    <PageShell>
      <WorkspaceHero label={label} title={title} text={text} />
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {modules.map((module, index) => (
          <Panel key={module} className="min-h-56">
            <p className="mono text-xs uppercase tracking-[0.24em] text-accent">
              Module {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-8 text-2xl font-bold tracking-[-0.05em]">{module}</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              This is a fresh placeholder for the new system. Next pass wires behavior and richer components.
            </p>
          </Panel>
        ))}
      </section>
      <div className="mt-8">
        <ButtonLink href="/#idea-validation">Run a verdict</ButtonLink>
      </div>
    </PageShell>
  );
}
