import { apiHandler, jsonOk } from "@/lib/api-handler";

const AUTOMATION_ACTIONS = [
  "AUTOMATION_TRIGGERED",
  "AUTOMATION_CONFIG_CREATED",
  "AUTOMATION_CONFIG_UPDATED",
  "AUTOMATION_CONFIG_ENABLED",
  "AUTOMATION_CONFIG_DISABLED",
  "AI_CALL_SCRIPT_GENERATED",
  "AI_MESSAGE_GENERATED",
  "TASK_COMPLETED",
  "TASK_CANCELLED",
] as const;

/**
 * GET /api/v1/automations/history — Automation activity history with pagination
 */
export const GET = apiHandler(
  { module: "AUTOMATIONS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);

    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const action = url.searchParams.get("action");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const where: Record<string, unknown> = {
      action: { in: [...AUTOMATION_ACTIONS] },
    };

    // Optional: filter by a single action type
    if (action && AUTOMATION_ACTIONS.includes(action as (typeof AUTOMATION_ACTIONS)[number])) {
      where.action = action;
    }

    // Optional date range filter on createdAt
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [events, total] = await Promise.all([
      ctx.db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      ctx.db.activityLog.count({ where }),
    ]);

    return jsonOk({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  },
);
