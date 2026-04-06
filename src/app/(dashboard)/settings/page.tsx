"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings2,
  MessageCircle,
  Send,
  MapPin,
  Building2,
  Users2,
  Loader2,
  Save,
  Mail,
  CalendarDays,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ITenantSettings {
  agencyName?: string;
  activityType?: string;
  address?: string;
  rcNumber?: string;
  contactEmail?: string;
  smtp?: { host?: string; port?: string };
  facebookPageId?: string;
  whatsappEnabled?: boolean;
  whatsappApiToken?: string;
  whatsappPhoneNumberId?: string;
  facebookEnabled?: boolean;
  facebookAppSecret?: string;
  facebookWebhookToken?: string;
  googleMapsEnabled?: boolean;
  googleMapsApiKey?: string;
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

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function planLabel(plan: string): string {
  const map: Record<string, string> = {
    STARTER: "Starter",
    PRO: "Pro",
    BUSINESS: "Business",
    ENTERPRISE: "Enterprise",
  };
  return map[plan] ?? plan;
}

function typeLabel(type: string): string {
  return type === "PROMOTION" ? "Promotion" : type === "AGENCY" ? "Agence" : type;
}

function planVariant(plan: string): "default" | "secondary" | "outline" {
  if (plan === "ENTERPRISE" || plan === "BUSINESS") return "default";
  if (plan === "PRO") return "secondary";
  return "outline";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<ITenant | null>(null);
  const [users, setUsers] = useState<ITeamMember[]>([]);

  /* -- Integration state -------------------------------------------------- */
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappApiToken, setWhatsappApiToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  const [facebookEnabled, setFacebookEnabled] = useState(false);
  const [facebookAppSecret, setFacebookAppSecret] = useState("");
  const [facebookWebhookToken, setFacebookWebhookToken] = useState("");
  const [savingFacebook, setSavingFacebook] = useState(false);

  const [googleMapsEnabled, setGoogleMapsEnabled] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("");
  const [savingMaps, setSavingMaps] = useState(false);

  /* -- Fetch -------------------------------------------------------------- */

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings");
      if (!res.ok) throw new Error("Erreur chargement");
      const json = await res.json();
      const data = json.data as ITenant;
      setTenant(data);
      if (data.users) setUsers(data.users);

      const s = data.settings ?? {};
      setWhatsappEnabled(s.whatsappEnabled ?? false);
      setWhatsappApiToken(s.whatsappApiToken ?? "");
      setWhatsappPhoneNumberId(s.whatsappPhoneNumberId ?? "");
      setFacebookEnabled(s.facebookEnabled ?? false);
      setFacebookAppSecret(s.facebookAppSecret ?? "");
      setFacebookWebhookToken(s.facebookWebhookToken ?? "");
      setGoogleMapsEnabled(s.googleMapsEnabled ?? false);
      setGoogleMapsApiKey(s.googleMapsApiKey ?? "");
    } catch {
      setError("Erreur de chargement des parametres");
      toast.error("Impossible de charger les parametres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* -- Save helpers ------------------------------------------------------- */

  async function saveSettings(
    settings: Partial<ITenantSettings>,
    setSaving: (v: boolean) => void,
  ) {
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

  function handleSaveWhatsapp() {
    saveSettings(
      {
        whatsappEnabled,
        whatsappApiToken,
        whatsappPhoneNumberId,
      },
      setSavingWhatsapp,
    );
  }

  function handleSaveFacebook() {
    saveSettings(
      {
        facebookEnabled,
        facebookAppSecret,
        facebookWebhookToken,
      },
      setSavingFacebook,
    );
  }

  function handleSaveGoogleMaps() {
    saveSettings(
      {
        googleMapsEnabled,
        googleMapsApiKey,
      },
      setSavingMaps,
    );
  }

  /* -- Loading / Error ---------------------------------------------------- */

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
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            fetchSettings();
          }}
        >
          Reessayer
        </Button>
      </div>
    );
  }

  const activeUsersCount = users.filter((u) => u.isActive).length;

  /* -- Render ------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* ------------------------------------------------------------------ */}
      {/*  Page header                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Parametres
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerez vos integrations et la configuration de votre workspace.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Section: Integrations Messagerie                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Integrations Messagerie
          </h2>
          <p className="text-sm text-muted-foreground">
            Connectez vos canaux de communication pour automatiser vos echanges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* WhatsApp Business -------------------------------------------- */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      WhatsApp Business
                    </CardTitle>
                    <CardDescription>
                      Envoyez des messages automatiques via l&apos;API WhatsApp
                      Business.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="whatsapp-toggle" className="text-xs text-muted-foreground">
                    {whatsappEnabled ? "Actif" : "Inactif"}
                  </Label>
                  <Switch
                    id="whatsapp-toggle"
                    checked={whatsappEnabled}
                    onCheckedChange={(val: boolean) => setWhatsappEnabled(val)}
                  />
                </div>
              </div>
            </CardHeader>

            {whatsappEnabled && (
              <>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa-token" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      API Token
                    </Label>
                    <Input
                      id="wa-token"
                      type="password"
                      placeholder="EAAxxxxxxx..."
                      value={whatsappApiToken}
                      onChange={(e) => setWhatsappApiToken(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Phone Number ID
                    </Label>
                    <Input
                      id="wa-phone"
                      placeholder="1234567890"
                      value={whatsappPhoneNumberId}
                      onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveWhatsapp}
                    disabled={savingWhatsapp}
                  >
                    {savingWhatsapp ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Sauvegarder
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>

          {/* Facebook Leads ----------------------------------------------- */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                    <Send className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Facebook Leads
                    </CardTitle>
                    <CardDescription>
                      Importez automatiquement vos leads depuis Facebook Ads.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="facebook-toggle" className="text-xs text-muted-foreground">
                    {facebookEnabled ? "Actif" : "Inactif"}
                  </Label>
                  <Switch
                    id="facebook-toggle"
                    checked={facebookEnabled}
                    onCheckedChange={(val: boolean) => setFacebookEnabled(val)}
                  />
                </div>
              </div>
            </CardHeader>

            {facebookEnabled && (
              <>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fb-secret" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      App Secret
                    </Label>
                    <Input
                      id="fb-secret"
                      type="password"
                      placeholder="Votre App Secret Facebook"
                      value={facebookAppSecret}
                      onChange={(e) => setFacebookAppSecret(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb-webhook" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Webhook Verify Token
                    </Label>
                    <Input
                      id="fb-webhook"
                      placeholder="Token de verification du webhook"
                      value={facebookWebhookToken}
                      onChange={(e) => setFacebookWebhookToken(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveFacebook}
                    disabled={savingFacebook}
                  >
                    {savingFacebook ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Sauvegarder
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Section: Integrations Cartographie                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Integrations Cartographie
          </h2>
          <p className="text-sm text-muted-foreground">
            Configurez les services de localisation pour vos biens immobiliers.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                  <MapPin className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Google Maps
                  </CardTitle>
                  <CardDescription>
                    Affichez vos biens sur une carte et proposez l&apos;itineraire
                    aux clients.
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="gmaps-toggle" className="text-xs text-muted-foreground">
                  {googleMapsEnabled ? "Actif" : "Inactif"}
                </Label>
                <Switch
                  id="gmaps-toggle"
                  checked={googleMapsEnabled}
                  onCheckedChange={(val: boolean) => setGoogleMapsEnabled(val)}
                />
              </div>
            </div>
          </CardHeader>

          {googleMapsEnabled && (
            <>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gmaps-key" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cle API Google Maps
                  </Label>
                  <Input
                    id="gmaps-key"
                    type="password"
                    placeholder="AIzaSy..."
                    value={googleMapsApiKey}
                    onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveGoogleMaps}
                  disabled={savingMaps}
                >
                  {savingMaps ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Sauvegarder
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Section: Informations Workspace + Equipe                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Workspace
          </h2>
          <p className="text-sm text-muted-foreground">
            Informations generales sur votre espace de travail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informations Workspace --------------------------------------- */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Informations Workspace
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Nom de l&apos;entreprise
                </p>
                <p className="text-sm font-medium text-foreground">
                  {tenant?.name ?? "-"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Type
                  </p>
                  <Badge variant="outline">
                    {typeLabel(tenant?.type ?? "")}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Plan
                  </p>
                  <Badge variant={planVariant(tenant?.plan ?? "")}>
                    {planLabel(tenant?.plan ?? "")}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Date de creation
                </p>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {tenant?.createdAt ? formatDate(tenant.createdAt) : "-"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equipe ------------------------------------------------------- */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Users2 className="h-5 w-5 text-violet-600" />
                </div>
                <CardTitle className="text-base font-semibold">
                  Equipe
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {activeUsersCount}
                </span>
                <span className="text-sm text-muted-foreground">
                  membre{activeUsersCount !== 1 ? "s" : ""} actif{activeUsersCount !== 1 ? "s" : ""}
                </span>
              </div>

              {users.length > activeUsersCount && (
                <p className="text-xs text-muted-foreground">
                  {users.length - activeUsersCount} membre{users.length - activeUsersCount !== 1 ? "s" : ""} inactif{users.length - activeUsersCount !== 1 ? "s" : ""}
                </p>
              )}

              <a href="/team">
                <Button variant="outline" size="sm" className="w-full">
                  Gerer l&apos;equipe
                  <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Help banner                                                       */}
      {/* ------------------------------------------------------------------ */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-medium text-foreground">
              Besoin d&apos;aide pour configurer vos integrations ?
            </p>
            <p className="text-xs text-muted-foreground">
              Notre equipe est disponible pour vous accompagner dans la mise en
              place de vos outils.
            </p>
          </div>
          <a href="mailto:support@crm-immo-pro.com">
            <Button variant="outline" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Contactez-nous
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
