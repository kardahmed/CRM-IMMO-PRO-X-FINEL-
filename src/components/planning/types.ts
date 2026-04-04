export interface PlanningVisit {
  id: string;
  scheduledAt: string;
  status: string;
  feedback?: string | null;
  clientName: string;
  clientId: string;
  propertyName: string;
  propertyId: string;
  agentName: string;
  agentId: string;
}

export interface PlanningTask {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  dueAt: string | null;
  assignedToName: string;
  assignedToId: string;
  clientName: string | null;
  clientId: string | null;
}

/** Raw visit shape returned by GET /api/v1/visits */
export interface ApiVisit {
  id: string;
  scheduledAt: string;
  status: string;
  feedback?: string | null;
  client: { id: string; firstName: string; lastName: string; phone?: string };
  property: { id: string; name: string; type?: string };
  agent: { id: string; firstName: string; lastName: string };
}

/** Raw task shape returned by GET /api/v1/tasks */
export interface ApiTask {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  dueAt: string | null;
  assignedTo: { id: string; firstName: string; lastName: string };
  client?: { id: string; firstName: string; lastName: string } | null;
  property?: { id: string; name: string } | null;
}

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PLANNED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  CONFIRMED: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", dot: "bg-green-500" },
  COMPLETED: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
  DONE: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  NO_SHOW: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  POSTPONED: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
};

export const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Programmee",
  SCHEDULED: "Programmee",
  CONFIRMED: "Confirmee",
  COMPLETED: "Terminee",
  DONE: "Terminee",
  CANCELLED: "Annulee",
  NO_SHOW: "Absent",
  POSTPONED: "Reportee",
};

export const TASK_STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-500" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  COMPLETED: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminee",
  CANCELLED: "Annulee",
};
