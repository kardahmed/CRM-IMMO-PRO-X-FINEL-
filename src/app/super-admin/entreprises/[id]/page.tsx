"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Save, Ban, CheckCircle2, Users, Activity, Loader2, AlertCircle, ArrowLeft, Briefcase, Trash2, UserMinus } from "lucide-react";
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

  async function fetchTenant() {
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
  }

  useEffect(() => { fetchTenant(); }, [id]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-lg font-bold text-white">Workspace introuvable</p>
        <Link href="/super-admin/entreprises">
          <Button variant="outline" className="border-neutral-800 text-white gap-2">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/super-admin/entreprises" className="text-neutral-500 hover:text-white transition-colors text-sm font-bold">
              ← Retour
            </Link>
            <Badge className={`${statusColor[tenant.status] || ""} border-none font-black uppercase text-[10px]`}>
              {tenant.status}
            </Badge>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black uppercase text-[10px]">
              {tenant.plan}
            </Badge>
            <Badge variant="outline" className="border-neutral-700 text-neutral-400 font-bold uppercase text-[10px]">
              {tenant.type}
            </Badge>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{tenant.name}</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Cree le {format(new Date(tenant.createdAt), "dd MMMM yyyy", { locale: fr })}
            {!!tenant.settings?.demoExpiresAt && (
              <> — Demo expire le {format(new Date(tenant.settings.demoExpiresAt as string), "dd MMMM yyyy", { locale: fr })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-indigo-400" />
                Statut et Plan
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Changez le statut pour activer l'abonnement ou suspendre le workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-300">Statut</label>
                  <Select value={newStatus} onValueChange={(v: string | null) => setNewStatus(v || "")}>
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
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
                      Cela activera l'abonnement et supprimera les limites demo
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neutral-300">Plan</label>
                  <Select value={newPlan} onValueChange={(v: string | null) => setNewPlan(v || "")}>
                    <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
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
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-cyan-400" />
                Utilisateurs ({tenant.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tenant.users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    <div>
                      <p className="font-bold text-white text-sm">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-neutral-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] uppercase font-bold ${u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-neutral-800 text-neutral-500"} border-none`}>
                        {u.role}
                      </Badge>
                      {u.isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] text-rose-400 hover:bg-rose-500/10 font-bold gap-1"
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
                          className="h-7 text-[10px] text-emerald-400 hover:bg-emerald-500/10 font-bold gap-1"
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
                  <p className="text-neutral-500 text-sm text-center py-4">Aucun utilisateur</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats */}
        <div className="space-y-6">
          <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-emerald-400" />
                Utilisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-sm text-neutral-400">Clients</span>
                <span className="text-lg font-black text-white">{tenant._count.clients}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-sm text-neutral-400">Biens</span>
                <span className="text-lg font-black text-white">{tenant._count.properties}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-sm text-neutral-400">Projets</span>
                <span className="text-lg font-black text-white">{tenant._count.projects}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                <span className="text-sm text-neutral-400">Utilisateurs</span>
                <span className="text-lg font-black text-white">{tenant.users.length}</span>
              </div>

              {!!tenant.settings?.demoLimits && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs font-bold text-amber-400 uppercase mb-2">Limites Demo</p>
                  <div className="space-y-1 text-xs text-neutral-400">
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
        <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" /> Supprimer le workspace
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Cette action est irreversible. Le workspace <strong className="text-white">{tenant.name}</strong> sera supprime avec toutes ses donnees (clients, biens, projets). Les comptes Clerk des {tenant.users.length} utilisateur(s) seront nettoyes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1 border-neutral-700 text-white"
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
    </div>
  );
}
