"use client";

import * as Sentry from "@sentry/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export function TabTaches({ tasks, clientId: _clientId }: { tasks: Task[]; clientId: string }) {
  const [execModal, setExecModal] = useState<{
    open: boolean;
    task: Task | null;
  }>({ open: false, task: null });
  const [execNote, setExecNote] = useState("");
  const [executing, setExecuting] = useState(false);

  const handleExecute = async () => {
    if (!execModal.task) return;
    setExecuting(true);
    try {
      await fetch(`/api/v1/tasks/${execModal.task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE", completionNote: execNote }),
      });
      setExecModal({ open: false, task: null });
      setExecNote("");
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "TabTaches" } });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <Card className="border-neutral-100 dark:border-neutral-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-black">
            <CheckSquare className="h-4 w-4 text-primary" />
            Tâches ({tasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">
              Aucune tâche
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const isOverdue =
                  task.status !== "DONE" && isPast(new Date(task.deadline));
                const isDone = task.status === "DONE";
                const TypeIcon = TYPE_ICONS[task.type] || CheckSquare;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (!isDone) setExecModal({ open: true, task });
                    }}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-xl border transition-all group",
                      isDone
                        ? "border-green-100 bg-green-50/30 dark:bg-green-950/10 opacity-60"
                        : isOverdue
                          ? "border-red-200 bg-red-50/50 dark:bg-red-950/10 cursor-pointer hover:shadow-md hover:border-red-300"
                          : "border-neutral-100 dark:border-neutral-800 cursor-pointer hover:shadow-md hover:border-primary/20"
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
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.deadline), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOverdue && (
                        <Badge
                          variant="destructive"
                          className="text-[9px] font-black uppercase gap-0.5 animate-pulse"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Retard
                        </Badge>
                      )}
                      {isDone && (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black uppercase bg-green-100 text-green-700 border-green-200"
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

      {/* Execution Dialog */}
      <Dialog
        open={execModal.open}
        onOpenChange={(o: boolean) => !o && setExecModal({ open: false, task: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">Exécuter la tâche</DialogTitle>
            <DialogDescription>
              {execModal.task?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-bold">Note d&apos;exécution</label>
            <Textarea
              value={execNote}
              onChange={(e) => setExecNote(e.target.value)}
              rows={3}
              placeholder="Détails sur l'exécution de cette tâche..."
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExecModal({ open: false, task: null })}
            >
              Annuler
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
