import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  checkOverdueTasks,
  checkUpcomingVisits,
  checkOverduePayments,
} from "@/services/automation-engine";

/**
 * POST /api/v1/automations/check-overdue
 *
 * Endpoint CRON — vérifie les tâches en retard, rappels de visites, paiements en retard.
 * Protégé par un secret en header (pas par Clerk — appelé par un cron externe).
 *
 * Vercel Cron / Supabase Edge Function appellent cette route toutes les heures.
 * Header requis : Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Vérifier le secret CRON (obligatoire)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  const expected = `Bearer ${cronSecret}`;
  const isValid =
    cronSecret &&
    authHeader &&
    authHeader.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));

  if (!isValid) {
    return NextResponse.json(
      { success: false, error: "Non autorisé" },
      { status: 401 },
    );
  }

  try {
    const [taskResult, visitReminders, paymentOverdue] = await Promise.all([
      checkOverdueTasks(),
      checkUpcomingVisits(),
      checkOverduePayments(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...taskResult,
        visitReminders,
        paymentOverdue,
      },
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
