"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span>Priority Debater</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/validate" className="text-slate-600 hover:text-slate-900 font-medium">
            Validate
          </Link>
        </nav>
      </div>
    </header>
  );
}
