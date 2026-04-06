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
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Moteur IA IMMO PRO-X
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Supervisez la consommation globale des API LLM (Anthropic/OpenAI) par vos locataires.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys config */}
        <Card className="lg:col-span-1 bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
               <Key className="h-4 w-4 text-emerald-400" /> API Keys Master
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Clés globales utilisées pour provisionner tous les Workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Anthropic API Key</label>
              <div className="flex gap-2">
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-background border-border text-foreground focus:border-indigo-500" />
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modèle par défaut</label>
              <Input disabled value="claude-3-opus-20240229" className="bg-background opacity-50 border-border text-foreground" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-primary-foreground font-bold mt-4">
              Mettre à jour la clé
            </Button>
          </CardContent>
        </Card>

        {/* Global Usage table */}
        <Card className="lg:col-span-2 bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
               <BarChart2 className="h-4 w-4 text-cyan-400" /> Consommation par Workspaces (Mois en cours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3 font-bold">Workspace</th>
                    <th className="px-4 py-3 font-bold">Consommation (Tokens)</th>
                    <th className="px-4 py-3 font-bold">Coût Estimé</th>
                    <th className="px-4 py-3 font-bold">État Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_AI_USAGE.map((usage, idx) => {
                    const ratio = usage.tokens / usage.limit;
                    let badge = <Badge className="bg-emerald-500/10 text-emerald-400 border-none uppercase text-xs">Normal</Badge>;
                    if (ratio > 0.8) badge = <Badge className="bg-amber-500/10 text-amber-400 border-none uppercase text-xs">Warning</Badge>;
                    if (ratio >= 1) badge = <Badge className="bg-rose-500/10 text-rose-400 border-none uppercase text-xs">Dépassement</Badge>;

                    return (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4 font-bold text-foreground">{usage.workspace}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-16 bg-muted rounded-full h-1.5 hidden sm:block">
                               <div className={`h-1.5 rounded-full ${ratio >= 1 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
                             </div>
                             <span className="text-muted-foreground font-mono text-xs">{new Intl.NumberFormat().format(usage.tokens)} / {new Intl.NumberFormat().format(usage.limit)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-muted-foreground">{usage.cost}</td>
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
