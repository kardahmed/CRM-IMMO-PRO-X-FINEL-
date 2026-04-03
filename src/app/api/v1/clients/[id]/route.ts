import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/check-permission";
import { createTenantPrisma } from "@/lib/prisma-tenant";

const updateClientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  desiredType: z.string().nullable().optional(),
  desiredWilaya: z.string().nullable().optional(),
  desiredRooms: z.number().int().nullable().optional(),
  desiredSurface: z.number().nullable().optional(),
  lostReason: z.string().nullable().optional(),
});

/** GET /api/v1/clients/[id] */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withPermission(req, "CLIENTS", "READ", async (ctx) => {
    const { id } = await params;
    const db = createTenantPrisma(ctx.tenantId);

    const client = await db.client.findFirst({
      where: { id },
      include: {
        assignedAgent: {
          select: { id: true, firstName: true, lastName: true },
        },
        interactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        visits: {
          orderBy: { scheduledAt: "desc" },
          take: 5,
        },
        tasks: {
          where: { status: "PENDING" },
          orderBy: { dueAt: "asc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Client introuvable" },
        { status: 404 },
      );
    }

    // Agent ne voit que ses clients
    if (
      ctx.user.role === "AGENT" &&
      client.assignedAgentId !== ctx.user.userId
    ) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true, data: client });
  });
}

/** PATCH /api/v1/clients/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withPermission(req, "CLIENTS", "UPDATE", async (ctx) => {
    const { id } = await params;
    const db = createTenantPrisma(ctx.tenantId);

    const body = await req.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Vérifier existence + accès
    const existing = await db.client.findFirst({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Client introuvable" },
        { status: 404 },
      );
    }

    if (
      ctx.user.role === "AGENT" &&
      existing.assignedAgentId !== ctx.user.userId
    ) {
      return NextResponse.json(
        { success: false, error: "Accès refusé" },
        { status: 403 },
      );
    }

    const updated = await (db.client.update as Function)({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  });
}
