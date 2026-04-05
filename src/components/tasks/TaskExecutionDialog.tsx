"use client";

import { useState, useEffect } from "react";
import { format, isPast } from "date-fns";
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
import Image from "next/image";

import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Clock,
  User,
  Home,
  CheckCircle2,
  CalendarClock,
  XCircle,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Map,
  type LucideIcon,
} from "lucide-react";

interface Interaction {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface TaskExecutionContext {
  task: {
    id: string;
    title: string;
    type: string;
    deadline: string;
    status: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    pipelineStage: string;
    budget: number;
    interactions: Interaction[];
  };
  property?: {
    id: string;
    name: string;
    price: number;
    status: string;
    imageUrl?: string;
  };
}

interface TaskExecutionDialogProps {
  taskId: string | null;
  open: boolean;
  onClose: () => void;
  onExecute: (taskId: string, action: string, note: string) => void;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  SMS: MessageSquare,
  WHATSAPP: MessageCircle,
};

export function TaskExecutionDialog({ taskId, open, onClose, onExecute }: TaskExecutionDialogProps) {
  const [context, setContext] = useState<TaskExecutionContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open && taskId) {
      fetchContext();
      setNote("");
      setMessage("");
    }
  }, [open, taskId]);

  const fetchContext = async () => {
    setLoading(true);
    try {
      // res = await fetch(`/api/v1/tasks/${taskId}/execution-context`);
      // MOCK DATA:
      setTimeout(() => {
        setContext({
          task: {
            id: taskId || "1",
            title: "Relancer le client suite à la visite",
            type: "CALL",
            deadline: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Overdue by 1h
            status: "PENDING",
          },
          client: {
            id: "c1",
            firstName: "Karim",
            lastName: "Benmohamed",
            phone: "+213 555 12 34 56",
            email: "karim@email.dz",
            pipelineStage: "Négociation",
            budget: 15000000,
            interactions: [
              { id: "1", type: "VISIT", description: "Visite effectuée", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
              { id: "2", type: "CALL", description: "Appel de confirmation", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
            ],
          },
          property: {
            id: "p1",
            name: "Appartement F4 Riviera",
            price: 16000000,
            status: "AVAILABLE",
            imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=80",
          },
        });
        setLoading(false);
      }, 500);
    } catch {
      setLoading(false);
    }
  };

  if (!open) return null;

  const isOverdue = context && isPast(new Date(context.task.deadline)) && context.task.status !== "DONE";
  const TaskIcon = context ? (TYPE_ICONS[context.task.type] || Clock) : Clock;

  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : null)}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-gray-50 dark:bg-neutral-950 p-0 border-l border-neutral-200 dark:border-neutral-800 max-sm:!w-screen max-sm:!max-w-none">
        {loading || !context ? (
          <div className="flex flex-col items-center justify-center p-12 h-full">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">Chargement du contexte...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* 1. Header Tâche */}
            <div className="bg-white dark:bg-black p-6 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <TaskIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <SheetTitle className="text-xl font-black">{context.task.title}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        Échéance : {format(new Date(context.task.deadline), "dd MMM yyyy, HH:mm", { locale: fr })}
                      </span>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-[10px] uppercase font-black px-1.5 py-0">En retard</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* 2. Infos Client */}
              <Card className="shadow-sm border-neutral-100 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
                      <User className="h-4 w-4" /> Client
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 uppercase font-black text-[10px]">
                      {context.client.pipelineStage}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div>
                      <p className="text-lg font-black">{context.client.firstName} {context.client.lastName}</p>
                    </div>
                    <div>
                      <a href={`tel:${context.client.phone}`} className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                        <Phone className="h-4 w-4" /> {context.client.phone}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground pt-1.5 font-medium">
                        Budget : <span className="font-bold text-foreground">{new Intl.NumberFormat("fr-DZ").format(context.client.budget)} DA</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 3. Dernières interactions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Dernières interactions
                  </h4>
                  <div className="pl-2 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-3">
                    {context.client.interactions.map((interaction) => (
                      <div key={interaction.id} className="relative">
                        <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-neutral-300 dark:bg-neutral-600 border-2 border-white dark:border-black" />
                        <p className="text-sm font-medium">{interaction.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(interaction.createdAt), "dd MMM à HH:mm", { locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Bien concerné */}
                {context.property && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                      <Home className="h-3.5 w-3.5" /> Bien concerné
                    </h4>
                    <div className="rounded-xl border bg-white dark:bg-neutral-900 overflow-hidden flex shadow-sm">
                      <div className="w-1/3 bg-neutral-100 flex items-center justify-center min-h-[80px] relative">
                        {context.property.imageUrl ? (
                          <Image src={context.property.imageUrl} alt="Bien" className="w-full h-full object-cover" fill sizes="120px" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-neutral-400" />
                        )}
                      </div>
                      <div className="p-3 w-2/3">
                        <p className="text-sm font-bold truncate">{context.property.name}</p>
                        <p className="text-sm text-primary font-black mt-1">
                          {new Intl.NumberFormat("fr-DZ").format(context.property.price)} DA
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2 gap-1 font-bold">
                            <ImageIcon className="h-3 w-3" /> Photos
                          </Button>
                          <Button size="sm" variant="secondary" className="h-6 text-[10px] px-2 gap-1 font-bold">
                            <Map className="h-3 w-3" /> Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Actions rapides + Rédaction */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5 font-bold shadow-sm h-8">
                      <Phone className="h-3.5 w-3.5" /> Appeler
                    </Button>
                    <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 gap-1.5 font-bold h-8">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 font-bold h-8">
                      <MessageSquare className="h-3.5 w-3.5" /> SMS
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 font-bold h-8">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                  </div>
                  <Button size="sm" variant="secondary" className="gap-1.5 font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 h-8">
                    <Sparkles className="h-3.5 w-3.5" /> Générer avec AI
                  </Button>
                </div>

                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Rédigez votre message ici ou prenez des notes d'appel..."
                  className="resize-none h-24 bg-white dark:bg-black focus-visible:ring-indigo-500"
                />
              </div>

              {/* 6. Note post-exécution */}
              <div className="space-y-2 pt-2">
                <h4 className="text-sm font-bold">Note de conclusion (pour l&apos;historique)</h4>
                <Input
                  value={note}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
                  placeholder="Résumé rapide de l'action effectuée..."
                  className="bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* 7. Actions Finales */}
            <div className="p-4 bg-white dark:bg-black border-t flex flex-wrap gap-3 justify-end shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
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
