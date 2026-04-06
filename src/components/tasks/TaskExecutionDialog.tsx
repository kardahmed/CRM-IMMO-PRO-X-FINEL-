"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

import {
  Phone,
  MessageSquare,
  MessageCircle,
  Clock,
  User,
  Home,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Sparkles,
  Loader2,
  AlertTriangle,
  Send,
  type LucideIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Interaction {
  id: string;
  type: string;
  direction: string;
  content: string;
  createdAt: string;
}

interface TaskExecutionContext {
  task: {
    id: string;
    title: string;
    type: string;
    status: string;
    dueAt: string;
    notes: string;
    pipelineStage: string;
    isAutomated: boolean;
    createdAt: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    pipelineStage: string;
    budgetMin: number;
    budgetMax: number;
    source: string;
    notes: string;
    desiredType: string;
    desiredWilaya: string;
    desiredRooms: number;
    interactions: Interaction[];
  };
  property: {
    id: string;
    name: string;
    type: string;
    price: number;
    surface: number;
    rooms: number;
    status: string;
    address: string;
    imageUrl: string;
  } | null;
  suggestedMessage: string | null;
}

interface TaskExecutionDialogProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onExecute: (taskId: string, action: string, note: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<string, LucideIcon> = {
  CALL: Phone,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
};

const PIPELINE_COLORS: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-sky-50 text-sky-700 border-sky-200",
  QUALIFIED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  VISIT_SCHEDULED: "bg-teal-50 text-teal-700 border-teal-200",
  VISITED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NEGOTIATION: "bg-orange-50 text-orange-700 border-orange-200",
  RESERVED: "bg-amber-50 text-amber-700 border-amber-200",
  SIGNED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-gray-50 text-gray-700 border-gray-200",
};

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+213" + cleaned.slice(1);
  }
  return cleaned;
}

function phoneForWaMe(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized.replace(/\+/g, "");
}

function formatDZD(amount: number): string {
  return new Intl.NumberFormat("fr-DZ").format(amount) + " DA";
}

const INTERACTION_TYPE_LABELS: Record<string, string> = {
  CALL: "Appel",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  VISIT: "Visite",
  NOTE: "Note",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TaskExecutionDialog({
  taskId,
  open,
  onClose,
  onExecute,
}: TaskExecutionDialogProps) {
  const [context, setContext] = useState<TaskExecutionContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [callScript, setCallScript] = useState<string | null>(null);
  const [scriptWarning, setScriptWarning] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/execution-context`);
      const json = await res.json();
      if (json.success && json.data) {
        setContext(json.data);
        if (json.data.suggestedMessage) {
          setMessage(json.data.suggestedMessage);
        }
      } else {
        toast.error("Impossible de charger le contexte de la tâche.");
      }
    } catch {
      toast.error("Erreur réseau lors du chargement.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (open && taskId) {
      setNote("");
      setMessage("");
      setCallScript(null);
      setScriptWarning(null);
      fetchContext();
    }
  }, [open, taskId, fetchContext]);

  // --- AI message generation ---
  const handleGenerateMessage = async () => {
    if (!taskId) return;
    setGeneratingMessage(true);
    try {
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, channel: "WHATSAPP", language: "FR" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMessage(json.data.message);
        if (json.data.warning) {
          toast.warning(json.data.warning);
        }
        toast.success("Message généré avec succès.");
      } else {
        toast.error("Échec de la génération du message.");
      }
    } catch {
      toast.error("Erreur réseau lors de la génération.");
    } finally {
      setGeneratingMessage(false);
    }
  };

  // --- AI call script generation ---
  const handleGenerateCallScript = async () => {
    if (!taskId) return;
    setGeneratingScript(true);
    try {
      const res = await fetch("/api/v1/ai/call-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, language: "FR" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setCallScript(json.data.script);
        setScriptWarning(json.data.warning || null);
        toast.success("Script d'appel généré.");
      } else {
        toast.error("Échec de la génération du script.");
      }
    } catch {
      toast.error("Erreur réseau lors de la génération du script.");
    } finally {
      setGeneratingScript(false);
    }
  };

  // --- WhatsApp link ---
  const openWhatsApp = (text?: string) => {
    if (!context) return;
    const digits = phoneForWaMe(context.client.phone);
    const encoded = text ? encodeURIComponent(text) : "";
    const url = encoded
      ? `https://wa.me/${digits}?text=${encoded}`
      : `https://wa.me/${digits}`;
    window.open(url, "_blank");
  };

  if (!open) return null;

  const isOverdue =
    context &&
    isPast(new Date(context.task.dueAt)) &&
    context.task.status !== "DONE";
  const TaskIcon = context
    ? TYPE_ICONS[context.task.type] || Clock
    : Clock;

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-gray-50 dark:bg-neutral-950 p-0 border-l border-neutral-200 dark:border-neutral-800 max-sm:!w-screen max-sm:!max-w-none">
        {loading || !context ? (
          <div className="flex flex-col items-center justify-center p-12 h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">
              Chargement du contexte...
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* ── Header ── */}
            <div className="bg-white dark:bg-black p-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                  <TaskIcon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="text-xl font-black truncate">
                    {context.task.title}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-medium text-muted-foreground">
                      Échéance :{" "}
                      {format(
                        new Date(context.task.dueAt),
                        "dd MMM yyyy, HH:mm",
                        { locale: fr }
                      )}
                    </span>
                    {isOverdue && (
                      <Badge
                        variant="destructive"
                        className="text-xs uppercase font-black px-1.5 py-0"
                      >
                        En retard &mdash;{" "}
                        {formatDistanceToNow(new Date(context.task.dueAt), {
                          locale: fr,
                        })}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scrollable content ── */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* ── Client info card ── */}
              <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
                      <User className="h-4 w-4" /> Client
                    </div>
                    <Badge
                      variant="outline"
                      className={`uppercase font-black text-xs ${
                        PIPELINE_COLORS[context.client.pipelineStage] ||
                        "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {context.client.pipelineStage}
                    </Badge>
                  </div>
                  <p className="text-lg font-black">
                    {context.client.firstName} {context.client.lastName}
                  </p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <a
                      href={`tel:${normalizePhone(context.client.phone)}`}
                      className="flex items-center gap-1.5 text-primary hover:underline font-medium"
                    >
                      <Phone className="h-4 w-4" /> {context.client.phone}
                    </a>
                    {context.client.email && (
                      <span className="text-muted-foreground">
                        {context.client.email}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Budget :{" "}
                    <span className="font-bold text-foreground">
                      {formatDZD(context.client.budgetMin)} &ndash;{" "}
                      {formatDZD(context.client.budgetMax)}
                    </span>
                  </p>
                </CardContent>
              </Card>

              {/* ── Property card ── */}
              {context.property && (
                <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground mb-1">
                      <Home className="h-4 w-4" /> Bien concerné
                    </div>
                    <p className="text-base font-black">
                      {context.property.name}
                    </p>
                    <p className="text-sm text-primary font-black">
                      {formatDZD(context.property.price)}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{context.property.type}</span>
                      {context.property.surface > 0 && (
                        <span>{context.property.surface} m²</span>
                      )}
                      {context.property.rooms > 0 && (
                        <span>{context.property.rooms} pièces</span>
                      )}
                      {context.property.address && (
                        <span>{context.property.address}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── Last interactions timeline ── */}
              {context.client.interactions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Dernières interactions
                  </h4>
                  <div className="pl-3 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-3">
                    {context.client.interactions.map((interaction) => (
                      <div key={interaction.id} className="relative">
                        <div className="absolute -left-[17px] top-1.5 h-2.5 w-2.5 rounded-full bg-neutral-300 dark:bg-neutral-600 border-2 border-gray-50 dark:border-neutral-950" />
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs font-bold px-1.5 py-0"
                          >
                            {INTERACTION_TYPE_LABELS[interaction.type] ||
                              interaction.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {interaction.direction === "OUTGOING"
                              ? "Sortant"
                              : "Entrant"}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5">{interaction.content}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(
                            new Date(interaction.createdAt),
                            "dd MMM yyyy à HH:mm",
                            { locale: fr }
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${normalizePhone(context.client.phone)}`}
                    className="inline-flex"
                  >
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white gap-1.5 font-bold shadow-sm h-8"
                    >
                      <Phone className="h-3.5 w-3.5" /> Appeler
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50 gap-1.5 font-bold h-8"
                    onClick={() => openWhatsApp()}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                  <a
                    href={`sms:${normalizePhone(context.client.phone)}`}
                    className="inline-flex"
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 font-bold h-8"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> SMS
                    </Button>
                  </a>
                </div>

                {/* ── AI generate message ── */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-1.5 font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 h-8"
                    onClick={handleGenerateMessage}
                    disabled={generatingMessage}
                  >
                    {generatingMessage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Générer avec IA
                  </Button>
                </div>

                {/* ── Message textarea ── */}
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Rédigez votre message ici ou prenez des notes d'appel..."
                  className="resize-none h-24 bg-white dark:bg-black focus-visible:ring-emerald-500"
                />

                {message.trim().length > 0 && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1.5 font-bold h-8"
                    onClick={() => openWhatsApp(message)}
                  >
                    <Send className="h-3.5 w-3.5" /> Envoyer via WhatsApp
                  </Button>
                )}
              </div>

              {/* ── AI Call Script (only for CALL type) ── */}
              {context.task.type === "CALL" && (
                <div className="space-y-3 pt-2">
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-1.5 font-bold text-purple-600 bg-purple-50 border border-purple-100 hover:bg-purple-100 h-8"
                      onClick={handleGenerateCallScript}
                      disabled={generatingScript}
                    >
                      {generatingScript ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Générer script d&apos;appel
                    </Button>

                    {callScript && (
                      <div className="mt-3 space-y-2">
                        {scriptWarning && (
                          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span>{scriptWarning}</span>
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className="text-xs font-bold text-purple-600 border-purple-200 bg-purple-50"
                        >
                          <Sparkles className="h-3 w-3 mr-1" /> Généré par IA
                          &mdash; validation humaine requise
                        </Badge>
                        <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black p-4 text-sm whitespace-pre-wrap leading-relaxed">
                          {callScript}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Post-execution note ── */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold">
                  Note de conclusion (pour l&apos;historique)
                </h4>
                <Input
                  value={note}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNote(e.target.value)
                  }
                  placeholder="Résumé rapide de l'action effectuée..."
                  className="bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* ── Bottom action buttons ── */}
            <div className="p-4 bg-white dark:bg-black border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap gap-3 justify-end shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 font-bold gap-1.5"
                onClick={() => onExecute(context.task.id, "CANCEL", note)}
              >
                <XCircle className="h-4 w-4" /> Annuler tâche
              </Button>
              <Button
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50 font-bold gap-1.5"
                onClick={() => onExecute(context.task.id, "POSTPONE", note)}
              >
                <CalendarClock className="h-4 w-4" /> Reporter
              </Button>
              <Button
                className="bg-primary text-white hover:bg-primary/90 font-black gap-1.5 px-8"
                onClick={() => onExecute(context.task.id, "FINISH", note)}
              >
                <CheckCircle2 className="h-4 w-4" /> Marquer Terminée
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
