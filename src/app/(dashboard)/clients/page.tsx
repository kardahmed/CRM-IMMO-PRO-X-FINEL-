"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, Plus, Search, Loader2, UserX } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";

interface IClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  pipelineStage: string;
  assignedAgent: { firstName: string; lastName: string } | null;
  createdAt: string;
}

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800",
  CONTACTED: "bg-indigo-100 text-indigo-800",
  QUALIFIED: "bg-purple-100 text-purple-800",
  VISIT_SCHEDULED: "bg-cyan-100 text-cyan-800",
  VISITED: "bg-teal-100 text-teal-800",
  NEGOTIATION: "bg-amber-100 text-amber-800",
  RESERVED: "bg-orange-100 text-orange-800",
  SIGNED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-green-100 text-green-800",
};

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacte",
  QUALIFIED: "Qualifie",
  VISIT_SCHEDULED: "Visite planifiee",
  VISITED: "Visite",
  NEGOTIATION: "Negociation",
  RESERVED: "Reserve",
  SIGNED: "Signe",
  CLOSED: "Cloture",
};

const SOURCE_OPTIONS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "WEBSITE", label: "Site web" },
  { value: "REFERRAL", label: "Parrainage" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Telephone" },
  { value: "OTHER", label: "Autre" },
];

const TYPE_OPTIONS = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "STUDIO", label: "Studio" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "VILLA", label: "Villa" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "TERRAIN", label: "Terrain" },
];

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    source: "",
    desiredType: "",
    budgetMin: "",
    budgetMax: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/v1/clients");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setClients(Array.isArray(d) ? d : d.clients ?? []);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "Clients page" } });
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
      if (form.source) body.source = form.source;
      if (form.desiredType) body.desiredType = form.desiredType;
      if (form.budgetMin) body.budgetMin = Number(form.budgetMin);
      if (form.budgetMax) body.budgetMax = Number(form.budgetMax);

      const res = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la creation");
        return;
      }
      toast.success("Client cree avec succes");
      setIsCreateOpen(false);
      setForm({ firstName: "", lastName: "", phone: "", email: "", source: "", desiredType: "", budgetMin: "", budgetMax: "" });
      // Navigate to new client's dossier
      const newClient = json.data;
      if (newClient?.id) {
        router.push(`/clients/${newClient.id}`);
      } else {
        fetchClients();
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setCreating(false);
    }
  }

  const filtered = clients.filter((c) => {
    const matchSearch =
      !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "ALL" || c.pipelineStage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Clients
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gerez vos clients et suivez leur progression dans le pipeline
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, telephone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={stageFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStageFilter("ALL")}
          >
            Tous
          </Button>
          {Object.entries(STAGE_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={stageFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStageFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
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
              Aucun client trouve
            </p>
            <p className="text-sm text-muted-foreground">
              {search || stageFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Commencez par ajouter votre premier client"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{filtered.length} client{filtered.length > 1 ? "s" : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Telephone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Etape Pipeline</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Date creation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email || "\u2014"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{client.source || "\u2014"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STAGE_COLORS[client.pipelineStage] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STAGE_LABELS[client.pipelineStage] || client.pipelineStage}
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.assignedAgent
                        ? `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}`
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(client.createdAt), {
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

      {/* Create Client Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
            <DialogDescription>Remplissez les informations du client</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prenom *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Prenom"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Telephone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0555 00 00 00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source ?? ""} onValueChange={(v) => setForm({ ...form, source: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type de bien souhaite</Label>
                <Select value={form.desiredType ?? ""} onValueChange={(v) => setForm({ ...form, desiredType: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Budget min (DA)</Label>
                <Input
                  type="number"
                  value={form.budgetMin}
                  onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                  placeholder="5 000 000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Budget max (DA)</Label>
                <Input
                  type="number"
                  value={form.budgetMax}
                  onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                  placeholder="20 000 000"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Creer le client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
