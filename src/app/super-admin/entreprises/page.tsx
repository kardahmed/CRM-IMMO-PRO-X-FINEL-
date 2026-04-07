"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreHorizontal, ExternalLink, Loader2, AlertCircle, RefreshCw, Building2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ITenant {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  settings: Record<string, unknown>;
  createdAt: string;
  _count: {
    users: number;
    clients: number;
    properties: number;
  };
}

const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export default function SuperAdminWorkspaces() {
  const [search, setSearch] = useState("");
  const [tenants, setTenants] = useState<ITenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchTenants() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/v1/admin/tenants");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        // Filter out the Platform Admin system tenant
        const realTenants = (json.data as ITenant[]).filter(t => t.id !== PLATFORM_TENANT_ID);
        setTenants(realTenants);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTenants(); }, []);

  const filtered = tenants.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      ENTERPRISE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      BUSINESS: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
      PRO: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
      STARTER: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
    };
    return (
      <Badge className={`${colors[plan] || "bg-muted text-muted-foreground"} border-none font-black uppercase text-[10px]`}>
        {plan}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Actif</div>;
      case "SUSPENDED": return <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-500" />Suspendu</div>;
      default: return <div className="text-xs text-muted-foreground">{status}</div>;
    }
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
        <p className="text-lg font-bold text-foreground">Impossible de charger les workspaces</p>
        <Button onClick={fetchTenants} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em]">
            <Building2 className="h-3.5 w-3.5" /> Gestion des tenants
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tighter">
            Workspaces <span className="text-muted-foreground text-2xl">({tenants.length})</span>
          </h1>
          <p className="text-sm text-muted-foreground">Gerez tous les locataires de la plateforme IMMO PRO-X.</p>
        </div>
      </header>

      <Card className="bg-card border-border shadow-stripe rounded-[32px] overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une entreprise..."
                className="pl-9 bg-background border-border focus:border-primary"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-accent/50 border-b border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Entreprise</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Statut</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Users</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Clients</TableHead>
                <TableHead className="text-muted-foreground font-bold text-xs uppercase tracking-wider">Creation</TableHead>
                <TableHead className="text-right text-muted-foreground font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id} className="border-border hover:bg-accent/50 transition-colors">
                  <TableCell className="font-bold text-foreground">
                    <Link href={`/super-admin/entreprises/${tenant.id}`} className="hover:text-primary flex items-center gap-2">
                      {tenant.name}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase border-border text-muted-foreground">
                      {tenant.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell className="text-muted-foreground font-medium">{tenant._count.users}</TableCell>
                  <TableCell className="text-muted-foreground font-medium">{tenant._count.clients}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(tenant.createdAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/super-admin/entreprises/${tenant.id}`}>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun workspace trouve
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
