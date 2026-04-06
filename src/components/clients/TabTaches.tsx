"use client";

import * as Sentry from "@sentry/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  Eye,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Copy,
  MessageCircle,
  MessageSquare,
  Send,
  type LucideIcon,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  type: string;
  deadline: string;
  status: string;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  CALL: Phone,
  EMAIL: Mail,
  VISIT: Eye,
  DOCUMENT: FileText,
  OTHER: CheckSquare,
};

const TYPE_LABELS: Record<string, string> = {
  CALL: "Appel",
  EMAIL: "Email",
  VISIT: "Visite",
  DOCUMENT: "Document",
  OTHER: "Autre",
};

const CHANNEL_OPTIONS: Record<string, { label: string; icon: LucideIcon; color: string }[]> = {
  CALL: [
    { label: "Script d'appel", icon: Phone, color: "bg-blue-600 hover:bg-blue-700 text-white" },
  ],
  EMAIL: [
    { label: "Brouillon email", icon: Mail, color: "bg-rose-500 hover:bg-rose-600 text-white" },
  ],
  OTHER: [
    { label: "Message WhatsApp", icon: MessageCircle, color: "bg-[#25D366] hover:bg-[#25D366]/90 text-white" },
    { label: "Brouillon SMS", icon: MessageSquare, color: "bg-purple-600 hover:bg-purple-700 text-white" },
    { label: "Brouillon email", icon: Mail, color: "bg-rose-500 hover:bg-rose-600 text-white" },
  ],
  VISIT: [
    { label: "Script de visite", icon: Phone, color: "bg-blue-600 hover:bg-blue-700 text-white" },
  ],
  DOCUMENT: [
    { label: "Brouillon email", icon: Mail, color: "bg-rose-500 hover:bg-rose-600 text-white" },
  ],
};

export function TabTaches({ tasks, clientId }: { tasks: Task[]; clientId: string }) {
  const [execModal, setExecModal] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });
  const [execNote, setExecNote] = useState("");
  const [executing, setExecuting] = useState(false);

  // AI Script state
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiScript, setAiScript] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetModal = () => {
    setExecModal({ open: false, task: null });
    setExecNote("");
    setAiScript(null);
    setAiError(null);
    setCopied(false);
  };

  const handleExecute = async () => {
    if (!execModal.task) return;
    setExecuting(true);
    try {
      await fetch(`/api/v1/tasks/${execModal.task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE", completionNote: execNote }),
      });
      resetModal();
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "TabTaches" } });
    } finally {
      setExecuting(false);
    }
  };

  const handleGenerateScript = async (channel?: string) => {
    if (!execModal.task) return;
    setGeneratingAI(true);
    setAiError(null);
    setAiScript(null);

    try {
      const taskType = execModal.task.type;

      if (taskType === "CALL" || (taskType === "VISIT" && !channel)) {
        // Use call-script endpoint
        const res = await fetch("/api/v1/ai/call-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: execModal.task.id }),
        });
        const data = await res.json();
        if (data.success === false) {
          setAiError(data.error || "Erreur de génération");
        } else {
          setAiScript(data.data?.script || data.script || "Aucun script généré");
        }
      } else {
        // Use generate endpoint for messages
        const channelToUse = channel || (taskType === "EMAIL" ? "EMAIL" : "SMS");
        const res = await fetch("/api/v1/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: execModal.task.id,
            channel: channelToUse,
          }),
        });
        const data = await res.json();
        if (data.success === false) {
          setAiError(data.error || "Erreur de génération");
        } else {
          setAiScript(data.data?.message || data.message || "Aucun message généré");
        }
      }
    } catch (err) {
      setAiError("Erreur de connexion au serveur IA");
      Sentry.captureException(err, { tags: { context: "TabTaches AI" } });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCopy = () => {
    if (aiScript) {
      navigator.clipboard.writeText(aiScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Sort tasks: overdue first, then pending, then done
  const sortedTasks = [...tasks].sort((a, b) => {
    const aIsDone = a.status === "DONE";
    const bIsDone = b.status === "DONE";
    if (aIsDone !== bIsDone) return aIsDone ? 1 : -1;

    const aIsOverdue = a.status !== "DONE" && isPast(new Date(a.deadline));
    const bIsOverdue = b.status !== "DONE" && isPast(new Date(b.deadline));
    if (aIsOverdue !== bIsOverdue) return aIsOverdue ? -1 : 1;

    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const pendingCount = tasks.filter((t) => t.status !== "DONE").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "DONE" && isPast(new Date(t.deadline))
  ).length;

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-bold">
              <CheckSquare className="h-4 w-4 text-primary" />
              Tâches
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-xs font-bold">
                  {pendingCount} en cours
                </Badge>
              )}
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs font-bold animate-pulse">
                  {overdueCount} en retard
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Aucune tâche
            </p>
          ) : (
            <div className="space-y-2">
              {sortedTasks.map((task) => {
                const isOverdue =
                  task.status !== "DONE" && isPast(new Date(task.deadline));
                const isDone = task.status === "DONE";
                const TypeIcon = TYPE_ICONS[task.type] || CheckSquare;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (!isDone) {
                        setExecModal({ open: true, task });
                        setAiScript(null);
                        setAiError(null);
                      }
                    }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border transition-all group",
                      isDone
                        ? "border-green-100 bg-green-50/30 dark:bg-green-950/10 opacity-60"
                        : isOverdue
                          ? "border-red-200 bg-red-50/50 dark:bg-red-950/10 cursor-pointer hover:shadow-md hover:border-red-300"
                          : "border-border cursor-pointer hover:shadow-md hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0",
                          isDone
                            ? "bg-green-100 text-green-600"
                            : isOverdue
                              ? "bg-red-100 text-red-600"
                              : "bg-primary/10 text-primary"
                        )}
                      >
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-bold truncate",
                            isDone && "line-through",
                            isOverdue && "text-red-700"
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.deadline), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                          <Badge variant="outline" className="text-xs h-5">
                            {TYPE_LABELS[task.type] || task.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isDone && !isOverdue && (
                        <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          Cliquer pour exécuter →
                        </span>
                      )}
                      {isOverdue && (
                        <Badge
                          variant="destructive"
                          className="text-xs font-bold uppercase gap-0.5 animate-pulse"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Retard
                        </Badge>
                      )}
                      {isDone && (
                        <Badge
                          variant="outline"
                          className="text-xs font-bold uppercase bg-green-100 text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          Fait
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Task Execution Dialog with AI Integration */}
      <Dialog
        open={execModal.open}
        onOpenChange={(o: boolean) => !o && resetModal()}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold">
              {execModal.task && (
                <>
                  {(() => {
                    const Icon = TYPE_ICONS[execModal.task.type] || CheckSquare;
                    return (
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    );
                  })()}
                  <div>
                    <p>{execModal.task.title}</p>
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      {TYPE_LABELS[execModal.task.type] || execModal.task.type} •{" "}
                      Échéance : {execModal.task && format(new Date(execModal.task.deadline), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* AI Script Generation Section */}
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <Sparkles className="h-4 w-4" />
                Assistant IA — Générer un script
              </div>

              {!aiScript && !generatingAI && !aiError && (
                <div className="flex flex-wrap gap-2">
                  {(CHANNEL_OPTIONS[execModal.task?.type || "OTHER"] || CHANNEL_OPTIONS.OTHER).map(
                    (opt) => (
                      <Button
                        key={opt.label}
                        size="sm"
                        className={cn("gap-2 font-bold rounded-full h-9 px-4", opt.color)}
                        onClick={() => {
                          if (execModal.task?.type === "CALL" || execModal.task?.type === "VISIT") {
                            handleGenerateScript();
                          } else {
                            const channelMap: Record<string, string> = {
                              "Brouillon email": "EMAIL",
                              "Brouillon SMS": "SMS",
                              "Message WhatsApp": "WHATSAPP",
                              "Script d'appel": "CALL",
                              "Script de visite": "CALL",
                            };
                            handleGenerateScript(channelMap[opt.label]);
                          }
                        }}
                      >
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </Button>
                    )
                  )}
                </div>
              )}

              {generatingAI && (
                <div className="flex items-center gap-3 py-6 justify-center text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Génération en cours...</span>
                </div>
              )}

              {aiError && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {aiError}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-xs"
                    onClick={() => {
                      setAiError(null);
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              )}

              {aiScript && (
                <div className="space-y-2">
                  <div className="relative bg-card border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                      {aiScript}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 gap-1.5 text-xs font-bold"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copier
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" />
                      Généré par IA — À valider avant utilisation
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7"
                      onClick={() => {
                        setAiScript(null);
                        setAiError(null);
                      }}
                    >
                      Regénérer
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {execModal.task && (execModal.task.type === "CALL" || execModal.task.type === "OTHER") && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Send className="h-3.5 w-3.5" />
                <span className="font-medium">Action rapide :</span>
                <a href={`tel:${""}`}>
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1">
                    <Phone className="h-3 w-3" /> Appeler
                  </Button>
                </a>
                <a href={`https://wa.me/`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-full gap-1">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </Button>
                </a>
              </div>
            )}

            {/* Completion Note */}
            <div className="space-y-2">
              <label className="text-sm font-bold">Note d&apos;exécution</label>
              <Textarea
                value={execNote}
                onChange={(e) => setExecNote(e.target.value)}
                rows={2}
                placeholder="Résumé de l'échange, prochaines étapes..."
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={resetModal}
            >
              Fermer
            </Button>
            <Button
              onClick={handleExecute}
              disabled={executing}
              className="gap-1.5 font-bold"
            >
              {executing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Marquer comme fait
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
