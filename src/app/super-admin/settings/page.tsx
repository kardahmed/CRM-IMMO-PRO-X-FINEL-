"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Database, Globe, Bell, Server, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SuperAdminSettings() {
  const [webhookSecret, setWebhookSecret] = useState("");
  const [cronSecret, setCronSecret] = useState("");
  const [encryptionSecret, setEncryptionSecret] = useState("");

  function handleSave() {
    toast.success("Configuration sauvegardee (simulation)");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-20">
      <header className="flex flex-col gap-3 pb-6 border-b border-border/50">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] w-fit">
          <Settings className="h-3.5 w-3.5" /> Configuration
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">
          Config Systeme
        </h1>
        <p className="text-sm text-muted-foreground">Parametres globaux de la plateforme IMMO PRO-X.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Info */}
        <Card className="bg-card border-border shadow-stripe rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Plateforme
            </CardTitle>
            <CardDescription>Informations sur l&apos;instance en cours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Version", value: "v1.4.0" },
              { label: "Environnement", value: "Production" },
              { label: "Framework", value: "Next.js 14 (App Router)" },
              { label: "Base de donnees", value: "Supabase PostgreSQL" },
              { label: "Auth Provider", value: "Supabase Auth" },
              { label: "ORM", value: "Prisma 7" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 rounded-2xl bg-accent/50 border border-border">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Badge variant="outline" className="text-xs font-bold border-border">
                  {item.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-card border-border shadow-stripe rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> Securite
            </CardTitle>
            <CardDescription>
              Cles et tokens de securite. Ces valeurs sont stockees dans les variables d&apos;environnement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Supabase Webhook Secret</label>
              <Input
                type="password"
                placeholder="SUPABASE_WEBHOOK_SECRET"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="bg-background border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CRON Secret</label>
              <Input
                type="password"
                placeholder="CRON_SECRET"
                value={cronSecret}
                onChange={(e) => setCronSecret(e.target.value)}
                className="bg-background border-border focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Encryption Secret</label>
              <Input
                type="password"
                placeholder="ENCRYPTION_SECRET (min 32 chars)"
                value={encryptionSecret}
                onChange={(e) => setEncryptionSecret(e.target.value)}
                className="bg-background border-border focus:border-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-card border-border shadow-stripe rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" /> Fonctionnalites Globales
            </CardTitle>
            <CardDescription>Activer ou desactiver des fonctionnalites pour tous les workspaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Moteur IA (Suggestions)", enabled: true },
              { label: "Integration Facebook Leads", enabled: true },
              { label: "Integration WhatsApp", enabled: false },
              { label: "Scraping Cadastral", enabled: true },
              { label: "Portail Client", enabled: true },
              { label: "Mode Maintenance", enabled: false },
            ].map((feature) => (
              <div key={feature.label} className="flex justify-between items-center p-3 rounded-2xl bg-accent/50 border border-border">
                <span className="text-sm text-foreground">{feature.label}</span>
                {feature.enabled ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold uppercase">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Actif
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-bold uppercase">
                    Inactif
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border shadow-stripe rounded-[32px]">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Notifications Admin
            </CardTitle>
            <CardDescription>Alertes et notifications pour le Super Admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Nouveau workspace cree", enabled: true },
              { label: "Workspace suspendu", enabled: true },
              { label: "Depassement quota IA", enabled: true },
              { label: "Erreur critique systeme", enabled: true },
              { label: "Nouveau paiement recu", enabled: false },
            ].map((notif) => (
              <div key={notif.label} className="flex justify-between items-center p-3 rounded-2xl bg-accent/50 border border-border">
                <span className="text-sm text-foreground">{notif.label}</span>
                {notif.enabled ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold uppercase">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-bold uppercase">
                    Inactive
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl px-8">
          Sauvegarder la configuration
        </Button>
      </div>
    </div>
  );
}
