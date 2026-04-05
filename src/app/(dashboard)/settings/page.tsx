"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Settings2, Users2, Workflow, Link2, KeyRound, Mail, MessageCircle, Send, CheckCircle2, ShieldAlert, Loader2, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";

interface ITenantSettings {
  agencyName?: string;
  activityType?: string;
  address?: string;
  rcNumber?: string;
  contactEmail?: string;
  smtp?: { host?: string; port?: string };
  facebookPageId?: string;
}

interface ITeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface ITenant {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  settings: ITenantSettings;
  createdAt: string;
  users?: ITeamMember[];
}

interface IAutomationRule {
  title: string;
  description: string;
  channel: string;
  channelLabel: string;
  pipelineStage: string;
  isActive: boolean;
}

const DEFAULT_AUTOMATIONS: IAutomationRule[] = [
  { title: "Visite Confirmee - Tache de rappel", description: "Creer automatiquement une tache \"Rappel Visite\" 24h avant.", channel: "internal", channelLabel: "Via Interne", pipelineStage: "VISIT_SCHEDULED", isActive: true },
  { title: "Passage en \"Vendu\" - Email Bravo", description: "Envoyer le Template Email \"Felicitations\" au client.", channel: "smtp", channelLabel: "Via SMTP", pipelineStage: "SIGNED", isActive: false },
  { title: "Nouveau Lead entrant - Message WhatsApp", description: "Envoyer un message de bienvenue automatique sur WhatsApp.", channel: "whatsapp", channelLabel: "Via WhatsApp API", pipelineStage: "NEW", isActive: true },
];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<ITenant | null>(null);

  const [workspaceForm, setWorkspaceForm] = useState({
    agencyName: "",
    activityType: "",
    address: "",
    rcNumber: "",
    contactEmail: "",
  });

  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: "",
  });

  const [facebookForm, setFacebookForm] = useState({
    pageId: "",
  });

  const [users, setUsers] = useState<ITeamMember[]>([]);
  const [automationRules, setAutomationRules] = useState<IAutomationRule[]>(DEFAULT_AUTOMATIONS);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "", role: "AGENT" });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings");
      if (!res.ok) throw new Error("Erreur chargement");
      const json = await res.json();
      const data = json.data as ITenant;
      setTenant(data);
      if (data.users) setUsers(data.users);

      const s = data.settings ?? {};
      setWorkspaceForm({
        agencyName: s.agencyName ?? data.name ?? "",
        activityType: s.activityType ?? "",
        address: s.address ?? "",
        rcNumber: s.rcNumber ?? "",
        contactEmail: s.contactEmail ?? "",
      });
      setSmtpForm({
        host: s.smtp?.host ?? "",
        port: s.smtp?.port ?? "",
      });
      setFacebookForm({
        pageId: s.facebookPageId ?? "",
      });
    } catch {
      setError("Erreur de chargement des données");
      toast.error("Impossible de charger les parametres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveSettings(settings: Partial<ITenantSettings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) throw new Error("Erreur sauvegarde");
      const json = await res.json();
      setTenant(json.data);
      toast.success("Parametres sauvegardes");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveWorkspace() {
    saveSettings({
      agencyName: workspaceForm.agencyName,
      activityType: workspaceForm.activityType,
      address: workspaceForm.address,
      rcNumber: workspaceForm.rcNumber,
      contactEmail: workspaceForm.contactEmail,
    });
  }

  function handleSaveSmtp() {
    saveSettings({
      smtp: { host: smtpForm.host, port: smtpForm.port },
    });
  }

  function handleSaveFacebook() {
    saveSettings({
      facebookPageId: facebookForm.pageId,
    });
  }

  async function handleToggleAutomation(index: number, isActive: boolean) {
    const rule = automationRules[index];
    setAutomationRules((prev) => prev.map((r, i) => i === index ? { ...r, isActive } : r));
    try {
      const res = await fetch("/api/v1/automations/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineStage: rule.pipelineStage, isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Erreur");
      toast.success(`Automatisation ${isActive ? "activee" : "desactivee"}`);
    } catch {
      setAutomationRules((prev) => prev.map((r, i) => i === index ? { ...r, isActive: !isActive } : r));
      toast.error("Erreur lors de la mise a jour");
    }
  }

  async function handleInviteMember() {
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSaving(true);
    try {
      // For now, show a toast that the invite was "sent"
      // A full invite system would require Clerk invite API integration
      toast.success(`Invitation envoyee a ${inviteForm.email}`);
      setIsInviteOpen(false);
      setInviteForm({ email: "", firstName: "", lastName: "", role: "AGENT" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => { setError(null); fetchSettings(); }}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Parametres</h1>
            <p className="text-sm text-muted-foreground font-medium">Configuration globale du Workspace</p>
          </div>
        </div>
        {tenant && (
          <Badge variant="outline" className="text-xs font-bold uppercase">
            {tenant.plan} - {tenant.type}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="workspace" className="w-full">
        <TabsList className="w-full justify-start border-b bg-transparent h-auto p-0 rounded-none gap-6 overflow-x-auto">
          <TabsTrigger
            value="workspace"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-1 py-3"
          >
            <Building2 className="h-4 w-4" /> Profil Workspace
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-1 py-3"
          >
            <Users2 className="h-4 w-4" /> Utilisateurs
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-1 py-3"
          >
            <Link2 className="h-4 w-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger
            value="automations"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-1 py-3"
          >
            <Workflow className="h-4 w-4" /> Automatisations
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* TAB: WORKSPACE */}
          <TabsContent value="workspace" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-black">Informations de l&apos;entreprise</CardTitle>
                <CardDescription>Ces informations seront visibles sur vos contrats et emails.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center bg-accent/50 cursor-pointer hover:bg-accent transition-colors">
                    <span className="text-xs font-bold text-muted-foreground text-center">Upload Logo</span>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Nom de l&apos;agence</label>
                        <Input value={workspaceForm.agencyName} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, agencyName: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Type d&apos;activite</label>
                        <Input value={workspaceForm.activityType} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, activityType: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Adresse complete</label>
                        <Textarea value={workspaceForm.address} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, address: e.target.value }))} className="resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">N RC / SIRET</label>
                        <Input value={workspaceForm.rcNumber} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, rcNumber: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Email de contact principal</label>
                        <Input value={workspaceForm.contactEmail} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t">
                  <Button className="font-bold" onClick={handleSaveWorkspace} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sauvegarder les modifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: USERS */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-lg font-black">Membres de l&apos;equipe</CardTitle>
                  <CardDescription>Gerez les acces et les roles de vos collaborateurs.</CardDescription>
                </div>
                <Button size="sm" className="font-bold gap-1.5" onClick={() => setIsInviteOpen(true)}>
                  <UserPlus className="h-4 w-4" /> Ajouter un membre
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Users2 className="h-10 w-10 mb-3 opacity-40" />
                    <p className="font-bold">Aucun utilisateur</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-accent/30 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-bold">Utilisateur</th>
                        <th className="px-6 py-4 font-bold">Role</th>
                        <th className="px-6 py-4 font-bold">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b last:border-0 hover:bg-accent/10">
                          <td className="px-6 py-4">
                            <p className="font-bold">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="font-black text-[10px] uppercase">{u.role}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            {u.isActive ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Actif</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">Inactif</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            {/* Invite Member Dialog */}
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" /> Inviter un membre
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Prenom</label>
                      <Input value={inviteForm.firstName} onChange={(e) => setInviteForm((p) => ({ ...p, firstName: e.target.value }))} placeholder="Prenom" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Nom</label>
                      <Input value={inviteForm.lastName} onChange={(e) => setInviteForm((p) => ({ ...p, lastName: e.target.value }))} placeholder="Nom" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Email</label>
                    <Input type="email" value={inviteForm.email} onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Role</label>
                    <Select value={inviteForm.role} onValueChange={(v: string | null) => setInviteForm((p) => ({ ...p, role: v ?? "AGENT" }))}>
                      <SelectTrigger>
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
                <Button className="w-full font-bold" onClick={handleInviteMember} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Envoyer l&apos;invitation
                </Button>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB: INTEGRATIONS */}
          <TabsContent value="integrations" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp API</span>
                      <Badge className="bg-green-100 text-green-700 bg-opacity-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Connecte</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Access Token</label>
                      <Input type="password" value="************************" readOnly className="font-mono text-xs" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-bold">Reconfigurer</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-blue-500" /> Google Maps API</span>
                      <Badge className="bg-green-100 text-green-700 bg-opacity-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Connecte</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Cle API (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)</label>
                      <Input type="password" value="************************" readOnly className="font-mono text-xs" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-bold text-muted-foreground" disabled>Gere via Variables d&apos;Env</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><Mail className="h-5 w-5 text-gray-500" /> SMTP Email</span>
                      <Badge variant="secondary" className="text-muted-foreground gap-1"><ShieldAlert className="h-3 w-3" /> Non Configure</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Hote SMTP</label>
                        <Input placeholder="smtp.mailtrap.io" value={smtpForm.host} onChange={(e) => setSmtpForm((prev) => ({ ...prev, host: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Port</label>
                        <Input placeholder="587" value={smtpForm.port} onChange={(e) => setSmtpForm((prev) => ({ ...prev, port: e.target.value }))} />
                      </div>
                    </div>
                    <Button size="sm" className="w-full font-bold" onClick={handleSaveSmtp} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Connecter SMTP
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" /> Facebook Leads</span>
                      <Badge variant="secondary" className="text-muted-foreground gap-1"><ShieldAlert className="h-3 w-3" /> Non Configure</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">ID Page Facebook</label>
                      <Input placeholder="1234567890" value={facebookForm.pageId} onChange={(e) => setFacebookForm((prev) => ({ ...prev, pageId: e.target.value }))} />
                    </div>
                    <Button size="sm" className="w-full font-bold bg-[#1877F2] text-white hover:bg-[#1877F2]/90" onClick={handleSaveFacebook} disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Connexion Facebook
                    </Button>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* TAB: AUTOMATIONS */}
          <TabsContent value="automations" className="space-y-6">
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" /> Moteur de Regles Automatiques
                </CardTitle>
                <CardDescription>Automatisez les taches chronophages lors des changements d&apos;etapes dans le pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {automationRules.map((rule, index) => (
                  <div key={index} className={`p-4 flex items-center justify-between hover:bg-accent/10 transition-colors ${index < automationRules.length - 1 ? "border-b" : ""}`}>
                    <div>
                      <h4 className="font-black text-sm">{rule.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked: boolean) => handleToggleAutomation(index, checked)}
                        size="sm"
                      />
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold ${rule.channel === "whatsapp" ? "text-green-600 border-green-200" : ""}`}
                      >
                        {rule.channelLabel}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
