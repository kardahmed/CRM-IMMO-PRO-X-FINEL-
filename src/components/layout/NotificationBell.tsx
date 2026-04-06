"use client";

import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications, type INotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// ============================================================================
// Notification type → icon/color mapping
// ============================================================================

const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  FACEBOOK_LEAD: { color: "bg-blue-500", label: "Facebook" },
  WHATSAPP_IN: { color: "bg-green-500", label: "WhatsApp" },
  WHATSAPP_UNKNOWN: { color: "bg-yellow-500", label: "WhatsApp" },
  LEAD_ASSIGNED: { color: "bg-indigo-500", label: "Assignation" },
  REASSIGNMENT: { color: "bg-orange-500", label: "Réassignation" },
  ESCALATION: { color: "bg-red-500", label: "Escalade" },
  STAGE_CHANGED: { color: "bg-purple-500", label: "Pipeline" },
  TASK_CREATED: { color: "bg-teal-500", label: "Tâche auto" },
  TASK_OVERDUE: { color: "bg-red-500", label: "Retard" },
  PAYMENT_OVERDUE: { color: "bg-red-600", label: "Paiement" },
  OBJECTIVE_REACHED: { color: "bg-emerald-500", label: "Objectif" },
  VISIT_REMINDER: { color: "bg-cyan-500", label: "Visite" },
  NEW_CLIENT: { color: "bg-blue-400", label: "Client" },
  INFO: { color: "bg-gray-400", label: "Info" },
};

// ============================================================================
// Single notification item
// ============================================================================

function NotificationItem({
  notification,
  onRead,
}: {
  notification: INotification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.INFO;

  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  const handleClick = () => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <DropdownMenuItem
      className={`flex gap-3 p-3 cursor-pointer ${!notification.isRead ? "bg-accent/40" : ""}`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className={`h-2 w-2 rounded-full ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground/60">{timeAgo}</span>
        </div>
        <p className="text-sm font-medium truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {notification.message}
        </p>
      </div>
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </DropdownMenuItem>
  );
}

// ============================================================================
// Main component
// ============================================================================

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label="Notifications"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative hover:bg-accent/50 outline-none"
            )}
          />
        }
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 min-w-[20px] px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-[500px]">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({unreadCount} non lue{unreadCount > 1 ? "s" : ""})
              </span>
            )}
          </DropdownMenuLabel>
          </DropdownMenuGroup>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                markAllAsRead();
              }}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Tout lire
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        <div className="overflow-y-auto max-h-[380px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Check className="h-8 w-8 mb-2 text-muted-foreground/40" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={markAsRead}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Helper
// ============================================================================

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "maintenant";
  if (diffMin < 60) return `${diffMin}min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}j`;

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
