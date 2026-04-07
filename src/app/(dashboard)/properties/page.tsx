"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Building2,
  Home,
  BarChart3,
  Plus,
  RefreshCcw,
  Search,
  AlertCircle,
  Loader2,
  Package,
  CheckCircle2,
  Clock,
  Ban,
  Wallet,
  TrendingUp,
  Grid3X3,
  MapPin,
  Megaphone,
  Target,
  Eye,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  properties?: Array<{ id: string; status?: string }>;
  marketingBudgetAds?: number | null;
  marketingBudgetEvents?: number | null;
  marketingBudgetPrint?: number | null;
  _count?: { leads?: number; visits?: number };
}

interface Property {
  id: string;
  name: string;
  type: string;
  floor: number | null;
  rooms: number | null;
  surface: number | null;
  price: number | null;
  status: string;
  projectId: string | null;
  project?: { id: string; name: string } | null;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------
function KPICard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorMap: Record<string, { iconBg: string; text: string }> = {
    emerald: { iconBg: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600", text: "text-emerald-600" },
    amber: { iconBg: "bg-amber-50 dark:bg-amber-900/20 text-amber-600", text: "text-amber-600" },
    blue: { iconBg: "bg-blue-50 dark:bg-blue-900/20 text-blue-600", text: "text-blue-600" },
    indigo: { iconBg: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600", text: "text-indigo-600" },
    rose: { iconBg: "bg-rose-50 dark:bg-rose-900/20 text-rose-600", text: "text-rose-600" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <Card className="relative overflow-hidden border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 rounded-[24px] group">
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
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function PropertiesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  // Create project dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    address: "",
    wilaya: "",
    commune: "",
    status: "PLANNING",
  });

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, propRes] = await Promise.all([
        fetch("/api/v1/projects?limit=100"),
        fetch("/api/v1/properties?limit=500"),
      ]);

      if (!projRes.ok) throw new Error(`Erreur projets: ${projRes.status}`);
      if (!propRes.ok) throw new Error(`Erreur biens: ${propRes.status}`);

      const projJson = await projRes.json();
      const propJson = await propRes.json();

      if (!projJson.success) throw new Error(projJson.error || "Erreur projets");

      setProjects(projJson.data.projects);

      // Properties API may return data in different shapes
      if (propJson.success) {
        const d = propJson.data;
        setProperties(Array.isArray(d) ? d : d?.properties ?? propJson.properties ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------------------
  // Filtered data
  // -------------------------------------------------------------------------
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.project?.name ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || p.status === statusFilter || (!p.status && statusFilter === "AVAILABLE");
      const matchProject = projectFilter === "all" || p.projectId === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [properties, search, statusFilter, projectFilter]);

  // Group properties by project for Catalogue tab
  const groupedByProject = useMemo(() => {
    const map = new Map<string, { projectName: string; items: Property[] }>();
    for (const p of filteredProperties) {
      const key = p.project?.id ?? p.projectId ?? "__no_project__";
      const projectName = p.project?.name ?? "Sans projet";
      if (!map.has(key)) map.set(key, { projectName, items: [] });
      map.get(key)!.items.push(p);
    }
    return Array.from(map.values());
  }, [filteredProperties]);

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------
  const stats = useMemo(() => {
    const total = properties.length;
    const available = properties.filter(p => !p.status || p.status === "AVAILABLE").length;
    const reserved = properties.filter(p => p.status === "RESERVED").length;
    const sold = properties.filter(p => p.status === "SOLD").length;
    const blocked = properties.filter(p => p.status === "BLOCKED").length;
    const totalValue = properties.reduce((acc, p) => acc + (p.price || 0), 0);
    const soldValue = properties.filter(p => p.status === "SOLD").reduce((acc, p) => acc + (p.price || 0), 0);
    const avgPriceM2 = (() => {
      const withSurface = properties.filter(p => p.surface && p.price);
      if (withSurface.length === 0) return 0;
      return withSurface.reduce((acc, p) => acc + (p.price! / p.surface!), 0) / withSurface.length;
    })();
    const sellRatio = total > 0 ? Math.round((sold / total) * 100) : 0;
    return { total, available, reserved, sold, blocked, totalValue, soldValue, avgPriceM2, sellRatio };
  }, [properties]);

  // -------------------------------------------------------------------------
  // Create project
  // -------------------------------------------------------------------------
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
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const formatPrice = (price: number | null): string => {
    if (price == null) return "-";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "DZD", maximumFractionDigits: 0 }).format(price);
  };

  const formatLargeValue = (amount: number): string => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)} Md DA`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} M DA`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)} k DA`;
    return `${amount} DA`;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Premium Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Home className="h-3.5 w-3.5" /> Inventaire
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-foreground flex items-center gap-3">
            Properties
            <Badge variant="outline" className="font-black border-primary/20 text-primary bg-primary/5 text-xs">
              {properties.length} biens
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Vue unifiee de votre inventaire immobilier — catalogue, programmes et analyse
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="h-12 w-12 rounded-2xl border-border bg-card shadow-stripe hover:shadow-stripe-lg active:scale-95 transition-all"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 text-xs font-black uppercase h-12 shadow-stripe rounded-2xl"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nouveau Projet
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="catalogue" className="w-full">
        <TabsList className="bg-transparent p-0 gap-2 h-auto flex-wrap">
          <TabsTrigger
            value="catalogue"
            className="rounded-full px-6 py-2.5 border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-stripe font-bold transition-all text-xs"
          >
            <Grid3X3 className="h-3.5 w-3.5 mr-2" /> Catalogue
            <span className="ml-2 bg-accent text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-black">{properties.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="programmes"
            className="rounded-full px-6 py-2.5 border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-stripe font-bold transition-all text-xs"
          >
            <Building2 className="h-3.5 w-3.5 mr-2" /> Programmes
            <span className="ml-2 bg-accent text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-black">{projects.length}</span>
          </TabsTrigger>
          <TabsTrigger
            value="analyse"
            className="rounded-full px-6 py-2.5 border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-stripe font-bold transition-all text-xs"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-2" /> Analyse
          </TabsTrigger>
          <TabsTrigger
            value="marketing"
            className="rounded-full px-6 py-2.5 border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-stripe font-bold transition-all text-xs"
          >
            <Megaphone className="h-3.5 w-3.5 mr-2" /> Marketing
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: CATALOGUE (Availability Grid) */}
        {/* ================================================================ */}
        <TabsContent value="catalogue" className="space-y-6 mt-6 outline-none">
          {/* Filters */}
          <Card className="p-4 rounded-[24px] border-border shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm group">
              <div className="absolute -inset-0.5 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity duration-500" />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un bien, type ou projet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="relative pl-10 h-10 rounded-xl border-border bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
              <SelectTrigger className="h-10 w-40 rounded-xl border-border bg-background">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="RESERVED">Reserve</SelectItem>
                <SelectItem value="SOLD">Vendu</SelectItem>
                <SelectItem value="BLOCKED">Bloque</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v ?? "all")}>
              <SelectTrigger className="h-10 w-44 rounded-xl border-border bg-background">
                <SelectValue placeholder="Tous les projets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les projets</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard icon={Package} label="Total" value={stats.total} color="indigo" />
            <KPICard icon={CheckCircle2} label="Disponibles" value={stats.available} color="emerald" />
            <KPICard icon={Clock} label="Reserves" value={stats.reserved} color="amber" />
            <KPICard icon={Wallet} label="Vendus" value={stats.sold} color="blue" />
            <KPICard icon={Ban} label="Bloques" value={stats.blocked} color="rose" />
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-2xl bg-card border border-border animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-8 rounded-[32px] bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-stripe text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <p className="text-lg font-black text-foreground tracking-tight">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchData} className="h-12 px-8 rounded-full font-bold">
                Reessayer
              </Button>
            </div>
          )}

          {/* Grouped Tables */}
          {!loading && !error && groupedByProject.map((group) => (
            <Card key={group.projectName} className="rounded-[24px] border-border shadow-stripe overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="font-black text-foreground text-sm">{group.projectName}</h3>
                <Badge variant="outline" className="font-bold text-[10px] border-border ml-auto">
                  {group.items.length} biens
                </Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-accent/50 border-border hover:bg-accent/50">
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Bien</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Type</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Etage</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Surface</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Prix</TableHead>
                    <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.items.map((property) => (
                    <TableRow key={property.id} className="hover:bg-accent/30 transition-colors border-border">
                      <TableCell className="font-bold text-sm text-foreground">{property.name}</TableCell>
                      <TableCell className="text-xs text-foreground">{property.type}</TableCell>
                      <TableCell className="text-xs text-center text-foreground tabular-nums">
                        {property.floor != null ? property.floor : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right text-foreground tabular-nums">
                        {property.surface != null ? `${property.surface} m\u00B2` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-foreground tabular-nums">
                        {formatPrice(property.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "border-none text-[10px] font-black uppercase",
                          (!property.status || property.status === "AVAILABLE") && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                          property.status === "RESERVED" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          property.status === "SOLD" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                          property.status === "BLOCKED" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        )}>
                          {property.status === "AVAILABLE" || !property.status ? "Disponible" :
                           property.status === "RESERVED" ? "Reserve" :
                           property.status === "SOLD" ? "Vendu" :
                           property.status === "BLOCKED" ? "Bloque" : property.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}

          {/* Empty state */}
          {!loading && !error && filteredProperties.length === 0 && (
            <Card className="p-12 text-center rounded-[32px] border-border shadow-stripe">
              <Grid3X3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-black text-foreground tracking-tight">
                {properties.length === 0 ? "Aucun bien enregistre" : "Aucun bien ne correspond a votre recherche"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {properties.length === 0 ? "Creez un projet pour commencer a ajouter des biens" : "Essayez de modifier vos filtres"}
              </p>
            </Card>
          )}

          {/* Summary badges */}
          {!loading && !error && properties.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                Disponible : {stats.available}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800">
                Reserve : {stats.reserved}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800">
                Vendu : {stats.sold}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs border-border text-muted-foreground">
                Total : {stats.total}
              </Badge>
            </div>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2: PROGRAMMES (Projects) */}
        {/* ================================================================ */}
        <TabsContent value="programmes" className="space-y-6 mt-6 outline-none">
          {/* Project KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard icon={Building2} label="Total Projets" value={projects.length} color="indigo" />
            <KPICard icon={TrendingUp} label="Actifs" value={projects.filter(p => p.status === "IN_PROGRESS" || p.status === "ACTIVE").length} color="emerald" />
            <KPICard icon={Package} label="Unites" value={properties.length} color="blue" />
            <KPICard icon={CheckCircle2} label="Vendues" value={stats.sold} color="amber" />
          </div>

          {/* Search */}
          <div className="relative max-w-sm group">
            <div className="absolute -inset-0.5 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 rounded-xl transition-opacity duration-500" />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un projet..." className="relative pl-10 h-11 rounded-xl border-border bg-card shadow-stripe transition-all" />
          </div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 rounded-[24px] bg-card border border-border animate-pulse" />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-8 rounded-[32px] bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-stripe text-center">
                <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
                <p className="text-lg font-black text-foreground tracking-tight">{error}</p>
              </div>
            </div>
          )}

          {/* Projects Grid */}
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
                  imageUrl="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && projects.length === 0 && (
            <Card className="p-12 text-center rounded-[32px] border-border shadow-stripe">
              <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-black text-foreground tracking-tight">Aucun programme</p>
              <p className="text-sm text-muted-foreground mt-1">Creez votre premier projet immobilier</p>
            </Card>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: ANALYSE */}
        {/* ================================================================ */}
        <TabsContent value="analyse" className="space-y-6 mt-6 outline-none">
          {/* Value KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="relative overflow-hidden border-border shadow-stripe rounded-[24px] group hover:shadow-stripe-lg transition-all duration-500">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Valeur Totale</p>
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground">{formatLargeValue(stats.totalValue)}</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-2">Valeur cumulee de tout l&apos;inventaire</p>
              </div>
            </Card>
            <Card className="relative overflow-hidden border-border shadow-stripe rounded-[24px] group hover:shadow-stripe-lg transition-all duration-500">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Valeur Vendue</p>
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground">{formatLargeValue(stats.soldValue)}</p>
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-2">Chiffre d&apos;affaires realise</p>
              </div>
            </Card>
            <Card className="relative overflow-hidden border-border shadow-stripe rounded-[24px] group hover:shadow-stripe-lg transition-all duration-500">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Prix Moyen / m&sup2;</p>
                </div>
                <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
                  {stats.avgPriceM2 > 0 ? `${Math.round(stats.avgPriceM2).toLocaleString()} DA` : "N/A"}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-medium mt-2">Moyenne sur tous les biens</p>
              </div>
            </Card>
          </div>

          {/* Sales Progress */}
          <Card className="p-6 rounded-[24px] border-border shadow-stripe space-y-4">
            <h3 className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em]">Progression des ventes</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800">
                Disponibles {stats.available}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800">
                Reserves {stats.reserved}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800">
                Vendus {stats.sold}
              </Badge>
              <Badge variant="outline" className="font-bold text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-200 dark:border-rose-800">
                Bloques {stats.blocked}
              </Badge>
            </div>
            <div className="relative pt-2">
              <div className="h-3 w-full bg-accent rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${(stats.sold / (stats.total || 1)) * 100}%` }} />
                <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(stats.reserved / (stats.total || 1)) * 100}%` }} />
                <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${(stats.blocked / (stats.total || 1)) * 100}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-muted-foreground">
                <span>{stats.sellRatio}% vendus</span>
                <span className="tabular-nums">{stats.sold} / {stats.total}</span>
              </div>
            </div>
          </Card>

          {/* Project breakdown */}
          <Card className="rounded-[24px] border-border shadow-stripe overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Repartition par programme
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50 border-border hover:bg-accent/50">
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Programme</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Total</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Dispo</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Vendus</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(project => {
                  const projProps = properties.filter(p => p.projectId === project.id || p.project?.id === project.id);
                  const projSold = projProps.filter(p => p.status === "SOLD").length;
                  const projAvail = projProps.filter(p => !p.status || p.status === "AVAILABLE").length;
                  const ratio = projProps.length > 0 ? Math.round((projSold / projProps.length) * 100) : 0;
                  return (
                    <TableRow key={project.id} className="hover:bg-accent/30 transition-colors border-border">
                      <TableCell className="font-bold text-sm text-foreground">{project.name}</TableCell>
                      <TableCell className="text-center text-xs tabular-nums text-foreground">{projProps.length}</TableCell>
                      <TableCell className="text-center text-xs tabular-nums text-emerald-600">{projAvail}</TableCell>
                      <TableCell className="text-center text-xs tabular-nums text-blue-600">{projSold}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "border-none text-[10px] font-black tabular-nums",
                          ratio >= 75 ? "bg-emerald-500/10 text-emerald-600" :
                          ratio >= 50 ? "bg-amber-500/10 text-amber-600" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {ratio}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun programme</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 4: MARKETING PERFORMANCE */}
        {/* ================================================================ */}
        <TabsContent value="marketing" className="space-y-6 mt-6 outline-none">
          {/* Global Marketing KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const totalBudget = projects.reduce((acc, p) => {
                return acc + Number(p.marketingBudgetAds || 0) + Number(p.marketingBudgetEvents || 0) + Number(p.marketingBudgetPrint || 0);
              }, 0);
              const totalLeads = projects.reduce((acc, p) => acc + (p._count?.leads || 0), 0);
              const totalVisits = projects.reduce((acc, p) => acc + (p._count?.visits || 0), 0);
              const cpl = totalLeads > 0 ? Math.round(totalBudget / totalLeads) : 0;
              return (
                <>
                  <KPICard icon={Megaphone} label="Budget Total" value={formatLargeValue(totalBudget)} color="indigo" />
                  <KPICard icon={Users} label="Leads Generes" value={totalLeads} color="emerald" />
                  <KPICard icon={Eye} label="Visites" value={totalVisits} color="blue" />
                  <KPICard icon={Target} label="CPL Moyen" value={cpl > 0 ? `${cpl.toLocaleString()} DA` : "N/A"} color="amber" />
                </>
              );
            })()}
          </div>

          {/* Per-project marketing breakdown */}
          <Card className="rounded-[24px] border-border shadow-stripe overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-black text-foreground text-sm flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" /> Rentabilite par programme
              </h3>
              <p className="text-[10px] text-muted-foreground mt-1">
                Analysez le cout par lead (CPL), cout par visite (CPV) et le ROI commercial de chaque programme
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/50 border-border hover:bg-accent/50">
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider">Programme</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Budget Ads</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Budget Events</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Budget Print</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">Total</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Leads</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">Visites</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">CPL</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-right">CPV</TableHead>
                  <TableHead className="uppercase text-[10px] font-black text-muted-foreground tracking-wider text-center">ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map(project => {
                  const ads = Number(project.marketingBudgetAds || 0);
                  const events = Number(project.marketingBudgetEvents || 0);
                  const print = Number(project.marketingBudgetPrint || 0);
                  const total = ads + events + print;
                  const leads = project._count?.leads || 0;
                  const visits = project._count?.visits || 0;
                  const cpl = leads > 0 ? Math.round(total / leads) : 0;
                  const cpv = visits > 0 ? Math.round(total / visits) : 0;

                  // ROI = revenue generated / marketing spend
                  const projProps = properties.filter(p => p.projectId === project.id || p.project?.id === project.id);
                  const revenue = projProps.filter(p => p.status === "SOLD").reduce((acc, p) => acc + (p.price || 0), 0);
                  const roi = total > 0 ? ((revenue / total) * 100).toFixed(0) : "N/A";

                  return (
                    <TableRow key={project.id} className="hover:bg-accent/30 transition-colors border-border">
                      <TableCell className="font-bold text-sm text-foreground">{project.name}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-foreground">{ads > 0 ? formatLargeValue(ads) : "-"}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-foreground">{events > 0 ? formatLargeValue(events) : "-"}</TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-foreground">{print > 0 ? formatLargeValue(print) : "-"}</TableCell>
                      <TableCell className="text-xs text-right font-bold tabular-nums text-foreground">{total > 0 ? formatLargeValue(total) : "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-black tabular-nums">{leads}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-blue-500/10 text-blue-600 border-none text-[10px] font-black tabular-nums">{visits}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-foreground font-bold">
                        {cpl > 0 ? `${cpl.toLocaleString()} DA` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-right tabular-nums text-foreground font-bold">
                        {cpv > 0 ? `${cpv.toLocaleString()} DA` : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(
                          "border-none text-[10px] font-black tabular-nums",
                          roi === "N/A" ? "bg-muted text-muted-foreground" :
                          Number(roi) >= 500 ? "bg-emerald-500/10 text-emerald-600" :
                          Number(roi) >= 100 ? "bg-amber-500/10 text-amber-600" :
                          "bg-rose-500/10 text-rose-600"
                        )}>
                          {roi === "N/A" ? "N/A" : `${roi}%`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Aucun programme avec budget marketing
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Budget allocation info */}
          <Card className="p-6 rounded-[24px] border-border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-foreground">Configurer le budget marketing</h3>
                <p className="text-[10px] text-muted-foreground">
                  Ajoutez un budget marketing sur la fiche de chaque programme pour voir les metriques CPL, CPV et ROI ici
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-2">
              <Building2 className="h-3 w-3" /> Nouveau
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Creer un programme
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
              <Select value={projectForm.status} onValueChange={(v) => setProjectForm((p) => ({ ...p, status: v ?? "PLANNING" }))}>
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
            Creer le programme
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
