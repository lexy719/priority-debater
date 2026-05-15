import { swot } from "@/data/mockData";
import { Plus, Minus, Sparkles, AlertTriangle } from "lucide-react";

const Block = ({ title, items, tone, Icon, testid }) => {
    const dark = tone === "ink";
    return (
        <div
            data-testid={testid}
            className={`relative border-2 border-black p-6 hover-lift ${
                dark ? "bg-black text-white" : "bg-white"
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-mono text-[11px] tracking-wider">{title}</span>
                </div>
                <span className={`font-mono text-[10px] ${dark ? "text-white/40" : "text-neutral-500"}`}>
                    {String(items.length).padStart(2, "0")}
                </span>
            </div>
            <ul className="mt-5 space-y-3">
                {items.map((t, i) => (
                    <li key={i} className="flex gap-3 font-mono text-[12.5px] leading-relaxed">
                        <span className={dark ? "text-[var(--hi)]" : "text-black"}>
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className={dark ? "text-white/85" : "text-neutral-800"}>{t}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function SWOTSection() {
    return (
        <section
            id="swot"
            data-testid="swot-section"
            className="relative border-b border-black bg-[var(--paper)] py-20"
        >
            <div className="absolute inset-0 bg-grid opacity-100" />
            <div className="relative mx-auto max-w-[1480px] px-6 lg:px-10">
                <div className="mb-12 grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">§08 / SWOT</div>
                        <h2 className="mt-3 font-display text-[48px] leading-[0.92] sm:text-[64px] lg:text-[80px]">
                            STRENGTHS. <br />
                            <span className="hl-strip-dark">WEAKNESSES.</span> <br />
                            BOTH ON RECORD.
                        </h2>
                    </div>
                    <div className="lg:col-span-5 lg:pt-6">
                        <p className="font-mono text-sm leading-relaxed text-neutral-600">
                            14 datapoints scored across the four SWOT quadrants. No vibes,
                            no rounding — every line is exportable to the investor PDF.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <Block testid="swot-strengths" title="STRENGTHS" items={swot.strengths} tone="ink" Icon={Plus} />
                    <Block testid="swot-weaknesses" title="WEAKNESSES" items={swot.weaknesses} tone="light" Icon={Minus} />
                    <Block testid="swot-opportunities" title="OPPORTUNITIES" items={swot.opportunities} tone="light" Icon={Sparkles} />
                    <Block testid="swot-threats" title="THREATS" items={swot.threats} tone="ink" Icon={AlertTriangle} />
                </div>
            </div>
        </section>
    );
}
