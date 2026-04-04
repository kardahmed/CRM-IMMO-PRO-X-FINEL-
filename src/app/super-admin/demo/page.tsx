"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-rose-400" />
            Demandes de Demo
            {newCount > 0 && (
              <Badge className="bg-rose-500/10 text-rose-400 border-none ml-2">
                {newCount} nouveau{newCount > 1 ? "x" : ""}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Toutes les demandes soumises via le formulaire /demo. Un tenant DEMO est cree automatiquement.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLeads}
          disabled={loading}
          className="border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-900 gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={leads.length} color="text-white" />
        <StatCard label="Nouveaux" value={newCount} color="text-rose-400" />
        <StatCard label="Contactes" value={leads.filter((l) => l.status === "CONTACTED").length} color="text-cyan-400" />
        <StatCard label="Qualifies" value={leads.filter((l) => l.status === "QUALIFIED").length} color="text-emerald-400" />
      </div>

      {/* Loading / Error / Empty */}
      {loading && leads.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="text-center py-20 text-neutral-500">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold">Aucune demande de demo</p>
          <p className="text-sm mt-1">Les demandes apparaitront ici lorsque des prospects rempliront le formulaire /demo</p>
        </div>
      )}

      {/* Lead Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {leads.map((lead) => {
          const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.NEW;

          return (
            <Card
              key={lead.id}
              className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm hover:border-neutral-700 transition-colors"
            >
              <CardContent className="p-5 relative">
                <div className="absolute top-5 right-5">
                  <Badge className={badge.className}>{badge.label}</Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                      <Building className="h-4 w-4 text-neutral-500" />
                      {lead.companyName}
                    </h3>
                    <p className="text-sm text-neutral-400 font-medium">
                      Par {lead.firstName} {lead.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={
                          lead.companyType === "PROMOTION"
                            ? "border-violet-500/30 text-violet-400 bg-violet-500/10 text-[10px]"
                            : "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px]"
                        }
                      >
                        {lead.companyType === "PROMOTION" ? "Promotion" : "Agence"}
                      </Badge>
                      {lead.agentCount && (
                        <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                          <UserCheck className="h-3 w-3" /> {lead.agentCount} agents
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <p className="flex items-center gap-2 text-neutral-300">
                      <Mail className="h-3 w-3 text-neutral-500" /> {lead.email}
                    </p>
                    <p className="flex items-center gap-2 text-neutral-300">
                      <Phone className="h-3 w-3 text-neutral-500" /> {lead.phone}
                    </p>
                    {lead.wilaya && (
                      <p className="flex items-center gap-2 text-neutral-300">
                        <MapPin className="h-3 w-3 text-neutral-500" /> {lead.wilaya}
                      </p>
                    )}
                    {lead.message && (
                      <p className="text-neutral-500 italic mt-2 line-clamp-2">
                        &ldquo;{lead.message}&rdquo;
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-neutral-500 font-medium pt-2">
                      <Clock className="h-3 w-3 text-neutral-600" />
                      Il y a {formatDistanceToNow(new Date(lead.createdAt), { locale: fr })}
                    </p>
                  </div>

                  {lead.tenantId && (
                    <div className="pt-2 border-t border-neutral-800">
                      <p className="text-[10px] text-neutral-500 font-mono truncate">
                        Tenant: {lead.tenantId}
                      </p>
                    </div>
                  )}
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
    <Card className="bg-neutral-900/50 border-neutral-800">
      <CardContent className="p-4 text-center">
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
