import { NextRequest, NextResponse } from "next/server";
import { checkOverdueTasks } from "@/services/automation-engine";

/**
 * POST /api/v1/automations/check-overdue
 *
 * Endpoint CRON — vérifie les tâches en retard et escalade si > 24h.
 * Protégé par un secret en header (pas par Clerk — appelé par un cron externe).
 *
 * Vercel Cron / Supabase Edge Function appellent cette route toutes les heures.
 * Header requis : Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Vérifier le secret CRON
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Non autorisé" },
      { status: 401 },
    );
  }

  try {
    const result = await checkOverdueTasks();
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    console.error("[CRON check-overdue]", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
