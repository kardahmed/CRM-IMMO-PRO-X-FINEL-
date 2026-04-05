"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  Home,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface IProperty {
  id: string;
  name: string;
  type: string;
  price: number;
  status: string;
  surface: number;
  rooms: number;
  floor: number | null;
  transactionType: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  RESERVED: "bg-amber-100 text-amber-800",
  SOLD: "bg-red-100 text-red-800",
  RENTED: "bg-blue-100 text-blue-800",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reserve",
  SOLD: "Vendu",
  RENTED: "Loue",
};

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  STUDIO: "Studio",
  DUPLEX: "Duplex",
  PENTHOUSE: "Penthouse",
  VILLA: "Villa",
  COMMERCIAL: "Commercial",
  PARKING: "Parking",
  CAVE: "Cave",
  TERRAIN: "Terrain",
};

const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

const TRANSACTION_OPTIONS = [
  { value: "SALE", label: "Vente" },
  { value: "RENT", label: "Location" },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    maximumFractionDigits: 0,
  }).format(price);

export default function PortfolioPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "",
    transactionType: "",
    price: "",
    surface: "",
    rooms: "",
    floor: "",
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const res = await fetch("/api/v1/properties");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setProperties(Array.isArray(d) ? d : d.properties ?? []);
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "Portfolio page" } });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.name || !form.type) {
      toast.error("Nom et type sont requis");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        type: form.type,
      };
      if (form.transactionType) body.transactionType = form.transactionType;
      if (form.price) body.price = Number(form.price);
      if (form.surface) body.surface = Number(form.surface);
      if (form.rooms) body.rooms = Number(form.rooms);
      if (form.floor) body.floor = Number(form.floor);

      const res = await fetch("/api/v1/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Erreur lors de la creation");
        return;
      }
      toast.success("Bien cree avec succes");
      setIsCreateOpen(false);
      setForm({ name: "", type: "", transactionType: "", price: "", surface: "", rooms: "", floor: "" });
      const newProp = json.data;
      if (newProp?.id) {
        router.push(`/portfolio/${newProp.id}`);
      } else {
        fetchProperties();
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setCreating(false);
    }
  }

  const filtered = properties.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Portefeuille
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gerez votre portefeuille de biens immobiliers
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau bien
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un bien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("ALL")}
          >
            Tous
          </Button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(key)}
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
            <Home className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Aucun bien trouve
            </p>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "Essayez de modifier vos filtres"
                : "Commencez par ajouter votre premier bien"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((property) => (
            <Link key={property.id} href={`/portfolio/${property.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {property.name}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${
                        STATUS_COLORS[property.status] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {STATUS_LABELS[property.status] || property.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {TYPE_LABELS[property.type] || property.type}
                    </Badge>
                    <span className="text-sm font-medium text-muted-foreground">
                      {property.transactionType === "SALE"
                        ? "Vente"
                        : "Location"}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(property.price)}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{property.surface} m²</span>
                    <span>
                      {property.rooms} piece{property.rooms > 1 ? "s" : ""}
                    </span>
                    {property.floor !== null && property.floor !== undefined && (
                      <span>Etage {property.floor}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajoute{" "}
                    {formatDistanceToNow(new Date(property.createdAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Property Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau bien</DialogTitle>
            <DialogDescription>Remplissez les informations du bien immobilier</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom / Designation *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Appartement F3 Hydra"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type ?? ""} onValueChange={(v) => setForm({ ...form, type: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Transaction</Label>
                <Select value={form.transactionType ?? ""} onValueChange={(v) => setForm({ ...form, transactionType: v ?? "" })}>
                  <SelectTrigger><SelectValue placeholder="Selectionner" /></SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prix (DA)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="15 000 000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Surface (m²)</Label>
                <Input
                  type="number"
                  value={form.surface}
                  onChange={(e) => setForm({ ...form, surface: e.target.value })}
                  placeholder="85"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre de pieces</Label>
                <Input
                  type="number"
                  value={form.rooms}
                  onChange={(e) => setForm({ ...form, rooms: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Etage</Label>
                <Input
                  type="number"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                  placeholder="2"
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
              Creer le bien
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
