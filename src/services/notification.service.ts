import { prisma } from "@/lib/prisma";

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | "FACEBOOK_LEAD"
  | "WHATSAPP_IN"
  | "WHATSAPP_UNKNOWN"
  | "LEAD_ASSIGNED"
  | "REASSIGNMENT"
  | "ESCALATION"
  | "STAGE_CHANGED"
  | "TASK_OVERDUE"
  | "PAYMENT_OVERDUE"
  | "OBJECTIVE_REACHED"
  | "VISIT_REMINDER"
  | "NEW_CLIENT"
  | "INFO";

export interface ICreateNotificationInput {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}

export interface INotificationWithMeta {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Crée une notification pour un utilisateur.
 * Utilisable depuis n'importe quel service.
 */
export async function createNotification(
  input: ICreateNotificationInput,
): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      isRead: false,
      link: input.link ?? null,
    },
  });
  return notification.id;
}

/**
 * Crée des notifications pour plusieurs utilisateurs.
 */
export async function createNotificationBulk(
  inputs: ICreateNotificationInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;

  const result = await prisma.notification.createMany({
    data: inputs.map((i) => ({
      tenantId: i.tenantId,
      userId: i.userId,
      title: i.title,
      message: i.message,
      type: i.type,
      isRead: false,
      link: i.link ?? null,
    })),
  });
  return result.count;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Récupère les notifications d'un utilisateur.
 */
export async function getUserNotifications(
  tenantId: string,
  userId: string,
  options: { limit?: number; onlyUnread?: boolean } = {},
): Promise<INotificationWithMeta[]> {
  const { limit = 30, onlyUnread = false } = options;

  return prisma.notification.findMany({
    where: {
      tenantId,
      userId,
      ...(onlyUnread ? { isRead: false } : {}),
    },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      isRead: true,
      link: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Compte les notifications non lues d'un utilisateur.
 */
export async function getUnreadCount(
  tenantId: string,
  userId: string,
): Promise<number> {
  return prisma.notification.count({
    where: { tenantId, userId, isRead: false },
  });
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Marque une notification comme lue.
 * Filtre par tenantId ET userId pour empêcher un user de marquer les notifs d'un autre.
 */
export async function markAsRead(
  tenantId: string,
  notificationId: string,
  userId: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, tenantId, userId },
    data: { isRead: true },
  });
}

/**
 * Marque toutes les notifications d'un utilisateur comme lues.
 */
export async function markAllAsRead(
  tenantId: string,
  userId: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { tenantId, userId, isRead: false },
    data: { isRead: true },
  });
  return result.count;
}
