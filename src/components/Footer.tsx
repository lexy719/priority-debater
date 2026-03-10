"use client";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 py-6 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-400">
        Built by{" "}
        <a
          href="https://manuelfernandes.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-slate-900 font-medium"
        >
          Manuel Gonçalves
        </a>
      </div>
    </footer>
  );
}
