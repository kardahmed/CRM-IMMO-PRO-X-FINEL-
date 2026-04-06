"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Megaphone,
  Mail,
  Send,
  Users,
  Building2,
  Zap,
  Plus,
  Loader2,
  Eye,
  Clock,
  CheckCircle2,
  BarChart3,
  Target,
  MessageCircle,
  ArrowRight,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface IDemoLead {
  id: string;
  companyName: string;
  companyType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  tenantId: string | null;
  createdAt: string;
}

interface ITenant {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  _count: { users: number; clients: number };
}

interface ICampaign {
  id: string;
  name: string;
  target: "demo_leads" | "workspaces" | "all";
  subject: string;
  message: string;
  status: "draft" | "sent";
  recipientCount: number;
  createdAt: string;
  sentAt: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Mock campaigns (stored in state — TODO: API backend)                      */
/* -------------------------------------------------------------------------- */

const INITIAL_CAMPAIGNS: ICampaign[] = [];

/* -------------------------------------------------------------------------- */
/*  Campaign Form                                                             */
/* -------------------------------------------------------------------------- */

function CampaignDialog({
  open,
  onOpenChange,
  onCreated,
  leadCount,
  workspaceCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (campaign: ICampaign) => void;
  leadCount: number;
  workspaceCount: number;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState<ICampaign["target"]>("demo_leads");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const recipientCount = target === "demo_leads" ? leadCount : target === "workspaces" ? workspaceCount : leadCount + workspaceCount;

  const handleSend = async () => {
    if (!name || !subject || !message) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));

    const campaign: ICampaign = {
      id: crypto.randomUUID(),
      name,
      target,
      subject,
      message,
      status: "sent",
      recipientCount,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
    };

    onCreated(campaign);
    setSending(false);
    onOpenChange(false);
    setName("");
    setTarget("demo_leads");
    setSubject("");
    setMessage("");
    toast.success(`Campagne "${name}" envoyee a ${recipientCount} destinataires`);
  };

  const handleDraft = () => {
    if (!name) {
      toast.error("Donnez un nom a la campagne");
      return;
    }
    const campaign: ICampaign = {
      id: crypto.randomUUID(),
      name,
      target,
      subject,
      message,
      status: "draft",
      recipientCount,
      createdAt: new Date().toISOString(),
      sentAt: null,
    };
    onCreated(campaign);
    onOpenChange(false);
    setName("");
    setTarget("demo_leads");
    setSubject("");
    setMessage("");
    toast.success("Brouillon sauvegarde");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Nouvelle campagne
          </DialogTitle>
          <DialogDescription>
            Creez et envoyez une campagne email a vos leads ou workspaces.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold">Nom de la campagne *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Offre de lancement PRO-X"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Audience cible *</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "demo_leads" as const, label: "Leads Demo", count: leadCount, icon: Target },
                { value: "workspaces" as const, label: "Workspaces", count: workspaceCount, icon: Building2 },
                { value: "all" as const, label: "Tous", count: leadCount + workspaceCount, icon: Users },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl border text-sm font-bold transition-all",
                    target === opt.value
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-accent/30 border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                  <span>{opt.label}</span>
                  <Badge variant="outline" className="text-xs">{opt.count}</Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contenu de l&apos;email</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Objet *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Decouvrez CRM IMMO PRO-X — Offre speciale"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Message *</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Bonjour {prenom},&#10;&#10;Nous avons le plaisir de vous presenter..."
              rows={8}
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">
              Variables disponibles : {"{prenom}"}, {"{nom}"}, {"{entreprise}"}, {"{email}"}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDraft} className="border-border gap-2">
            <Clock className="h-4 w-4" />
            Sauvegarder brouillon
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Envoi..." : `Envoyer (${recipientCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick Action Cards                                                        */
/* -------------------------------------------------------------------------- */

function QuickAction({
  icon: Icon,
  title,
  description,
  count,
  accent,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  count: number;
  accent: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="bg-card border-border shadow-stripe rounded-[24px] cursor-pointer hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-500 group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl border transition-all group-hover:scale-110", `bg-${accent}-500/5 border-${accent}-500/10`)}>
            <Icon className={cn("h-5 w-5", `text-${accent}-500`)} />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
        <h3 className="text-base font-black text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-bold tabular-nums">{count} destinataires</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function SuperAdminMarketing() {
  const [campaigns, setCampaigns] = useState<ICampaign[]>(INITIAL_CAMPAIGNS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leads, setLeads] = useState<IDemoLead[]>([]);
  const [tenants, setTenants] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCampaign, setSearchCampaign] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [leadsRes, tenantsRes] = await Promise.all([
          fetch("/api/v1/admin/demo-leads"),
          fetch("/api/v1/admin/tenants"),
        ]);
        const leadsData = await leadsRes.json();
        const tenantsData = await tenantsRes.json();

        if (leadsData.success) setLeads(leadsData.data);
        if (tenantsData.success) setTenants(tenantsData.data);
      } catch {
        toast.error("Erreur lors du chargement des donnees");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCampaignCreated = (campaign: ICampaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  };

  const newLeads = leads.filter((l) => l.status === "NEW");
  const contactedLeads = leads.filter((l) => l.status === "CONTACTED");
  const activeWorkspaces = tenants.filter((t) => t.status === "ACTIVE");
  const demoWorkspaces = tenants.filter((t) => t.status === "DEMO");

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchCampaign.toLowerCase())
  );

  const stats = [
    { label: "Leads Demo", value: leads.length, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "Nouveaux leads", value: newLeads.length, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Workspaces actifs", value: activeWorkspaces.length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Campagnes envoyees", value: campaigns.filter((c) => c.status === "sent").length, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <Zap className="h-3 w-3" /> Marketing Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter italic uppercase underline decoration-primary decoration-8 underline-offset-8">
            Marketing
          </h1>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider rounded-2xl px-8 py-6 text-sm shadow-stripe gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </header>

      {/* Stats Row */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card border-border rounded-[20px] animate-pulse">
              <CardContent className="p-5">
                <div className="h-3 w-20 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border shadow-stripe rounded-[20px]">
              <CardContent className="p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl font-black text-foreground tabular-nums">{stat.value}</span>
                  <Badge className={cn("border-0 text-xs font-bold", stat.bg, stat.color)}>
                    {stat.label === "Campagnes envoyees" ? "total" : "actuel"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Actions rapides</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={Target}
            title="Relancer les nouveaux leads"
            description="Envoyer un email de bienvenue aux leads non contactes"
            count={newLeads.length}
            accent="rose"
            onClick={() => {
              if (newLeads.length === 0) {
                toast.info("Aucun nouveau lead a relancer");
                return;
              }
              setDialogOpen(true);
            }}
          />
          <QuickAction
            icon={MessageCircle}
            title="Suivre les leads contactes"
            description="Email de suivi pour les leads deja contactes"
            count={contactedLeads.length}
            accent="cyan"
            onClick={() => {
              if (contactedLeads.length === 0) {
                toast.info("Aucun lead contacte");
                return;
              }
              setDialogOpen(true);
            }}
          />
          <QuickAction
            icon={Building2}
            title="Upsell workspaces actifs"
            description="Proposer une montee en gamme aux workspaces actifs"
            count={activeWorkspaces.length}
            accent="emerald"
            onClick={() => {
              if (activeWorkspaces.length === 0) {
                toast.info("Aucun workspace actif");
                return;
              }
              setDialogOpen(true);
            }}
          />
          <QuickAction
            icon={Clock}
            title="Convertir les demos"
            description="Encourager les workspaces demo a passer en payant"
            count={demoWorkspaces.length}
            accent="amber"
            onClick={() => {
              if (demoWorkspaces.length === 0) {
                toast.info("Aucun workspace en demo");
                return;
              }
              setDialogOpen(true);
            }}
          />
        </div>
      </div>

      {/* Campaigns History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Historique des campagnes</h2>
          {campaigns.length > 0 && (
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchCampaign}
                onChange={(e) => setSearchCampaign(e.target.value)}
                className="pl-9 bg-background border-border text-sm"
              />
            </div>
          )}
        </div>

        {campaigns.length === 0 ? (
          <Card className="bg-card border-border shadow-stripe rounded-[24px]">
            <CardContent className="py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6">
                <Megaphone className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-black text-foreground">Aucune campagne</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Creez votre premiere campagne pour contacter vos leads demo ou promouvoir de nouvelles fonctionnalites aupres de vos workspaces.
              </p>
              <Button
                onClick={() => setDialogOpen(true)}
                className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 rounded-xl"
              >
                <Plus className="h-4 w-4" />
                Creer une campagne
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="bg-card border-border shadow-stripe rounded-[20px] hover:shadow-stripe-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2.5 rounded-xl border",
                        campaign.status === "sent"
                          ? "bg-emerald-500/5 border-emerald-500/10"
                          : "bg-amber-500/5 border-amber-500/10"
                      )}>
                        {campaign.status === "sent" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-foreground">{campaign.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{campaign.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant="outline" className="text-xs font-bold border-border">
                        {campaign.target === "demo_leads" ? "Leads Demo" : campaign.target === "workspaces" ? "Workspaces" : "Tous"}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-bold tabular-nums border-border">
                        <Users className="h-3 w-3 mr-1" />
                        {campaign.recipientCount}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs font-bold border-0",
                          campaign.status === "sent"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        )}
                      >
                        {campaign.status === "sent" ? "Envoyee" : "Brouillon"}
                      </Badge>
                      {campaign.status === "draft" && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-1 text-xs rounded-lg"
                          onClick={() => toast.info("Fonctionnalite en cours de developpement")}
                        >
                          <Send className="h-3 w-3" />
                          Envoyer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Email Templates */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Templates d&apos;email</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Bienvenue Demo",
              description: "Email de bienvenue pour les nouveaux leads demo",
              subject: "Bienvenue sur CRM IMMO PRO-X !",
              preview: "Bonjour {prenom}, merci pour votre interet pour CRM IMMO PRO-X. Votre periode d'essai de 14 jours commence maintenant...",
            },
            {
              title: "Relance Demo",
              description: "Relance pour les leads non convertis apres 7 jours",
              subject: "Votre essai PRO-X — il vous reste 7 jours",
              preview: "Bonjour {prenom}, votre periode d'essai de CRM IMMO PRO-X arrive bientot a expiration. Avez-vous eu l'occasion de...",
            },
            {
              title: "Offre Upgrade",
              description: "Proposition de montee en gamme",
              subject: "Passez au plan Business — 20% de reduction",
              preview: "Bonjour {prenom}, felicitations pour votre utilisation de CRM IMMO PRO-X ! En tant que client fidele, nous vous proposons...",
            },
          ].map((template) => (
            <Card
              key={template.title}
              className="bg-card border-border shadow-stripe rounded-[20px] hover:shadow-stripe-lg hover:-translate-y-0.5 transition-all cursor-pointer group"
              onClick={() => {
                setDialogOpen(true);
                // Pre-fill would require state lifting — TODO
                toast.info(`Template "${template.title}" selectionne`);
              }}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold border-border">
                    <Mail className="h-3 w-3 mr-1" />
                    Template
                  </Badge>
                  <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm font-black text-foreground">{template.title}</h3>
                <p className="text-xs text-muted-foreground">{template.description}</p>
                <div className="p-3 rounded-xl bg-accent/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-bold mb-1">Objet : {template.subject}</p>
                  <p className="text-xs text-muted-foreground/70 line-clamp-2">{template.preview}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Campaign Dialog */}
      <CampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCampaignCreated}
        leadCount={leads.length}
        workspaceCount={tenants.length}
      />
    </div>
  );
}
