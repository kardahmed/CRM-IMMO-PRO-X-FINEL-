"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { WorkspaceType, UserRole, PlanType } from "@prisma/client";

interface ISimulationState {
  isSimulating: boolean;
  tenantId: string | null;
  workspaceType: WorkspaceType | null;
  role: UserRole | null;
  plan: PlanType | null;
}

interface ISimulationContext extends ISimulationState {
  setSimulation: (data: Partial<Omit<ISimulationState, "isSimulating">>) => void;
  stopSimulation: () => void;
}

const COOKIE_NAMES = {
  TENANT_ID: "x-sim-tenant-id",
  MODE: "x-sim-mode",
  ROLE: "x-sim-role",
  PLAN: "x-sim-plan",
  ACTIVE: "x-sim-active",
};

const SimulationContext = createContext<ISimulationContext | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null;
  return null;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ISimulationState>({
    isSimulating: false,
    tenantId: null,
    workspaceType: null,
    role: null,
    plan: null,
  });

  // Load from cookies on mount
  useEffect(() => {
    const active = getCookie(COOKIE_NAMES.ACTIVE) === "true";
    if (active) {
      setState({
        isSimulating: true,
        tenantId: getCookie(COOKIE_NAMES.TENANT_ID),
        workspaceType: getCookie(COOKIE_NAMES.MODE) as WorkspaceType | null,
        role: getCookie(COOKIE_NAMES.ROLE) as UserRole | null,
        plan: getCookie(COOKIE_NAMES.PLAN) as PlanType | null,
      });
    }
  }, []);

  const setSimulation = useCallback((data: Partial<Omit<ISimulationState, "isSimulating">>) => {
    setState((prev) => {
      const newState = { ...prev, ...data, isSimulating: true };
      
      // Update cookies
      setCookie(COOKIE_NAMES.ACTIVE, "true");
      if (newState.tenantId) setCookie(COOKIE_NAMES.TENANT_ID, newState.tenantId);
      if (newState.workspaceType) setCookie(COOKIE_NAMES.MODE, newState.workspaceType);
      if (newState.role) setCookie(COOKIE_NAMES.ROLE, newState.role);
      if (newState.plan) setCookie(COOKIE_NAMES.PLAN, newState.plan);
      
      return newState;
    });
  }, []);

  const stopSimulation = useCallback(() => {
    setState({
      isSimulating: false,
      tenantId: null,
      workspaceType: null,
      role: null,
      plan: null,
    });
    
    // Clear cookies
    deleteCookie(COOKIE_NAMES.ACTIVE);
    deleteCookie(COOKIE_NAMES.TENANT_ID);
    deleteCookie(COOKIE_NAMES.MODE);
    deleteCookie(COOKIE_NAMES.ROLE);
    deleteCookie(COOKIE_NAMES.PLAN);
  }, []);

  return (
    <SimulationContext.Provider value={{ ...state, setSimulation, stopSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
