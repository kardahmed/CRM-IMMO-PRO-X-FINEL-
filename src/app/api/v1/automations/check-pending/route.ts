import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/services/notification.service";
import * as Sentry from "@sentry/nextjs";

/**
 * GET /api/v1/automations/check-pending
 *
 * Endpoint CRON — traite les tâches automatisées en attente (PENDING) dont la date est dépassée,
 * et escalade celles restées IN_PROGRESS plus de 24 h.
 *
 * Vercel Cron appelle cette route toutes les 15 minutes.
 * Header requis : Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request): Promise<NextResponse> {
  // ── Vérifier le secret CRON ──────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // ── 1. Tâches PENDING automatisées dont dueAt est dépassé ────────────
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: "PENDING",
        isAutomated: true,
        dueAt: { lte: now },
      },
      include: {
        assignedTo: { select: { id: true, tenantId: true } },
      },
    });

    let pendingProcessed = 0;

    for (const task of pendingTasks) {
      // Passer le statut à IN_PROGRESS
      await prisma.task.update({
        where: { id: task.id },
        data: { status: "IN_PROGRESS" },
      });

      // Notifier l'agent assigné (s'il existe)
      if (task.assignedTo) {
        await createNotification({
          tenantId: task.tenantId,
          userId: task.assignedTo.id,
          title: `Tâche en attente: ${task.title}`,
          message: `La tâche "${task.title}" est en retard et a été passée en cours.`,
          type: "TASK_OVERDUE",
          link: "/dashboard/automations",
        });
      }

      pendingProcessed++;
    }

    // ── 2. Tâches IN_PROGRESS depuis plus de 24 h → escalade ────────────
    const stalledTasks = await prisma.task.findMany({
      where: {
        status: "IN_PROGRESS",
        isAutomated: true,
        updatedAt: { lte: twentyFourHoursAgo },
      },
      include: {
        assignedTo: { select: { id: true, tenantId: true } },
      },
    });

    let escalated = 0;

    for (const task of stalledTasks) {
      // Trouver le superviseur du tenant (fallback vers CEO)
      const supervisor = await prisma.user.findFirst({
        where: {
          tenantId: task.tenantId,
          role: "SUPERVISOR",
          isActive: true,
        },
        select: { id: true },
      });

      const escalationTarget =
        supervisor ??
        (await prisma.user.findFirst({
          where: {
            tenantId: task.tenantId,
            role: "CEO",
            isActive: true,
          },
          select: { id: true },
        }));

      if (escalationTarget) {
        await createNotification({
          tenantId: task.tenantId,
          userId: escalationTarget.id,
          title: `Escalade: ${task.title}`,
          message: `La tâche "${task.title}" est restée en cours plus de 24 h sans avancement.`,
          type: "ESCALATION",
          link: "/dashboard/automations",
        });
      }

      // Annoter la tâche
      await prisma.task.update({
        where: { id: task.id },
        data: {
          notes: task.notes
            ? `${task.notes}\nEscaladée au superviseur`
            : "Escaladée au superviseur",
        },
      });

      escalated++;
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingProcessed,
        escalated,
        timestamp: now.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    Sentry.captureException(err, {
      tags: { context: "CRON check-pending" },
    });
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
