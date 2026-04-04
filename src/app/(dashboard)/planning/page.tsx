"use client";

import { useState, useEffect, useMemo } from "react";
import { PlanningFilters, type ViewMode } from "@/components/planning/PlanningFilters";
import { DayView } from "@/components/planning/DayView";
import { WeekView } from "@/components/planning/WeekView";
import { MonthView } from "@/components/planning/MonthView";
import { VisitDetailPopup } from "@/components/planning/VisitDetailPopup";
import type { PlanningVisit } from "@/components/planning/types";
import { Calendar as CalendarIcon } from "lucide-react";

// Mock Data
const MOCK_VISITS: PlanningVisit[] = [
  {
    id: "v1",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // +2 hours
    status: "PLANNED",
    clientName: "Karim Benmohamed",
    clientId: "c1",
    propertyName: "Appt F3 - Résidence Riviera",
    propertyId: "p1",
    agentName: "Sophie Martin",
    agentId: "sophie",
  },
  {
    id: "v2",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    status: "CONFIRMED",
    clientName: "Amira Hadj",
    clientId: "c2",
    propertyName: "Studio - Les Palmiers",
    propertyId: "p2",
    agentName: "Lucas Bernard",
    agentId: "lucas",
  },
  {
    id: "v3",
    scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    status: "DONE",
    clientName: "Yacine Ferhat",
    clientId: "c3",
    propertyName: "Villa Duplex - Horizon Bay",
    propertyId: "p3",
    agentName: "Emma Petit",
    agentId: "emma",
  },
  {
    id: "v4",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: "CANCELLED",
    clientName: "Nadia Khelifa",
    clientId: "c4",
    propertyName: "Appt F4 - Riviera",
    propertyId: "p4",
    agentName: "Sophie Martin",
    agentId: "sophie",
  },
  {
    id: "v5",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    status: "POSTPONED",
    clientName: "Rachid Belkacem",
    clientId: "c5",
    propertyName: "Bureau Centre Ville",
    propertyId: "p5",
    agentName: "Lucas Bernard",
    agentId: "lucas",
  },
];

function getDefaultView(): ViewMode {
  if (typeof window !== "undefined" && window.innerWidth < 768) return "day";
  return "week";
}

export default function PlanningPage() {
  const [view, setView] = useState<ViewMode>(getDefaultView);
  const [agent, setAgent] = useState("all");
  const [status, setStatus] = useState("all");
  const [date, setDate] = useState(new Date());

  const [visits, setVisits] = useState<PlanningVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedVisit, setSelectedVisit] = useState<PlanningVisit | null>(null);

  useEffect(() => {
    fetchVisits();
  }, [date, view, agent, status]);

  const fetchVisits = async () => {
    setLoading(true);
    // MOCK Fetch
    setTimeout(() => {
      setVisits(MOCK_VISITS);
      setLoading(false);
    }, 300);
  };

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (agent !== "all" && v.agentId !== agent) return false;
      if (status !== "all" && v.status !== status) return false;
      return true;
    });
  }, [visits, agent, status]);

  const handleAction = async (visitId: string, action: string) => {
    // API Call here to update status
    setVisits((prev) =>
      prev.map((v) => (v.id === visitId ? { ...v, status: action } : v))
    );
    setSelectedVisit(null);
  };

  const handleCreateVisit = () => {
    // Open create visit dialog
    alert("Ouverture du formulaire de création de visite...");
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Planning</h1>
            <p className="text-sm text-muted-foreground font-medium">
              Gestion des visites et rendez-vous
            </p>
          </div>
        </div>

        <PlanningFilters
          view={view}
          onViewChange={setView}
          agent={agent}
          onAgentChange={setAgent}
          status={status}
          onStatusChange={setStatus}
          onCreateVisit={handleCreateVisit}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-auto min-h-[500px]">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : view === "day" ? (
          <DayView visits={filteredVisits} date={date} onVisitClick={setSelectedVisit} />
        ) : view === "week" ? (
          <WeekView visits={filteredVisits} date={date} onVisitClick={setSelectedVisit} />
        ) : (
          <MonthView visits={filteredVisits} date={date} onVisitClick={setSelectedVisit} />
        )}
      </div>

      {/* Detail Popup */}
      <VisitDetailPopup
        visit={selectedVisit}
        open={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
        onAction={handleAction}
      />
    </div>
  );
}
