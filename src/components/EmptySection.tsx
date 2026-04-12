/**
 * Shown when a parsed report section is missing for the current run.
 */
export function EmptySection({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <p className="text-muted text-sm leading-relaxed">{title}</p>
    </div>
  );
}
