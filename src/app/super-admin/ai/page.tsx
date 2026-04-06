"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Key, RefreshCw, BarChart2, Zap, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

interface AIUsageEntry {
  tenantId: string;
  workspace: string;
  plan: string;
  generations: number;
}

interface AIUsageData {
  usage: AIUsageEntry[];
  totalGenerations: number;
  thisMonthGenerations: number;
}

export default function SuperAdminAI() {
  const [apiKey, setApiKey] = useState("");
  const [data, setData] = useState<AIUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/v1/admin/ai-usage");
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Erreur lors du chargement");
          return;
        }
        setData(json.data);
      } catch {
        setError("Impossible de contacter le serveur");
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Moteur IA IMMO PRO-X
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Supervisez la consommation globale des API LLM (Anthropic/OpenAI) par vos locataires.</p>
      </div>

      {/* Summary stats */}
      {!loading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Generations</p>
                  <p className="text-2xl font-black text-foreground">{new Intl.NumberFormat().format(data.totalGenerations)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ce mois-ci</p>
                  <p className="text-2xl font-black text-foreground">{new Intl.NumberFormat().format(data.thisMonthGenerations)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <BarChart2 className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspaces actifs</p>
                  <p className="text-2xl font-black text-foreground">{data.usage.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Keys config */}
        <Card className="lg:col-span-1 bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
               <Key className="h-4 w-4 text-emerald-400" /> API Keys Master
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Cles globales utilisees pour provisionner tous les Workspaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Anthropic API Key</label>
              <div className="flex gap-2">
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-api03-..." className="bg-background border-border text-foreground focus:border-indigo-500" />
                <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modele par defaut</label>
              <Input disabled value="claude-3-opus-20240229" className="bg-background opacity-50 border-border text-foreground" />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-primary-foreground font-bold mt-4">
              Mettre a jour la cle
            </Button>
          </CardContent>
        </Card>

        {/* Global Usage table */}
        <Card className="lg:col-span-2 bg-card/50 border-border backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
               <BarChart2 className="h-4 w-4 text-cyan-400" /> Consommation par Workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                    <div className="h-4 bg-muted rounded w-1/6" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            ) : !data || data.usage.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune utilisation IA</p>
                <p className="text-muted-foreground text-xs mt-1">Les generations IA apparaitront ici une fois utilisees par vos workspaces.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-background/50 border-y border-border">
                    <tr>
                      <th className="px-4 py-3 font-bold">Workspace</th>
                      <th className="px-4 py-3 font-bold">Plan</th>
                      <th className="px-4 py-3 font-bold">Generations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.usage.map((entry) => (
                      <tr key={entry.tenantId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-4 font-bold text-foreground">{entry.workspace}</td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="border-border text-muted-foreground uppercase text-xs">
                            {entry.plan}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 font-mono text-muted-foreground">
                          {new Intl.NumberFormat().format(entry.generations)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
