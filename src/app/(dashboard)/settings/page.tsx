"use client";

import { useState } from "react";
import { Building2, Settings2, Users2, Workflow, Link2, KeyRound, Mail, MessageCircle, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";


export default function SettingsPage() {
  const [workspaceForm, setWorkspaceForm] = useState({
    agencyName: "IMMO PRO-X",
    activityType: "Promotion Immobilière",
    address: "123 Rue Didouche Mourad, Alger Centre",
    rcNumber: "RC-16-00-1234567A12",
    contactEmail: "contact@immopro-x.dz",
  });

  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: "",
  });

  const [facebookForm, setFacebookForm] = useState({
    pageId: "",
  });

  function handleSaveWorkspace() {
    toast("Parametres sauvegardes");
  }

  function handleSaveSmtp() {
    toast("Parametres sauvegardes");
  }

  function handleSaveFacebook() {
    toast("Parametres sauvegardes");
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
            <h1 className="text-2xl font-black uppercase tracking-tight">Paramètres</h1>
            <p className="text-sm text-muted-foreground font-medium">Configuration globale du Workspace</p>
          </div>
        </div>
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
            <Link2 className="h-4 w-4" /> Intégrations
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
                <CardTitle className="text-lg font-black">Informations de l'entreprise</CardTitle>
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
                        <label className="text-xs font-bold uppercase text-muted-foreground">Nom de l'agence</label>
                        <Input value={workspaceForm.agencyName} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, agencyName: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Type d'activité</label>
                        <Input value={workspaceForm.activityType} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, activityType: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Adresse complète</label>
                        <Textarea value={workspaceForm.address} onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, address: e.target.value }))} className="resize-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">N° RC / SIRET</label>
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
                  <Button className="font-bold" onClick={handleSaveWorkspace}>Sauvegarder les modifications</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: USERS */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                  <CardTitle className="text-lg font-black">Membres de l'équipe</CardTitle>
                  <CardDescription>Gérez les accès et les rôles de vos collaborateurs.</CardDescription>
                </div>
                <Button size="sm" className="font-bold gap-1.5">
                  <Users2 className="h-4 w-4" /> Ajouter un membre
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-accent/30 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-bold">Utilisateur</th>
                      <th className="px-6 py-4 font-bold">Rôle</th>
                      <th className="px-6 py-4 font-bold">Statut</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Ahmed K.", email: "ahmed@immopro-x.dz", role: "CEO", status: "Actif" },
                      { name: "Sophie M.", email: "sophie@immopro-x.dz", role: "Agent Senior", status: "Actif" },
                      { name: "Lucas B.", email: "lucas@immopro-x.dz", role: "Agent Junior", status: "Inactif" },
                    ].map((u, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-accent/10">
                        <td className="px-6 py-4">
                          <p className="font-bold">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-black text-[10px] uppercase">{u.role}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {u.status === "Actif" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Actif</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground">Inactif</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button variant="ghost" size="sm" className="text-xs font-bold">Éditer</Button>
                          <Button variant="ghost" size="sm" className="text-xs font-bold text-red-600">Désactiver</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: INTEGRATIONS */}
          <TabsContent value="integrations" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-500" /> WhatsApp API</span>
                      <Badge className="bg-green-100 text-green-700 bg-opacity-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Connecté</Badge>
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
                      <Badge className="bg-green-100 text-green-700 bg-opacity-100 gap-1"><CheckCircle2 className="h-3 w-3" /> Connecté</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">Clé API (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)</label>
                      <Input type="password" value="AIzaSyAL9gL3TWaTxR5Y_tW7hLJvYgPph7Z0obs" readOnly className="font-mono text-xs" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full font-bold text-muted-foreground" disabled>Géré via Variables d'Env</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><Mail className="h-5 w-5 text-gray-500" /> SMTP Email</span>
                      <Badge variant="secondary" className="text-muted-foreground gap-1"><ShieldAlert className="h-3 w-3" /> Non Configuré</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Hôte SMTP</label>
                        <Input placeholder="smtp.mailtrap.io" value={smtpForm.host} onChange={(e) => setSmtpForm((prev) => ({ ...prev, host: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Port</label>
                        <Input placeholder="587" value={smtpForm.port} onChange={(e) => setSmtpForm((prev) => ({ ...prev, port: e.target.value }))} />
                      </div>
                    </div>
                    <Button size="sm" className="w-full font-bold" onClick={handleSaveSmtp}>Connecter SMTP</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-black flex items-center justify-between">
                      <span className="flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" /> Facebook Leads</span>
                      <Badge variant="secondary" className="text-muted-foreground gap-1"><ShieldAlert className="h-3 w-3" /> Non Configuré</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-muted-foreground">ID Page Facebook</label>
                      <Input placeholder="1234567890" value={facebookForm.pageId} onChange={(e) => setFacebookForm((prev) => ({ ...prev, pageId: e.target.value }))} />
                    </div>
                    <Button size="sm" className="w-full font-bold bg-[#1877F2] text-white hover:bg-[#1877F2]/90" onClick={handleSaveFacebook}>Connexion Facebook</Button>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* TAB: AUTOMATIONS */}
          <TabsContent value="automations" className="space-y-6">
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" /> Moteur de Règles Automatiques
                </CardTitle>
                <CardDescription>Automatisez les tâches chronophages lors des changements d'étapes dans le pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="p-4 border-b flex items-center justify-between hover:bg-accent/10 transition-colors">
                    <div>
                      <h4 className="font-black text-sm">Visite Confirmée ➔ Tâche de rappel</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Créer automatiquement une tâche "Rappel Visite" 24h avant.</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="relative inline-block w-8 h-4 rounded-full bg-primary/20"><div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-primary" /></div>
                       <Badge variant="outline" className="text-[9px] uppercase font-bold">Via Interne</Badge>
                    </div>
                 </div>
                 
                 <div className="p-4 border-b flex items-center justify-between hover:bg-accent/10 transition-colors">
                    <div>
                      <h4 className="font-black text-sm">Passage en "Vendu" ➔ Email Bravo</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Envoyer le Template Email "Félicitations" au client.</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="relative inline-block w-8 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800"><div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-neutral-400" /></div>
                       <Badge variant="outline" className="text-[9px] uppercase font-bold">Via SMTP</Badge>
                    </div>
                 </div>

                 <div className="p-4 flex items-center justify-between hover:bg-accent/10 transition-colors">
                    <div>
                      <h4 className="font-black text-sm">Nouveau Lead entrant ➔ Message WhatsApp</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Envoyer un message de bienvenue automatique sur WhatsApp.</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className="relative inline-block w-8 h-4 rounded-full bg-primary/20"><div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-primary" /></div>
                       <Badge variant="outline" className="text-[9px] uppercase font-bold text-green-600 border-green-200">Via WhatsApp API</Badge>
                    </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
