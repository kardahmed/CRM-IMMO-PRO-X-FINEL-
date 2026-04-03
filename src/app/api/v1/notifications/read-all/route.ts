import { apiHandler, jsonOk } from "@/lib/api-handler";
import { markAllAsRead } from "@/services/notification.service";

/**
 * PATCH /api/v1/notifications/read-all
 *
 * Marque toutes les notifications de l'utilisateur comme lues.
 */
export const PATCH = apiHandler(
  { module: "NOTIFICATIONS", action: "UPDATE" },
  async (ctx) => {
    const count = await markAllAsRead(ctx.tenantId, ctx.user.userId);
    return jsonOk({ markedCount: count });
  },
);
