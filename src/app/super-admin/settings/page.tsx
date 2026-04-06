"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Shield,
  Globe,
  Mail,
  Bell,
  Database,
  Key,
  Save,
  Loader2,
  Server,
  Lock,
  CreditCard,
  FileText,
  Palette,
  Clock,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface IPlatformConfig {
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  maxWorkspaces: number;
  maxUsersPerWorkspace: number;
  defaultPlan: string;
  demoExpiryDays: number;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  slackWebhookUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  smtpFromEmail: string;
  smtpFromName: string;
  anthropicApiKey: string;
  googleMapsApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  sentryDsn: string;
  logLevel: string;
  backupEnabled: boolean;
  backupFrequency: string;
  rateLimitPerMinute: number;
  sessionTimeoutMinutes: number;
}

// TODO: charger la config depuis /api/v1/admin/config
const DEFAULT_CONFIG: IPlatformConfig = {
  platformName: "CRM IMMO PRO-X",
  platformUrl: "https://crm-immo-pro-x.vercel.app",
  supportEmail: "contact@sensium-x.com",
  maxWorkspaces: 100,
  maxUsersPerWorkspace: 50,
  defaultPlan: "STARTER",
  demoExpiryDays: 14,
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  slackWebhookUrl: "",
  smtpHost: "smtp.resend.com",
  smtpPort: "465",
  smtpUser: "resend",
  smtpPassword: "",
  smtpFromEmail: "noreply@sensium-x.com",
  smtpFromName: "CRM IMMO PRO-X",
  anthropicApiKey: "sk-ant-***",
  googleMapsApiKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  sentryDsn: "",
  logLevel: "warn",
  backupEnabled: true,
  backupFrequency: "daily",
  rateLimitPerMinute: 60,
  sessionTimeoutMinutes: 480,
};

/* -------------------------------------------------------------------------- */
/*  Section Component                                                         */
/* -------------------------------------------------------------------------- */

function ConfigSection({
  icon: Icon,
  title,
  description,
  children,
  badge,
  badgeColor,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <Card className="bg-card border-border shadow-stripe rounded-[24px] overflow-hidden">
      <CardHeader className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-foreground tracking-tight uppercase">
                {title}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>
          {badge && (
            <Badge variant="outline" className={cn("text-xs font-bold uppercase tracking-wider", badgeColor)}>
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">{children}</CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field Components                                                          */
/* -------------------------------------------------------------------------- */

function FieldGroup({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

function SecretField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldGroup label={label} hint={hint}>
      <div className="flex gap-2">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-background border-border text-foreground font-mono text-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setVisible(!visible)}
          className="border-border shrink-0"
          aria-label={visible ? "Masquer" : "Afficher"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </FieldGroup>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-accent/50 border border-border/50">
      <div className="space-y-0.5">
        <p className={cn("text-sm font-bold", danger ? "text-destructive" : "text-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function SuperAdminSettings() {
  const [config, setConfig] = useState<IPlatformConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "email" | "api" | "security" | "system">("general");

  const update = <K extends keyof IPlatformConfig>(key: K, value: IPlatformConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setSaving(false);
    toast.success("Configuration sauvegardée", {
      description: "Les changements seront appliqués immédiatement.",
    });
  };

  const tabs = [
    { id: "general" as const, label: "Général", icon: Globe },
    { id: "email" as const, label: "Email / SMTP", icon: Mail },
    { id: "api" as const, label: "Clés API", icon: Key },
    { id: "security" as const, label: "Sécurité", icon: Shield },
    { id: "system" as const, label: "Système", icon: Server },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <Zap className="h-3 w-3" /> Config Système
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter italic uppercase underline decoration-primary decoration-8 underline-offset-8">
            Paramètres
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider rounded-2xl px-8 py-6 text-sm shadow-stripe"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 uppercase tracking-wider",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
              )}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* === GENERAL === */}
        {activeTab === "general" && (
          <div className="grid gap-8 md:grid-cols-2">
            <ConfigSection icon={Globe} title="Identité Plateforme" description="Nom, URL et coordonnées de la plateforme">
              <FieldGroup label="Nom de la plateforme">
                <Input
                  value={config.platformName}
                  onChange={(e) => update("platformName", e.target.value)}
                  className="bg-background border-border text-foreground font-bold"
                />
              </FieldGroup>
              <FieldGroup label="URL de production">
                <Input
                  value={config.platformUrl}
                  onChange={(e) => update("platformUrl", e.target.value)}
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
              </FieldGroup>
              <FieldGroup label="Email de support">
                <Input
                  value={config.supportEmail}
                  onChange={(e) => update("supportEmail", e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </FieldGroup>
            </ConfigSection>

            <ConfigSection icon={CreditCard} title="Plans & Limites" description="Quotas par défaut pour les workspaces">
              <FieldGroup label="Max workspaces" hint="Nombre maximum de workspaces sur la plateforme">
                <Input
                  type="number"
                  value={config.maxWorkspaces}
                  onChange={(e) => update("maxWorkspaces", Number(e.target.value))}
                  className="bg-background border-border text-foreground tabular-nums"
                />
              </FieldGroup>
              <FieldGroup label="Max utilisateurs / workspace">
                <Input
                  type="number"
                  value={config.maxUsersPerWorkspace}
                  onChange={(e) => update("maxUsersPerWorkspace", Number(e.target.value))}
                  className="bg-background border-border text-foreground tabular-nums"
                />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Plan par défaut">
                  <select
                    value={config.defaultPlan}
                    onChange={(e) => update("defaultPlan", e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="ESSENTIAL">Essential</option>
                    <option value="BUSINESS">Business</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </FieldGroup>
                <FieldGroup label="Durée démo (jours)">
                  <Input
                    type="number"
                    value={config.demoExpiryDays}
                    onChange={(e) => update("demoExpiryDays", Number(e.target.value))}
                    className="bg-background border-border text-foreground tabular-nums"
                  />
                </FieldGroup>
              </div>
            </ConfigSection>

            <ConfigSection icon={Bell} title="Notifications" description="Alertes plateforme et intégrations" badge="Actif" badgeColor="text-emerald-600 border-emerald-600/30">
              <ToggleField
                label="Notifications email"
                description="Envoyer des emails aux admins pour les événements critiques"
                checked={config.emailNotifications}
                onChange={(v) => update("emailNotifications", v)}
              />
              <FieldGroup label="Webhook Slack" hint="Recevez les alertes dans un channel Slack">
                <Input
                  value={config.slackWebhookUrl}
                  onChange={(e) => update("slackWebhookUrl", e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
              </FieldGroup>
            </ConfigSection>

            <ConfigSection icon={Palette} title="Inscription & Onboarding" description="Contrôle de l'accès à la plateforme">
              <ToggleField
                label="Inscription ouverte"
                description="Permettre à de nouveaux utilisateurs de créer un workspace"
                checked={config.registrationEnabled}
                onChange={(v) => update("registrationEnabled", v)}
              />
              <ToggleField
                label="Mode maintenance"
                description="Bloque l'accès à la plateforme pour tous sauf le super admin"
                checked={config.maintenanceMode}
                onChange={(v) => update("maintenanceMode", v)}
                danger
              />
            </ConfigSection>
          </div>
        )}

        {/* === EMAIL / SMTP === */}
        {activeTab === "email" && (
          <div className="grid gap-8 md:grid-cols-2">
            <ConfigSection icon={Mail} title="Serveur SMTP" description="Configuration du serveur d'envoi d'emails">
              <FieldGroup label="Hôte SMTP">
                <Input
                  value={config.smtpHost}
                  onChange={(e) => update("smtpHost", e.target.value)}
                  placeholder="smtp.resend.com"
                  className="bg-background border-border text-foreground font-mono text-sm"
                />
              </FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup label="Port">
                  <Input
                    value={config.smtpPort}
                    onChange={(e) => update("smtpPort", e.target.value)}
                    className="bg-background border-border text-foreground tabular-nums"
                  />
                </FieldGroup>
                <FieldGroup label="Utilisateur">
                  <Input
                    value={config.smtpUser}
                    onChange={(e) => update("smtpUser", e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </FieldGroup>
              </div>
              <SecretField
                label="Mot de passe SMTP"
                value={config.smtpPassword}
                onChange={(v) => update("smtpPassword", v)}
                placeholder="re_xxxxxxxxxxxxx"
              />
            </ConfigSection>

            <ConfigSection icon={FileText} title="Expéditeur" description="Informations affichées dans les emails envoyés">
              <FieldGroup label="Email expéditeur">
                <Input
                  value={config.smtpFromEmail}
                  onChange={(e) => update("smtpFromEmail", e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </FieldGroup>
              <FieldGroup label="Nom expéditeur">
                <Input
                  value={config.smtpFromName}
                  onChange={(e) => update("smtpFromName", e.target.value)}
                  className="bg-background border-border text-foreground"
                />
              </FieldGroup>
              <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent rounded-xl">
                <Mail className="h-4 w-4 mr-2" />
                Envoyer un email de test
              </Button>
            </ConfigSection>
          </div>
        )}

        {/* === API KEYS === */}
        {activeTab === "api" && (
          <div className="grid gap-8 md:grid-cols-2">
            <ConfigSection
              icon={Zap}
              title="Anthropic (Claude)"
              description="Clé API pour le moteur IA de la plateforme"
              badge="Production"
              badgeColor="text-emerald-600 border-emerald-600/30"
            >
              <SecretField
                label="API Key"
                value={config.anthropicApiKey}
                onChange={(v) => update("anthropicApiKey", v)}
                placeholder="sk-ant-api03-..."
                hint="Clé maître utilisée pour tous les workspaces"
              />
              <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-bold text-foreground">Statut</span>
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-600/30 font-bold">Connecté</Badge>
              </div>
            </ConfigSection>

            <ConfigSection icon={Globe} title="Google Maps" description="Clé API pour la cartographie et géolocalisation">
              <SecretField
                label="API Key"
                value={config.googleMapsApiKey}
                onChange={(v) => update("googleMapsApiKey", v)}
                placeholder="AIzaSy..."
                hint="Maps JavaScript API + Geocoding API requis"
              />
            </ConfigSection>

            <ConfigSection icon={CreditCard} title="Stripe" description="Clés pour la facturation et les abonnements">
              <SecretField
                label="Secret Key"
                value={config.stripeSecretKey}
                onChange={(v) => update("stripeSecretKey", v)}
                placeholder="sk_live_..."
              />
              <SecretField
                label="Webhook Secret"
                value={config.stripeWebhookSecret}
                onChange={(v) => update("stripeWebhookSecret", v)}
                placeholder="whsec_..."
                hint="Utilisé pour valider les webhooks Stripe"
              />
            </ConfigSection>

            <ConfigSection icon={AlertTriangle} title="Sentry" description="Monitoring d'erreurs en production">
              <SecretField
                label="DSN"
                value={config.sentryDsn}
                onChange={(v) => update("sentryDsn", v)}
                placeholder="https://xxx@sentry.io/xxx"
                hint="Data Source Name pour le reporting d'erreurs"
              />
            </ConfigSection>
          </div>
        )}

        {/* === SECURITY === */}
        {activeTab === "security" && (
          <div className="grid gap-8 md:grid-cols-2">
            <ConfigSection icon={Lock} title="Rate Limiting" description="Protection contre les abus et le spam">
              <FieldGroup label="Requêtes / minute (par IP)" hint="Nombre de requêtes API autorisées par minute">
                <Input
                  type="number"
                  value={config.rateLimitPerMinute}
                  onChange={(e) => update("rateLimitPerMinute", Number(e.target.value))}
                  className="bg-background border-border text-foreground tabular-nums"
                />
              </FieldGroup>
              <FieldGroup label="Timeout session (minutes)" hint="Durée d'inactivité avant déconnexion automatique">
                <Input
                  type="number"
                  value={config.sessionTimeoutMinutes}
                  onChange={(e) => update("sessionTimeoutMinutes", Number(e.target.value))}
                  className="bg-background border-border text-foreground tabular-nums"
                />
              </FieldGroup>
            </ConfigSection>

            <ConfigSection icon={Database} title="Sauvegardes" description="Backup automatique de la base de données">
              <ToggleField
                label="Backup automatique"
                description="Sauvegarde quotidienne de la base de données"
                checked={config.backupEnabled}
                onChange={(v) => update("backupEnabled", v)}
              />
              <FieldGroup label="Fréquence">
                <select
                  value={config.backupFrequency}
                  onChange={(e) => update("backupFrequency", e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm"
                >
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </FieldGroup>
            </ConfigSection>

            <div className="md:col-span-2">
              <ConfigSection icon={Shield} title="Audit de sécurité" description="Vérification en temps réel des services">
                <div className="py-6 px-4 rounded-2xl bg-accent/30 border border-border/50 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Les vérifications de santé seront disponibles après connexion aux services de monitoring.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-accent rounded-xl mt-2"
                  onClick={() => toast.info("Fonctionnalité en cours de développement")}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Relancer le diagnostic
                </Button>
              </ConfigSection>
            </div>
          </div>
        )}

        {/* === SYSTEM === */}
        {activeTab === "system" && (
          <div className="grid gap-8 md:grid-cols-2">
            <ConfigSection icon={Server} title="Environnement" description="Informations sur le déploiement actuel">
              <div className="space-y-3">
                {[
                  { label: "Framework", value: "Next.js 14" },
                  { label: "Base de données", value: "Supabase PostgreSQL" },
                  { label: "Auth", value: "Supabase Auth" },
                ].map((info) => (
                  <div key={info.label} className="flex items-center justify-between py-2 px-4 rounded-xl bg-accent/30 border border-border/50">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{info.label}</span>
                    <span className="text-sm font-bold text-foreground font-mono">{info.value}</span>
                  </div>
                ))}
              </div>
            </ConfigSection>

            <ConfigSection icon={Clock} title="Logs & Debug" description="Niveau de log et outils de diagnostic">
              <FieldGroup label="Niveau de log">
                <select
                  value={config.logLevel}
                  onChange={(e) => update("logLevel", e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-background border border-border text-foreground text-sm"
                >
                  <option value="error">Error — Erreurs critiques uniquement</option>
                  <option value="warn">Warn — Erreurs + avertissements</option>
                  <option value="info">Info — Informations générales</option>
                  <option value="debug">Debug — Tout (attention: volume élevé)</option>
                </select>
              </FieldGroup>

              <Separator className="my-2" />

              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions de maintenance</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="border-border text-foreground hover:bg-accent rounded-xl text-xs h-auto py-3">
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Vider le cache
                  </Button>
                  <Button variant="outline" className="border-border text-foreground hover:bg-accent rounded-xl text-xs h-auto py-3">
                    <Database className="h-3.5 w-3.5 mr-2" />
                    Reindex DB
                  </Button>
                  <Button variant="outline" className="border-border text-foreground hover:bg-accent rounded-xl text-xs h-auto py-3">
                    <Users className="h-3.5 w-3.5 mr-2" />
                    Purger sessions
                  </Button>
                  <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/5 rounded-xl text-xs h-auto py-3">
                    <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                    Reset démo
                  </Button>
                </div>
              </div>
            </ConfigSection>

            <div className="md:col-span-2">
              <ConfigSection icon={FileText} title="Version & Changelog" description="Historique des mises à jour de la plateforme">
                <div className="flex items-center gap-3 py-4 px-5 rounded-2xl bg-primary/5 border border-primary/20">
                  <Badge variant="outline" className="font-mono font-black text-sm text-primary border-primary/30">
                    v1.4.0
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold uppercase">
                    Version actuelle
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Consultez le dépôt Git pour l&apos;historique complet des versions.
                </p>
              </ConfigSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
