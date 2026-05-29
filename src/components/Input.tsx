"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Eyebrow, Tag } from "./primitives";

const bullets = ["Auto-extracts wedge, ICP, GTM", "Forces evidence on every claim", "No \"great idea!\" — ever"];

export function Input() {
  const [pitch, setPitch] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [message, setMessage] = useState("Add at least 120 characters so we have enough context.");

  const handleValidate = () => {
    if (pitch.trim().length >= 120) {
      setIsValid(true);
      setMessage("Great, the pitch has enough signal for validation.");
    } else {
      setIsValid(false);
      setMessage("Add at least 120 characters so we have enough context.");
    }
  };

  return (
    <section id="input" className="border-b border-ink/15 bg-paper grid-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <Eyebrow index="— 02" label="Input" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.96] tracking-[-0.02em] text-ink">
              Drop the pitch. <br />
              The panel <br />
              handles <br />
              <span className="hl-yellow">the rest.</span>
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-ink/70">
              Tell us what you are building, who pays, and why now. We turn it into a structured stress test the panel can argue with.
            </p>
            <ul className="mt-8 space-y-2 font-mono text-[13px] text-ink/85">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-signal-red" /> {b}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-wrap gap-2">
              <Tag tone="blue">120s avg</Tag>
              <Tag tone="green">No card required</Tag>
              <Tag tone="amber">Claude Sonnet 4.5</Tag>
              <Tag tone="ink">PDF export</Tag>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-ink bg-ink p-6 text-paper shadow-[8px_8px_0_0_var(--color-signal-red)]">
              <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-paper/60">
                <span className="text-paper">Idea Validation</span>
                <span>{Math.min(pitch.trim().length, 120)}/120+</span>
              </div>
              <textarea
                value={pitch}
                onChange={(event) => setPitch(event.target.value)}
                placeholder="Pitch your idea in one shot: what you are building, who pays, the pain, why now, and what is hard. We need enough signal to argue — aim for at least a few dense paragraphs."
                className="mt-6 h-80 w-full resize-none rounded-xl border border-paper/15 bg-ink p-5 font-mono text-xs leading-relaxed text-paper/70 placeholder:text-paper/40 focus:border-paper/60 focus:outline-none focus:ring-2 focus:ring-paper/20"
              />
              <div className="mt-6 flex items-center justify-between">
                <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${isValid ? "text-signal-green" : "text-paper/50"}`}>
                  {message}
                </p>
                <button
                  type="button"
                  onClick={handleValidate}
                  className="group inline-flex items-center gap-2 border border-paper/30 bg-paper px-5 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink transition-all hover:bg-signal-red hover:border-signal-red hover:text-paper"
                >
                  Run Validation
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}