"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, CheckCircle2, Users, Activity, Loader2, AlertCircle, ArrowLeft,
  Briefcase, Trash2, UserMinus, Pencil, UserPlus, Clock, Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ITenantDetail {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  }>;
  _count: {
    clients: number;
    properties: number;
    projects: number;
  };
}

export default function WorkspaceDetailPanel() {
  const params = useParams();
  const id = params.id as string;

  const [tenant, setTenant] = useState<ITenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newPlan, setNewPlan] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  // Edit name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Add user dialog state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "AGENT",
  });

  // Extend demo dialog state
  const [isExtendDemoOpen, setIsExtendDemoOpen] = useState(false);
  const [extendDays, setExtendDays] = useState("14");
  const [extendingDemo, setExtendingDemo] = useState(false);

  // Convert demo state
  const [converting, setConverting] = useState(false);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}`);
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        setTenant(json.data);
        setNewStatus(json.data.status);
        setNewPlan(json.data.plan);
      }
    } catch {
      toast.error("Impossible de charger le workspace");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTenant(); }, [fetchTenant]);

  async function handleSave() {
    if (!tenant) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (newStatus !== tenant.status) body.status = newStatus;
      if (newPlan !== tenant.plan) body.plan = newPlan;

      if (Object.keys(body).length === 0) {
        toast.info("Aucune modification");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        toast.success("Workspace mis a jour");
        fetchTenant();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteWorkspace() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        toast.success(`Workspace supprime (${json.data.usersCleared} utilisateurs nettoyes dans Clerk)`);
        // Redirect back to list
        window.location.href = "/super-admin/entreprises";
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
      setIsDeleteOpen(false);
    }
  }

  async function handleToggleUser(userId: string, isActive: boolean) {
    setTogglingUser(userId);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        toast.success(`Utilisateur ${isActive ? "reactive" : "desactive"} (Clerk synchronise)`);
        fetchTenant();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la modification");
    } finally {
      setTogglingUser(null);
    }
  }

  // --- Feature 1: Edit workspace name ---
  function startEditingName() {
    if (!tenant) return;
    setEditedName(tenant.name);
    setIsEditingName(true);
  }

  async function handleSaveName() {
    if (!tenant || !editedName.trim() || editedName.trim() === tenant.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName.trim() }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        toast.success("Nom du workspace mis a jour");
        setIsEditingName(false);
        fetchTenant();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la mise a jour du nom");
    } finally {
      setSavingName(false);
    }
  }

  // --- Feature 2: Add user to workspace ---
  async function handleAddUser() {
    if (!tenant) return;
    setAddingUser(true);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Utilisateur cree avec succes");
        setIsAddUserOpen(false);
        setNewUserForm({ firstName: "", lastName: "", email: "", phone: "", password: "", role: "AGENT" });
        fetchTenant();
      } else {
        toast.error(json.error || "Erreur lors de la creation");
      }
    } catch {
      toast.error("Erreur lors de la creation de l'utilisateur");
    } finally {
      setAddingUser(false);
    }
  }

  // --- Feature 3: Extend demo period ---
  async function handleExtendDemo() {
    if (!tenant) return;
    const days = parseInt(extendDays, 10);
    if (isNaN(days) || days < 1) {
      toast.error("Nombre de jours invalide");
      return;
    }
    setExtendingDemo(true);
    try {
      const currentExpiry = tenant.settings?.demoExpiresAt
        ? new Date(tenant.settings.demoExpiresAt as string)
        : new Date();
      const newExpiry = new Date(currentExpiry);
      newExpiry.setDate(newExpiry.getDate() + days);

      const res = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { demoExpiresAt: newExpiry.toISOString() } }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        toast.success(`Demo prolongee de ${days} jours`);
        setIsExtendDemoOpen(false);
        fetchTenant();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la prolongation");
    } finally {
      setExtendingDemo(false);
    }
  }

  // --- Feature 4: Convert demo to active ---
  async function handleConvertToActive() {
    if (!tenant) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        toast.success("Workspace converti en abonnement actif — limites demo supprimees");
        fetchTenant();
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur lors de la conversion");
    } finally {
      setConverting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-lg font-bold text-foreground">Workspace introuvable</p>
        <Link href="/super-admin/entreprises">
          <Button variant="outline" className="border-border text-foreground gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </Link>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400",
    DEMO: "bg-amber-500/10 text-amber-400",
    SUSPENDED: "bg-rose-500/10 text-rose-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/super-admin/entreprises" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-bold">
              ← Retour
            </Link>
            <Badge className={`${statusColor[tenant.status] || ""} border-none font-black uppercase text-xs`}>
              {tenant.status}
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black uppercase text-xs">
              {tenant.plan}
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground font-bold uppercase text-xs">
              {tenant.type}
            </Badge>
          </div>
          {/* Editable name */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-black bg-background border-border text-foreground h-10 w-80"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 h-8"
                >
                  {savingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  OK
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(false)}
                  className="text-muted-foreground h-8"
                >
                  Annuler
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-black text-foreground tracking-tight">{tenant.name}</h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEditingName}
                  className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cree le {format(new Date(tenant.createdAt), "dd MMMM yyyy", { locale: fr })}
            {!!tenant.settings?.demoExpiresAt && (
              <> — Demo expire le {format(new Date(tenant.settings.demoExpiresAt as string), "dd MMMM yyyy", { locale: fr })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Demo-specific actions */}
          {tenant.status === "DEMO" && (
            <>
              <Button
                variant="outline"
                onClick={() => setIsExtendDemoOpen(true)}
                className="border-amber-800 text-amber-400 hover:bg-amber-500/10 font-bold gap-2"
              >
                <Clock className="h-4 w-4" />
                Prolonger la demo
              </Button>
              <Button
                onClick={handleConvertToActive}
                disabled={converting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              >
                {converting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Convertir en abonnement
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => setIsDeleteOpen(true)}
            className="border-rose-800 text-rose-400 hover:bg-rose-500/10 font-bold gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Plan */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                Statut et Plan
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Changez le statut pour activer l&apos;abonnement ou suspendre le workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Statut</label>
                  <Select value={newStatus} onValueChange={(v: string | null) => setNewStatus(v || "")}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEMO">Demo (essai gratuit)</SelectItem>
                      <SelectItem value="ACTIVE">Actif (abonnement payant)</SelectItem>
                      <SelectItem value="SUSPENDED">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                  {newStatus === "ACTIVE" && tenant.status === "DEMO" && (
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Cela activera l&apos;abonnement et supprimera les limites demo
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground">Plan</label>
                  <Select value={newPlan} onValueChange={(v: string | null) => setNewPlan(v || "")}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-cyan-400" />
                  Utilisateurs ({tenant.users.length})
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddUserOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Ajouter un utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tenant.users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                    <div>
                      <p className="font-bold text-foreground text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs uppercase font-bold ${u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"} border-none`}>
                        {u.role}
                      </Badge>
                      {u.isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-rose-400 hover:bg-rose-500/10 font-bold gap-1"
                          disabled={togglingUser === u.id}
                          onClick={() => handleToggleUser(u.id, false)}
                        >
                          {togglingUser === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserMinus className="h-3 w-3" />}
                          Desactiver
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 font-bold gap-1"
                          disabled={togglingUser === u.id}
                          onClick={() => handleToggleUser(u.id, true)}
                        >
                          {togglingUser === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Reactiver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {tenant.users.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-4">Aucun utilisateur</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats */}
        <div className="space-y-6">
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-emerald-400" />
                Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                <span className="text-sm text-muted-foreground">Clients</span>
                <span className="text-lg font-black text-foreground">{tenant._count.clients}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                <span className="text-sm text-muted-foreground">Biens</span>
                <span className="text-lg font-black text-foreground">{tenant._count.properties}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                <span className="text-sm text-muted-foreground">Projets</span>
                <span className="text-lg font-black text-foreground">{tenant._count.projects}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-background border border-border">
                <span className="text-sm text-muted-foreground">Utilisateurs</span>
                <span className="text-lg font-black text-foreground">{tenant.users.length}</span>
              </div>

              {!!tenant.settings?.demoLimits && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-bold text-amber-400 uppercase mb-2">Limites Demo</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Max clients: {(tenant.settings.demoLimits as Record<string, number>)?.maxClients ?? "—"}</p>
                    <p>Max biens: {(tenant.settings.demoLimits as Record<string, number>)?.maxProperties ?? "—"}</p>
                    <p>Max users: {(tenant.settings.demoLimits as Record<string, number>)?.maxUsers ?? "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> Supprimer le workspace
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cette action est irreversible. Le workspace <strong className="text-foreground">{tenant.name}</strong> sera supprime avec toutes ses donnees (clients, biens, projets). Les comptes Clerk des {tenant.users.length} utilisateur(s) seront nettoyes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground"
              onClick={() => setIsDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2"
              onClick={handleDeleteWorkspace}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Confirmer la suppression
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-400" /> Ajouter un utilisateur
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Creez un nouvel utilisateur dans le workspace <strong className="text-foreground">{tenant.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Prenom</Label>
                <Input
                  value={newUserForm.firstName}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Jean"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Nom</Label>
                <Input
                  value={newUserForm.lastName}
                  onChange={(e) => setNewUserForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Dupont"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="jean.dupont@exemple.com"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-muted-foreground">Telephone (optionnel)</Label>
              <Input
                type="tel"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+33 6 12 34 56 78"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-muted-foreground">Mot de passe</Label>
              <Input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 caracteres"
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold text-muted-foreground">Role</Label>
              <Select value={newUserForm.role} onValueChange={(v) => setNewUserForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="SUPERVISOR">Superviseur</SelectItem>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground"
              onClick={() => setIsAddUserOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
              onClick={handleAddUser}
              disabled={addingUser || !newUserForm.firstName || !newUserForm.lastName || !newUserForm.email || !newUserForm.password}
            >
              {addingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Creer l&apos;utilisateur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Demo Dialog */}
      <Dialog open={isExtendDemoOpen} onOpenChange={setIsExtendDemoOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-400" /> Prolonger la demo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ajoutez des jours supplementaires a la periode de demo de <strong className="text-foreground">{tenant.name}</strong>.
              {!!tenant.settings?.demoExpiresAt && (
                <> Expiration actuelle : {format(new Date(tenant.settings.demoExpiresAt as string), "dd MMMM yyyy", { locale: fr })}.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-muted-foreground">Nombre de jours a ajouter</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="14"
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-border text-foreground"
              onClick={() => setIsExtendDemoOpen(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
              onClick={handleExtendDemo}
              disabled={extendingDemo || !extendDays}
            >
              {extendingDemo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Prolonger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
