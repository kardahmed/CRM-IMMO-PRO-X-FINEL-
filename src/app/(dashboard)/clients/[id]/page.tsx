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
// Types
// ============================================================================

interface IAssignedAgent {
  id?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

interface IPayment {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string;
}

interface IVisit {
  id: string;
  scheduledAt: string;
  status: string;
  feedback?: string;
  property: { id: string; name: string };
}

interface ITask {
  id: string;
  title: string;
  type: string;
  deadline: string;
  status: string;
}

interface IInteraction {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userName: string;
}

interface IClientDetail {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  source: string;
  pipelineStage: string;
  budgetMin?: number;
  budgetMax?: number;
  desiredType?: string;
  desiredRooms?: number;
  desiredWilaya?: string;
  notes?: string;
  lostReason?: string;
  portalToken?: string;
  assignedAgent?: IAssignedAgent;
  payments: IPayment[];
  visits: IVisit[];
  tasks: ITask[];
  interactions: IInteraction[];
  createdAt: string;
  address?: string;
  city?: string;
  budget?: number;
  propertyType?: string;
  minArea?: number;
  maxArea?: number;
  minRooms?: number;
  desiredLocation?: string;
  reservation?: Record<string, unknown>;
  vente?: Record<string, unknown>;
  documents?: Record<string, unknown>[];
  charges?: Record<string, unknown>[];
  notesLog?: Record<string, unknown>[];
}


export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<IClientDetail | null>(null);
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
        setError(true);
      }
    } catch {
      setError(true);
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
    (sum: number, p: IPayment) => sum + (p.amount || 0),
    0
  );
  const paidAmount = (client.payments || [])
    .filter((p: IPayment) => p.status === "PAID")
    .reduce((sum: number, p: IPayment) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <ClientHeader client={client as any} />

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
            <TabReservation reservation={client.reservation as any} />
          </TabsContent>

          <TabsContent value="vente">
            <TabVente vente={client.vente as any} />
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
            <TabDocuments documents={(client.documents || []) as any} />
          </TabsContent>

          <TabsContent value="charges">
            <TabCharges charges={(client.charges || []) as any} />
          </TabsContent>

          <TabsContent value="notes">
            <TabNotes notes={(client.notesLog || []) as any} />
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
