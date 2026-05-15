"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  BarChart3,
  Layers3,
  Search,
  Presentation,
  Compass,
  Megaphone,
  FileText,
  MessagesSquare,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerdictPill, type Verdict } from "./verdict-pill";

type SectionItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  locked?: boolean;
  nested?: boolean;
};

const CORE_NAV: SectionItem[] = [
  { label: "Validate", href: "/#idea-validation", icon: ShieldCheck },
  { label: "Results", href: "/results", icon: BarChart3 },
  { label: "Persona chat", href: "/results/debate", icon: MessagesSquare },
];

const SOLO_NAV: SectionItem[] = [
  { label: "Brand", href: "/brand", icon: Layers3, locked: true },
  { label: "Competitors", href: "/competitors", icon: Search, locked: true },
  { label: "Pitch", href: "/pitch", icon: Presentation, locked: true },
  { label: "Strategy", href: "/strategy", icon: Compass, locked: true },
  { label: "Marketing", href: "/marketing", icon: Megaphone, locked: true },
  { label: "Landing pages", href: "/landing-generator", icon: FileText, locked: true },
];

interface SidebarProps {
  project?: { title: string; verdict: Verdict; validatedAt: string };
  user?: { name: string; email: string; initial: string };
}

function navItemActive(s: SectionItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === s.href) return true;
  if (pathname === "/results/debate") return false;
  return (
    s.href !== "/" &&
    !s.nested &&
    pathname.startsWith(s.href)
  );
}

function renderNavItem(s: SectionItem, pathname: string | null) {
  const active = navItemActive(s, pathname);
  const Icon = s.icon;
  const href = s.locked ? "/#pricing" : s.href;
  return (
    <li key={s.href} className="relative">
      {active && !s.locked && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[--accent]" />
      )}
      <Link
        href={href}
        data-cursor="snap"
        aria-disabled={s.locked}
        title={s.locked ? "Included on Solo — see pricing" : undefined}
        className={cn(
          "flex items-center gap-2.5 pr-3 py-2 rounded-[--radius] text-[13px] transition-colors duration-[120ms]",
          s.nested ? "pl-9" : "pl-4",
          s.locked
            ? "text-[--ink-2] hover:text-[--ink-1] hover:bg-[--surface-2]/60"
            : active
            ? "bg-[--surface-3] text-[--ink-0]"
            : "text-[--ink-1] hover:bg-[--surface-2] hover:text-[--ink-0]"
        )}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1">{s.label}</span>
        {s.locked && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink-2]">
            <Lock className="w-2.5 h-2.5" />
            Solo
          </span>
        )}
      </Link>
    </li>
  );
}

export function Sidebar({ project, user }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className="w-[248px] shrink-0 h-screen sticky top-0 z-[60] flex flex-col border-r-2 border-black bg-white shadow-[4px_0_0_0_#000]">
      <div className="px-5 h-16 flex items-center border-b-2 border-black bg-black text-white">
        <Link href="/" className="flex items-center gap-2 group" data-cursor="snap">
          <span className="grid h-7 w-7 place-items-center bg-white text-black font-mono font-bold text-[12px]">
            PD
          </span>
          <span className="font-bold text-[14px] tracking-tight uppercase">
            Priority Debater
          </span>
        </Link>
      </div>

      {project && (
        <div className="px-5 py-6 border-b-2 border-black space-y-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40">
            CURRENT CASE
          </div>
          <div className="font-bold text-[16px] leading-[1.2] tracking-tight text-black uppercase">
            {project.title}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <span className={cn(
              "font-mono text-[9px] px-2 py-0.5 border border-black uppercase tracking-widest",
              project.verdict === "GO" ? "bg-[#22c55e] text-white" : "bg-[#eab308] text-white"
            )}>
              • {project.verdict}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-black/40">
              {project.validatedAt}
            </span>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-8">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40 px-3 mb-4">
            YOUR CASE
          </div>
          <ul className="space-y-1">
            {CORE_NAV.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-[11px] font-mono uppercase tracking-widest transition-all",
                    pathname === s.href ? "bg-black text-white" : "hover:bg-black/5"
                  )}
                >
                  <s.icon className="w-3.5 h-3.5" />
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-black/40 px-3 mb-4">
            SOLO TIER
          </div>
          <ul className="space-y-1 opacity-50">
            {SOLO_NAV.map((s) => (
              <li key={s.href}>
                <div className="flex items-center gap-3 px-3 py-2 text-[11px] font-mono uppercase tracking-widest cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" />
                  {s.label}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {user && (
        <div className="px-4 py-4 border-t-2 border-black bg-[#fafafa]">
          <div className="flex items-center gap-3 px-3 py-2 border-2 border-black bg-white shadow-[2px_2px_0_0_#000]">
            <div className="w-7 h-7 grid place-items-center bg-black text-white font-mono text-[12px]">
              {user.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase truncate">{user.name}</div>
              <div className="font-mono text-[9px] text-black/40 truncate">
                {user.email}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
