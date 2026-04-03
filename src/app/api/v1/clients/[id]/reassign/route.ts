import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/check-permission";
import { reassignClient } from "@/services/client.service";

const reassignSchema = z.object({
  newAgentId: z.string().uuid(),
});

/** POST /api/v1/clients/[id]/reassign — CEO/SUPERVISOR uniquement */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withPermission(req, "CLIENTS", "ASSIGN", async (ctx) => {
    const { id } = await params;
    const body = await req.json();
    const parsed = reassignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "newAgentId (UUID) requis" },
        { status: 400 },
      );
    }

    try {
      const result = await reassignClient(ctx.user, id, parsed.data.newAgentId);
      return NextResponse.json({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      return NextResponse.json(
        { success: false, error: message },
        { status: 403 },
      );
    }
  });
}
