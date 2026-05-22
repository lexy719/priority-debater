"use client";

import type { TemplateProps } from "@/lib/landing-template-types";

/** Founder-warm: pastel cards, rounded edges, friendly tone, conversion-focused. */
export default function FounderWarmTemplate({ copy, images, accent, device }: TemplateProps) {
    const img = (i: number) => images[i % Math.max(1, images.length)]?.url;
    const isMobile = device === "mobile";

    return (
        <div className="bg-[#fff7ed] text-[#1a1717]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }} data-testid="tpl-warm">
            {/* Nav */}
            <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full" style={{ background: accent }} />
                    <span className="text-lg font-semibold tracking-tight">{copy.brand.name}</span>
                </div>
                <div className="hidden gap-6 text-sm text-black/60 sm:flex">
                    <span>Why</span><span>Features</span><span>Pricing</span><span>Stories</span>
                </div>
                <button type="button" className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90">{copy.hero.primaryCta}</button>
            </div>

            {/* Hero */}
            <section className="px-6 pb-12 pt-8 sm:px-10 lg:px-16 lg:pb-24">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {copy.hero.kicker}
                </div>
                <h1 className={`mt-6 font-semibold tracking-tight ${isMobile ? "text-4xl" : "text-5xl sm:text-6xl lg:text-7xl"}`} style={{ lineHeight: 1.05 }}>
                    {copy.hero.title}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-black/65">{copy.hero.sub}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <button type="button" className="rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white shadow-lg hover:-translate-y-0.5 transition-transform">{copy.hero.primaryCta} →</button>
                    <button type="button" className="rounded-full border-2 border-black/15 bg-white px-6 py-3.5 text-sm font-medium hover:border-black/40">{copy.hero.secondaryCta}</button>
                    <span className="text-sm text-black/50">✦ {copy.hero.proofLine}</span>
                </div>

                {/* Hero card collage */}
                <div className="mt-12 grid gap-4 sm:grid-cols-3">
                    {[0, 1, 2].map((i) => img(i) && (
                        <div key={i} className={`overflow-hidden rounded-2xl border border-black/10 shadow-sm ${i === 1 ? "sm:translate-y-6" : ""}`}>
                            <img src={img(i)} alt="" className="aspect-[4/5] w-full object-cover" />
                        </div>
                    ))}
                </div>
            </section>

            {/* Problem */}
            <section className="mx-6 my-10 rounded-3xl bg-rose-50 p-8 sm:mx-10 sm:p-12 lg:mx-16 lg:p-16">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">{copy.problem.eyebrow}</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{copy.problem.title}</h2>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-black/70">{copy.problem.body}</p>
            </section>

            {/* Features */}
            <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
                <div className="text-xs font-semibold uppercase tracking-wider text-black/55">What&apos;s inside</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Everything you need on day one.</h2>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {copy.features.map((f, i) => {
                        const bgs = ["bg-amber-50", "bg-emerald-50", "bg-sky-50", "bg-violet-50", "bg-rose-50", "bg-orange-50"];
                        return (
                            <div key={f.kicker} className={`rounded-2xl ${bgs[i % bgs.length]} p-6 transition hover:-translate-y-1 hover:shadow-md`}>
                                <div className="inline-block rounded-full bg-white px-2.5 py-0.5 text-xs font-medium tracking-wide text-black/70">{f.kicker}</div>
                                <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-black/65">{f.body}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Metrics */}
            <section className="mx-6 my-10 rounded-3xl p-10 text-white sm:mx-10 sm:p-14 lg:mx-16 lg:p-20" style={{ background: "#1a1717" }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Numbers that matter</div>
                <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {copy.metrics.map((m) => (
                        <div key={m.label}>
                            <div className="text-5xl font-semibold tracking-tight" style={{ color: accent }}>{m.value}</div>
                            <div className="mt-2 text-sm text-white/60">{m.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonial */}
            <section className="mx-6 my-10 rounded-3xl bg-amber-50 p-10 sm:mx-10 sm:p-14 lg:mx-16 lg:p-20">
                <div className="text-4xl">&ldquo;</div>
                <blockquote className="mt-2 text-2xl font-medium leading-snug sm:text-3xl lg:text-4xl" style={{ lineHeight: 1.25 }}>{copy.testimonial.quote}</blockquote>
                <div className="mt-6 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full" style={{ background: accent }} />
                    <div>
                        <div className="font-semibold">{copy.testimonial.author}</div>
                        <div className="text-sm text-black/55">{copy.testimonial.role}</div>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
                <div className="text-xs font-semibold uppercase tracking-wider text-black/55">Pricing</div>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Start free. Upgrade when you grow.</h2>
                <div className="mt-10 grid gap-5 lg:grid-cols-3">
                    {copy.pricing.map((t) => (
                        <div key={t.name} className={`rounded-2xl border p-7 transition ${t.featured ? "border-black bg-black text-white shadow-xl lg:-translate-y-2" : "border-black/15 bg-white"}`}>
                            <div className="text-xs font-semibold uppercase tracking-wider opacity-70">{t.name}</div>
                            <div className="mt-3 text-4xl font-semibold tracking-tight">{t.price}<span className="ml-1 text-base font-normal opacity-60">{t.period}</span></div>
                            <ul className="mt-5 space-y-2.5 text-sm">
                                {t.features.map((ft, i) => <li key={i} className="flex items-start gap-2"><span style={{ color: accent }}>✓</span> {ft}</li>)}
                            </ul>
                            <button type="button" className={`mt-7 w-full rounded-full px-4 py-3 text-sm font-medium ${t.featured ? "bg-white text-black" : "bg-black text-white"}`}>{t.cta}</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="mx-6 my-14 rounded-3xl p-10 text-center sm:mx-10 sm:p-16 lg:mx-16 lg:p-24" style={{ background: accent }}>
                <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">{copy.finalCta.title}</h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-black/70">{copy.finalCta.body}</p>
                <button type="button" className="mt-8 rounded-full bg-black px-9 py-4 text-base font-medium text-white shadow-lg hover:-translate-y-0.5 transition-transform">{copy.finalCta.cta} →</button>
            </section>

            <div className="px-6 pb-8 pt-2 text-center text-xs text-black/45">
                © {new Date().getFullYear()} {copy.brand.name} · Made with Idea Debater
            </div>
        </div>
    );
}
