"use client";

import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  Kanban,
  FileText,
  MapPin,
  Target,
  Bell,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const illustrations: Record<string, LucideIcon> = {
  clients: Users,
  planning: Calendar,
  pipeline: Kanban,
  documents: FileText,
  map: MapPin,
  objectives: Target,
  notifications: Bell,
  tasks: CheckSquare,
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const Icon = icon ? illustrations[icon] || Users : Users;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center animate-page-enter",
        className
      )}
    >
      <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-sm mb-6">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
