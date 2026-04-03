"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export interface INotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface IUseNotificationsReturn {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook pour les notifications en temps réel.
 * - Charge les notifications depuis l'API
 * - S'abonne aux nouvelles notifications via Supabase Realtime
 * - Fournit des méthodes pour marquer comme lues
 */
export function useNotifications(): IUseNotificationsReturn {
  const { user, isLoaded } = useUser();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const userId = user?.publicMetadata?.dbUserId as string | undefined;
  const tenantId = user?.publicMetadata?.tenantId as string | undefined;

  // Charger les notifications depuis l'API
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch("/api/v1/notifications?limit=30");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // Silently fail — user will see stale data
    }
  }, [userId]);

  // Charger au montage
  useEffect(() => {
    if (!isLoaded || !userId) return;

    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));
  }, [isLoaded, userId, fetchNotifications]);

  // Supabase Realtime — s'abonner aux INSERT sur la table notifications
  useEffect(() => {
    if (!isLoaded || !userId || !tenantId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;

          const newNotif: INotification = {
            id: row.id as string,
            title: row.title as string,
            message: row.message as string,
            type: row.type as string,
            isRead: row.is_read as boolean,
            link: (row.link as string) ?? null,
            createdAt: row.created_at as string,
          };

          // Ajouter en tête de liste
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
          if (!newNotif.isRead) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [isLoaded, userId, tenantId]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await fetch(`/api/v1/notifications/${notificationId}/read`, {
          method: "PATCH",
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently fail
      }
    },
    [],
  );

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/v1/notifications/read-all", { method: "PATCH" });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
