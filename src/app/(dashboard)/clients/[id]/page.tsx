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
import { TabReservation } from "@/components/clients/TabReservation";
import { TabVente } from "@/components/clients/TabVente";
import { TabEcheances } from "@/components/clients/TabEcheances";
import { TabDocuments } from "@/components/clients/TabDocuments";
import { TabCharges } from "@/components/clients/TabCharges";
import { TabNotes } from "@/components/clients/TabNotes";
import { CreditSimulator } from "@/components/shared/CreditSimulator";
import { PipelineStepper } from "@/components/clients/PipelineStepper";
import { ClientInfoPanel } from "@/components/clients/ClientInfoPanel";
import {
  AlertCircle,
  RefreshCw,
  User,
  Eye,
  DollarSign,
  CheckSquare,
  History,
  Sparkles,
  Calculator,
  MessageCircle,
  MessageSquare,
  Mail,
  Phone,
  FileCheck,
  Scale,
  CalendarDays,
  FileText,
  Receipt,
  StickyNote,
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
  reservation: {
    contractId: "RES-2023-089",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    property: { id: "p2", name: "Villa Duplex - Horizon Bay", unit: "B-12" },
    amount: 18_000_000,
    deposit: 500_000,
    status: "SIGNED",
  },
  vente: {
    notary: "Me. Haddad",
    promesseDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    acteDate: null,
    status: "EN_ATTENTE_PROMESSE",
    percentCompleted: 40,
  },
  documents: [
    { id: "doc1", title: "Pièce d'identité (CNI)", type: "IDENTITY", url: "#", uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), size: "1.2 MB" },
    { id: "doc2", title: "Contrat de Réservation Signé", type: "CONTRACT", url: "#", uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), size: "2.5 MB" },
  ],
  charges: [
    { id: "c1", label: "TMA - Ajout prise électrique", amount: 25_000, status: "UNPAID" },
    { id: "c2", label: "Frais de dossier", amount: 15_000, status: "PAID" },
  ],
  notesLog: [
    { id: "n1", content: "Le client exige une vue dégagée sur le jardin. Ne veut pas de RDC.", author: "Sophie Martin", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
    { id: "n2", content: "Validé le financement bancaire avec la banque CPA à 80%.", author: "Sophie Martin", date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  ]
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

      {/* Accordion Infos (Read-Only) */}
      <ClientInfoPanel client={client} />

      {/* Barre d'Actions Rapides (Horizontal Pills) */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1">
        <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 gap-2 px-5">
          <Phone className="h-4 w-4" fill="currentColor" /> Appeler
        </Button>
        <Button className="rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold h-9 gap-2 px-5 shadow-sm">
          <MessageCircle className="h-4 w-4" fill="currentColor" /> Appel WhatsApp
        </Button>
        <Button className="rounded-full bg-[#128C7E] hover:bg-[#128C7E]/90 text-white font-bold h-9 gap-2 px-5 shadow-sm">
          <MessageCircle className="h-4 w-4" /> Message WA
        </Button>
        <Button variant="outline" className="rounded-full font-bold h-9 gap-2 px-5 border-neutral-300">
          <MessageSquare className="h-4 w-4 text-purple-600" fill="currentColor" /> SMS
        </Button>
        <Button variant="outline" className="rounded-full font-bold h-9 gap-2 px-5 border-neutral-300">
          <Mail className="h-4 w-4 text-rose-500" fill="currentColor" /> Email
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-black h-9 gap-2 px-5 shadow-sm">
          <Sparkles className="h-4 w-4" fill="currentColor" /> Suggestions AI
        </Button>
      </div>

      {/* Pipeline Stepper (Visual Flow) */}
      <PipelineStepper currentStage={client.pipelineStage} />

      {/* Tabs */}
      <Tabs defaultValue="visites" className="w-full mt-4">
        <TabsList className="flex w-full justify-start overflow-x-auto border-b bg-transparent h-auto p-0 rounded-none gap-0 no-scrollbar">
          <TabsTrigger
            value="visites"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <Eye className="h-4 w-4" />
            Visites
          </TabsTrigger>
          <TabsTrigger
            value="reservation"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <FileCheck className="h-4 w-4" />
            Réservation
          </TabsTrigger>
          <TabsTrigger
            value="vente"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <Scale className="h-4 w-4" />
            Vente
          </TabsTrigger>
          <TabsTrigger
            value="echeances"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <CalendarDays className="h-4 w-4" />
            Échéances
          </TabsTrigger>
          <TabsTrigger
            value="paiements"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <DollarSign className="h-4 w-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger
             value="documents"
             className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
           >
             <FileText className="h-4 w-4" />
             Documents
           </TabsTrigger>
           <TabsTrigger
             value="charges"
             className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
           >
             <Receipt className="h-4 w-4" />
             Charges
           </TabsTrigger>
           <TabsTrigger
             value="notes"
             className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
           >
             <StickyNote className="h-4 w-4" />
             Notes
           </TabsTrigger>
          <TabsTrigger
            value="taches"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <CheckSquare className="h-4 w-4" />
            Tâches
          </TabsTrigger>
          <TabsTrigger
            value="historique"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <History className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger
            value="suggestions"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3"
          >
            <Sparkles className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger
            value="simulateur"
            className="flex-shrink-0 gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold text-sm px-5 py-3 text-purple-600 data-[state=active]:text-purple-600"
          >
            <Calculator className="h-4 w-4" />
            Simulateur
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="visites">
            <TabVisites visits={client.visits || []} />
          </TabsContent>

          <TabsContent value="reservation">
            <TabReservation reservation={client.reservation} />
          </TabsContent>

          <TabsContent value="vente">
            <TabVente vente={client.vente} />
          </TabsContent>

          <TabsContent value="echeances">
            <TabEcheances
              totalAmount={totalPayment}
              paidAmount={paidAmount} 
            />
          </TabsContent>

          <TabsContent value="paiements">
            <TabPaiements
              payments={client.payments || []}
              totalAmount={totalPayment}
              paidAmount={paidAmount}
            />
          </TabsContent>

          <TabsContent value="documents">
            <TabDocuments documents={client.documents || []} />
          </TabsContent>

          <TabsContent value="charges">
            <TabCharges charges={client.charges || []} />
          </TabsContent>

          <TabsContent value="notes">
            <TabNotes notes={client.notesLog || []} />
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

          <TabsContent value="simulateur">
            <CreditSimulator initialPrixBien={client.budgetMax ? client.budgetMax : client.budget} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
