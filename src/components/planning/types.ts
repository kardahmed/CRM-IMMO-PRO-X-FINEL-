export interface PlanningVisit {
  id: string;
  scheduledAt: string;
  status: string;
  clientName: string;
  clientId: string;
  propertyName: string;
  propertyId: string;
  agentName: string;
  agentId: string;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PLANNED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  CONFIRMED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  DONE: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  POSTPONED: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
};

export const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Programmée",
  CONFIRMED: "Confirmée",
  DONE: "Terminée",
  CANCELLED: "Annulée",
  POSTPONED: "Reportée",
};
