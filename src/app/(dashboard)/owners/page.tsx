"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  UserCircle,
  Plus,
  Search,
  Loader2,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface IOwner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  _count: { mandates: number };
  createdAt: string;
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<IOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchOwners() {
      try {
        const res = await fetch("/api/v1/owners");
        if (!res.ok) throw new Error("Erreur");
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setOwners(Array.isArray(d) ? d : d.owners ?? []);
        }
      } catch {
        console.error("Impossible de charger les propriétaires");
      } finally {
        setLoading(false);
      }
    }
    fetchOwners();
  }, []);

  const filtered = owners.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
      o.phone.includes(search) ||
      o.email?.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Propriétaires
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gérez les propriétaires et leurs mandats
            </p>
          </div>
        </div>
        <Link href="/owners/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            Nouveau propriétaire
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, téléphone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <UserX className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Aucun propriétaire trouvé
            </p>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Essayez de modifier votre recherche"
                : "Commencez par ajouter votre premier propriétaire"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {filtered.length} propriétaire{filtered.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Mandats</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((owner) => (
                  <TableRow key={owner.id}>
                    <TableCell>
                      <Link
                        href={`/owners/${owner.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {owner.firstName} {owner.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{owner.phone}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner.email || "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {owner.address || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {owner._count.mandates}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(owner.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
