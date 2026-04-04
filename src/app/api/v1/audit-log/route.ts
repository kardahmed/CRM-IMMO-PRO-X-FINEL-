import { apiHandler, jsonOk } from "@/lib/api-handler";

/**
 * GET /api/v1/audit-log
 *
 * List activity logs for the tenant.
 * Supports optional query params: ?entity=Client&action=CREATE
 */
export const GET = apiHandler(
  { module: "AUDIT_LOG", action: "READ" },
  async (ctx) => {
    const { req, db } = ctx;
    const url = new URL(req.url);

    const entityFilter = url.searchParams.get("entity");
    const actionFilter = url.searchParams.get("action");

    const where: Record<string, unknown> = {};
    if (entityFilter) {
      where.entity = entityFilter;
    }
    if (actionFilter) {
      where.action = actionFilter;
    }

    const logs = await db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return jsonOk(logs);
  },
);
