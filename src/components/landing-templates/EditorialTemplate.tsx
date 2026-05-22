"use client";

import type { TemplateProps } from "@/lib/landing-template-types";

/** Magazine-style: cream paper, serif headlines, generous whitespace. */
export default function EditorialTemplate({ copy, images, accent, device }: TemplateProps) {
    const img = (i: number) => images[i % Math.max(1, images.length)]?.url;
    const isMobile = device === "mobile";

    return (
        <div className="bg-[#f4efe3] text-[#0a0a0a]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }} data-testid="tpl-editorial">
            {/* Nav */}
            <div className="flex items-center justify-between border-b border-black/15 px-6 py-5">
                <div className="font-serif text-2xl italic tracking-tight">{copy.brand.name}</div>
                <div className="hidden gap-7 font-mono text-[10px] tracking-widest text-black/60 sm:flex">
                    <span>STORY</span><span>PRODUCT</span><span>PRICING</span><span>PRESS</span>
                </div>
                <button type="button" className="border border-black px-4 py-1.5 font-mono text-[10px] tracking-widest hover:bg-black hover:text-[#f4efe3]">
                    {copy.hero.primaryCta}
                </button>
            </div>

            {/* Hero */}
            <section className="grid gap-10 px-6 py-16 sm:px-12 lg:grid-cols-12 lg:py-24">
                <div className="lg:col-span-7">
                    <div className="inline-block border border-black/30 px-2 py-0.5 font-mono text-[10px] tracking-widest">{copy.hero.kicker}</div>
                    <h1 className={`mt-6 font-serif leading-[1.35] tracking-tight ${isMobile ? "text-5xl" : "text-6xl sm:text-7xl lg:text-[112px]"}`}>
                        {copy.hero.title.split(".").map((seg, i, arr) => seg.trim() && (
                            <span key={i} className="block italic">
                                {seg.trim()}{i < arr.length - 1 ? "." : ""}
                            </span>
                        ))}
                    </h1>
                    <p className="mt-8 max-w-xl font-sans text-base leading-relaxed text-black/75" style={{ fontFamily: "Inter, sans-serif" }}>{copy.hero.sub}</p>
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <button type="button" className="bg-black px-6 py-3 font-mono text-xs tracking-widest text-[#f4efe3]">{copy.hero.primaryCta} →</button>
                        <button type="button" className="border border-black px-6 py-3 font-mono text-xs tracking-widest">{copy.hero.secondaryCta}</button>
                    </div>
                    <div className="mt-8 font-mono text-[11px] tracking-widest text-black/55">— {copy.hero.proofLine}</div>
                </div>
                <div className="relative lg:col-span-5">
                    {img(0) && <img src={img(0)} alt="" className="aspect-[4/5] w-full object-cover grayscale" />}
                    <div className="absolute -bottom-4 -left-4 border border-black bg-[#f4efe3] px-3 py-1.5 font-mono text-[10px] tracking-widest">{copy.brand.tagline}</div>
                </div>
            </section>

            {/* Problem */}
            <section className="border-y border-black/15 bg-[#ebe5d5] px-6 py-16 sm:px-12 lg:py-24">
                <div className="grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <div className="font-mono text-[10px] tracking-widest text-black/50">§01 / {copy.problem.eyebrow}</div>
                        <h2 className="mt-3 font-serif text-4xl italic leading-[1.35] lg:text-5xl">
                            <span style={{ background: accent, padding: "0 0.1em" }}>{copy.problem.title}</span>
                        </h2>
                    </div>
                    <p className="self-center font-sans text-lg leading-relaxed text-black/80 lg:col-span-8" style={{ fontFamily: "Inter, sans-serif" }}>{copy.problem.body}</p>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 py-16 sm:px-12 lg:py-24">
                <div className="font-mono text-[10px] tracking-widest text-black/50">§02 / WHAT YOU GET</div>
                <h2 className="mt-3 font-serif text-4xl italic leading-[1.35] lg:text-6xl">A single quiet platform.</h2>
                <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {copy.features.map((f) => (
                        <div key={f.kicker} className="border-t border-black/30 pt-5">
                            <div className="font-mono text-[10px] tracking-widest text-black/45">{f.kicker}</div>
                            <h3 className="mt-3 font-serif text-2xl italic">{f.title}</h3>
                            <p className="mt-3 font-sans text-sm leading-relaxed text-black/70" style={{ fontFamily: "Inter, sans-serif" }}>{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Metrics + image */}
            <section className="border-y border-black/15 bg-black px-6 py-16 text-[#f4efe3] sm:px-12 lg:py-24">
                <div className="grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        {img(1) && <img src={img(1)} alt="" className="aspect-[4/3] w-full object-cover" />}
                    </div>
                    <div className="grid grid-cols-2 gap-px self-center border border-white/20 bg-white/10 lg:col-span-7">
                        {copy.metrics.map((m) => (
                            <div key={m.label} className="bg-black p-6">
                                <div className="font-serif text-5xl italic" style={{ color: accent }}>{m.value}</div>
                                <div className="mt-2 font-mono text-[10px] tracking-widest text-white/55">{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial */}
            <section className="px-6 py-20 sm:px-12 lg:px-24 lg:py-28">
                <div className="font-mono text-[10px] tracking-widest text-black/50">§04 / FROM AN OPERATOR</div>
                <blockquote className="mt-4 font-serif text-3xl italic leading-[1.05] lg:text-5xl">&ldquo;{copy.testimonial.quote}&rdquo;</blockquote>
                <div className="mt-6 font-mono text-xs tracking-widest text-black/65">
                    <span style={{ background: accent, padding: "0 0.25em" }}>{copy.testimonial.author}</span>
                    <span className="ml-2 opacity-60">· {copy.testimonial.role}</span>
                </div>
            </section>

            {/* Pricing */}
            <section className="border-y border-black/15 bg-[#ebe5d5] px-6 py-16 sm:px-12 lg:py-24">
                <div className="font-mono text-[10px] tracking-widest text-black/50">§05 / PRICING</div>
                <h2 className="mt-3 font-serif text-4xl italic leading-[1.35] lg:text-6xl">Plain pricing. No surprises.</h2>
                <div className="mt-10 grid gap-5 sm:grid-cols-3">
                    {copy.pricing.map((t) => (
                        <div key={t.name} className={`border p-6 ${t.featured ? "border-2 border-black bg-black text-[#f4efe3]" : "border-black/25 bg-[#f4efe3]"}`}>
                            <div className="font-mono text-[10px] tracking-widest opacity-70">{t.name}</div>
                            <div className="mt-3 font-serif text-5xl italic">{t.price}<span className="text-base font-mono not-italic opacity-60">{t.period}</span></div>
                            <ul className="mt-5 space-y-2 font-sans text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
                                {t.features.map((ft, i) => <li key={i} className="border-t border-current/15 pt-2">— {ft}</li>)}
                            </ul>
                            <button type="button" className={`mt-6 w-full border px-4 py-2.5 font-mono text-xs tracking-widest ${t.featured ? "border-[#f4efe3] bg-[#f4efe3] text-black" : "border-black"}`}>{t.cta}</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-6 py-20 sm:px-12 lg:px-24 lg:py-28" style={{ background: accent }}>
                <h2 className="font-serif text-5xl italic leading-[1.35] lg:text-7xl">{copy.finalCta.title}</h2>
                <p className="mt-6 max-w-xl font-sans text-lg leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>{copy.finalCta.body}</p>
                <button type="button" className="mt-9 border-2 border-black bg-black px-8 py-4 font-mono text-xs tracking-widest text-[#f4efe3]">{copy.finalCta.cta} →</button>
            </section>

            <div className="border-t border-black/15 px-6 py-6 text-center font-mono text-[9px] tracking-widest text-black/50">
                © {new Date().getFullYear()} {copy.brand.name.toUpperCase()} · MADE WITH IDEA DEBATER
            </div>
        </div>
    );
}
