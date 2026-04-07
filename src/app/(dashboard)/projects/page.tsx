"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { FolderKanban, Loader2, AlertCircle, Plus } from "lucide-react";
import Image from "next/image";
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

const KPIItem = ({ icon, label, value, highlight = false, color = "neutral" }: { icon: string, label: string, value: number | string, highlight?: boolean, color?: string }) => (
  <div className={cn(
    "p-4 rounded-2xl border bg-white shadow-sm flex items-center gap-4",
    highlight && "border-emerald-100 bg-emerald-50/20",
    color === "emerald" && "border-emerald-100 bg-emerald-50/20",
    color === "amber" && "border-amber-100 bg-amber-50/20",
    color === "blue" && "border-blue-100 bg-blue-50/20",
    color === "red" && "border-red-100 bg-red-50/20",
  )}>
    <div className={cn(
      "h-10 w-10 rounded-xl flex items-center justify-center text-xl",
      color === "neutral" && "bg-neutral-100",
      color === "emerald" && "bg-emerald-100 text-emerald-600",
      color === "amber" && "bg-amber-100 text-amber-600",
      color === "blue" && "bg-blue-100 text-blue-600",
      color === "red" && "bg-red-100 text-red-600",
      highlight && "bg-emerald-500 text-white shadow-emerald-200 shadow-lg"
    )}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  </div>
);

const ValueCard = ({ label, value, icon }: { label: string, value: string, icon: string }) => (
  <div className="p-6 rounded-2xl border bg-white shadow-sm flex items-center justify-between">
    <div>
      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
    <div className="h-12 w-12 rounded-2xl bg-neutral-50 flex items-center justify-center text-2xl border border-neutral-100">
      {icon}
    </div>
  </div>
);

const GridItemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
);

const ListItemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
);


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
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des unités");
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold uppercase flex items-center gap-2">
            Projets Immobiliers
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Gérer les projets de vente immobilière et les unités
          </p>
        </div>
      </div>

      <Tabs defaultValue="projects" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-transparent p-0 gap-2 h-auto flex-wrap">
            <TabsTrigger 
              value="projects" 
              className="rounded-full px-6 py-2 border border-neutral-200 dark:border-neutral-800 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border-emerald-500 font-bold transition-all text-xs"
            >
              🏢 Projets <span className="ml-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded text-[10px]">{projects.length}</span>
            </TabsTrigger>
            <TabsTrigger 
              value="units" 
              className="rounded-full px-6 py-2 border border-neutral-200 dark:border-neutral-800 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border-emerald-500 font-bold transition-all text-xs"
            >
              🏠 Unités
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="m-0 mt-0">
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><span className="text-sm">❓</span></Button>
                <Button variant="outline" className="text-xs font-black uppercase h-9 border-neutral-200 dark:border-neutral-800">
                   <span className="mr-2">💾</span> Exporter
                </Button>
                <Button variant="outline" className="text-xs font-black uppercase h-9 border-neutral-200 dark:border-neutral-800">
                   <span className="mr-2">📥</span> Importer
                </Button>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 px-4 text-xs font-black uppercase text-white h-9 shadow-sm"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nouveau Projet
                </Button>
             </div>
          </TabsContent>

          <TabsContent value="units" className="m-0 mt-0">
             <div className="flex items-center gap-2">
                <Button variant="outline" className="text-xs font-black uppercase h-9 border-neutral-200 dark:border-neutral-800">
                   <span className="mr-2">📊</span> Comparer
                </Button>
                <Button variant="outline" className="text-xs font-black uppercase h-9 border-neutral-200 dark:border-neutral-800">
                   <span className="mr-2">💾</span> Export
                </Button>
                <Button variant="outline" className="text-xs font-black uppercase h-9 border-neutral-200 dark:border-neutral-800">
                   <span className="mr-2">📥</span> Importer
                </Button>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 px-4 text-xs font-black uppercase text-white h-9 shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nouvelle Unité
                </Button>
             </div>
          </TabsContent>
        </div>

        <TabsContent value="projects" className="space-y-6 outline-none">
          {/* Projects KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KPIItem icon="🏢" label="Total Projets" value={projects.length} />
            <KPIItem icon="🏗️" label="Actifs" value={projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length} />
            <KPIItem icon="📦" label="Unités" value={properties.length} />
            <KPIItem icon="✅" label="Vendues" value={properties.filter(p => p.status === 'SOLD').length} />
            <KPIItem icon="⏳" label="Réservées" value={properties.filter(p => p.status === 'RESERVED').length} />
          </div>

          {/* Filters & View Toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative flex-1 max-w-sm">
                <Input placeholder="Rechercher un projet..." className="pl-9" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Toutes les filiales" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les filiales</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => fetchProjects()}>🔄</Button>
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white dark:bg-neutral-700 shadow-sm"><GridItemIcon /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ListItemIcon /></Button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="ml-3 text-muted-foreground font-medium">Chargement des projets...</span>
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
                  location={[project.commune, project.wilaya].filter(Boolean).join(", ") || project.address || "Non renseigné"}
                  availableUnits={project.properties?.filter(p => !p.status || p.status === "AVAILABLE").length ?? 0}
                  totalUnits={project.properties?.length ?? 0}
                  progress={project.progressPercentage}
                  status={project.status}
                  imageUrl={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80`}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-6 outline-none">
          {/* Selected Project Header (if any) */}
          {selectedProjectId !== "all" && projects.find(p => p.id === selectedProjectId) && (
            <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl overflow-hidden relative border border-neutral-100">
                     <Image src={`https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&q=80`} fill alt="Project" className="object-cover" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black flex items-center gap-2">
                        {projects.find(p => p.id === selectedProjectId)?.name}
                        <Badge className="bg-emerald-500 text-white border-none text-[8px] h-4">Active</Badge>
                     </h3>
                     <p className="text-[10px] text-muted-foreground font-medium">@ MZ-IMMO | prj-002</p>
                  </div>
               </div>
               <div className="flex items-center gap-8">
                  <div className="text-center">
                     <p className="text-xs font-black">{properties.length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">TOTAL</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-black text-emerald-600">{properties.filter(p => !p.status || p.status === 'AVAILABLE').length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">DISPO</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-black text-amber-600">{properties.filter(p => p.status === 'RESERVED').length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">RÉSERVÉES</p>
                  </div>
                  <div className="text-center">
                     <p className="text-xs font-black text-blue-600">{properties.filter(p => p.status === 'SOLD').length}</p>
                     <p className="text-[8px] text-muted-foreground font-black uppercase">VENDUES</p>
                  </div>
                  <Button variant="ghost" className="text-[10px] font-black uppercase h-8" onClick={() => setSelectedProjectId("all")}>Changer</Button>
               </div>
            </div>
          )}

          {/* Units KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <KPIItem icon="📦" label="TOTAL UNITES" value={properties.length} highlight />
            <KPIItem icon="✅" label="DISPONIBLES" value={properties.filter(p => !p.status || p.status === 'AVAILABLE').length} color="emerald" />
            <KPIItem icon="⏳" label="RESERVEES" value={properties.filter(p => p.status === 'RESERVED').length} color="amber" />
            <KPIItem icon="💰" label="VENDUES" value={properties.filter(p => p.status === 'SOLD').length} color="blue" />
            <KPIItem icon="🚫" label="BLOQUEES" value={properties.filter(p => p.status === 'BLOCKED').length} color="red" />
          </div>

          {/* Value Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValueCard label="VALEUR TOTALE" value={`${(properties.reduce((acc, p) => acc + (p.price || 0), 0) / 1000000000).toFixed(2)} Md DA`} icon="💰" />
            <ValueCard label="VALEUR VENDUE" value={`${(properties.filter(p => p.status === 'SOLD').reduce((acc, p) => acc + (p.price || 0), 0) / 1000000).toFixed(1)} M DA`} icon="📈" />
          </div>

          {/* Sales Progression */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">Vendues {properties.filter(p => p.status === 'SOLD').length}</Badge>
              <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-100">Réservées {properties.filter(p => p.status === 'RESERVED').length}</Badge>
              <Badge variant="outline" className="text-red-600 bg-red-50 border-red-100">Bloquées {properties.filter(p => p.status === 'BLOCKED').length}</Badge>
              <Badge variant="outline" className="text-neutral-600 bg-neutral-50 border-neutral-100">Disponibles {properties.filter(p => !p.status || p.status === 'AVAILABLE').length}</Badge>
            </div>
            <div className="relative pt-4">
               <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: `${(properties.filter(p => p.status === 'SOLD').length / (properties.length || 1)) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(properties.filter(p => p.status === 'RESERVED').length / (properties.length || 1)) * 100}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${(properties.filter(p => p.status === 'BLOCKED').length / (properties.length || 1)) * 100}%` }} />
               </div>
               <span className="absolute right-0 -top-1 text-[10px] text-muted-foreground font-bold">
                  {properties.filter(p => p.status === 'SOLD').length} / {properties.length} ({((properties.filter(p => p.status === 'SOLD').length / (properties.length || 1)) * 100).toFixed(1)}%)
               </span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Progression des ventes</p>
          </div>

          {/* Advanced Filters */}
          <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 flex flex-wrap items-center gap-3">
             <div className="relative w-64">
                <Input placeholder="Rechercher par code..." className="pl-9 h-9" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">🔍</span>
             </div>
             <Select value={selectedProjectId} onValueChange={(v: string | null) => setSelectedProjectId(v ?? "all")}>
                <SelectTrigger className="h-9 w-40">
                   <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="all">Tous les projets</SelectItem>
                   {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                   ))}
                </SelectContent>
             </Select>
             <Select defaultValue="all"><SelectTrigger className="h-9 w-32"><SelectValue placeholder="Tous les types" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les types</SelectItem></SelectContent></Select>
             <Select defaultValue="all"><SelectTrigger className="h-9 w-32"><SelectValue placeholder="Tous les sous-types" /></SelectTrigger><SelectContent><SelectItem value="all">Tous les sous-types</SelectItem></SelectContent></Select>
             <Input placeholder="Bâtiment" className="h-9 w-24" />
             <Input placeholder="Étage" className="h-9 w-20" />
             <div className="flex items-center gap-2">
                <Input placeholder="Min" className="h-9 w-20" />
                <span className="text-muted-foreground">-</span>
                <Input placeholder="Max" className="h-9 w-20" />
             </div>
          </div>

          {/* Units Table */}
          <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow>
                  <TableHead className="w-10"><input type="checkbox" /></TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Code</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Projet</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Type</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Sous-type</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Bâtiment</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Étage</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Surface</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-right">Prix Total</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Livraison</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Agent</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Client</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Plan 2D</TableHead>
                  <TableHead className="uppercase text-[10px] font-black">Statut</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map(p => (
                  <TableRow key={p.id}>
                    <TableCell><input type="checkbox" /></TableCell>
                    <TableCell className="font-bold text-xs">{p.name || 'N/A'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.project?.name || '-'}</TableCell>
                    <TableCell className="text-xs">{p.type}</TableCell>
                    <TableCell className="text-xs">F{p.rooms || '?'}</TableCell>
                    <TableCell className="text-xs">{p.building || '-'}</TableCell>
                    <TableCell className="text-xs">{p.floor || '-'}</TableCell>
                    <TableCell className="text-xs">{p.surface} m²</TableCell>
                    <TableCell className="text-xs font-bold text-right">{(p.price || 0).toLocaleString()} DA</TableCell>
                    <TableCell className="text-xs">{p.deliveryDate ? new Date(p.deliveryDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="text-xs">-</TableCell>
                    <TableCell className="text-xs text-muted-foreground">Aucun</TableCell>
                    <TableCell className="text-xs text-blue-500 font-bold hover:underline cursor-pointer italic text-[9px]">S/O</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "border-none text-[10px] font-black",
                        (!p.status || p.status === 'AVAILABLE') && "bg-emerald-100 text-emerald-700",
                        p.status === 'RESERVED' && "bg-amber-100 text-amber-700",
                        p.status === 'SOLD' && "bg-blue-100 text-blue-700",
                        p.status === 'BLOCKED' && "bg-red-100 text-red-700",
                      )}>
                        {p.status || 'Disponible'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">...</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-amber-500" /> Nouveau Projet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Nom du projet</label>
              <Input
                placeholder="Ex: Residence Les Oliviers"
                value={projectForm.name}
                onChange={(e) => setProjectForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Wilaya</label>
                <Input
                  placeholder="Ex: Alger"
                  value={projectForm.wilaya}
                  onChange={(e) => setProjectForm((p) => ({ ...p, wilaya: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Commune</label>
                <Input
                  placeholder="Ex: Bab Ezzouar"
                  value={projectForm.commune}
                  onChange={(e) => setProjectForm((p) => ({ ...p, commune: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Adresse</label>
              <Input
                placeholder="Adresse complete"
                value={projectForm.address}
                onChange={(e) => setProjectForm((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Statut initial</label>
              <Select value={projectForm.status} onValueChange={(v: string | null) => setProjectForm((p) => ({ ...p, status: v ?? "PLANNING" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">Planification</SelectItem>
                  <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={handleCreateProject} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer le projet
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
