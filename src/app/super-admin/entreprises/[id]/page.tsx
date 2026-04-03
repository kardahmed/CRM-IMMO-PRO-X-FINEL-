"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Save, Rocket, Ban, ShieldAlert, Sparkles, HardDrive, Users, Activity } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function WorkspaceDetailPanel() {
  const params = useParams();
  const id = params.id as string;
  
  // MOCK DATA based on the id
  const [tenant, setTenant] = useState({
    id: id,
    name: "Premium Immobilier",
    plan: "ENTERPRISE",
    status: "ACTIVE",
    settings: {
      maxAgents: 15,
      aiTokenLimit: 100000,
      maxStorageGb: 50,
      modules: {
        crm: true,
        ai: true,
        billing: true,
        automation: true
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/super-admin/entreprises" className="text-neutral-500 hover:text-white transition-colors text-sm font-bold">
              ← Retour
            </Link>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black uppercase text-[10px]">
              {tenant.status}
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black uppercase text-[10px]">
              {tenant.plan}
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            {tenant.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10 gap-2 font-bold">
            <Ban className="h-4 w-4" /> Suspendre
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2">
            <Save className="h-4 w-4" /> Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche : Paramètres & Limites */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <ShieldAlert className="h-5 w-5 text-indigo-400" />
                Limites & Quotas (Settings JSON)
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Configurez les limites techniques imposées par le Plan choisi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-neutral-300 font-bold flex items-center gap-2">
                    <Users className="h-4 w-4 text-neutral-500" />
                    Utilisateurs autorisés (Max)
                  </Label>
                  <Input 
                    type="number" 
                    className="bg-neutral-950 border-neutral-800 text-white" 
                    value={tenant.settings.maxAgents}
                    onChange={(e) => setTenant({...tenant, settings: {...tenant.settings, maxAgents: parseInt(e.target.value)}})}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-neutral-300 font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Quota IA Mensuel (Tokens)
                  </Label>
                  <Input 
                    type="number" 
                    className="bg-neutral-950 border-neutral-800 text-white" 
                    value={tenant.settings.aiTokenLimit}
                    onChange={(e) => setTenant({...tenant, settings: {...tenant.settings, aiTokenLimit: parseInt(e.target.value)}})}
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Estimé : ~{Math.round(tenant.settings.aiTokenLimit / 1000)} requêtes</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-neutral-300 font-bold flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-neutral-500" />
                    Stockage autorisé (Go)
                  </Label>
                  <Input 
                    type="number" 
                    className="bg-neutral-950 border-neutral-800 text-white" 
                    value={tenant.settings.maxStorageGb}
                    onChange={(e) => setTenant({...tenant, settings: {...tenant.settings, maxStorageGb: parseInt(e.target.value)}})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Rocket className="h-5 w-5 text-cyan-400" />
                Modules Optionnels (ON/OFF)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-1 divide-y divide-neutral-800/50">
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold text-white">Moteur d'Intelligence Artificielle</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Génération de résumés, analyse de sentiments.</p>
                  </div>
                  <Switch 
                    checked={tenant.settings.modules.ai} 
                    onCheckedChange={(c: boolean) => setTenant({...tenant, settings: {...tenant.settings, modules: {...tenant.settings.modules, ai: c}}})} 
                    className="data-[state=checked]:bg-indigo-500" 
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold text-white">Facturation Avancée</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Échéanciers, rappels paiements, acomptes.</p>
                  </div>
                  <Switch 
                    checked={tenant.settings.modules.billing} 
                    onCheckedChange={(c: boolean) => setTenant({...tenant, settings: {...tenant.settings, modules: {...tenant.settings.modules, billing: c}}})} 
                    className="data-[state=checked]:bg-indigo-500" 
                  />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold text-white">Automatisations (Workflows)</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Scénarios déclenchables sur le pipeline lead.</p>
                  </div>
                  <Switch 
                    checked={tenant.settings.modules.automation} 
                    onCheckedChange={(c: boolean) => setTenant({...tenant, settings: {...tenant.settings, modules: {...tenant.settings.modules, automation: c}}})} 
                    className="data-[state=checked]:bg-indigo-500" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Droite : Stats */}
        <div className="space-y-6">
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-emerald-400" />
                Utilisation Actuelle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Agents actifs</span>
                  <span className="text-white font-bold">14 / {tenant.settings.maxAgents}</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(14 / tenant.settings.maxAgents) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Tokens IA</span>
                  <span className="text-white font-bold">45K / {Math.round(tenant.settings.aiTokenLimit / 1000)}K</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full w-[45%]"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Stockage Giga</span>
                  <span className="text-white font-bold">4.2 / {tenant.settings.maxStorageGb} Go</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full w-[8%]"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
