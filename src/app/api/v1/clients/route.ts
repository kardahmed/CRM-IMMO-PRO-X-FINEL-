import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/check-permission";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import { createClient } from "@/services/client.service";

const createClientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(5),
  email: z.string().email().nullable().optional(),
  source: z
    .enum(["FACEBOOK", "WEBSITE", "REFERRAL", "WALK_IN", "PHONE", "OTHER"])
    .optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  desiredType: z
    .enum([
      "APARTMENT",
      "STUDIO",
      "DUPLEX",
      "PENTHOUSE",
      "VILLA",
      "COMMERCIAL",
      "PARKING",
      "CAVE",
      "TERRAIN",
    ])
    .nullable()
    .optional(),
  desiredWilaya: z.string().nullable().optional(),
  desiredRooms: z.number().int().nullable().optional(),
  desiredSurface: z.number().nullable().optional(),
});

/** POST /api/v1/clients — Créer un client avec dedup */
export async function POST(req: NextRequest) {
  return withPermission(req, "CLIENTS", "CREATE", async (ctx) => {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await createClient(ctx.user, parsed.data);

    if (!result.dedup.canCreate) {
      return NextResponse.json(
        {
          success: false,
          error: "Doublon détecté",
          data: { duplicates: result.dedup.duplicates },
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        client: result.client,
        alerts: result.dedup.duplicates, // Alertes non-bloquantes (email, nom)
      },
    });
  });
}

/** GET /api/v1/clients — Liste filtrée par rôle */
export async function GET(req: NextRequest) {
  return withPermission(req, "CLIENTS", "READ", async (ctx) => {
    const db = createTenantPrisma(ctx.tenantId);
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};

    // Agent ne voit que ses clients
    if (ctx.user.role === "AGENT") {
      where.assignedAgentId = ctx.user.userId;
    }

    const stage = searchParams.get("stage");
    if (stage) where.pipelineStage = stage;

    const source = searchParams.get("source");
    if (source) where.source = source;

    const search = searchParams.get("search");
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const clients = await db.client.findMany({
      where,
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: clients });
  });
}
