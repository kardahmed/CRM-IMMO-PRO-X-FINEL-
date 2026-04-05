"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Key, RefreshCw, BarChart2 } from "lucide-react";
import { useState } from "react";

const MOCK_AI_USAGE = [
  { workspace: "Premium Immobilier", tokens: 45000, limit: 100000, cost: "0.45 $" },
  { workspace: "Horizon Promotion", tokens: 82000, limit: 50000, cost: "0.82 $" },
  { workspace: "Agence du Centre", tokens: 1200, limit: 10000, cost: "0.01 $" },
];

export default function SuperAdminAI() {
  const [apiKey, setApiKey] = useState("sk-ant-api03-P*********************");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Moteur IA IMMO PRO-X
        </h1>
        <p className="text-sm text-neutral-400 mt-1">Supervisez la consommation globale des API LLM (Anthropic/OpenAI) par vos locataires.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys config */}
        <Card className="lg:col-span-1 bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
               <Key className="h-4 w-4 text-emerald-400" /> API Keys Master
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Clés globales utilisées pour provisionner tous les Workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Anthropic API Key</label>
              <div className="flex gap-2">
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-neutral-950 border-neutral-800 text-white focus:border-indigo-500" />
                <Button variant="outline" className="border-neutral-800 text-white hover:bg-neutral-800">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Modèle par défaut</label>
              <Input disabled value="claude-3-opus-20240229" className="bg-neutral-950 opacity-50 border-neutral-800 text-white" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold mt-4">
              Mettre à jour la clé
            </Button>
          </CardContent>
        </Card>

        {/* Global Usage table */}
        <Card className="lg:col-span-2 bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
               <BarChart2 className="h-4 w-4 text-cyan-400" /> Consommation par Workspaces (Mois en cours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-400 uppercase bg-neutral-950/50 border-y border-neutral-800">
                  <tr>
                    <th className="px-4 py-3 font-bold">Workspace</th>
                    <th className="px-4 py-3 font-bold">Consommation (Tokens)</th>
                    <th className="px-4 py-3 font-bold">Coût Estimé</th>
                    <th className="px-4 py-3 font-bold">État Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {MOCK_AI_USAGE.map((usage, idx) => {
                    const ratio = usage.tokens / usage.limit;
                    let badge = <Badge className="bg-emerald-500/10 text-emerald-400 border-none uppercase text-[10px]">Normal</Badge>;
                    if (ratio > 0.8) badge = <Badge className="bg-amber-500/10 text-amber-400 border-none uppercase text-[10px]">Warning</Badge>;
                    if (ratio >= 1) badge = <Badge className="bg-rose-500/10 text-rose-400 border-none uppercase text-[10px]">Dépassement</Badge>;

                    return (
                      <tr key={idx} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="px-4 py-4 font-bold text-white">{usage.workspace}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-16 bg-neutral-800 rounded-full h-1.5 hidden sm:block">
                               <div className={`h-1.5 rounded-full ${ratio >= 1 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
                             </div>
                             <span className="text-neutral-300 font-mono text-xs">{new Intl.NumberFormat().format(usage.tokens)} / {new Intl.NumberFormat().format(usage.limit)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-neutral-400">{usage.cost}</td>
                        <td className="px-4 py-4">{badge}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
