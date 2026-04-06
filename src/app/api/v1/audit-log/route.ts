import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/audit-log
 *
 * List activity logs for the tenant with pagination.
 * Supports optional query params: ?entity=Client&action=CREATE&page=1&limit=50
 */
export const GET = apiHandler(
  { module: "AUDIT_LOG", action: "READ" },
  async (ctx) => {
    const { req, db } = ctx;
    const url = new URL(req.url);

    const entityFilter = url.searchParams.get("entity");
    const actionFilter = url.searchParams.get("action");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (entityFilter) {
      where.entity = entityFilter;
    }
    if (actionFilter) {
      where.action = actionFilter;
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      db.activityLog.count({ where }),
    ]);

    return jsonOk({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);
