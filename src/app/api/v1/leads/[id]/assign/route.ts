import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { assignLeadSchema } from "@/lib/validations/facebook-leads";
import { triggerAutomations } from "@/services/automation-engine";
import { createNotification } from "@/services/notification.service";

/**
 * POST /api/v1/leads/[id]/assign
 *
 * Assigne un lead non assigné à un agent.
 * Déclenche les automatisations d'accueil.
 *
 * Accès : CEO, ADMIN, SUPERVISOR
 * Body : { agentId }
 */
export const POST = apiHandler(
  { module: "CLIENTS", action: "ASSIGN", schema: assignLeadSchema },
  async (ctx) => {
    const clientId = ctx.params.id;
    const { agentId } = getBody<{ agentId: string }>(ctx.req);

    // Vérifier que le client existe et n'est pas déjà assigné
    const client = await ctx.db.client.findFirst({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedAgentId: true,
        pipelineStage: true,
        source: true,
      },
    });

    if (!client) {
      return jsonError("Lead introuvable", 404);
    }

    if (client.assignedAgentId) {
      return jsonError(
        "Ce lead est déjà assigné. Utilisez la réassignation pour changer l'agent.",
        409,
      );
    }

    // Vérifier que l'agent cible existe et est actif
    const agent = await ctx.db.user.findFirst({
      where: { id: agentId, isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!agent) {
      return jsonError("Agent introuvable ou inactif", 404);
    }

    // Assigner le lead
    const updated = await ctx.db.client.update({
      where: { id: clientId },
      data: { assignedAgentId: agentId },
    });

    // Notification pour l'agent
    await createNotification({
      tenantId: ctx.tenantId,
      userId: agentId,
      title: "Nouveau lead assigné",
      message: `${client.firstName} ${client.lastName} vous a été assigné (source: ${client.source})`,
      type: "LEAD_ASSIGNED",
      link: `/clients/${clientId}`,
    });

    // Log (tenant-scoped)
    await ctx.db.activityLog.create({
      data: {
        tenantId: ctx.tenantId,
        userId: ctx.user.userId,
        action: "LEAD_ASSIGNED",
        entity: "Client",
        entityId: clientId,
        metadata: {
          clientName: `${client.firstName} ${client.lastName}`,
          agentId,
          agentName: `${agent.firstName} ${agent.lastName}`,
          source: client.source,
          assignedBy: ctx.user.userId,
        },
      },
    });

    // Déclencher les automatisations pour l'étape actuelle (non-bloquant)
    // Cela lance les tâches d'accueil si configurées
    triggerAutomations(ctx.tenantId, clientId, updated.pipelineStage).catch(
      (err) => {
        console.error("[Lead assign automation error]", err);
      },
    );

    return jsonOk({
      client: updated,
      assignedTo: `${agent.firstName} ${agent.lastName}`,
    });
  },
);
