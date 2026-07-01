"use client";

/**
 * SiteNav — the single, consistent navbar used across every page.
 *
 * One identity everywhere (PD mark + "Priority Debater", dark ink bar), but two
 * link sets depending on context:
 *
 *  - Marketing (the landing page): on-page section anchors only — How it works,
 *    The Chamber, The Studio, Pricing, FAQ — plus the "Validate my idea" CTA.
 *    No Results/Debate/Studio links, because the visitor hasn't validated yet.
 *
 *  - Journey (every post-validation page): the connected flow — Results, Debate,
 *    Studio — with the current section highlighted.
 *
 * Pages can pass `actions` to swap the default CTA for page-specific controls
 * and `subtitle` for a small contextual line under the brand.
 *
 * Replaces the old Nav / StudioTopNav / DebateNavbar.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { CreditBadge } from "@/components/credits/CreditBadge";
import { AccountChip } from "@/components/account/AccountChip";
import { getCurrentReport } from "@/lib/commerce/client-store";

const FLOW_ROUTES = ["/brand-kit", "/launch-kit", "/campaign", "/landing-builder", "/ship"];

type NavLink = { label: string; href: string; active: boolean };

type NavContext = "marketing" | "journey" | "commerce";

const MARKETING_LINKS: NavLink[] = [
  { label: "The Chamber", href: "/#chamber", active: false },
  { label: "The Dossier", href: "/#report", active: false },
  { label: "How it works", href: "/#how", active: false },
  { label: "The Studio", href: "/#studio", active: false },
  { label: "Pricing", href: "/pricing", active: false },
  { label: "FAQ", href: "/faq", active: false },
];

function useNav(commerceReportId?: string): { context: NavContext; links: NavLink[]; ctaLabel: string; ctaHref: string } {
  const path = usePathname() ?? "";

  const MARKETING_PAGES = ["/pricing", "/faq", "/about", "/privacy", "/terms", "/contact"];
  if (path === "/" || MARKETING_PAGES.includes(path)) {
    return { context: "marketing", links: MARKETING_LINKS, ctaLabel: "Validate my idea", ctaHref: "/#validate" };
  }

  // The second path — PD Commerce: Scan → Report → PD Agent. Once a report
  // exists (carried in localStorage), the nav threads its id through so moving
  // between Report and Agent keeps the same store.
  if (path.startsWith("/commerce")) {
    const onResults = path.startsWith("/commerce/results");
    const onAgent = path.startsWith("/commerce/agent");
    const links: NavLink[] = commerceReportId
      ? [
          { label: "Report", href: `/commerce/results?r=${commerceReportId}`, active: onResults },
          { label: "PD Agent", href: `/commerce/agent?reportId=${commerceReportId}`, active: onAgent },
        ]
      : [
          { label: "Scan", href: "/commerce", active: path === "/commerce" || onResults },
          { label: "PD Agent", href: "/commerce/agent", active: onAgent },
        ];
    return {
      context: "commerce",
      links,
      ctaLabel: commerceReportId ? "New scan" : "Run free scan",
      ctaHref: "/commerce",
    };
  }

  const isDebate = path === "/debate";
  const isResults = path.startsWith("/results") && !isDebate;
  const isStudio =
    FLOW_ROUTES.some((p) => path === p || path.startsWith(`${p}/`)) ||
    path === "/landing" ||
    path === "/pitch";

  const links: NavLink[] = [
    { label: "Results", href: "/results", active: isResults },
    { label: "Debate", href: "/debate", active: isDebate },
    { label: "Studio", href: "/brand-kit", active: isStudio },
  ];
  return { context: "journey", links, ctaLabel: "New validation", ctaHref: "/#validate" };
}

type SiteNavProps = {
  subtitle?: string;
  actions?: ReactNode;
  /** Set false when nested inside another sticky header (e.g. the flow stepper). */
  sticky?: boolean;
};

export function SiteNav({ subtitle, actions, sticky = true }: SiteNavProps) {
  const path = usePathname() ?? "";
  // Read the current commerce report from localStorage after mount (never during
  // render — keeps SSR/first paint stable, then threads the store id into nav).
  const [commerceReportId, setCommerceReportId] = useState<string | undefined>(undefined);
  useEffect(() => {
    setCommerceReportId(path.startsWith("/commerce") ? getCurrentReport()?.shareId : undefined);
  }, [path]);

  const { context, links, ctaLabel, ctaHref } = useNav(commerceReportId);
  const [open, setOpen] = useState(false);

  return (
    <header
      data-testid="site-nav"
      data-variant={context}
      className={`${sticky ? "sticky top-0 z-50" : ""} border-b border-white/15 bg-[#0a0a0a] text-white`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
        {/* Brand */}
        <Link href="/" data-testid="site-nav-logo" className="flex items-center gap-3 shrink-0">
          <span className="grid h-8 w-8 place-items-center bg-[#ff3b30] font-display text-base leading-none text-white pt-0.5">
            PD
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-[11px] uppercase tracking-[0.25em]">Priority Debater</span>
            {subtitle && (
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{subtitle}</span>
            )}
          </span>
        </Link>

        {/* Center links */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              data-testid={`site-nav-${l.label.split(" ")[0].toLowerCase()}`}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-3 py-2 transition-colors ${
                l.active ? "bg-[#ff3b30] text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: page actions or default CTA */}
        <div className="flex items-center gap-2">
          <CreditBadge />
          <AccountChip />
          {actions ?? (
            <Link
              href={ctaHref}
              data-testid="site-nav-cta"
              className="group hidden items-center gap-2 bg-[#ff3b30] px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black sm:inline-flex"
            >
              {ctaLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center border border-white/20 text-white md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/15 px-5 py-3 md:hidden">
          <nav className="flex flex-col">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`font-mono text-[11px] uppercase tracking-[0.18em] py-2.5 ${
                  l.active ? "text-[#ff3b30]" : "text-white/70"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 bg-[#ff3b30] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white"
            >
              {ctaLabel} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
