"use client";

import type { TemplateProps } from "@/lib/landing-template-types";

/** Tech-minimal: dark mode, gradient hero, precise type, dev-tool grade. */
export default function TechMinimalTemplate({ copy, images, accent, device }: TemplateProps) {
    const img = (i: number) => images[i % Math.max(1, images.length)]?.url;
    const isMobile = device === "mobile";
    const accentSoft = accent + "33"; // 20% alpha

    return (
        <div className="bg-[#0b0d12] text-white" style={{ fontFamily: "'Geist', 'Inter', system-ui, sans-serif" }} data-testid="tpl-tech">
            {/* Nav */}
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-sm" style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)` }} />
                    <span className="text-sm font-medium tracking-tight">{copy.brand.name}</span>
                </div>
                <div className="hidden gap-7 font-mono text-xs text-white/55 sm:flex">
                    <span>Docs</span><span>Pricing</span><span>Changelog</span><span>Customers</span>
                </div>
                <button type="button" className="rounded-md border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium backdrop-blur transition hover:bg-white/10">
                    {copy.hero.primaryCta} <span className="opacity-50">↗</span>
                </button>
            </div>

            {/* Hero with gradient */}
            <section className="relative overflow-hidden px-6 py-20 sm:px-12 lg:py-28">
                <div className="pointer-events-none absolute inset-0" style={{
                    background: `radial-gradient(ellipse 800px 400px at 50% 0%, ${accentSoft}, transparent 70%)`,
                }} />
                <div className="pointer-events-none absolute inset-0 opacity-30" style={{
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }} />
                <div className="relative mx-auto max-w-5xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] tracking-wider text-white/70 backdrop-blur">
                        <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                        {copy.hero.kicker}
                    </div>
                    <h1 className={`mt-7 font-semibold tracking-[-0.04em] ${isMobile ? "text-4xl" : "text-5xl sm:text-6xl lg:text-7xl"}`} style={{ lineHeight: 0.98 }}>
                        {copy.hero.title.split(".").map((seg, i, arr) => seg.trim() && (
                            <span key={i} className="block">
                                {i === arr.length - 2 ? (
                                    <span style={{ background: `linear-gradient(135deg, ${accent}, #c084fc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                                        {seg.trim()}.
                                    </span>
                                ) : seg.trim() + (i < arr.length - 1 ? "." : "")}
                            </span>
                        ))}
                    </h1>
                    <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/65">{copy.hero.sub}</p>
                    <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                        <button type="button" className="rounded-md px-6 py-3 text-sm font-medium text-black transition hover:opacity-90" style={{ background: accent }}>{copy.hero.primaryCta} →</button>
                        <button type="button" className="rounded-md border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/10">{copy.hero.secondaryCta}</button>
                    </div>
                    <div className="mt-10 font-mono text-xs tracking-wider text-white/40">{copy.hero.proofLine}</div>
                </div>
                {img(0) && (
                    <div className="relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-xl border border-white/10 shadow-[0_50px_120px_-30px_rgba(124,58,237,0.35)]">
                        <img src={img(0)} alt="" className="w-full" />
                    </div>
                )}
            </section>

            {/* Problem */}
            <section className="border-t border-white/8 px-6 py-20 sm:px-12">
                <div className="mx-auto max-w-4xl text-center">
                    <div className="font-mono text-[11px] tracking-wider text-white/45">{"// "}{copy.problem.eyebrow}</div>
                    <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{copy.problem.title}</h2>
                    <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/65">{copy.problem.body}</p>
                </div>
            </section>

            {/* Features */}
            <section className="border-t border-white/8 px-6 py-20 sm:px-12">
                <div className="mx-auto max-w-6xl">
                    <div className="font-mono text-[11px] tracking-wider text-white/45">{"// CAPABILITIES"}</div>
                    <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Built for engineers who hate buying twice.</h2>
                    <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
                        {copy.features.map((f) => (
                            <div key={f.kicker} className="bg-[#0b0d12] p-6 transition hover:bg-white/[0.03]">
                                <div className="font-mono text-[10px] tracking-wider" style={{ color: accent }}>{f.kicker}</div>
                                <h3 className="mt-3 text-lg font-medium tracking-tight">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/55">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Metrics */}
            <section className="border-t border-white/8 px-6 py-20 sm:px-12">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        {copy.metrics.map((m) => (
                            <div key={m.label}>
                                <div className="text-5xl font-semibold tracking-[-0.04em]" style={{ background: `linear-gradient(135deg, ${accent}, #c084fc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{m.value}</div>
                                <div className="mt-2 font-mono text-xs tracking-wider text-white/45">{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="border-t border-white/8 px-6 py-20 sm:px-12">
                <div className="mx-auto max-w-4xl">
                    <blockquote className="text-2xl font-medium leading-snug tracking-tight text-white/85 sm:text-3xl lg:text-4xl">&ldquo;{copy.testimonial.quote}&rdquo;</blockquote>
                    <div className="mt-7 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full" style={{ background: `linear-gradient(135deg, ${accent}, #7c3aed)` }} />
                        <div>
                            <div className="text-sm font-medium">{copy.testimonial.author}</div>
                            <div className="font-mono text-xs text-white/45">{copy.testimonial.role}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="border-t border-white/8 px-6 py-20 sm:px-12">
                <div className="mx-auto max-w-6xl">
                    <div className="text-center">
                        <div className="font-mono text-[11px] tracking-wider text-white/45">{"// PRICING"}</div>
                        <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Simple, usage-based.</h2>
                    </div>
                    <div className="mt-12 grid gap-4 lg:grid-cols-3">
                        {copy.pricing.map((t) => (
                            <div key={t.name} className={`rounded-xl border p-7 ${t.featured ? "border-white/30 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"}`} style={t.featured ? { boxShadow: `0 0 0 1px ${accent}33` } : undefined}>
                                <div className="flex items-center justify-between">
                                    <div className="font-mono text-[11px] tracking-wider text-white/55">{t.name}</div>
                                    {t.featured && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-black" style={{ background: accent }}>POPULAR</span>}
                                </div>
                                <div className="mt-4 text-4xl font-semibold tracking-tight">{t.price}<span className="ml-1 font-mono text-sm font-normal text-white/45">{t.period}</span></div>
                                <ul className="mt-5 space-y-2 text-sm text-white/65">
                                    {t.features.map((ft, i) => <li key={i} className="flex items-start gap-2"><span style={{ color: accent }}>✓</span> {ft}</li>)}
                                </ul>
                                <button type="button" className={`mt-7 w-full rounded-md px-4 py-2.5 text-sm font-medium ${t.featured ? "text-black" : "border border-white/15 bg-white/5 text-white"}`} style={t.featured ? { background: accent } : undefined}>{t.cta}</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="relative overflow-hidden border-t border-white/8 px-6 py-24 sm:px-12">
                <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 600px 300px at 50% 50%, ${accentSoft}, transparent 70%)` }} />
                <div className="relative mx-auto max-w-4xl text-center">
                    <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{copy.finalCta.title}</h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">{copy.finalCta.body}</p>
                    <button type="button" className="mt-9 rounded-md px-8 py-3.5 text-base font-medium text-black transition hover:opacity-90" style={{ background: accent }}>{copy.finalCta.cta} →</button>
                </div>
            </section>

            <div className="border-t border-white/8 px-6 py-6 text-center font-mono text-[10px] tracking-wider text-white/35">
                © {new Date().getFullYear()} {copy.brand.name.toUpperCase()} · MADE WITH IDEA DEBATER
            </div>
        </div>
    );
}
