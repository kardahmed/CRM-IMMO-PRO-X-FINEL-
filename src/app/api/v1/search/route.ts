import { NextRequest } from "next/server";
import { apiHandler, jsonOk, jsonError } from "@/lib/api-handler";

/**
 * GET /api/v1/search?q=...
 *
 * Global search across clients, properties, and projects.
 * Returns top 5 results per category.
 */
export const GET = apiHandler(
  { module: "CLIENTS", action: "READ" },
  async (ctx) => {
    const q = ctx.req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return jsonOk({ clients: [], properties: [], projects: [] });
    }

    const search = `%${q}%`;

    const [clients, properties, projects] = await Promise.all([
      ctx.db.client.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          pipelineStage: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      ctx.db.property.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { lotNumber: { contains: q, mode: "insensitive" } },
            { cadastralRef: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          lotNumber: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      ctx.db.project.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { address: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          address: true,
          status: true,
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return jsonOk({ clients, properties, projects });
  },
);
