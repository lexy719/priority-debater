"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/validate", label: "Validate" },
    { href: "/validate?mode=generate", label: "Generate" },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span>Priority Debater</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href || (link.href.includes("?") && pathname + "?" + (typeof window !== "undefined" ? window.location.search.slice(1) : "") === link.href)
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            href="/validate"
            className="ml-1 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile controls */}
        <div className="sm:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/validate"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium text-center mt-2"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
