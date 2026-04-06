"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, MoreHorizontal, ExternalLink, Loader2, AlertCircle, RefreshCw, Plus, Building2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface ITenant {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    properties: number;
  };
}

interface ICreateForm {
  name: string;
  type: "AGENCY" | "PROMOTION";
  plan: "STARTER" | "PRO" | "BUSINESS" | "ENTERPRISE";
  status: "ACTIVE" | "DEMO";
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  ownerPassword: string;
}

const EMPTY_FORM: ICreateForm = {
  name: "",
  type: "AGENCY",
  plan: "STARTER",
  status: "ACTIVE",
  ownerEmail: "",
  ownerFirstName: "",
  ownerLastName: "",
  ownerPhone: "",
  ownerPassword: "",
};

export default function SuperAdminWorkspaces() {
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ICreateForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  const updateForm = <K extends keyof ICreateForm>(key: K, value: ICreateForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function fetchTenants() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/admin/tenants");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) setTenants(json.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name || !form.ownerEmail || !form.ownerFirstName || !form.ownerLastName || !form.ownerPassword) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (form.ownerPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/v1/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(`Workspace "${form.name}" créé avec succès`);
        setDialogOpen(false);
        setForm(EMPTY_FORM);
        setShowPassword(false);
        fetchTenants();
      } else {
        toast.error(json.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => { fetchTenants(); }, []);

  const filtered = tenants.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      ENTERPRISE: "bg-emerald-500/10 text-emerald-400",
      BUSINESS: "bg-indigo-500/10 text-indigo-400",
      PRO: "bg-cyan-500/10 text-cyan-400",
    };
    return (
      <Badge className={`${colors[plan] || "bg-muted text-muted-foreground"} border-none font-black uppercase text-xs`}>
        {plan}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <div className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Actif</div>;
      case "SUSPENDED": return <div className="flex items-center gap-1.5 text-xs text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-500" />Suspendu</div>;
      case "DEMO": return <div className="flex items-center gap-1.5 text-xs text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-500" />Demo</div>;
      default: return <div className="text-xs text-muted-foreground">{status}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-lg font-bold text-foreground">Impossible de charger les workspaces</p>
        <Button onClick={fetchTenants} variant="outline" className="border-border text-foreground gap-2">
          <RefreshCw className="h-4 w-4" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Workspaces ({tenants.length})</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez tous les locataires de la plateforme IMMO PRO-X.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setForm(EMPTY_FORM); setShowPassword(false); } }}>
          <DialogTrigger>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Nouveau workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-foreground sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Créer un workspace
              </DialogTitle>
              <DialogDescription>
                Créez un nouveau workspace avec son propriétaire (CEO).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Workspace info */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspace</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Nom du workspace *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="Ex: Agence Horizon Alger"
                  className="bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Type *</Label>
                  <select
                    value={form.type}
                    onChange={(e) => updateForm("type", e.target.value as ICreateForm["type"])}
                    className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm"
                  >
                    <option value="AGENCY">Agence</option>
                    <option value="PROMOTION">Promotion</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Plan *</Label>
                  <select
                    value={form.plan}
                    onChange={(e) => updateForm("plan", e.target.value as ICreateForm["plan"])}
                    className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="BUSINESS">Business</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Statut initial</Label>
                <select
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value as ICreateForm["status"])}
                  className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm"
                >
                  <option value="ACTIVE">Actif</option>
                  <option value="DEMO">Démo (14 jours)</option>
                </select>
              </div>

              {/* Owner info */}
              <div className="pt-2 border-t border-border space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Propriétaire (CEO)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Prénom *</Label>
                  <Input
                    value={form.ownerFirstName}
                    onChange={(e) => updateForm("ownerFirstName", e.target.value)}
                    placeholder="Ahmed"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Nom *</Label>
                  <Input
                    value={form.ownerLastName}
                    onChange={(e) => updateForm("ownerLastName", e.target.value)}
                    placeholder="Kard"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Email *</Label>
                <Input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => updateForm("ownerEmail", e.target.value)}
                  placeholder="ahmed@agence.com"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Téléphone</Label>
                <Input
                  value={form.ownerPhone}
                  onChange={(e) => updateForm("ownerPhone", e.target.value)}
                  placeholder="+213 555 123 456"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Mot de passe *</Label>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.ownerPassword}
                    onChange={(e) => updateForm("ownerPassword", e.target.value)}
                    placeholder="Minimum 8 caractères"
                    className="bg-background border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="border-border shrink-0"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Le CEO utilisera cet email et mot de passe pour se connecter.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {creating ? "Création..." : "Créer le workspace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une entreprise..."
                className="pl-9 bg-background border-border text-foreground focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-background/50 border-b border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Entreprise</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Statut</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Users</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Clients</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Creation</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell className="font-bold text-foreground">
                    <Link href={`/super-admin/entreprises/${tenant.id}`} className="hover:text-primary flex items-center gap-2">
                      {tenant.name}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-bold uppercase border-border text-muted-foreground">
                      {tenant.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell className="text-muted-foreground font-medium">{tenant._count.users}</TableCell>
                  <TableCell className="text-muted-foreground font-medium">{tenant._count.clients}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(tenant.createdAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/super-admin/entreprises/${tenant.id}`}>
                      <Button size="icon" variant="ghost" aria-label="Voir les détails de l'entreprise" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun workspace trouve
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
