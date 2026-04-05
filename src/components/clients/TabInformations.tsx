"use client";

import * as Sentry from "@sentry/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Loader2, User, Home, DollarSign, MapPin } from "lucide-react";
import { useState } from "react";

interface TabInformationsProps {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    notes?: string;
    budget?: number;
    budgetMax?: number;
    propertyType?: string;
    minArea?: number;
    maxArea?: number;
    minRooms?: number;
    desiredLocation?: string;
    source?: string;
  };
}

export function TabInformations({ client }: TabInformationsProps) {
  const [form, setForm] = useState({
    firstName: client.firstName || "",
    lastName: client.lastName || "",
    phone: client.phone || "",
    email: client.email || "",
    address: client.address || "",
    city: client.city || "",
    notes: client.notes || "",
    budget: client.budget?.toString() || "",
    budgetMax: client.budgetMax?.toString() || "",
    propertyType: client.propertyType || "",
    minArea: client.minArea?.toString() || "",
    maxArea: client.maxArea?.toString() || "",
    minRooms: client.minRooms?.toString() || "",
    desiredLocation: client.desiredLocation || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/v1/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? Number(form.budget) : undefined,
          budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
          minArea: form.minArea ? Number(form.minArea) : undefined,
          maxArea: form.maxArea ? Number(form.maxArea) : undefined,
          minRooms: form.minRooms ? Number(form.minRooms) : undefined,
        }),
      });
      setSaved(true);
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "TabInformations" } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
      {/* Infos Personnelles */}
      <Card className="border-neutral-100 dark:border-neutral-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <User className="h-4 w-4 text-primary" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Prénom</label>
              <Input value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Nom</label>
              <Input value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Téléphone</label>
              <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Email</label>
              <Input value={form.email} onChange={(e) => handleChange("email", e.target.value)} type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Adresse</label>
              <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Ville</label>
              <Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="resize-none"
              placeholder="Remarques sur le client..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Critères de Recherche */}
      <Card className="border-neutral-100 dark:border-neutral-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <Home className="h-4 w-4 text-indigo-500" />
            Critères de recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Budget min (DA)</label>
              <Input value={form.budget} onChange={(e) => handleChange("budget", e.target.value)} type="number" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Budget max (DA)</label>
              <Input value={form.budgetMax} onChange={(e) => handleChange("budgetMax", e.target.value)} type="number" placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Type de bien</label>
            <Select value={form.propertyType} onValueChange={(v: string | null) => handleChange("propertyType", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPARTEMENT">Appartement</SelectItem>
                <SelectItem value="VILLA">Villa</SelectItem>
                <SelectItem value="STUDIO">Studio</SelectItem>
                <SelectItem value="DUPLEX">Duplex</SelectItem>
                <SelectItem value="TERRAIN">Terrain</SelectItem>
                <SelectItem value="COMMERCE">Local commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Surface min (m²)</label>
              <Input value={form.minArea} onChange={(e) => handleChange("minArea", e.target.value)} type="number" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Surface max (m²)</label>
              <Input value={form.maxArea} onChange={(e) => handleChange("maxArea", e.target.value)} type="number" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Pièces min</label>
              <Input value={form.minRooms} onChange={(e) => handleChange("minRooms", e.target.value)} type="number" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Localisation souhaitée</label>
              <Input value={form.desiredLocation} onChange={(e) => handleChange("desiredLocation", e.target.value)} placeholder="Quartier, ville..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="lg:col-span-2 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 font-bold px-8"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Enregistré ✓" : "Enregistrer les modifications"}
        </Button>
      </div>
    </div>
  );
}
