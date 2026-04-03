import { apiHandler, jsonOk } from "@/lib/api-handler";
import { markAsRead } from "@/services/notification.service";

/**
 * PATCH /api/v1/notifications/[id]/read
 *
 * Marque une notification comme lue.
 */
export const PATCH = apiHandler(
  { module: "NOTIFICATIONS", action: "UPDATE" },
  async (ctx) => {
    const notificationId = ctx.params.id;
    await markAsRead(ctx.tenantId, notificationId, ctx.user.userId);
    return jsonOk({ marked: true });
  },
);
