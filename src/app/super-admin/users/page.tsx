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
} from "@/components/ui/dialog";
import { Search, Loader2, AlertCircle, RefreshCw, KeyRound, Eye, EyeOff, Power } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    type: string;
    plan: string;
  };
}

export default function SuperAdminUsers() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetUserName, setResetUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Toggle loading tracker
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/admin/users");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(userId: string) {
    setTogglingId(userId);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "toggle-active" }),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev: IUser[]) =>
          prev.map((u: IUser) => (u.id === userId ? { ...u, isActive: json.data.isActive } : u))
        );
        toast.success(json.data.isActive ? "Utilisateur active" : "Utilisateur desactive");
      } else {
        toast.error(json.error || "Erreur");
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setTogglingId(null);
    }
  }

  function openResetDialog(user: IUser) {
    setResetUserId(user.id);
    setResetUserName(`${user.firstName} ${user.lastName}`);
    setNewPassword("");
    setShowPassword(false);
    setResetDialogOpen(true);
  }

  async function handleResetPassword() {
    if (!resetUserId || !newPassword) {
      toast.error("Veuillez saisir un nouveau mot de passe");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetUserId, action: "reset-password", newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Mot de passe mis a jour avec succes");
        setResetDialogOpen(false);
      } else {
        toast.error(json.error || "Erreur lors de la reinitialisation");
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setResetting(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u: IUser) =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      CEO: "bg-emerald-500/10 text-emerald-400",
      SUPERVISOR: "bg-indigo-500/10 text-indigo-400",
      AGENT: "bg-cyan-500/10 text-cyan-400",
      ASSISTANT: "bg-muted text-muted-foreground",
    };
    return (
      <Badge className={`${colors[role] || "bg-muted text-muted-foreground"} border-none font-black uppercase text-xs`}>
        {role}
      </Badge>
    );
  };

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

  const getStatusIndicator = (isActive: boolean) => {
    if (isActive) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Actif
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-400">
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        Inactif
      </div>
    );
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
        <p className="text-lg font-bold text-foreground">Impossible de charger les utilisateurs</p>
        <Button onClick={fetchUsers} variant="outline" className="border-border text-foreground gap-2">
          <RefreshCw className="h-4 w-4" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Utilisateurs ({users.length})</h1>
          <p className="text-sm text-muted-foreground mt-1">Tous les utilisateurs de la plateforme IMMO PRO-X.</p>
        </div>
      </div>

      <Card className="bg-card/50 border-border backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                className="pl-9 bg-background border-border text-foreground focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-background/50 border-b border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Nom</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Email</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Workspace</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Statut</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Creation</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell className="font-bold text-foreground">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-bold border-border text-muted-foreground">
                      {user.tenant.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPlanBadge(user.tenant.plan)}</TableCell>
                  <TableCell>{getStatusIndicator(user.isActive)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={user.isActive ? "Desactiver l'utilisateur" : "Activer l'utilisateur"}
                        className={`h-8 w-8 ${
                          user.isActive
                            ? "text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                            : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                        disabled={togglingId === user.id}
                        onClick={() => handleToggleActive(user.id)}
                      >
                        {togglingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Reinitialiser le mot de passe"
                        className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => openResetDialog(user)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur trouve
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => { setResetDialogOpen(open); if (!open) { setNewPassword(""); setShowPassword(false); } }}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Reinitialiser le mot de passe
            </DialogTitle>
            <DialogDescription>
              Definir un nouveau mot de passe pour <span className="font-bold text-foreground">{resetUserName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Nouveau mot de passe *</Label>
              <div className="flex gap-2">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caracteres"
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
              <p className="text-xs text-muted-foreground">L&apos;utilisateur devra utiliser ce nouveau mot de passe pour se connecter.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="border-border">
              Annuler
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
            >
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {resetting ? "Mise a jour..." : "Reinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
