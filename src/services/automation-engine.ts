import { prisma } from "@/lib/prisma";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { PipelineStage, TaskType } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface IAutomationTask {
  title: string;
  type: TaskType;
  delayMinutes: number; // délai après le changement d'étape
  description?: string;
}

export interface IAutomationConfigTasks {
  tasks: IAutomationTask[];
}

// ============================================================================
// Trigger — appelé après chaque changement d'étape
// ============================================================================

/**
 * Déclenche les automatisations configurées pour une étape du pipeline.
 * - Lit AutomationConfig pour ce tenant + cette étape
 * - Si isActive, crée les Task avec délai, assignées à l'agent du client
 * - Non-bloquant : les erreurs sont loguées mais ne bloquent pas le flow
 */
export async function triggerAutomations(
  tenantId: string,
  clientId: string,
  newStage: PipelineStage,
): Promise<void> {
  try {
    const db = createTenantPrisma(tenantId);

    // 1. Charger la config pour cette étape
    const config = await db.automationConfig.findFirst({
      where: { pipelineStage: newStage },
    });

    if (!config || !config.isActive) return;

    // 2. Charger le client pour connaître l'agent assigné
    const client = await db.client.findFirst({
      where: { id: clientId },
      select: { id: true, assignedAgentId: true, firstName: true, lastName: true },
    });

    if (!client) return;

    // 3. Parser les tâches depuis la config JSON
    const configTasks = (config.tasks as unknown as IAutomationTask[]) || [];
    if (configTasks.length === 0) return;

    const now = new Date();

    // 4. Créer les tâches automatisées
    const tasksToCreate = configTasks.map((task) => ({
      tenantId,
      title: task.title.replace("{clientName}", `${client.firstName} ${client.lastName}`),
      type: task.type,
      clientId: client.id,
      assignedToId: client.assignedAgentId,
      dueAt: new Date(now.getTime() + task.delayMinutes * 60 * 1000),
      status: "PENDING" as const,
      isAutomated: true,
      pipelineStage: newStage,
      notes: task.description || null,
    }));

    await prisma.task.createMany({ data: tasksToCreate });

    // 5. Log
    await prisma.activityLog.create({
      data: {
        tenantId,
        action: "AUTOMATION_TRIGGERED",
        entity: "AutomationConfig",
        entityId: config.id,
        metadata: {
          stage: newStage,
          clientId,
          tasksCreated: tasksToCreate.length,
        },
      },
    });
  } catch (err) {
    // Non-bloquant — on log l'erreur sans bloquer le changement d'étape
    console.error("[AutomationEngine] Erreur:", err);
  }
}

// ============================================================================
// Overdue checker — à appeler périodiquement (CRON / Edge Function)
// ============================================================================

/**
 * Vérifie les tâches PENDING dont dueAt est dépassé.
 * Les passe en status IN_PROGRESS (overdue).
 * Si overdue depuis +24h, crée une notification d'escalade pour le Superviseur.
 */
export async function checkOverdueTasks(): Promise<{
  markedOverdue: number;
  escalated: number;
}> {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Trouver les tâches PENDING dont dueAt est dépassé
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: "PENDING",
      dueAt: { lt: now },
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (overdueTasks.length > 0) {
    // Passer les tâches en IN_PROGRESS (marquées overdue)
    await prisma.task.updateMany({
      where: {
        id: { in: overdueTasks.map((t) => t.id) },
      },
      data: { status: "IN_PROGRESS" },
    });
  }

  // 2. Trouver les tâches IN_PROGRESS dont dueAt est > 24h (escalade)
  //    Exclure celles déjà escaladées (notes contient "[ESCALATED]") pour éviter les doublons
  const escalationTasks = await prisma.task.findMany({
    where: {
      status: "IN_PROGRESS",
      isAutomated: true,
      dueAt: { lt: twentyFourHoursAgo },
      NOT: { notes: { contains: "[ESCALATED]" } },
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true, tenantId: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // 3. Pour chaque tâche à escalader, notifier le(s) superviseur(s)
  const notifications: Array<{
    tenantId: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link: string | null;
  }> = [];

  for (const task of escalationTasks) {
    if (!task.assignedTo) continue;

    // Trouver les superviseurs du même tenant
    const supervisors = await prisma.user.findMany({
      where: {
        tenantId: task.assignedTo.tenantId,
        role: { in: ["SUPERVISOR", "CEO"] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const supervisor of supervisors) {
      notifications.push({
        tenantId: task.assignedTo.tenantId,
        userId: supervisor.id,
        title: "Tâche en retard — Escalade",
        message: `La tâche "${task.title}" assignée à ${task.assignedTo.firstName} ${task.assignedTo.lastName} est en retard de +24h${task.client ? ` (client: ${task.client.firstName} ${task.client.lastName})` : ""}`,
        type: "ESCALATION",
        isRead: false,
        link: `/dashboard/tasks/${task.id}`,
      });
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }

  // 4. Marquer les tâches escaladées pour ne pas re-notifier
  if (escalationTasks.length > 0) {
    for (const task of escalationTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          notes: task.notes
            ? `${task.notes}\n[ESCALATED]`
            : "[ESCALATED]",
        },
      });
    }
  }

  return {
    markedOverdue: overdueTasks.length,
    escalated: escalationTasks.length,
  };
}
