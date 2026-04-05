"use client";

import { useEffect, useState, useCallback } from "react";
import { Target, Trophy, Plus, CheckCircle2, AlertTriangle, TrendingUp, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IObjective {
  id: string;
  type: string;
  targetValue: number;
  currentValue: number;
  period: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  assignedTo: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const TYPE_LABELS: Record<string, string> = {
  SALES: "Ventes",
  VISITS: "Visites",
  CALLS: "Appels",
  REVENUE: "CA",
  CLIENTS: "Clients",
};

const PERIOD_LABELS: Record<string, string> = {
  DAILY: "Journalier",
  WEEKLY: "Hebdomadaire",
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  YEARLY: "Annuel",
};

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  return `${s.toLocaleDateString("fr-FR", opts)} - ${e.toLocaleDateString("fr-FR", opts)}`;
}

function getStatus(current: number, target: number): "ACHIEVED" | "ON_TRACK" | "BEHIND" {
  const ratio = target > 0 ? current / target : 0;
  if (ratio >= 1) return "ACHIEVED";
  if (ratio >= 0.5) return "ON_TRACK";
  return "BEHIND";
}

export default function ObjectivesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [objectives, setObjectives] = useState<IObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);

  const [objForm, setObjForm] = useState({
    type: "",
    targetValue: "",
    period: "",
    assignedToId: "",
  });

  const fetchObjectives = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/objectives");
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Erreur lors du chargement");
        return;
      }
      setObjectives(json.data);
    } catch {
      setError("Impossible de contacter le serveur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObjectives();
  }, [fetchObjectives]);

  const handleOpenCreate = async () => {
    setIsModalOpen(true);
    setObjForm({ type: "", targetValue: "", period: "", assignedToId: "" });
    try {
      const res = await fetch("/api/v1/performance");
      const json = await res.json();
      if (json.success) setTeamMembers(json.data.agents ?? json.data ?? []);
    } catch { /* ignore */ }
  };

  const handleSubmitObjective = async () => {
    if (!objForm.type || !objForm.targetValue || !objForm.period || !objForm.assignedToId) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSaving(true);
    try {
      const now = new Date();
      let startDate = now;
      let endDate = new Date(now);
      if (objForm.period === "MONTHLY") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (objForm.period === "QUARTERLY") {
        const q = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), q * 3, 1);
        endDate = new Date(now.getFullYear(), q * 3 + 3, 0);
      } else if (objForm.period === "YEARLY") {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
      }

      const res = await fetch("/api/v1/objectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: objForm.type,
          targetValue: parseFloat(objForm.targetValue),
          period: objForm.period,
          assignedToId: objForm.assignedToId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      toast.success("Objectif cree avec succes");
      setIsModalOpen(false);
      fetchObjectives();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-bold">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  // Build leaderboard from objectives data
  const agentScores = new Map<string, { name: string; role: string; achieved: number; total: number }>();
  for (const obj of objectives) {
    const key = obj.assignedTo.id;
    const existing = agentScores.get(key);
    if (existing) {
      existing.total += 1;
      if (obj.currentValue >= obj.targetValue) existing.achieved += 1;
    } else {
      agentScores.set(key, {
        name: `${obj.assignedTo.firstName} ${obj.assignedTo.lastName}`,
        role: obj.assignedTo.role,
        total: 1,
        achieved: obj.currentValue >= obj.targetValue ? 1 : 0,
      });
    }
  }

  const leaderboard = Array.from(agentScores.values())
    .map((a) => ({
      ...a,
      score: a.total > 0 ? Math.round((a.achieved / a.total) * 100) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Filter objectives by search
  const filtered = objectives.filter((obj) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const typeLabel = TYPE_LABELS[obj.type]?.toLowerCase() ?? obj.type.toLowerCase();
    const assignee = `${obj.assignedTo.firstName} ${obj.assignedTo.lastName}`.toLowerCase();
    return typeLabel.includes(term) || assignee.includes(term);
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Objectifs & Quotas</h1>
            <p className="text-sm text-muted-foreground font-medium">Définissez et suivez les metas des équipes</p>
          </div>
        </div>

        <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Creer un objectif
        </Button>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" /> Nouvel Objectif
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Type de metrique</label>
                  <Select value={objForm.type} onValueChange={(v: string | null) => setObjForm((p) => ({ ...p, type: v ?? "" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALES">Ventes (#)</SelectItem>
                      <SelectItem value="VISITS">Visites (#)</SelectItem>
                      <SelectItem value="REVENUE">Chiffre d&apos;Affaires (DA)</SelectItem>
                      <SelectItem value="CALLS">Appels (#)</SelectItem>
                      <SelectItem value="CLIENTS">Clients (#)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Cible (Valeur)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 5"
                    value={objForm.targetValue}
                    onChange={(e) => setObjForm((p) => ({ ...p, targetValue: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Periode</label>
                <Select value={objForm.period} onValueChange={(v: string | null) => setObjForm((p) => ({ ...p, period: v ?? "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensuel</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestriel</SelectItem>
                    <SelectItem value="YEARLY">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Assigner a</label>
                <Select value={objForm.assignedToId} onValueChange={(v: string | null) => setObjForm((p) => ({ ...p, assignedToId: v ?? "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.firstName} {m.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 font-bold" onClick={handleSubmitObjective} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder l&apos;objectif
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Filters */}
          <div className="flex items-center gap-2 mb-2 bg-card p-2 rounded-xl border relative">
             <Search className="h-4 w-4 text-muted-foreground absolute left-4" />
             <Input
               placeholder="Rechercher un objectif..."
               className="border-0 bg-transparent pl-8 focus-visible:ring-0 shadow-none"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Target className="h-10 w-10 mb-3 opacity-40" />
              <p className="font-bold">Aucun objectif trouvé</p>
              <p className="text-sm mt-1">Créez votre premier objectif pour commencer le suivi.</p>
            </div>
          ) : (
            filtered.map((obj) => {
              const isCa = obj.type === "REVENUE";
              const ratio = obj.targetValue > 0
                ? Math.min(100, Math.round((obj.currentValue / obj.targetValue) * 100))
                : 0;
              const progressColor = ratio >= 100 ? "bg-green-500" : ratio >= 50 ? "bg-purple-500" : "bg-red-500";
              const status = getStatus(obj.currentValue, obj.targetValue);

              return (
                <Card key={obj.id} className="overflow-hidden hover:border-purple-200 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                            {TYPE_LABELS[obj.type] ?? obj.type}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-black bg-accent">
                            {PERIOD_LABELS[obj.period] ?? obj.period}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-black bg-accent">
                            {formatDateRange(obj.startDate, obj.endDate)}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-black">
                          {TYPE_LABELS[obj.type] ?? obj.type} — {PERIOD_LABELS[obj.period] ?? obj.period}
                        </h3>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                          Assigné à : <span className="text-foreground font-bold">{obj.assignedTo.firstName} {obj.assignedTo.lastName}</span>
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        {status === "ACHIEVED" && (
                          <Badge className="bg-green-100 text-green-700 bg-opacity-100 uppercase font-black text-xs gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Atteint
                          </Badge>
                        )}
                        {status === "BEHIND" && (
                          <Badge className="bg-red-100 text-red-700 bg-opacity-100 uppercase font-black text-xs gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> En retard
                          </Badge>
                        )}
                        {status === "ON_TRACK" && (
                          <Badge className="bg-purple-100 text-purple-700 bg-opacity-100 uppercase font-black text-xs gap-1">
                            <TrendingUp className="h-3.5 w-3.5" /> En cours
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-black">
                          {isCa ? new Intl.NumberFormat("fr-DZ", { notation: "compact" }).format(obj.currentValue) : obj.currentValue}
                          <span className="text-base text-muted-foreground font-bold ml-1">
                            / {isCa ? new Intl.NumberFormat("fr-DZ", { notation: "compact" }).format(obj.targetValue) + " DA" : obj.targetValue}
                          </span>
                        </span>
                        <span className="text-sm font-black text-muted-foreground">{ratio}%</span>
                      </div>
                      <Progress value={ratio} className={`h-2.5 bg-neutral-100 dark:bg-neutral-800 [&_[data-slot=progress-indicator]]:${progressColor}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-neutral-900 dark:to-neutral-950 border-amber-200/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Leaderboard Agents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">Aucun agent avec des objectifs assignés</p>
              ) : (
                leaderboard.map((l, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-black border shadow-sm relative overflow-hidden">
                    {i === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                    {i === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-zinc-300" />}
                    {i === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-700" />}

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-black text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{l.name}</p>
                        <p className="text-[10px] uppercase font-black text-muted-foreground">{l.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg">{l.score}</p>
                      <p className="text-[10px] font-bold text-muted-foreground">
                        {l.achieved}/{l.total} atteints
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
