"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientHeader } from "@/components/clients/ClientHeader";
import { TabInformations } from "@/components/clients/TabInformations";
import { TabVisites } from "@/components/clients/TabVisites";
import { TabPaiements } from "@/components/clients/TabPaiements";
import { TabTaches } from "@/components/clients/TabTaches";
import { TabHistorique } from "@/components/clients/TabHistorique";
import { TabSuggestions } from "@/components/clients/TabSuggestions";
import {
  AlertCircle,
  RefreshCw,
  User,
  Eye,
  DollarSign,
  CheckSquare,
  History,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// Mock data for demo — replaced by API fetch below
// ============================================================================
const MOCK_CLIENT = {
  id: "c1",
  firstName: "Karim",
  lastName: "Benmohamed",
  phone: "0555 12 34 56",
  email: "karim.benmohamed@email.dz",
  pipelineStage: "NEGOCIATION",
  source: "Site web",
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
  address: "12 Rue Didouche Mourad",
  city: "Alger",
  notes: "Client très motivé, cherche un bien pour investissement.",
  budget: 10_000_000,
  budgetMax: 18_000_000,
  propertyType: "APPARTEMENT",
  minArea: 70,
  maxArea: 120,
  minRooms: 3,
  desiredLocation: "Hydra, El Biar",
  assignedAgent: {
    id: "a1",
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie@immoprox.dz",
  },
  visits: [
    {
      id: "v1",
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      status: "DONE",
      feedback: "Le client a aimé l'agencement mais trouve le prix un peu élevé.",
      property: { id: "p1", name: "Appt F3 - Résidence Riviera" },
    },
    {
      id: "v2",
      scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      status: "DONE",
      feedback: "Très intéressé, demande une deuxième visite avec sa femme.",
      property: { id: "p2", name: "Villa Duplex - Horizon Bay" },
    },
    {
      id: "v3",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: "CONFIRMED",
      property: { id: "p2", name: "Villa Duplex - Horizon Bay" },
    },
  ],
  payments: [
    { id: "pay1", type: "Réservation", amount: 500_000, dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), status: "PAID", paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
    { id: "pay2", type: "1ère tranche", amount: 5_000_000, dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), status: "OVERDUE" },
    { id: "pay3", type: "2ème tranche", amount: 5_000_000, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), status: "PENDING" },
    { id: "pay4", type: "Solde", amount: 7_500_000, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(), status: "PENDING" },
  ],
  tasks: [
    { id: "t1", title: "Envoyer le compromis de vente", type: "DOCUMENT", deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), status: "PENDING" },
    { id: "t2", title: "Relancer pour paiement 1ère tranche", type: "CALL", deadline: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), status: "PENDING" },
    { id: "t3", title: "Préparer visite avec architecte", type: "VISIT", deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), status: "PENDING" },
    { id: "t4", title: "Appel de bienvenue", type: "CALL", deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(), status: "DONE" },
  ],
  interactions: [
    { id: "h1", type: "CALL", description: "Appel sortant — Confirmation visite F3 Riviera", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), userName: "Sophie Martin" },
    { id: "h2", type: "VISIT", description: "Visite Appt F3 Résidence Riviera — Client a aimé, prix à négocier", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), userName: "Sophie Martin" },
    { id: "h3", type: "EMAIL", description: "Envoi brochure Villa Duplex Horizon Bay", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), userName: "Sophie Martin" },
    { id: "h4", type: "STAGE_CHANGE", description: "Étape changée : Visite terminée → Négociation", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), userName: "Système" },
    { id: "h5", type: "VISIT", description: "Visite Villa Duplex Horizon Bay — Très intéressé", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), userName: "Sophie Martin" },
    { id: "h6", type: "SMS", description: "SMS envoyé : Rappel paiement réservation", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), userName: "Sophie Martin" },
    { id: "h7", type: "NOTE", description: "Note ajoutée : Client très motivé, cherche un bien pour investissement", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), userName: "Sophie Martin" },
    { id: "h8", type: "TASK_COMPLETED", description: "Tâche terminée : Appel de bienvenue", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), userName: "Sophie Martin" },
  ],
};

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchClient() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/v1/clients/${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data.data || data);
      } else {
        // Use mock data for demo
        setClient(MOCK_CLIENT);
      }
    } catch {
      setClient(MOCK_CLIENT);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-xl font-bold">Client introuvable</p>
        <Button onClick={fetchClient} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Réessayer
        </Button>
      </div>
    );
  }

  const totalPayment = (client.payments || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  );
  const paidAmount = (client.payments || [])
    .filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <ClientHeader client={client} />

      {/* Tabs */}
      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto border-b bg-transparent h-auto p-0 rounded-none gap-0">
          <TabsTrigger
            value="informations"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <User className="h-4 w-4" />
            Informations
          </TabsTrigger>
          <TabsTrigger
            value="visites"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <Eye className="h-4 w-4" />
            Visites
          </TabsTrigger>
          <TabsTrigger
            value="paiements"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <DollarSign className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger
            value="taches"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <CheckSquare className="h-4 w-4" />
            Tâches
          </TabsTrigger>
          <TabsTrigger
            value="historique"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <Sparkles className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="informations">
            <TabInformations client={client} />
          </TabsContent>

          <TabsContent value="visites">
            <TabVisites visits={client.visits || []} />
          </TabsContent>

          <TabsContent value="paiements">
            <TabPaiements
              payments={client.payments || []}
              totalAmount={totalPayment}
              paidAmount={paidAmount}
            />
          </TabsContent>

          <TabsContent value="taches">
            <TabTaches tasks={client.tasks || []} clientId={client.id} />
          </TabsContent>

          <TabsContent value="historique">
            <TabHistorique history={client.interactions || []} />
          </TabsContent>

          <TabsContent value="suggestions">
            <TabSuggestions
              clientId={client.id}
              criteria={{
                budget: client.budget,
                budgetMax: client.budgetMax,
                propertyType: client.propertyType,
                minArea: client.minArea,
                desiredLocation: client.desiredLocation,
                minRooms: client.minRooms,
              }}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
