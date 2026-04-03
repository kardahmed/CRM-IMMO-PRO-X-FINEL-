"use client";

import { useState } from "react";
import { Target, Trophy, Plus, CheckCircle2, AlertTriangle, TrendingUp, Search } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// MOCKS
const OBJECTIVES = [
  { id: "1", title: "Objectif Trimestre 1", type: "VENTES", target: 15, current: 12, period: "Jan - Mar 2026", agent: "Équipe A", status: "ON_TRACK" },
  { id: "2", title: "Visites mensuelles", type: "VISITES", target: 120, current: 45, period: "Avril 2026", agent: "Tous", status: "BEHIND" },
  { id: "3", title: "Chiffre d'Affaires T1", type: "CA", target: 450000000, current: 520000000, period: "Jan - Mar 2026", agent: "Global", status: "ACHIEVED" },
  { id: "4", title: "Appels de prospection", type: "APPELS", target: 500, current: 300, period: "Avril 2026", agent: "Équipe Junior", status: "ON_TRACK" },
];

const LEADERBOARD = [
  { agent: "Karim B.", score: 98, role: "Senior Agent", trend: "+12%" },
  { agent: "Amira H.", score: 85, role: "Agent", trend: "+5%" },
  { junior: true, agent: "Lucas M.", score: 65, role: "Junior", trend: "-2%" },
];

export default function ObjectivesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md">
              <Plus className="h-4 w-4 mr-1.5" /> Créer un objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" /> Nouvel Objectif
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Titre de l'objectif</label>
                <Input placeholder="Ex: Clôturer 5 ventes ce mois-ci" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Type de métrique</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ventes">Ventes (#)</SelectItem>
                      <SelectItem value="visites">Visites (#)</SelectItem>
                      <SelectItem value="ca">Chiffre d'Affaires (DA)</SelectItem>
                      <SelectItem value="appels">Appels (#)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Cible (Valeur)</label>
                  <Input type="number" placeholder="Ex: 5" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Assignation</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Global, Équipe ou Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Objectif Global (Toute l'agence)</SelectItem>
                    <SelectItem value="team-a">Équipe A</SelectItem>
                    <SelectItem value="agent-1">Karim B. (Individuel)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Période</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mois en cours (Avril)</SelectItem>
                    <SelectItem value="q2">Trimestre 2</SelectItem>
                    <SelectItem value="annual">Année 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 font-bold" onClick={() => setIsModalOpen(false)}>
              Sauvegarder l'objectif
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
             <Input placeholder="Rechercher un objectif..." className="border-0 bg-transparent pl-8 focus-visible:ring-0 shadow-none" />
             <Button variant="secondary" size="sm" className="font-bold text-xs uppercase px-4 rounded-lg">Tous</Button>
             <Button variant="ghost" size="sm" className="font-bold text-xs uppercase text-muted-foreground px-4 rounded-lg">Mois</Button>
             <Button variant="ghost" size="sm" className="font-bold text-xs uppercase text-muted-foreground px-4 rounded-lg">Trimestre</Button>
          </div>

          {OBJECTIVES.map((obj) => {
            const isCa = obj.type === "CA";
            const ratio = Math.min(100, Math.round((obj.current / obj.target) * 100));
            const progressColor = ratio >= 100 ? "bg-green-500" : ratio >= 50 ? "bg-purple-500" : "bg-red-500";

            return (
              <Card key={obj.id} className="overflow-hidden hover:border-purple-200 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                          {obj.type}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] uppercase font-black bg-accent">
                          {obj.period}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-black">{obj.title}</h3>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                        Assigné à : <span className="text-foreground font-bold">{obj.agent}</span>
                      </p>
                    </div>
                    
                    <div className="text-left md:text-right">
                      {obj.status === "ACHIEVED" && (
                        <Badge className="bg-green-100 text-green-700 bg-opacity-100 uppercase font-black text-xs gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Atteint
                        </Badge>
                      )}
                      {obj.status === "BEHIND" && (
                        <Badge className="bg-red-100 text-red-700 bg-opacity-100 uppercase font-black text-xs gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> En retard
                        </Badge>
                      )}
                      {obj.status === "ON_TRACK" && (
                        <Badge className="bg-purple-100 text-purple-700 bg-opacity-100 uppercase font-black text-xs gap-1">
                          <TrendingUp className="h-3.5 w-3.5" /> En cours
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black">
                        {isCa ? new Intl.NumberFormat("fr-DZ", { notation: "compact" }).format(obj.current) : obj.current}
                        <span className="text-base text-muted-foreground font-bold ml-1">
                          / {isCa ? new Intl.NumberFormat("fr-DZ", { notation: "compact" }).format(obj.target) + " DA" : obj.target}
                        </span>
                      </span>
                      <span className="text-sm font-black text-muted-foreground">{ratio}%</span>
                    </div>
                    <Progress value={ratio} className={`h-2.5 bg-neutral-100 dark:bg-neutral-800 [&_[data-slot=progress-indicator]]:${progressColor}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              {LEADERBOARD.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-black border shadow-sm relative overflow-hidden">
                  {i === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                  {i === 1 && <div className="absolute top-0 left-0 w-1 h-full bg-zinc-300" />}
                  {i === 2 && <div className="absolute top-0 left-0 w-1 h-full bg-amber-700" />}
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-black text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{l.agent}</p>
                      <p className="text-[10px] uppercase font-black text-muted-foreground">{l.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg">{l.score}</p>
                    <p className={`text-[10px] font-bold ${l.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {l.trend}
                    </p>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full text-xs font-bold uppercase mt-2">
                Voir le classement complet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
