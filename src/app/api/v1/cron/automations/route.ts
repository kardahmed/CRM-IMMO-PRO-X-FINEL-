import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import {
  checkOverdueTasks,
  checkUpcomingVisits,
  checkOverduePayments,
} from "@/services/automation-engine";

/**
 * GET /api/v1/cron/automations
 *
 * Point d'entrée pour les vérifications périodiques :
 * - Tâches en retard → notification agent + escalade superviseur après 24h
 * - Visites dans 1h → rappel agent
 * - Paiements en retard (+30j) → notification agent + superviseur
 *
 * À appeler via :
 * - Vercel Cron (vercel.json)
 * - Supabase Edge Function (pg_cron)
 * - Ou tout scheduler externe (toutes les 15 min)
 *
 * Sécurisé par CRON_SECRET en header Authorization.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Vérifier le secret CRON pour sécuriser l'endpoint
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const [overdueResult, visitsReminded, paymentsNotified] = await Promise.all([
      checkOverdueTasks(),
      checkUpcomingVisits(),
      checkOverduePayments(),
    ]);

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        tasksMarkedOverdue: overdueResult.markedOverdue,
        tasksEscalated: overdueResult.escalated,
        visitsReminded,
        paymentsNotified,
      },
    };

    return NextResponse.json(result);
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "CronAutomations" } });
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'exécution du cron" },
      { status: 500 },
    );
  }
}
