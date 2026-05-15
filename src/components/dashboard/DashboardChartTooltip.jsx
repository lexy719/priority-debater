"use client";

/**
 * Readable Recharts tooltip (default + contentStyle often renders as an empty black box in v3).
 */
export default function DashboardChartTooltip({
    active,
    payload,
    label,
    valueFormatter,
    labelFormatter,
}) {
    if (!active || !payload?.length) return null;

    const title = labelFormatter ? labelFormatter(label) : label;
    const rows = payload.filter((p) => p.value != null && Number(p.value) > 0);
    const rowTotal = payload[0]?.payload?.total;

    return (
        <div className="border-2 border-black bg-white px-3 py-2 shadow-brutal" style={{ pointerEvents: "none" }}>
            {title ? (
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-black">{title}</div>
            ) : null}
            <div className="mt-1 space-y-0.5">
                {rows.length === 0 ? (
                    <div className="font-mono text-[11px] text-neutral-600">No value</div>
                ) : (
                    rows.map((p) => (
                        <div key={p.dataKey} className="flex items-center gap-2 font-mono text-[11px] text-black">
                            <span
                                className="inline-block h-2.5 w-2.5 shrink-0 border border-black"
                                style={{ background: p.color ?? "#0a0a0a" }}
                            />
                            <span className="text-neutral-600">{p.name}:</span>
                            <span className="font-bold">
                                {valueFormatter ? valueFormatter(p.value, p) : String(p.value)}
                            </span>
                        </div>
                    ))
                )}
                {rowTotal != null && Number(rowTotal) > 0 ? (
                    <div className="mt-1 border-t border-black/20 pt-1 font-mono text-[11px] font-bold text-black">
                        Total: {valueFormatter ? valueFormatter(rowTotal, { dataKey: "total" }) : rowTotal}
                    </div>
                ) : rows.length > 1 ? (
                    <div className="mt-1 border-t border-black/20 pt-1 font-mono text-[11px] font-bold text-black">
                        Total:{" "}
                        {valueFormatter
                            ? valueFormatter(
                                  rows.reduce((s, p) => s + (Number(p.value) || 0), 0),
                                  { dataKey: "total" },
                              )
                            : rows.reduce((s, p) => s + (Number(p.value) || 0), 0)}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
