import { FileCheck, Gavel, MessageSquare, Target } from "lucide-react";
import { Eyebrow } from "./primitives";

const items = [
  { icon: FileCheck, t: "Verdict", b: "Go, caution, or no-go with a visible score model." },
  { icon: Gavel, t: "Risk Radar", b: "Assumptions ranked by likelihood and damage." },
  { icon: MessageSquare, t: "Objection Bank", b: "The pushback investors, buyers, and operators will raise." },
  { icon: Target, t: "Proof Sprint", b: "The smallest test that can change the decision." },
];

export function Packet() {
  return (
    <section className="border-b border-ink/15 bg-paper">
      <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow index="05" label="/ What you get" className="mb-8" />
            <h2 className="font-display text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[0.95] tracking-[-0.02em] text-ink">
              Not a chat. <br />
              <span className="hl-blue">A decision packet.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pt-20">
            <p className="max-w-md text-[14px] leading-relaxed text-ink/70">
              Move from an idea you are emotionally attached to into a dossier you can defend, improve, or discard before it becomes expensive.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-px border border-ink bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, ...it }, i) => (
            <div key={it.t} className="group relative bg-paper p-6 transition-colors hover:bg-paper-2">
              <span className="grid h-9 w-9 place-items-center border border-ink/30 bg-paper">
                <Icon className="h-4 w-4 text-ink" />
              </span>
              <div className="mt-12 font-display text-lg uppercase text-ink">{it.t}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink/70">{it.b}</p>
              <div className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                0{i + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}