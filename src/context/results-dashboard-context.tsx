"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { buildDashboardViewModel, type DashboardViewModel } from "@/lib/dashboard-view-model";
import type { ValidationSession } from "@/lib/types";

const DEFAULT_VM = buildDashboardViewModel(null);

const ResultsDashboardContext = createContext<DashboardViewModel>(DEFAULT_VM);

export function ResultsDashboardProvider({
  session,
  children,
}: {
  session: ValidationSession | null;
  children: ReactNode;
}) {
  const value = useMemo(() => buildDashboardViewModel(session), [session]);
  return <ResultsDashboardContext.Provider value={value}>{children}</ResultsDashboardContext.Provider>;
}

export function useResultsDashboard(): DashboardViewModel {
  return useContext(ResultsDashboardContext);
}
