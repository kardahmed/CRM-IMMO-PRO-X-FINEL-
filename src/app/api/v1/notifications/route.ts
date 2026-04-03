import { apiHandler, jsonOk } from "@/lib/api-handler";
import {
  getUserNotifications,
  getUnreadCount,
} from "@/services/notification.service";

/**
 * GET /api/v1/notifications
 *
 * Récupère les notifications de l'utilisateur connecté.
 * Query params : limit (default 30), unread (true/false)
 */
export const GET = apiHandler(
  { module: "NOTIFICATIONS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "30")));
    const onlyUnread = url.searchParams.get("unread") === "true";

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(ctx.tenantId, ctx.user.userId, { limit, onlyUnread }),
      getUnreadCount(ctx.tenantId, ctx.user.userId),
    ]);

    return jsonOk({ notifications, unreadCount });
  },
);
