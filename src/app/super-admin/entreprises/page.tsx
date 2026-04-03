"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MoreHorizontal, Power, LogIn, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MOCK_WORKSPACES = [
  { id: "w1", name: "Premium Immobilier", plan: "ENTERPRISE", status: "ACTIVE", users: 14, mrr: 250000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365) },
  { id: "w2", name: "Horizon Promotion", plan: "PRO", status: "ACTIVE", users: 4, mrr: 80000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180) },
  { id: "w3", name: "Agence du Centre", plan: "STARTER", status: "ACTIVE", users: 2, mrr: 35000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45) },
  { id: "w4", name: "Global Invest DZ", plan: "BUSINESS", status: "SUSPENDED", users: 8, mrr: 150000, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400) },
  { id: "w5", name: "Demo Agency", plan: "STARTER", status: "DEMO", users: 1, mrr: 0, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
];

export default function SuperAdminWorkspaces() {
  const [search, setSearch] = useState("");
  
  const filtered = MOCK_WORKSPACES.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  const getPlanBadge = (plan: string) => {
    switch(plan) {
      case "ENTERPRISE": return <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black uppercase text-[10px]">ENTERPRISE</Badge>;
      case "BUSINESS": return <Badge className="bg-indigo-500/10 text-indigo-400 border-none font-black uppercase text-[10px]">BUSINESS</Badge>;
      case "PRO": return <Badge className="bg-cyan-500/10 text-cyan-400 border-none font-black uppercase text-[10px]">PRO</Badge>;
      default: return <Badge className="bg-neutral-800 text-neutral-400 border-none font-black uppercase text-[10px]">{plan}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "ACTIVE": return <div className="flex items-center gap-1.5 text-xs text-emerald-400"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>Actif</div>;
      case "SUSPENDED": return <div className="flex items-center gap-1.5 text-xs text-rose-400"><span className="h-2 w-2 rounded-full bg-rose-500"></span>Suspendu</div>;
      case "DEMO": return <div className="flex items-center gap-1.5 text-xs text-amber-400"><span className="h-2 w-2 rounded-full bg-amber-500"></span>Démo</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Workspaces (Entreprises)</h1>
          <p className="text-sm text-neutral-400 mt-1">Gérez tous les locataires de la plateforme IMMO PRO-X.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-6 rounded-lg">
          + Nouveau Workspace
        </Button>
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
            <Button variant="outline" className="border-neutral-800 text-white hover:bg-neutral-800 gap-2">
              <Filter className="h-4 w-4" /> Filtres
            </Button>
          </div>

          <Table>
            <TableHeader className="bg-neutral-950/50 border-b border-neutral-800">
              <TableRow className="hover:bg-transparent border-neutral-800">
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Entreprise</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Plan</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Statut</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider text-right">MRR</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Agents</TableHead>
                <TableHead className="text-neutral-400 font-bold text-xs uppercase tracking-wider">Création</TableHead>
                <TableHead className="text-right text-neutral-400 font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((workspace) => (
                <TableRow key={workspace.id} className="border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                  <TableCell className="font-bold text-white">
                    <Link href={`/super-admin/entreprises/${workspace.id}`} className="hover:text-indigo-400 flex items-center gap-2">
                       {workspace.name}
                       <ExternalLink className="h-3 w-3 opacity-50" />
                    </Link>
                  </TableCell>
                  <TableCell>{getPlanBadge(workspace.plan)}</TableCell>
                  <TableCell>{getStatusBadge(workspace.status)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-neutral-300">
                    {new Intl.NumberFormat("fr-DZ").format(workspace.mrr)} DA
                  </TableCell>
                  <TableCell className="text-neutral-300 font-medium">
                    {workspace.users}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-400">
                    {format(workspace.createdAt, "dd MMM yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10">
                      <LogIn className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
