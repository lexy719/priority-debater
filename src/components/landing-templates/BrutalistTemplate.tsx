"use client";

import type { TemplateProps } from "@/lib/landing-template-types";

/** Brutalist: heavy black borders, neon yellow, mono type, raw. */
export default function BrutalistTemplate({ copy, images, accent, device }: TemplateProps) {
    const img = (i: number) => images[i % Math.max(1, images.length)]?.url;
    const isMobile = device === "mobile";

    return (
        <div className="bg-[#fefce8] text-black" style={{ fontFamily: "'JetBrains Mono', monospace" }} data-testid="tpl-brutalist">
            {/* Nav */}
            <div className="flex items-center justify-between border-b-4 border-black px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-7 w-7 border-2 border-black" style={{ background: accent }} />
                    <span className="text-lg font-black uppercase tracking-tight">{copy.brand.name}</span>
                </div>
                <div className="hidden gap-6 text-[10px] font-bold uppercase tracking-widest sm:flex">
                    <span>WHY</span><span>WHAT</span><span>PRICING</span><span>CONTACT</span>
                </div>
                <button type="button" className="border-2 border-black bg-black px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#fefce8] hover:bg-[#fefce8] hover:text-black">
                    {copy.hero.primaryCta}
                </button>
            </div>

            {/* Hero */}
            <section className="border-b-4 border-black px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
                <div className="inline-block border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ background: accent }}>
                    {copy.hero.kicker}
                </div>
                <h1 className={`mt-6 font-black uppercase leading-[1.35] tracking-tighter ${isMobile ? "text-5xl" : "text-6xl sm:text-7xl lg:text-[120px]"}`} style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif" }}>
                    {copy.hero.title.split(".").map((seg, i, arr) => seg.trim() && (
                        <span key={i} className="block">
                            {i === arr.length - 2 ? (
                                <span style={{ background: accent, padding: "0 0.08em", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
                                    {seg.trim()}.
                                </span>
                            ) : seg.trim() + (i < arr.length - 1 ? "." : "")}
                        </span>
                    ))}
                </h1>
                <p className="mt-8 max-w-xl text-sm leading-relaxed sm:text-base">{copy.hero.sub}</p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                    <button type="button" className="border-2 border-black bg-black px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-[#fefce8] shadow-[6px_6px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]">{copy.hero.primaryCta} →</button>
                    <button type="button" className="border-2 border-black bg-[#fefce8] px-7 py-3.5 text-xs font-bold uppercase tracking-widest shadow-[6px_6px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]" style={{ background: accent }}>{copy.hero.secondaryCta}</button>
                </div>
                <div className="mt-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">● {copy.hero.proofLine}</div>
            </section>

            {/* Image strip */}
            {img(0) && (
                <div className="grid grid-cols-3 gap-0 border-b-4 border-black">
                    {[0, 1, 2].map((i) => img(i) && (
                        <div key={i} className={i < 2 ? "border-r-4 border-black" : ""}>
                            <img src={img(i)} alt="" className="aspect-square w-full object-cover grayscale contrast-125" />
                        </div>
                    ))}
                </div>
            )}

            {/* Problem */}
            <section className="border-b-4 border-black bg-black px-6 py-14 text-[#fefce8] sm:px-10 lg:px-16 lg:py-20">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">§01 / {copy.problem.eyebrow}</div>
                <h2 className="mt-3 font-black uppercase leading-[1.35] tracking-tighter sm:text-5xl lg:text-7xl" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: isMobile ? "2.5rem" : undefined }}>
                    <span style={{ background: accent, color: "#000", padding: "0 0.08em" }}>{copy.problem.title}</span>
                </h2>
                <p className="mt-7 max-w-2xl text-sm leading-relaxed opacity-85">{copy.problem.body}</p>
            </section>

            {/* Features */}
            <section className="border-b-4 border-black px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">§02 / WHAT IT DOES</div>
                <h2 className="mt-3 font-black uppercase leading-[1.35] tracking-tighter" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: isMobile ? "2.25rem" : "4.5rem" }}>
                    SIX THINGS. <span style={{ background: accent, padding: "0 0.08em" }}>SHIPPED.</span>
                </h2>
                <div className="mt-10 grid gap-0 border-2 border-black sm:grid-cols-2 lg:grid-cols-3">
                    {copy.features.map((f, i) => (
                        <div key={f.kicker} className={`bg-[#fefce8] p-6 ${i < copy.features.length - (isMobile ? 1 : 3) ? "border-b-2 border-black" : ""} ${(i + 1) % 3 !== 0 && !isMobile ? "lg:border-r-2 lg:border-black" : ""} ${i % 2 === 0 && isMobile ? "sm:border-r-2 sm:border-black" : ""}`}>
                            <div className="inline-block border border-black bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#fefce8]">{f.kicker}</div>
                            <h3 className="mt-4 text-xl font-black uppercase tracking-tight">{f.title}</h3>
                            <p className="mt-3 text-xs leading-relaxed opacity-75">{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Metrics */}
            <section className="border-b-4 border-black px-6 py-14 sm:px-10 lg:px-16 lg:py-20" style={{ background: accent }}>
                <div className="text-[10px] font-bold uppercase tracking-widest">§03 / NUMBERS</div>
                <div className="mt-8 grid grid-cols-2 gap-0 border-2 border-black lg:grid-cols-4">
                    {copy.metrics.map((m, i) => (
                        <div key={m.label} className={`bg-[#fefce8] p-6 ${(i + 1) % 2 !== 0 ? "border-r-2 border-black" : ""} ${i < 2 ? "border-b-2 border-black lg:border-b-0" : ""} ${i !== 3 ? "lg:border-r-2 lg:border-black" : ""}`}>
                            <div className="font-black uppercase tracking-tighter" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: "3.5rem", lineHeight: 0.9 }}>{m.value}</div>
                            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest">{m.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Testimonial */}
            <section className="border-b-4 border-black px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">§04 / FROM AN OPERATOR</div>
                <blockquote className="mt-4 font-black uppercase leading-[1.35] tracking-tighter" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: isMobile ? "1.75rem" : "3rem" }}>
                    &ldquo;{copy.testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-6 text-[11px] font-bold uppercase tracking-widest">
                    <span className="border-2 border-black px-2 py-1" style={{ background: accent }}>{copy.testimonial.author}</span>
                    <span className="ml-3 opacity-60">· {copy.testimonial.role}</span>
                </div>
            </section>

            {/* Pricing */}
            <section className="border-b-4 border-black px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">§05 / PRICING</div>
                <h2 className="mt-3 font-black uppercase leading-[1.35] tracking-tighter" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: isMobile ? "2.25rem" : "4rem" }}>
                    NO TRIAL TRAP.
                </h2>
                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                    {copy.pricing.map((t) => (
                        <div key={t.name} className={`border-2 border-black p-6 ${t.featured ? "bg-black text-[#fefce8] shadow-[8px_8px_0_0_#000]" : "bg-[#fefce8]"}`}>
                            <div className="flex items-center justify-between">
                                <div className="text-[11px] font-bold uppercase tracking-widest">{t.name}</div>
                                {t.featured && <span className="border-2 border-current px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: accent, color: "#000", borderColor: "#000" }}>★ PICK</span>}
                            </div>
                            <div className="mt-4 font-black uppercase tracking-tighter" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: "2.75rem", lineHeight: 0.9 }}>{t.price}<span className="text-sm font-mono opacity-60">{t.period}</span></div>
                            <ul className="mt-5 space-y-2 text-[11px] uppercase tracking-wider">
                                {t.features.map((ft, i) => <li key={i} className="border-t border-current/25 pt-2">→ {ft}</li>)}
                            </ul>
                            <button type="button" className={`mt-7 w-full border-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest ${t.featured ? "border-[#fefce8] bg-[#fefce8] text-black" : "border-black bg-black text-[#fefce8]"}`}>{t.cta}</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="border-b-4 border-black px-6 py-16 sm:px-10 lg:px-16 lg:py-24" style={{ background: accent }}>
                <h2 className="font-black uppercase leading-[1.35] tracking-tighter" style={{ fontFamily: "'Archivo Black', 'Inter', sans-serif", fontSize: isMobile ? "2.75rem" : "6rem" }}>
                    {copy.finalCta.title}
                </h2>
                <p className="mt-7 max-w-xl text-sm leading-relaxed">{copy.finalCta.body}</p>
                <button type="button" className="mt-9 border-2 border-black bg-black px-9 py-4 text-xs font-bold uppercase tracking-widest text-[#fefce8] shadow-[6px_6px_0_0_#000] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#000]">
                    {copy.finalCta.cta} →
                </button>
            </section>

            <div className="bg-black px-6 py-4 text-center text-[9px] font-bold uppercase tracking-widest text-[#fefce8]">
                © {new Date().getFullYear()} {copy.brand.name.toUpperCase()} · MADE WITH IDEA DEBATER
            </div>
        </div>
    );
}
