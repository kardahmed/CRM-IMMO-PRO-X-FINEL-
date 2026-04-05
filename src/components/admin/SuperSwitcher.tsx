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
  Zap,
  Database,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { triggerDemoSeeding } from "@/app/admin/demo/actions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface ITenantOption {
  id: string;
  name: string;
  workspaceType: string;
}

export function SuperSwitcher() {
  const { isSuperAdmin } = useSupabaseAuth();
  const { isSimulating, tenantId, workspaceType, role, plan, demoBypass, setSimulation, stopSimulation } = useSimulation();
  const [tenants, setTenants] = useState<ITenantOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      getAllTenants().then((res) => {
        if (res.tenants) {
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

  const handleSeed = async () => {
    if (!tenantId) {
      toast.error("Veuillez sélectionner un client d'abord.");
      return;
    }
    setIsSeeding(true);
    try {
      const res = await triggerDemoSeeding(tenantId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.error || "Erreur d'injection");
      }
    } catch (err) {
      toast.error("Une erreur système est survenue.");
    } finally {
      setIsSeeding(false);
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2 animate-in slide-in-from-bottom-5 duration-500">
      {isSimulating && (
        <div className="flex flex-col items-end gap-1.5">
          {demoBypass && (
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 shadow-lg font-black uppercase tracking-wider text-[10px] py-1 px-3 border-none">
              <ShieldCheck className="h-3 w-3 mr-1.5" />
              Full Access Unlocked
            </Badge>
          )}
          <Badge variant="destructive" className="animate-pulse shadow-lg font-bold uppercase tracking-wider text-[10px] py-1 px-3 border-none">
            Simulation Active: {plan || role || "Tenant"}
          </Badge>
        </div>
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
        
        <DropdownMenuContent align="end" className="w-[360px] p-5 rounded-[32px] shadow-stripe-lg border-2 bg-background/95 backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-sm flex items-center gap-2 uppercase italic tracking-tight">
              <Monitor className="h-4 w-4 text-primary" />
              HQ Simulator
            </h3>
            {isSimulating && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={stopSimulation}
                className="text-[10px] uppercase font-black text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
              >
                Reset simulation
              </Button>
            )}
          </div>

          <div className="space-y-5">
            {/* God Mode Section */}
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between group transition-all hover:border-emerald-500/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-500 animate-pulse" />
                  <span className="font-black text-xs uppercase italic text-emerald-600 dark:text-emerald-400">Mode Démo Total</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">Bypass des plans et permissions</p>
              </div>
              <Switch 
                checked={demoBypass} 
                onCheckedChange={(checked) => setSimulation({ demoBypass: checked })}
              />
            </div>

            {/* Seeding Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                Génération de données
              </label>
              <Button
                variant="outline"
                disabled={!tenantId || isSeeding}
                onClick={handleSeed}
                className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 flex gap-2 font-bold group transition-all"
              >
                {isSeeding ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Database className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                )}
                <span className="text-xs uppercase">Injecter Données Démo</span>
              </Button>
            </div>

            <DropdownMenuSeparator className="opacity-30" />

            {/* Tenants Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                Client / Organisation
              </label>
              <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto px-1 pr-2 scrollbar-thin">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSimulation({ tenantId: t.id, workspaceType: t.workspaceType as any })}
                    className={cn(
                      "flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all group",
                      tenantId === t.id 
                        ? "bg-primary text-primary-foreground shadow-lg scale-[1.02]"
                        : "hover:bg-accent border border-transparent hover:border-border"
                    )}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Building2 className={cn("h-4 w-4 shrink-0", tenantId === t.id ? "text-primary-foreground" : "text-primary")} />
                      <span className="text-xs font-black truncate">{t.name}</span>
                    </div>
                    {tenantId === t.id && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Plan Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                  Plan
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {["STARTER", "PRO", "BUSINESS", "ENTERPRISE"].map((p) => (
                    <Button
                      key={p}
                      variant={plan === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSimulation({ plan: p as any })}
                      className={cn(
                        "rounded-lg text-[10px] uppercase font-black h-8 px-2 justify-start border-border",
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
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">
                  Rôle
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {["ADMIN", "SUPERVISOR", "AGENT"].map((r) => (
                    <Button
                      key={r}
                      variant={role === r ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setSimulation({ role: r as any })}
                      className={cn(
                        "rounded-lg text-[10px] uppercase font-black h-8 px-2 justify-start border border-transparent",
                        role === r ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-accent"
                      )}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
