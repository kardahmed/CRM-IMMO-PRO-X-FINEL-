"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  History,
  Phone,
  Mail,
  Eye,
  ArrowRight,
  CheckSquare,
  MessageSquare,
  UserPlus,
  FileText,
  Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userName?: string;
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  CALL: { icon: Phone, color: "bg-green-100 text-green-600 dark:bg-green-900/30" },
  EMAIL: { icon: Mail, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
  SMS: { icon: MessageSquare, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  VISIT: { icon: Eye, color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" },
  STAGE_CHANGE: { icon: ArrowRight, color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30" },
  TASK_COMPLETED: { icon: CheckSquare, color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30" },
  NOTE: { icon: FileText, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30" },
  ASSIGNMENT: { icon: UserPlus, color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30" },
  MEETING: { icon: Calendar, color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30" },
};

export function TabHistorique({ history }: { history: HistoryEntry[] }) {
  return (
    <Card className="border-neutral-100 dark:border-neutral-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-black">
          <History className="h-4 w-4 text-primary" />
          Historique ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">
            Aucun historique
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-800" />

            <div className="space-y-4">
              {history.map((entry) => {
                const config = TYPE_CONFIG[entry.type] || {
                  icon: History,
                  color: "bg-gray-100 text-gray-600",
                };
                const Icon = config.icon;

                return (
                  <div key={entry.id} className="relative flex gap-4 pl-1 group">
                    {/* Dot */}
                    <div
                      className={cn(
                        "relative z-10 flex items-center justify-center h-10 w-10 rounded-full shrink-0 transition-transform group-hover:scale-110",
                        config.color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {entry.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold">
                          {formatDistanceToNow(new Date(entry.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                        {entry.userName && (
                          <>
                            <span>•</span>
                            <span className="font-medium">{entry.userName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
