"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ShellContextValue = {
  expanded: boolean;
  mobileOpen: boolean;
  toggleExpanded: () => void;
  openMobile: () => void;
  closeMobile: () => void;
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleExpanded = useCallback(() => setExpanded((value) => !value), []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo(
    () => ({
      expanded,
      mobileOpen,
      toggleExpanded,
      openMobile,
      closeMobile,
    }),
    [expanded, mobileOpen, toggleExpanded, openMobile, closeMobile]
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error("useShell must be used within ShellProvider");
  return context;
}
