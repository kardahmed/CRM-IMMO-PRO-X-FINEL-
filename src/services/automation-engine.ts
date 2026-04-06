import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { PipelineStage, TaskType } from "@prisma/client";
import { createNotification } from "@/services/notification.service";

// ============================================================================
// Types
// ============================================================================

export interface IAutomationTask {
  title: string;
  type: TaskType;
  delayMinutes: number; // délai après le changement d'étape
  description?: string;
  messageTemplate?: string;
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

    // Filter out tasks that already exist (idempotency)
    const existingTasks = await db.task.findMany({
      where: {
        clientId: client.id,
        title: { in: tasksToCreate.map((t) => t.title) },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
      },
      select: { title: true },
    });
    const existingTitles = new Set(existingTasks.map((t) => t.title));
    const newTasks = tasksToCreate.filter((t) => !existingTitles.has(t.title));

    if (newTasks.length > 0) {
      await db.task.createMany({ data: newTasks });

      // 5. Notifier l'agent assigné qu'il a de nouvelles tâches
      if (client.assignedAgentId) {
        const clientName = `${client.firstName} ${client.lastName}`;
        await createNotification({
          tenantId,
          userId: client.assignedAgentId,
          title: `${newTasks.length} tâche${newTasks.length > 1 ? "s" : ""} auto créée${newTasks.length > 1 ? "s" : ""}`,
          message: `${clientName} → étape ${newStage} : ${newTasks.map(t => t.title).join(", ")}`,
          type: "TASK_CREATED",
          link: `/clients/${clientId}`,
        });
      }
    }

    // 6. Log
    await db.activityLog.create({
      data: {
        tenantId,
        action: "AUTOMATION_TRIGGERED",
        entity: "AutomationConfig",
        entityId: config.id,
        metadata: {
          stage: newStage,
          clientId,
          tasksCreated: newTasks.length,
        },
      },
    });
  } catch (err) {
    // Non-bloquant — on log l'erreur sans bloquer le changement d'étape
    Sentry.captureException(err, { tags: { context: "AutomationEngine" } });
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

// ============================================================================
// Visit reminder — à appeler périodiquement (CRON toutes les 15 min)
// ============================================================================

/**
 * Envoie un rappel 1h avant chaque visite programmée.
 * Ne notifie qu'une seule fois (vérifie via notes "[REMINDED]").
 */
export async function checkUpcomingVisits(): Promise<number> {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  // Visites programmées dans la prochaine heure, pas encore rappelées
  const visits = await prisma.visit.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: now, lte: oneHourLater },
      NOT: { feedback: { contains: "[REMINDED]" } },
    },
    include: {
      agent: { select: { id: true, firstName: true, lastName: true, tenantId: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
      property: { select: { name: true } },
    },
  });

  let reminded = 0;

  for (const visit of visits) {
    if (!visit.agent) continue;

    const time = visit.scheduledAt.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await createNotification({
      tenantId: visit.agent.tenantId,
      userId: visit.agent.id,
      title: "Visite dans 1h",
      message: `${visit.client?.firstName ?? ""} ${visit.client?.lastName ?? ""} — ${visit.property?.name ?? "Bien"} à ${time}`,
      type: "VISIT_REMINDER",
      link: `/clients/${visit.clientId}`,
    });

    // Marquer comme rappelé
    await prisma.visit.update({
      where: { id: visit.id },
      data: {
        feedback: visit.feedback
          ? `${visit.feedback}\n[REMINDED]`
          : "[REMINDED]",
      },
    });

    reminded++;
  }

  return reminded;
}

// ============================================================================
// Payment overdue — à appeler périodiquement (CRON quotidien)
// ============================================================================

/**
 * Vérifie les paiements PENDING depuis plus de 30 jours.
 * Notifie l'agent assigné et le superviseur.
 * Évite les doublons : ne notifie qu'une fois en vérifiant si une notification
 * PAYMENT_OVERDUE existe déjà pour ce paiement (via ActivityLog marker).
 */
export async function checkOverduePayments(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const overduePayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: thirtyDaysAgo },
    },
    select: {
      id: true,
      amount: true,
      type: true,
      clientId: true,
      tenantId: true,
    },
  });

  let notified = 0;

  for (const payment of overduePayments) {
    // Vérifier si déjà notifié via ActivityLog
    const alreadyNotified = await prisma.activityLog.findFirst({
      where: {
        tenantId: payment.tenantId,
        action: "PAYMENT_OVERDUE_NOTIFIED",
        entityId: payment.id,
      },
      select: { id: true },
    });
    if (alreadyNotified) continue;

    // Charger le client
    const client = await prisma.client.findFirst({
      where: { id: payment.clientId, tenantId: payment.tenantId },
      select: { id: true, firstName: true, lastName: true, assignedAgentId: true },
    });
    if (!client) continue;

    const tenantId = payment.tenantId;
    const amountStr = new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(Number(payment.amount));
    const msg = `${client.firstName} ${client.lastName} — ${amountStr} DA (${payment.type})`;

    // Notifier l'agent assigné
    if (client.assignedAgentId) {
      await createNotification({
        tenantId,
        userId: client.assignedAgentId,
        title: "Paiement en retard",
        message: msg,
        type: "PAYMENT_OVERDUE",
        link: `/clients/${client.id}`,
      });
    }

    // Notifier les superviseurs
    const supervisors = await prisma.user.findMany({
      where: { tenantId, role: { in: ["SUPERVISOR", "CEO"] }, isActive: true },
      select: { id: true },
    });

    for (const s of supervisors) {
      await createNotification({
        tenantId,
        userId: s.id,
        title: "Paiement en retard",
        message: msg,
        type: "PAYMENT_OVERDUE",
        link: `/clients/${client.id}`,
      });
    }

    // Marquer comme notifié pour éviter les doublons
    const dbForPayment = createTenantPrisma(tenantId);
    await dbForPayment.activityLog.create({
      data: {
        tenantId,
        action: "PAYMENT_OVERDUE_NOTIFIED",
        entity: "Payment",
        entityId: payment.id,
        metadata: { clientId: client.id, amount: Number(payment.amount) },
      },
    });

    notified++;
  }

  return notified;
}
