export default function Footer() {
    return (
        <footer data-testid="dashboard-footer" className="bg-[var(--paper)]">
            <div className="mx-auto max-w-[1480px] px-6 py-12 lg:px-10">
                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-black bg-black text-white font-mono text-sm font-bold">
                                ID
                            </div>
                            <div>
                                <div className="font-display text-xl leading-none">IDEA DEBATER</div>
                                <div className="font-mono text-[10px] text-neutral-500">V.1.0 / 2026 · CLAUDE SONNET 4.5</div>
                            </div>
                        </div>
                        <p className="mt-5 max-w-md font-mono text-xs leading-relaxed text-neutral-500">
                            Every Idea Debater report ships with numbers a Tier-1 fund
                            partner would recognise. No fluff. No vibes.
                        </p>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">REPORT</div>
                        <ul className="mt-3 space-y-2 font-mono text-xs">
                            <li><a href="#overview">Overview</a></li>
                            <li><a href="#market">Market</a></li>
                            <li><a href="#risk">Risk</a></li>
                            <li><a href="#competition">Competition</a></li>
                        </ul>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">PRODUCT</div>
                        <ul className="mt-3 space-y-2 font-mono text-xs">
                            <li><a href="#">Validate Idea</a></li>
                            <li><a href="#">Personas</a></li>
                            <li><a href="#">Pricing</a></li>
                            <li><a href="#">FAQ</a></li>
                        </ul>
                    </div>
                    <div className="lg:col-span-2">
                        <div className="font-mono text-[10px] tracking-wider text-neutral-500">EXPORT</div>
                        <ul className="mt-3 space-y-2 font-mono text-xs">
                            <li><a href="#">PDF Report</a></li>
                            <li><a href="#">Notion</a></li>
                            <li><a href="#">CSV / Raw</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-black pt-6 font-mono text-[10px] tracking-wider text-neutral-500">
                    <span>© 2026 IDEA DEBATER. ALL RIGHTS RESERVED.</span>
                    <span>REPORT ID · 4F12-A82-2026-02-11</span>
                </div>
            </div>
        </footer>
    );
}
