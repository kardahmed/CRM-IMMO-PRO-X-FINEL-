"use client";

import React, { useState, useEffect } from "react";
import { useSimulation } from "@/context/simulation-context";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { getAllTenants } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  HardHat,
  Monitor,
  Check,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ITenantOption {
  id: string;
  name: string;
  workspaceType: string;
}

export function SuperSwitcher() {
  const { isSuperAdmin } = useSupabaseAuth();
  const { isSimulating, tenantId, workspaceType, role, plan, setSimulation, stopSimulation } = useSimulation();
  const [tenants, setTenants] = useState<ITenantOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllTenants().then((res) => {
        if (res.tenants) {
          // Adapt type from DB to UI
          const options = res.tenants.map(t => ({
            id: t.id,
            name: t.name,
            workspaceType: t.type
          }));
          setTenants(options);
        }
      });
    }
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return null;

  const activeTenant = tenants.find((t) => t.id === tenantId);

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 animate-in slide-in-from-bottom-5 duration-500">
      {isSimulating && (
        <Badge variant="destructive" className="animate-pulse shadow-lg font-bold uppercase tracking-wider text-xs">
          Simulation Active: {plan || role || "Tenant"}
        </Badge>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger>
          <Button
            variant={isSimulating ? "destructive" : "secondary"}
            size="lg"
            className={cn(
              "h-14 rounded-full shadow-2xl border-2 flex gap-3 px-6 transition-all duration-300",
              isSimulating 
                ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20" 
                : "border-primary/20 hover:border-primary/50"
            )}
          >
            {isSimulating ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            <span className="font-bold uppercase tracking-tight text-xs">
              Switcher HQ
            </span>
            <ChevronUp className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-[340px] p-4 rounded-3xl shadow-stripe-lg border-2 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              HQ Simulator
            </h3>
            {isSimulating && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={stopSimulation}
                className="text-xs uppercase font-bold text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
              >
                Reset
              </Button>
            )}
          </div>

          <DropdownMenuSeparator className="mb-4 opacity-50" />

          {/* Tenants Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                Client / Organisation
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto px-1 pr-2 scrollbar-hide">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSimulation({ tenantId: t.id })}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group",
                      tenantId === t.id 
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "hover:bg-accent border border-transparent hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Building2 className={cn("h-4 w-4 shrink-0", tenantId === t.id ? "text-primary-foreground" : "text-primary")} />
                      <span className="text-xs font-bold truncate">{t.name}</span>
                    </div>
                    {tenantId === t.id && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border/50 my-2" />

            {/* Mode Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                Logiciel Business
              </label>
              <div className="grid grid-cols-2 gap-2 px-1">
                <Button
                  variant={workspaceType === "AGENCY" ? "default" : "outline"}
                  onClick={() => setSimulation({ workspaceType: "AGENCY" })}
                  className="rounded-xl h-16 flex flex-col gap-1 font-bold group border-border"
                >
                  <Building2 className={cn("h-4 w-4", workspaceType === "AGENCY" ? "text-white" : "group-hover:text-primary")} />
                  <span className="text-[10px] uppercase">Agence</span>
                </Button>
                <Button
                  variant={workspaceType === "PROMOTION" ? "default" : "outline"}
                  onClick={() => setSimulation({ workspaceType: "PROMOTION" })}
                  className="rounded-xl h-16 flex flex-col gap-1 font-bold group border-border"
                >
                  <HardHat className={cn("h-4 w-4", workspaceType === "PROMOTION" ? "text-white" : "group-hover:text-primary")} />
                  <span className="text-[10px] uppercase">Promotion</span>
                </Button>
              </div>
            </div>

            {/* Plan Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                Plan de Souscription
              </label>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].map((p) => (
                  <Button
                    key={p}
                    variant={plan === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSimulation({ plan: p as any })}
                    className={cn(
                      "rounded-lg text-[9px] uppercase font-bold h-8 border-border",
                      plan === p ? "bg-primary text-primary-foreground" : "hover:bg-primary/5 hover:text-primary"
                    )}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* Role Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
                Niveau d&apos;Autorité
              </label>
              <div className="flex flex-wrap gap-1.5 px-1">
                {["ADMIN", "SUPERVISOR", "AGENT"].map((r) => (
                  <Button
                    key={r}
                    variant={role === r ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSimulation({ role: r as any })}
                    className={cn(
                      "rounded-lg text-[9px] uppercase font-bold h-7 px-3 border border-transparent",
                      role === r ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-accent"
                    )}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
