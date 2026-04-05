"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  CheckCheck,
  Loader2,
  BellOff,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface INotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
  WARNING: "bg-amber-100 text-amber-800",
  ERROR: "bg-red-100 text-red-800",
  ALERT: "bg-orange-100 text-orange-800",
  TASK: "bg-purple-100 text-purple-800",
};

const TYPE_LABELS: Record<string, string> = {
  INFO: "Info",
  SUCCESS: "Succès",
  WARNING: "Attention",
  ERROR: "Erreur",
  ALERT: "Alerte",
  TASK: "Tâche",
};

const TYPE_ICONS: Record<string, typeof Info> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  ALERT: AlertTriangle,
  TASK: CheckCircle,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/v1/notifications");
        if (!res.ok) throw new Error("Erreur");
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setNotifications(Array.isArray(d) ? d : d.notifications ?? []);
        }
      } catch (err) {
        Sentry.captureException(err, { tags: { context: "Notifications page" } });
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  async function markAllAsRead() {
    setMarkingRead(true);
    try {
      const res = await fetch("/api/v1/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { context: "Notifications markAllAsRead" } });
    } finally {
      setMarkingRead(false);
    }
  }

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);

  function NotificationCard({ notification }: { notification: INotification }) {
    const IconComponent = TYPE_ICONS[notification.type] || Info;
    const content = (
      <Card
        className={`transition-all hover:shadow-md ${
          !notification.isRead
            ? "border-l-4 border-l-primary bg-primary/5"
            : ""
        }`}
      >
        <CardContent className="flex items-start gap-4 py-4">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-800"
            }`}
          >
            <IconComponent className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm leading-tight">
                  {notification.title}
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {TYPE_LABELS[notification.type] || notification.type}
                </span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {notification.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );

    if (notification.link) {
      return (
        <Link href={notification.link} className="block">
          {content}
        </Link>
      );
    }

    return content;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Restez informé des dernières activités
            </p>
          </div>
        </div>
        {unread.length > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={markingRead}
          >
            {markingRead ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1" />
            )}
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BellOff className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Aucune notification
            </p>
            <p className="text-sm text-muted-foreground">
              Vous êtes à jour, rien de nouveau pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Unread */}
          {unread.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Non lues
                </h2>
                <Badge variant="default">{unread.length}</Badge>
              </div>
              <div className="space-y-2">
                {unread.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Lues
              </h2>
              <div className="space-y-2">
                {read.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
