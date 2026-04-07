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
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <header className="flex flex-col gap-3 pb-6 border-b border-border/50">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] w-fit">
          <Sparkles className="h-3.5 w-3.5" /> Intelligence Artificielle
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">
          Moteur IA <span className="text-muted-foreground text-2xl">IMMO PRO-X</span>
        </h1>
        <p className="text-sm text-muted-foreground">Supervisez la consommation globale des API LLM (Anthropic/OpenAI) par vos locataires.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys config */}
        <Card className="lg:col-span-1 bg-card border-border shadow-stripe rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
               <Key className="h-4 w-4 text-emerald-500" /> API Keys Master
            </CardTitle>
            <CardDescription>
              Cles globales utilisees pour provisionner tous les Workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Anthropic API Key</label>
              <div className="flex gap-2">
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="bg-background border-border focus:border-primary" />
                <Button variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modele par defaut</label>
              <Input disabled value="claude-opus-4-6" className="bg-muted border-border opacity-60" />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold mt-4 rounded-2xl">
              Mettre a jour la cle
            </Button>
          </CardContent>
        </Card>

        {/* Global Usage table */}
        <Card className="lg:col-span-2 bg-card border-border shadow-stripe rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
               <BarChart2 className="h-4 w-4 text-primary" /> Consommation par Workspaces (Mois en cours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-accent/50 border-y border-border">
                  <tr>
                    <th className="px-4 py-3 font-bold">Workspace</th>
                    <th className="px-4 py-3 font-bold">Consommation (Tokens)</th>
                    <th className="px-4 py-3 font-bold">Cout Estime</th>
                    <th className="px-4 py-3 font-bold">Etat Quota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MOCK_AI_USAGE.map((usage, idx) => {
                    const ratio = usage.tokens / usage.limit;
                    let badge = <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none uppercase text-[10px]">Normal</Badge>;
                    if (ratio > 0.8) badge = <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none uppercase text-[10px]">Warning</Badge>;
                    if (ratio >= 1) badge = <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none uppercase text-[10px]">Depassement</Badge>;

                    return (
                      <tr key={idx} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-4 font-bold text-foreground">{usage.workspace}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             <div className="w-16 bg-muted rounded-full h-1.5 hidden sm:block">
                               <div className={`h-1.5 rounded-full ${ratio >= 1 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }}></div>
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
