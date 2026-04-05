"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreHorizontal, ExternalLink, Loader2, AlertCircle, RefreshCw } from "lucide-react";
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
      if (json.success) setTenants(json.data);
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
      ENTERPRISE: "bg-emerald-500/10 text-emerald-400",
      BUSINESS: "bg-indigo-500/10 text-indigo-400",
      PRO: "bg-cyan-500/10 text-cyan-400",
    };
    return (
      <Badge className={`${colors[plan] || "bg-neutral-800 text-neutral-400"} border-none font-black uppercase text-xs`}>
        {plan}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <div className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />Actif</div>;
      case "SUSPENDED": return <div className="flex items-center gap-1.5 text-xs text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-500" />Suspendu</div>;
      case "DEMO": return <div className="flex items-center gap-1.5 text-xs text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-500" />Demo</div>;
      default: return <div className="text-xs text-neutral-400">{status}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <p className="text-lg font-bold text-white">Impossible de charger les workspaces</p>
        <Button onClick={fetchTenants} variant="outline" className="border-neutral-800 text-white gap-2">
          <RefreshCw className="h-4 w-4" /> Reessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Workspaces ({tenants.length})</h1>
          <p className="text-sm text-neutral-400 mt-1">Gerez tous les locataires de la plateforme IMMO PRO-X.</p>
        </div>
      </div>

      <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="p-4 border-b border-neutral-800 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Rechercher une entreprise..."
                className="pl-9 bg-neutral-950 border-neutral-800 text-white focus:border-indigo-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader className="bg-neutral-950/50 border-b border-neutral-800">
              <TableRow className="hover:bg-transparent border-neutral-800">
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Entreprise</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Statut</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Users</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Clients</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Creation</TableHead>
                <TableHead className="text-right text-neutral-400 font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tenant) => (
                <TableRow key={tenant.id} className="border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                  <TableCell className="font-bold text-white">
                    <Link href={`/super-admin/entreprises/${tenant.id}`} className="hover:text-indigo-400 flex items-center gap-2">
                      {tenant.name}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-bold uppercase border-neutral-700 text-neutral-300">
                      {tenant.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell className="text-neutral-300 font-medium">{tenant._count.users}</TableCell>
                  <TableCell className="text-neutral-300 font-medium">{tenant._count.clients}</TableCell>
                  <TableCell className="text-xs text-neutral-400">
                    {format(new Date(tenant.createdAt), "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/super-admin/entreprises/${tenant.id}`}>
                      <Button size="icon" variant="ghost" aria-label="Voir les détails de l'entreprise" className="h-8 w-8 text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-neutral-500">
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
