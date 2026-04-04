"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

interface SidebarContextType {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMobile = useCallback(() => setIsMobileOpen((v) => !v), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);
  const toggleCollapse = useCallback(() => setIsCollapsed((v) => !v), []);

  // Close mobile sidebar on route change (resize)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isMobileOpen, isCollapsed, toggleMobile, closeMobile, toggleCollapse }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
