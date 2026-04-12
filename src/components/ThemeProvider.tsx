"use client";

/**
 * Dark theme only — `data-theme="dark"` is set on `<html>` in root layout.
 * This wrapper remains so existing imports keep working without a larger refactor.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
