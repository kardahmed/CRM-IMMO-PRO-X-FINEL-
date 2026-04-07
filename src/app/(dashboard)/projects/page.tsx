"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FolderKanban, Loader2, AlertCircle, Plus, RefreshCcw, Search, LayoutGrid, List } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  address: string | null;
  wilaya: string | null;
  commune: string | null;
  status: string;
  progressPercentage: number;
  deliveryDate: string | null;
  createdAt: string;
  properties?: Array<{
    id: string;
    status?: string;
  }>;
}

const KPIItem = ({ icon: Icon, label, value, color = "neutral" }: { icon: React.ComponentType<{ className?: string }>, label: string, value: number | string, highlight?: boolean, color?: string }) => {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    neutral: { bg: "bg-card", text: "text-foreground", iconBg: "bg-accent/50 text-foreground" },
    emerald: { bg: "bg-card", text: "text-emerald-600", iconBg: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" },
    amber: { bg: "bg-card", text: "text-amber-600", iconBg: "bg-amber-50 dark:bg-amber-900/20 text-amber-600" },
    blue: { bg: "bg-card", text: "text-blue-600", iconBg: "bg-blue-50 dark:bg-blue-900/20 text-blue-600" },
    red: { bg: "bg-card", text: "text-rose-600", iconBg: "bg-rose-50 dark:bg-rose-900/20 text-rose-600" },
    indigo: { bg: "bg-card", text: "text-indigo-600", iconBg: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" },
  };
  const c = colorMap[color] || colorMap.neutral;

  return (
    <Card className={cn("relative overflow-hidden border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 rounded-[24px] group", c.bg)}>
      <div className="p-5 flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", c.iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">{label}</p>
          <p className={cn("text-2xl font-black tracking-tighter tabular-nums", c.text)}>{value}</p>
        </div>
      </div>
    </Card>
  );
};

const ValueCard = ({ label, value, Icon, color }: { label: string, value: string, Icon: React.ComponentType<{ className?: string }>, color: string }) => (
  <Card className="relative overflow-hidden border-border shadow-stripe hover:shadow-stripe-lg transition-all duration-500 rounded-[24px] group">
    <div className="p-6 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tighter text-foreground">{value}</p>
      </div>
      <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", color)}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </Card>
);

import { Building2, Home, Package, CheckCircle2, Clock, Ban, Wallet, TrendingUp } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<Array<{ id: string; status: string; type: string; name: string; price: number | null; surface: number | null; rooms: number | null; floor: number | null; projectId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    address: "",
    wilaya: "",
    commune: "",
    status: "PLANNING",
  });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/v1/projects?limit=100");
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      setProjects(json.data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      if (selectedProjectId === "all") setLoading(false);
    }
  }, [selectedProjectId]);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = selectedProjectId === "all"
        ? "/api/v1/properties?limit=100"
        : `/api/v1/properties?projectId=${selectedProjectId}&limit=100`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur inconnue");
      setProperties(json.properties);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des unites");
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
    fetchProperties();
  }, [fetchProjects, fetchProperties]);

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectForm.name,
          address: projectForm.address || null,
          wilaya: projectForm.wilaya || null,
          commune: projectForm.commune || null,
          status: projectForm.status,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      toast.success("Projet cree avec succes");
      setIsCreateOpen(false);
      setProjectForm({ name: "", address: "", wilaya: "", commune: "", status: "PLANNING" });
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Building2 className="h-3.5 w-3.5" /> Stock Immobilier
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            Projets Immobiliers
            <Badge variant="outline" className="font-black border-primary/20 text-primary bg-primary/5 text-xs">
              {projects.length} projets
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Gerez vos programmes immobiliers et suivez les ventes en temps reel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => { fetchProjects(); fetchProperties(); }}
            disabled={loading}
            className="h-12 w-12 rounded-2xl border-border bg-card shadow-stripe hover:shadow-stripe-lg active:scale-95 transition-all"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <TabsList className="bg-transparent p-0 gap-2 h-auto flex-wrap">
            <TabsTrigger
              value="projects"
              className="rounded-full px-6 py-2.5 border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-stripe font-bold transition-all text-xs"
            >
              <Building2 className="h-3.5 w-3.5 mr-2" /> Projets
              <span className="ml-2 bg-accent text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-black">{projects.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="rounded-full px-6 py-2.5 border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-stripe font-bold transition-all text-xs"
            >
              <Home className="h-3.5 w-3.5 mr-2" /> Unites
              <span className="ml-2 bg-accent text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-black">{properties.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="m-0 mt-0">
             <div className="flex items-center gap-2">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 text-xs font-black uppercase h-10 shadow-stripe rounded-2xl"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nouveau Projet
                </Button>
             </div>
          </TabsContent>

          <TabsContent value="units" className="m-0 mt-0">
             <div className="flex items-center gap-2">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 text-xs font-black uppercase h-10 shadow-stripe rounded-2xl"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nouvelle Unite
                </Button>
             </div>
          </TabsContent>
        </div>

        <TabsContent value="projects" className="space-y-6 outline-none">
          {/* Projects KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KPIItem icon={Building2} label="Total Projets" value={projects.length} color="indigo" />
            <KPIItem icon={TrendingUp} label="Actifs" value={projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length} color="emerald" />
            <KPIItem icon={Package} label="Unites" value={properties.length} color="blue" />
            <KPIItem icon={CheckCircle2} label="Vendues" value={properties.filter(p => p.status === 'SOLD').length} color="emerald" />
            <KPIItem icon={Clock} label="Reservees" value={properties.filter(p => p.status === 'RESERVED').length} color="amber" />
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1 max-w-sm group">
                <div className="absolute -inset-0.5 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 rounded-2xl transition-opacity duration-500" />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un projet..." className="relative pl-10 h-11 rounded-xl border-border bg-card shadow-stripe focus:shadow-stripe-lg transition-all" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] h-11 rounded-xl border-border bg-card shadow-sm">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PLANNING">Planification</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                  <SelectItem value="DELIVERED">Livre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 rounded-[24px] bg-card border border-border animate-pulse" />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-8 rounded-[32px] bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-stripe text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <p className="text-lg font-black text-foreground tracking-tight">{error}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => { fetchProjects(); fetchProperties(); }}
                className="h-12 px-8 rounded-full font-bold"
              >
                Reessayer
              </Button>
            </div>
          )}

          {/* Project List */}
          {!loading && !error && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  location={[project.commune, project.wilaya].filter(Boolean).join(", ") || project.address || "Non renseigne"}
                  availableUnits={project.properties?.filter(p => !p.status || p.status === "AVAILABLE").length ?? 0}
                  totalUnits={project.properties?.length ?? 0}
                  progress={project.progressPercentage}
                  status={project.status}
                  imageUrl={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80`}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-8 rounded-[32px] bg-card border border-border shadow-stripe text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-lg font-black text-foreground tracking-tight">Aucun projet</p>
                <p className="text-sm text-muted-foreground mt-1">Commencez par creer votre premier projet immobilier</p>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl px-8"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Nouveau Projet
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-6 outline-none">
          {/* Selected Project Header */}
          {selectedProjectId !== "all" && projects.find(p => p.id === selectedProjectId) && (
            <Card className="p-4 rounded-[24px] border-border shadow-stripe flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl overflow-hidden relative border border-border">
                     <Image src={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=80`} fill alt="Project" className="object-cover" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                        {projects.find(p => p.id === selectedProjectId)?.name}
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[8px] font-bold uppercase">Active</Badge>
                     </h3>
                     <p className="text-[10px] text-muted-foreground font-medium">Projet selectionne</p>
                  </div>
               </div>
               <div className="flex items-center gap-8">
                  <div className="text-center">
                     <p className="text-xs font-black text-foreground">{properties.length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">TOTAL</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-black text-emerald-600">{properties.filter(p => !p.status || p.status === 'AVAILABLE').length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">DISPO</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-black text-amber-600">{properties.filter(p => p.status === 'RESERVED').length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">RESERVEES</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-black text-blue-600">{properties.filter(p => p.status === 'SOLD').length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">VENDUES</p>
                  </div>
                  <Button variant="ghost" className="text-[10px] font-black uppercase h-8" onClick={() => setSelectedProjectId("all")}>Changer</Button>
               </div>
            </Card>
          )}

          {/* Units KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KPIItem icon={Package} label="TOTAL UNITES" value={properties.length} color="indigo" />
            <KPIItem icon={CheckCircle2} label="DISPONIBLES" value={properties.filter(p => !p.status || p.status === 'AVAILABLE').length} color="emerald" />
            <KPIItem icon={Clock} label="RESERVEES" value={properties.filter(p => p.status === 'RESERVED').length} color="amber" />
            <KPIItem icon={Wallet} label="VENDUES" value={properties.filter(p => p.status === 'SOLD').length} color="blue" />
            <KPIItem icon={Ban} label="BLOQUEES" value={properties.filter(p => p.status === 'BLOCKED').length} color="red" />
          </div>

          {/* Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValueCard label="VALEUR TOTALE" value={`${(properties.reduce((acc, p) => acc + (p.price || 0), 0) / 1000000000).toFixed(2)} Md DA`} Icon={Wallet} color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
            <ValueCard label="VALEUR VENDUE" value={`${(properties.filter(p => p.status === 'SOLD').reduce((acc, p) => acc + (p.price || 0), 0) / 1000000).toFixed(1)} M DA`} Icon={TrendingUp} color="bg-blue-50 dark:bg-blue-900/20 text-blue-600" />
          </div>

          {/* Sales Progression */}
          <Card className="p-5 rounded-[24px] border-border shadow-stripe space-y-3">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 font-bold text-xs">Vendues {properties.filter(p => p.status === 'SOLD').length}</Badge>
              <Badge variant="outline" className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 font-bold text-xs">Reservees {properties.filter(p => p.status === 'RESERVED').length}</Badge>
              <Badge variant="outline" className="text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 font-bold text-xs">Bloquees {properties.filter(p => p.status === 'BLOCKED').length}</Badge>
              <Badge variant="outline" className="text-muted-foreground bg-accent/50 border-border font-bold text-xs">Disponibles {properties.filter(p => !p.status || p.status === 'AVAILABLE').length}</Badge>
            </div>
            <div className="relative pt-4">
               <div className="h-2.5 w-full bg-accent rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${(properties.filter(p => p.status === 'SOLD').length / (properties.length || 1)) * 100}%` }} />
                  <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(properties.filter(p => p.status === 'RESERVED').length / (properties.length || 1)) * 100}%` }} />
                  <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${(properties.filter(p => p.status === 'BLOCKED').length / (properties.length || 1)) * 100}%` }} />
               </div>
               <span className="absolute right-0 -top-1 text-[10px] text-muted-foreground font-bold tabular-nums">
                  {properties.filter(p => p.status === 'SOLD').length} / {properties.length} ({((properties.filter(p => p.status === 'SOLD').length / (properties.length || 1)) * 100).toFixed(1)}%)
               </span>
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Progression des ventes</p>
          </Card>

          {/* Advanced Filters */}
          <Card className="p-4 rounded-[24px] border-border shadow-sm flex flex-wrap items-center gap-3">
             <div className="relative w-64 group">
                <div className="absolute -inset-0.5 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity duration-500" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Rechercher par code..." className="relative pl-9 h-9 rounded-xl border-border bg-background" />
             </div>
             <Select value={selectedProjectId} onValueChange={(v: string | null) => setSelectedProjectId(v ?? "all")}>
                <SelectTrigger className="h-9 w-40 rounded-xl border-border bg-background">
                   <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">Tous les projets</SelectItem>
                   {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
             <Select defaultValue="all"><SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background"><SelectValue placeholder="Tous les types" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les types</SelectItem></SelectContent></Select>
             <Select defaultValue="all"><SelectTrigger className="h-9 w-32 rounded-xl border-border bg-background"><SelectValue placeholder="Sous-types" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les sous-types</SelectItem></SelectContent></Select>
             <Input placeholder="Batiment" className="h-9 w-24 rounded-xl border-border bg-background" />
             <Input placeholder="Etage" className="h-9 w-20 rounded-xl border-border bg-background" />
             <div className="flex items-center gap-2">
                <Input placeholder="Min" className="h-9 w-20 rounded-xl border-border bg-background" />
                <span className="text-muted-foreground text-xs">-</span>
                <Input placeholder="Max" className="h-9 w-20 rounded-xl border-border bg-background" />
             </div>
          </Card>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          )}

          {/* Units Table */}
          {!loading && (
            <Card className="border-border rounded-[24px] overflow-hidden shadow-stripe">
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent/50 border-border hover:bg-accent/50">
                    <TableHead className="w-10"><input type="checkbox" className="rounded" /></TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Code</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Projet</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Type</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Sous-type</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Etage</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Surface</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Prix Total</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Statut</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map(p => (
                    <TableRow key={p.id} className="hover:bg-accent/30 transition-colors border-border">
                      <TableCell><input type="checkbox" className="rounded" /></TableCell>
                      <TableCell className="font-bold text-xs text-foreground">{p.name || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">-</TableCell>
                      <TableCell className="text-xs text-foreground">{p.type}</TableCell>
                      <TableCell className="text-xs text-foreground">F{p.rooms || '?'}</TableCell>
                      <TableCell className="text-xs text-foreground">{p.floor || '-'}</TableCell>
                      <TableCell className="text-xs text-foreground">{p.surface} m&sup2;</TableCell>
                      <TableCell className="text-xs font-bold text-right text-foreground tabular-nums">{(p.price || 0).toLocaleString()} DA</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "border-none text-[10px] font-black uppercase",
                          (!p.status || p.status === 'AVAILABLE') && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          p.status === 'RESERVED' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          p.status === 'SOLD' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          p.status === 'BLOCKED' && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        )}>
                          {p.status || 'Disponible'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">...</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {properties.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        Aucune unite trouvee
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-2">
              <FolderKanban className="h-3 w-3" /> Nouveau
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Creer un projet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Nom du projet</label>
              <Input
                placeholder="Ex: Residence Les Oliviers"
                value={projectForm.name}
                onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
                className="h-12 rounded-xl border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Wilaya</label>
                <Input
                  placeholder="Ex: Alger"
                  value={projectForm.wilaya}
                  onChange={(e) => setProjectForm((p) => ({ ...p, wilaya: e.target.value }))}
                  className="h-12 rounded-xl border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Commune</label>
                <Input
                  placeholder="Ex: Bab Ezzouar"
                  value={projectForm.commune}
                  onChange={(e) => setProjectForm((p) => ({ ...p, commune: e.target.value }))}
                  className="h-12 rounded-xl border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Adresse</label>
              <Input
                placeholder="Adresse complete"
                value={projectForm.address}
                onChange={(e) => setProjectForm((p) => ({ ...p, address: e.target.value }))}
                className="h-12 rounded-xl border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-muted-foreground tracking-wider">Statut initial</label>
              <Select value={projectForm.status} onValueChange={(v: string | null) => setProjectForm((p) => ({ ...p, status: v ?? "PLANNING" }))}>
                <SelectTrigger className="h-12 rounded-xl border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planification</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-12" onClick={handleCreateProject} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer le projet
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
