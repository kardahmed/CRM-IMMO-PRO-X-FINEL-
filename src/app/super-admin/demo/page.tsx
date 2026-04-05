"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Users,
  Clock,
  Mail,
  Phone,
  Building,
  MapPin,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface IDemoLead {
  id: string;
  companyName: string;
  companyType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  wilaya: string | null;
  agentCount: string | null;
  message: string | null;
  status: string;
  tenantId: string | null;
  createdAt: string;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  NEW: { label: "NOUVEAU", className: "bg-rose-500/10 text-rose-400 border-none font-black uppercase text-[10px] animate-pulse" },
  CONTACTED: { label: "CONTACTE", className: "bg-cyan-500/10 text-cyan-400 border-none font-bold uppercase text-[10px]" },
  QUALIFIED: { label: "QUALIFIE", className: "bg-emerald-500/10 text-emerald-400 border-none font-bold uppercase text-[10px]" },
  CLOSED: { label: "FERME", className: "bg-neutral-800 text-neutral-400 border-none font-bold uppercase text-[10px]" },
};

export default function SuperAdminDemoLeads() {
  const [leads, setLeads] = useState<IDemoLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/admin/demo-leads");
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      } else {
        setError(data.error || "Erreur inconnue");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const newCount = leads.filter((l) => l.status === "NEW").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Demandes de Demo
            {newCount > 0 && (
              <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 ml-2 px-3 py-1 rounded-full text-[10px] font-black">
                {newCount} NOUVEAU{newCount > 1 ? "X" : ""}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Toutes les demandes soumises via le formulaire public. Un tenant DEMO est crée automatiquement.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeads}
          disabled={loading}
          className="rounded-2xl border-border bg-background shadow-sm hover:bg-accent gap-2 h-11 px-5 font-bold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : "text-primary"}`} />
          Actualiser la liste
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard label="Total Leads" value={leads.length} color="text-foreground" />
        <StatCard label="Nouveaux" value={newCount} color="text-rose-500" />
        <StatCard label="Contactés" value={leads.filter((l) => l.status === "CONTACTED").length} color="text-cyan-500" />
        <StatCard label="Qualifiés" value={leads.filter((l) => l.status === "QUALIFIED").length} color="text-emerald-500" />
      </div>

      {/* Loading / Error / Empty */}
      {loading && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Récupération des leads...</p>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-[24px] bg-destructive/5 border border-destructive/10 flex items-center gap-4 text-sm text-destructive shadow-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="text-center py-32 bg-card rounded-[32px] border-2 border-dashed border-border/50">
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-black text-xl text-foreground tracking-tight">Aucune demande de démo</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
            Les demandes apparaîtront ici dès que des prospects rempliront le formulaire sur la landing page.
          </p>
        </div>
      )}

      {/* Lead Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead) => {
          const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.NEW;

          return (
            <Card
              key={lead.id}
              className="bg-card border-border shadow-stripe hover:shadow-stripe-lg hover:-translate-y-1 transition-all duration-300 rounded-[32px] overflow-hidden group"
            >
              <CardContent className="p-6 relative">
                <div className="absolute top-6 right-6">
                  <Badge className={cn("px-3 py-1 rounded-full", badge.className)}>{badge.label}</Badge>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-xl text-foreground tracking-tight flex items-center gap-2 group-hover:text-primary transition-colors">
                      <Building className="h-5 w-5 text-muted-foreground/50" />
                      {lead.companyName}
                    </h3>
                    <p className="text-sm text-muted-foreground font-bold mt-1">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-3 py-0.5 font-bold uppercase text-[9px] border-none shadow-sm",
                          lead.companyType === "PROMOTION"
                            ? "bg-violet-500/10 text-violet-600"
                            : "bg-cyan-500/10 text-cyan-600"
                        )}
                      >
                        {lead.companyType === "PROMOTION" ? "Promoteur" : "Agence"}
                      </Badge>
                      {lead.agentCount && (
                        <span className="text-[10px] text-muted-foreground font-black flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                          <UserCheck className="h-3 w-3 text-primary" /> {lead.agentCount} AGENTS
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 p-4 rounded-2xl bg-accent/50 border border-border/50">
                    <p className="flex items-center gap-3 text-xs font-bold text-foreground">
                      <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shadow-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {lead.email}
                    </p>
                    <p className="flex items-center gap-3 text-xs font-bold text-foreground">
                       <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shadow-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      {lead.phone}
                    </p>
                    {lead.wilaya && (
                      <p className="flex items-center gap-3 text-xs font-bold text-foreground">
                        <div className="h-6 w-6 rounded-lg bg-background flex items-center justify-center shadow-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {lead.wilaya}
                      </p>
                    )}
                  </div>

                  {lead.message && (
                    <div className="p-4 rounded-2xl bg-primary/5 italic text-sm text-muted-foreground border-l-4 border-primary/20 line-clamp-3">
                      &ldquo;{lead.message}&rdquo;
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-tighter">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDistanceToNow(new Date(lead.createdAt), { locale: fr, addSuffix: true })}
                    </div>
                    {lead.tenantId && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/5 text-emerald-600 rounded-lg">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                         <span className="text-[9px] font-black font-mono">TENANT OK</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="bg-card border-border shadow-stripe rounded-[24px] group hover:scale-[1.02] transition-transform">
      <CardContent className="p-6 text-center">
        <p className={cn("text-4xl font-black tracking-tighter", color)}>{value}</p>
        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}
