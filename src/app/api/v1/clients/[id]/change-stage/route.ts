import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/check-permission";
import { changeClientStage } from "@/services/client.service";
import type { PipelineStage } from "@prisma/client";

const changeStageSchema = z.object({
  stage: z.enum([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "VISIT_SCHEDULED",
    "VISITED",
    "NEGOTIATION",
    "RESERVED",
    "SIGNED",
    "CLOSED",
  ]),
});

/** POST /api/v1/clients/[id]/change-stage */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withPermission(req, "CLIENTS", "UPDATE", async (ctx) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = changeStageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Stage invalide" },
        { status: 400 },
      );
    }

    try {
      const client = await changeClientStage(
        ctx.user,
        id,
        parsed.data.stage as PipelineStage,
      );
      return NextResponse.json({ success: true, data: client });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return NextResponse.json(
        { success: false, error: message },
        { status: 404 },
      );
    }
  });
}
