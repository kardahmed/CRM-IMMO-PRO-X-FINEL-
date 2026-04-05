"use client";

import * as Sentry from "@sentry/nextjs";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", address: "" });

  useEffect(() => { fetchOwners(); }, []);

  async function fetchOwners() {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/owners");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setOwners(Array.isArray(d) ? d : d.owners ?? []);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "Owners page" } });
      setError("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.firstName || !form.lastName || !form.phone) {
      toast.error("Prenom, nom et telephone sont requis");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      };
      if (form.email) body.email = form.email;
      if (form.address) body.address = form.address;
      const res = await fetch("/api/v1/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Erreur"); return; }
      toast.success("Proprietaire cree avec succes");
      setIsCreateOpen(false);
      setForm({ firstName: "", lastName: "", phone: "", email: "", address: "" });
      fetchOwners();
    } catch { toast.error("Erreur reseau"); } finally { setCreating(false); }
  }

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Proprietaires</h1>
            <p className="text-sm text-muted-foreground font-medium">Gerez les proprietaires et leurs mandats</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau proprietaire
        </Button>
      </div>

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher par nom, telephone, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button variant="outline" onClick={() => { setError(null); fetchOwners(); }}>
            Réessayer
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <UserX className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">Aucun proprietaire trouve</p>
            <p className="text-sm text-muted-foreground">
              {search ? "Essayez de modifier votre recherche" : "Commencez par ajouter votre premier proprietaire"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{filtered.length} proprietaire{filtered.length > 1 ? "s" : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Telephone</TableHead>
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
                      <Link href={`/owners/${owner.id}`} className="font-medium text-primary hover:underline">
                        {owner.firstName} {owner.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{owner.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{owner.email || "\u2014"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{owner.address || "\u2014"}</TableCell>
                    <TableCell><Badge variant="secondary">{owner._count.mandates}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(owner.createdAt), { addSuffix: true, locale: fr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau proprietaire</DialogTitle>
            <DialogDescription>Remplissez les informations du proprietaire</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prenom *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prenom" />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telephone *</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0555 00 00 00" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Adresse complete" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>Annuler</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Creer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
