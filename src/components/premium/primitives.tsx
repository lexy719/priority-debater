import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  AudioWaveform,
  Brain,
  Command,
  Crosshair,
  FileText,
  Fingerprint,
  Layers3,
  LineChart,
  Radar,
  ShieldAlert,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { HoverEffect } from "@/components/ui/card-hover-effect";

export const navItems = [
  { href: "/", label: "Command" },
  { href: "/#idea-validation", label: "Validate" },
  { href: "/results", label: "Dossier" },
  { href: "/brand", label: "Brand" },
  { href: "/competitors", label: "Market" },
  { href: "/landing-generator", label: "Landing" },
  { href: "/styleguide", label: "System" },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-hidden text-text">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 mx-auto h-136 max-w-6xl rounded-full bg-[radial-gradient(circle,rgba(156,255,110,0.16),rgba(98,212,255,0.08)_32%,transparent_68%)] blur-3xl" />
      <BackgroundBeams className="fixed inset-0 z-0 opacity-35" />
      <header className="sticky top-0 z-50 border-b border-line bg-bg-deep/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-accent/35 bg-accent text-sm font-black text-bg-deep shadow-[0_0_60px_rgba(156,255,110,0.28)]">
              <span className="absolute inset-0 bg-[linear-gradient(135deg,transparent,rgba(255,255,255,0.55),transparent)] opacity-60" />
              <span className="relative">PD</span>
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">Priority Debater</span>
              <span className="mono block text-[10px] uppercase tracking-[0.34em] text-[#9aa8bd]">
                Founder intelligence
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-white/4.5 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm text-[#d6e5ff]/70 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/#idea-validation"
            className="hidden min-w-[112px] rounded-full bg-accent px-5 py-3 text-center text-sm font-bold leading-tight text-black shadow-[0_16px_50px_rgba(156,255,110,0.2)] transition hover:bg-white sm:inline-flex"
          >
            Run verdict
          </Link>
        </div>
      </header>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PageShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <Shell>
      <main className={cn("mx-auto w-full px-5 py-8 sm:px-8 lg:py-12", wide ? "max-w-368" : "max-w-7xl")}>
        {children}
      </main>
    </Shell>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="mono inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_18px_var(--accent)]" />
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold transition",
        variant === "primary"
          ? "bg-accent text-black shadow-[0_0_54px_rgba(156,255,110,0.24)] hover:bg-white"
          : "border border-line bg-white/4.5 text-text hover:border-line-strong hover:bg-white/10",
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
    </Link>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-4xl border border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.34)] backdrop-blur-2xl",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/35 before:to-transparent",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  text,
  center = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <Kicker>{eyebrow}</Kicker>
      <h2 className="mt-5 text-3xl font-black tracking-[-0.055em] text-balance sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-muted sm:text-lg">{text}</p>
    </div>
  );
}

export function StatPill({ label, value, tone = "accent" }: { label: string; value: string; tone?: "accent" | "blue" | "violet" | "danger" }) {
  const tones = {
    accent: "text-accent",
    blue: "text-accent-2",
    violet: "text-accent-3",
    danger: "text-danger",
  };

  return (
    <div className="rounded-2xl border border-line bg-bg-deep/46 px-4 py-3">
      <div className={cn("mono text-2xl font-black tracking-[-0.08em]", tones[tone])}>{value}</div>
      <div className="mono mt-1 text-[10px] uppercase tracking-[0.24em] text-muted">{label}</div>
    </div>
  );
}

export function CommandCenterMockup() {
  const scores = [
    ["Market gravity", 82, "Pull"],
    ["Moat clarity", 46, "Weak"],
    ["Execution edge", 74, "Fit"],
    ["Distribution proof", 31, "Gap"],
  ];

  return (
    <Panel className="min-h-[650px] p-0">
      <div className="grid min-h-[650px] lg:grid-cols-[220px_1fr]">
        <aside className="border-b border-line bg-bg-deep/42 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <Command className="h-4 w-4 text-accent" />
            <span className="mono text-[10px] uppercase tracking-[0.28em] text-muted">Live run</span>
          </div>
          <div className="mt-8 grid gap-3">
            {["Brief", "Personas", "Market", "Risks", "Memo"].map((item, index) => (
              <div
                key={item}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-3 py-3 text-sm",
                  index === 1 ? "border-accent/35 bg-accent/10 text-accent" : "border-line bg-white/[0.035] text-muted",
                )}
              >
                <span>{item}</span>
                <span className="mono text-[10px]">{String(index + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="relative p-5 sm:p-6">
          <div className="absolute right-8 top-8 hidden h-44 w-44 rounded-full bg-accent/14 blur-3xl sm:block" />
          <div className="relative grid gap-5 xl:grid-cols-[1fr_260px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="mono text-[10px] uppercase tracking-[0.28em] text-muted">Dossier / 04.26</p>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.06em]">Restaurant ops AI co-pilot</h3>
                </div>
                <span className="rounded-full border border-warning/35 bg-warning/10 px-4 py-2 text-sm font-bold text-warning">
                  Conditional GO
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {scores.map(([label, score, status]) => (
                  <div key={label as string} className="rounded-3xl border border-line bg-bg-deep/54 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="mono text-xl font-black text-accent">{score}</span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-accent-2 via-accent to-warning"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <p className="mono mt-3 text-[10px] uppercase tracking-[0.24em] text-muted">{status}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-line-strong bg-white/4.5 p-5">
                <div className="flex items-start gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-bg-deep">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Board memo synthesis</p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Build the first workflow by hand for 12 operators. Do not ship automation until the owner can name the saved hours in budget language.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <ScoreDial score={78} label="Verdict confidence" />
              <SignalTile icon={<Radar className="h-4 w-4" />} label="Evidence quality" value="B-" />
              <SignalTile icon={<ShieldAlert className="h-4 w-4" />} label="Primary risk" value="Distribution" />
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function ScoreDial({ score, label }: { score: number; label: string }) {
  return (
    <div className="rounded-3xl border border-line bg-bg-deep/54 p-5">
      <div
        className="mx-auto grid h-36 w-36 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--accent) ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-bg-deep text-center">
          <span className="mono text-4xl font-black tracking-[-0.08em]">{score}</span>
        </div>
      </div>
      <p className="mono mt-5 text-center text-[10px] uppercase tracking-[0.24em] text-muted">{label}</p>
    </div>
  );
}

export function SignalTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white/4 p-4">
      <div className="flex items-center justify-between text-muted">
        {icon}
        <span className="mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-5 text-xl font-black tracking-[-0.05em]">{value}</p>
    </div>
  );
}

export function IntelligenceBento() {
  const items = [
    {
      title: "Persona debate lanes",
      text: "Operator, investor, customer, growth, and adversary all score the same assumptions.",
      icon: <AudioWaveform className="h-5 w-5" />,
      className: "md:col-span-2",
      header: <BentoSignalHeader variant="lanes" />,
    },
    {
      title: "Risk heatmap",
      text: "Distribution, willingness to pay, timing, moat, and execution edge are separated.",
      icon: <ShieldAlert className="h-5 w-5" />,
      className: "",
      header: <BentoSignalHeader variant="risk" />,
    },
    {
      title: "Board memo output",
      text: "A concise decision packet with next tests instead of generic startup advice.",
      icon: <FileText className="h-5 w-5" />,
      className: "",
      header: <BentoSignalHeader variant="memo" />,
    },
    {
      title: "Evidence gaps",
      text: "Every claim gets pressure-tested against what the founder can prove this week.",
      icon: <Fingerprint className="h-5 w-5" />,
      className: "md:col-span-2",
      header: <BentoSignalHeader variant="evidence" />,
    },
  ];

  return (
    <BentoGrid className="max-w-none md:auto-rows-[22rem]">
      {items.map((item) => (
        <BentoGridItem
          key={item.title}
          className={cn(
            "border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.095),rgba(255,255,255,0.026))] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.34)] backdrop-blur-2xl dark:border-line dark:bg-transparent",
            item.className,
          )}
          title={<span className="text-2xl font-black tracking-[-0.06em] text-text">{item.title}</span>}
          description={<span className="text-sm leading-7 text-muted">{item.text}</span>}
          header={item.header}
          icon={<span className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-white/10 text-accent">{item.icon}</span>}
        />
      ))}
    </BentoGrid>
  );
}

function BentoSignalHeader({ variant }: { variant: "lanes" | "risk" | "memo" | "evidence" }) {
  if (variant === "risk") {
    return (
      <div className="flex min-h-40 flex-1 items-end rounded-2xl border border-line bg-bg-deep/50 p-4">
        <div className="grid w-full grid-cols-5 items-end gap-2">
          {[42, 68, 31, 76, 54].map((height, index) => (
            <div key={height} className="rounded-t-xl bg-linear-to-t from-danger/70 to-warning" style={{ height: `${height + 30}px` }}>
              <span className="mono block -translate-y-5 text-center text-[10px] text-muted">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "memo") {
    return (
      <div className="min-h-40 rounded-2xl border border-line bg-bg-deep/50 p-4">
        <div className="mono text-[10px] uppercase tracking-[0.24em] text-accent">Memo extract</div>
        <div className="mt-5 space-y-2">
          <div className="h-3 w-5/6 rounded-full bg-white/15" />
          <div className="h-3 w-2/3 rounded-full bg-white/10" />
          <div className="h-3 w-4/5 rounded-full bg-white/10" />
        </div>
        <div className="mt-5 rounded-xl border border-accent/20 bg-accent/10 p-3 text-xs leading-5 text-accent">
          Test distribution before product.
        </div>
      </div>
    );
  }

  if (variant === "evidence") {
    return (
      <div className="grid min-h-40 grid-cols-3 gap-3 rounded-2xl border border-line bg-bg-deep/50 p-4">
        {["Calls", "Revenue", "Access"].map((label, index) => (
          <div key={label} className="rounded-2xl border border-line bg-white/4 p-3">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${48 + index * 18}%` }} />
            <p className="mono mt-8 text-[10px] uppercase tracking-[0.18em] text-muted">{label}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-40 rounded-2xl border border-line bg-bg-deep/50 p-4">
      <div className="grid grid-cols-5 gap-2">
        {["OP", "IV", "CU", "AD", "GR"].map((label, index) => (
          <div key={label} className="rounded-2xl border border-line bg-white/5 p-3 text-center">
            <AudioWaveform className="mx-auto h-5 w-5 text-accent-2" />
            <p className="mono mt-8 text-[10px] text-muted">{label}</p>
            <p className="mono mt-1 text-lg font-black text-accent">{72 + index * 4}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PersonaGrid() {
  const personas = [
    {
      title: "Operator / 81",
      description: "Finds operational drag, margin traps, process debt, and implementation risk.",
      link: "/results",
    },
    {
      title: "Investor / 74",
      description: "Attacks scale, moat, fundability, category timing, and the story investors will reject.",
      link: "/results",
    },
    {
      title: "Customer / 88",
      description: "Checks urgency, budget ownership, trust, switching pain, and whether anyone cares today.",
      link: "/results",
    },
    {
      title: "Adversary / 69",
      description: "Names the obvious reason the idea fails before the market says it more expensively.",
      link: "/results",
    },
    {
      title: "Growth / 57",
      description: "Pressure-tests first channel, repeatability, payback period, and message-market fit.",
      link: "/results",
    },
  ];

  return (
    <HoverEffect items={personas} className="py-0 lg:grid-cols-5 [&_a]:p-1.5 [&_h4]:text-text [&_p]:text-muted" />
  );
}

export function IntakeConsole() {
  return (
    <Panel className="p-0">
      <div className="grid lg:grid-cols-[1fr_340px]">
        <form className="grid gap-5 p-5 sm:p-7">
          <ConsoleField label="Idea headline" placeholder="AI finance co-pilot for multi-location restaurant operators" />
          <ConsoleField label="Customer pain" textarea placeholder="Who hurts, how often, what do they do today, and what does the pain cost?" />
          <ConsoleField label="Unfair edge" textarea placeholder="Distribution access, domain credibility, proprietary data, wedge, or founder obsession." />
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <ButtonLink href="/results">Generate dossier</ButtonLink>
            <ButtonLink href="/styleguide" variant="ghost">View design system</ButtonLink>
          </div>
        </form>
        <aside className="border-t border-line bg-bg-deep/50 p-5 lg:border-l lg:border-t-0">
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-muted">Run configuration</p>
          <div className="mt-6 grid gap-3">
            <SignalTile icon={<Layers3 className="h-4 w-4" />} label="Mode" value="Board packet" />
            <SignalTile icon={<Target className="h-4 w-4" />} label="Output" value="Verdict + plan" />
            <SignalTile icon={<Zap className="h-4 w-4" />} label="Speed" value="2 min brief" />
          </div>
        </aside>
      </div>
    </Panel>
  );
}

function ConsoleField({ label, placeholder, textarea = false }: { label: string; placeholder: string; textarea?: boolean }) {
  const className =
    "w-full rounded-3xl border border-line bg-bg-deep/64 px-5 py-4 text-base outline-none transition placeholder:text-faint focus:border-accent focus:bg-bg-deep";

  return (
    <label className="grid gap-2">
      <span className="mono text-xs uppercase tracking-[0.24em] text-muted">{label}</span>
      {textarea ? (
        <textarea className={cn(className, "min-h-36 resize-y leading-7")} placeholder={placeholder} />
      ) : (
        <input className={className} placeholder={placeholder} />
      )}
    </label>
  );
}

export function ResultsDossier() {
  const risks = [
    ["Distribution", "No owned channel yet. Run concierge tests before productizing.", "High"],
    ["Willingness to pay", "Pain is visible, budget owner still unclear.", "Med"],
    ["Defensibility", "Workflow depth must become the moat, not model access.", "Med"],
  ];

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <CommandCenterMockup />
      <div className="grid gap-5">
        <Panel>
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-accent">Board memo</p>
          <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.07em]">
            Credible wedge. Under-proven entry motion.
          </h2>
          <p className="mt-5 leading-8 text-muted">
            The idea earns a conditional GO only if the founder proves budget ownership and repeats a narrow distribution motion with real operators.
          </p>
        </Panel>
        <Panel>
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-muted">Risk register</p>
          <div className="mt-5 grid gap-3">
            {risks.map(([label, text, severity]) => (
              <div key={label} className="grid gap-4 rounded-3xl border border-line bg-bg-deep/54 p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-bold">{label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                </div>
                <span className="h-fit rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-bold text-danger">
                  {severity}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function WorkspaceHero({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
      <SectionHeader eyebrow={label} title={title} text={text} />
      <Panel>
        <div className="flex items-center gap-3">
          <Crosshair className="h-5 w-5 text-accent" />
          <span className="mono text-xs uppercase tracking-[0.24em] text-muted">New system</span>
        </div>
        <p className="mt-5 text-sm leading-7 text-muted">
          Built as a fresh premium interface with bento modules, command surfaces, and dossier-style hierarchy.
        </p>
      </Panel>
    </div>
  );
}

export { LineChart };
