"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, Plus, Search, Loader2, UserX, ArrowRight, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  pipelineStage: string;
  assignedAgent: { firstName: string; lastName: string } | null;
  createdAt: string;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  CONTACTED: { label: "Contacte", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  QUALIFIED: { label: "Qualifie", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400", dot: "bg-purple-500" },
  VISIT_SCHEDULED: { label: "Visite planifiee", color: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400", dot: "bg-cyan-500" },
  VISITED: { label: "Visite", color: "bg-teal-500/10 text-teal-700 dark:text-teal-400", dot: "bg-teal-500" },
  NEGOTIATION: { label: "Negociation", color: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  RESERVED: { label: "Reserve", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  SIGNED: { label: "Signe", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  CLOSED: { label: "Cloture", color: "bg-green-500/10 text-green-700 dark:text-green-400", dot: "bg-green-500" },
};

const SOURCE_OPTIONS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "WEBSITE", label: "Site web" },
  { value: "REFERRAL", label: "Parrainage" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Telephone" },
  { value: "OTHER", label: "Autre" },
];

const TYPE_OPTIONS = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "STUDIO", label: "Studio" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "TERRAIN", label: "Terrain" },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    source: "",
    desiredType: "",
    budgetMin: "",
    budgetMax: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/clients");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setClients(Array.isArray(d) ? d : d.clients ?? []);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "Clients page" } });
      setError("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error("Prenom, nom et telephone sont requis");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };
      if (form.email) body.email = form.email;
      if (form.source) body.source = form.source;
      if (form.desiredType) body.desiredType = form.desiredType;
      if (form.budgetMin) body.budgetMin = Number(form.budgetMin);
      if (form.budgetMax) body.budgetMax = Number(form.budgetMax);

      const res = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la creation");
        return;
      }
      toast.success("Client cree avec succes");
      setIsCreateOpen(false);
      setForm({ firstName: "", lastName: "", phone: "", email: "", source: "", desiredType: "", budgetMin: "", budgetMax: "" });
      const newClient = json.data;
      if (newClient?.id) {
        router.push(`/clients/${newClient.id}`);
      } else {
        fetchClients();
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setCreating(false);
    }
  }

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "ALL" || c.pipelineStage === stageFilter;
    return matchSearch && matchStage;
  });

  // Stats by stage
  const stageCounts = clients.reduce<Record<string, number>>((acc, c) => {
    acc[c.pipelineStage] = (acc[c.pipelineStage] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-20">
      {/* Premium Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Users className="h-3.5 w-3.5" /> Gestion Clients
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
            Portefeuille Clients
            <span className="text-muted-foreground/30 text-2xl ml-3 italic font-medium">{clients.length}</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Gerez vos clients et suivez leur progression dans le pipeline
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="h-14 px-8 rounded-2xl font-black uppercase text-xs tracking-widest shadow-stripe hover:shadow-stripe-lg transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Client
        </Button>
      </header>

      {/* Search + Stage Filter Chips */}
      <div className="space-y-4">
        <div className="relative max-w-lg group">
          <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Rechercher par nom, telephone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-14 bg-card border-border shadow-stripe focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all font-medium"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStageFilter("ALL")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border",
              stageFilter === "ALL"
                ? "bg-foreground text-background border-foreground shadow-stripe"
                : "bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
            )}
          >
            Tous ({clients.length})
          </button>
          {Object.entries(STAGE_CONFIG).map(([key, config]) => {
            const count = stageCounts[key] || 0;
            if (count === 0 && stageFilter !== key) return null;
            return (
              <button
                key={key}
                onClick={() => setStageFilter(key)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border flex items-center gap-2",
                  stageFilter === key
                    ? `${config.color} border-current shadow-stripe`
                    : "bg-card text-muted-foreground border-border hover:border-foreground/20"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", config.dot)} />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-[24px] bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="p-8 rounded-[32px] bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 shadow-stripe text-center">
            <UserX className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <p className="text-lg font-black text-foreground tracking-tight">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setError(null); fetchClients(); }}
            className="h-12 px-8 rounded-full font-bold"
          >
            Reessayer
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="p-10 rounded-[40px] bg-card border border-border shadow-stripe text-center max-w-md">
            <div className="h-20 w-20 rounded-[24px] bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserX className="h-10 w-10 text-primary/30" />
            </div>
            <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
              Aucun client trouve
            </h3>
            <p className="text-sm text-muted-foreground">
              {search || stageFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Commencez par ajouter votre premier client"}
            </p>
          </div>
          {!search && stageFilter === "ALL" && (
            <Button onClick={() => setIsCreateOpen(true)} className="h-12 px-8 rounded-full font-bold">
              <Plus className="h-4 w-4 mr-2" /> Ajouter un client
            </Button>
          )}
        </div>
      ) : (
        <Card className="bg-card border-border shadow-stripe rounded-[32px] overflow-hidden">
          <div className="p-5 border-b border-border/50 flex items-center justify-between">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">
              {filtered.length} client{filtered.length > 1 ? "s" : ""} {stageFilter !== "ALL" && `— ${STAGE_CONFIG[stageFilter]?.label}`}
            </p>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-accent/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider pl-6">Client</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Source</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Pipeline</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Agent</TableHead>
                  <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider pr-6">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => {
                  const stage = STAGE_CONFIG[client.pipelineStage] || { label: client.pipelineStage, color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" };
                  return (
                    <TableRow
                      key={client.id}
                      className="border-border hover:bg-accent/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/clients/${client.id}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-black text-primary">
                              {client.firstName[0]}{client.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {client.firstName} {client.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase border-border">
                          {client.source || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider", stage.color)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", stage.dot)} />
                          {stage.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground font-medium">
                          {client.assignedAgent
                            ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}`
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(client.createdAt), { addSuffix: true, locale: fr })}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Client Dialog — Premium */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg rounded-[28px]">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-2">
              <Plus className="h-3 w-3" /> Nouveau dossier
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight">Creer un client</DialogTitle>
            <DialogDescription>Remplissez les informations du client pour ouvrir un dossier.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prenom *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Prenom"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Nom"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telephone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0555 00 00 00"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Source</Label>
                <Select value={form.source ?? ""} onValueChange={(v) => setForm({ ...form, source: v ?? "" })}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SOURCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type de bien</Label>
                <Select value={form.desiredType ?? ""} onValueChange={(v) => setForm({ ...form, desiredType: v ?? "" })}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Budget min (DA)</Label>
                <Input
                  type="number"
                  value={form.budgetMin}
                  onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                  placeholder="5 000 000"
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Budget max (DA)</Label>
                <Input
                  type="number"
                  value={form.budgetMax}
                  onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                  placeholder="20 000 000"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating} className="rounded-xl px-6">
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="rounded-xl px-8 font-bold">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Creer le dossier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
