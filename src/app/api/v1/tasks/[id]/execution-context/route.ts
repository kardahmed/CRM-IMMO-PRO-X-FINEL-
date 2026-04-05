import { apiHandler, jsonOk, jsonError } from "@/lib/api-handler";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generates a pre-filled message template based on task type and pipeline stage.
 */
function buildSuggestedMessage(
  taskType: string,
  taskTitle: string,
  clientFirstName: string,
  pipelineStage: string | null,
): string | null {
  if (taskType === "CALL" || taskType === "DOCUMENT") {
    return null;
  }

  if (taskType === "MEETING") {
    return (
      `Bonjour ${clientFirstName}, je vous rappelle notre rendez-vous prevu prochainement. ` +
      `N'hesitez pas a me contacter si vous avez des questions. Cordialement.`
    );
  }

  // OTHER — WhatsApp / SMS style messages based on pipeline stage
  const stageMessages: Record<string, string> = {
    NEW: `Bonjour ${clientFirstName}, merci pour votre interet. Je suis votre conseiller immobilier et je serais ravi d'echanger avec vous sur votre projet. Quand seriez-vous disponible pour un premier echange ?`,
    CONTACTED: `Bonjour ${clientFirstName}, suite a notre premier contact, je souhaitais savoir si vous aviez des questions supplementaires. Je reste a votre disposition.`,
    QUALIFIED: `Bonjour ${clientFirstName}, j'ai selectionne des biens qui correspondent a vos criteres. Souhaitez-vous que nous planifions une visite ?`,
    VISIT_SCHEDULED: `Bonjour ${clientFirstName}, je vous confirme notre visite programmee. N'hesitez pas a me contacter si vous avez besoin de modifier l'horaire.`,
    VISITED: `Bonjour ${clientFirstName}, suite a notre visite, j'aimerais connaitre vos impressions. Avez-vous des questions sur le bien ?`,
    NEGOTIATION: `Bonjour ${clientFirstName}, je reviens vers vous concernant les conditions que nous avons discutees. Avez-vous pu reflechir a notre proposition ?`,
    RESERVED: `Bonjour ${clientFirstName}, votre reservation est bien enregistree. Je vous tiens informe de la suite des demarches.`,
    SIGNED: `Bonjour ${clientFirstName}, felicitations pour la signature ! Je reste a votre disposition pour toute question concernant les prochaines etapes.`,
    CLOSED: `Bonjour ${clientFirstName}, je vous souhaite beaucoup de bonheur dans votre nouveau bien. N'hesitez pas a me recommander aupres de votre entourage.`,
  };

  if (pipelineStage && stageMessages[pipelineStage]) {
    return stageMessages[pipelineStage];
  }

  // Fallback: generic message using the task title
  return `Bonjour ${clientFirstName}, je vous contacte au sujet de : ${taskTitle}. N'hesitez pas a me repondre. Cordialement.`;
}

// ============================================================================
// GET /api/v1/tasks/[id]/execution-context
// ============================================================================

/**
 * Returns the full execution context for a task: task details, client with
 * recent interactions, optional property, and a suggested message template.
 */
export const GET = apiHandler(
  { module: "PLANNING", action: "READ" },
  async (ctx) => {
    const { id } = ctx.params;

    // ------------------------------------------------------------------
    // 1. Fetch task with relations
    // ------------------------------------------------------------------
    const task = await ctx.db.task.findFirst({
      where: { id },
    });

    if (!task) {
      return jsonError("Tache introuvable", 404);
    }

    // ------------------------------------------------------------------
    // 2. Access control: AGENT can only see their own tasks
    // ------------------------------------------------------------------
    if (ctx.user.role === "AGENT" && task.assignedToId !== ctx.user.userId) {
      return jsonError("Acces refuse", 403);
    }

    // ------------------------------------------------------------------
    // 3. Load related data
    // ------------------------------------------------------------------
    const client = task.clientId
      ? await ctx.db.client.findFirst({ where: { id: task.clientId } })
      : null;

    const interactions = client
      ? await ctx.db.interaction.findMany({
          where: { clientId: client.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, type: true, direction: true, content: true, createdAt: true },
        })
      : [];

    const property = task.propertyId
      ? await ctx.db.property.findFirst({ where: { id: task.propertyId } })
      : null;

    const taskData = {
      id: task.id,
      title: task.title,
      type: task.type,
      status: task.status,
      dueAt: task.dueAt,
      notes: task.notes,
      pipelineStage: task.pipelineStage,
      isAutomated: task.isAutomated,
      createdAt: task.createdAt,
    };

    const clientData = client
      ? {
          id: client.id,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          email: client.email,
          pipelineStage: client.pipelineStage,
          budget: {
            budgetMin: client.budgetMin,
            budgetMax: client.budgetMax,
          },
          source: client.source,
          desiredType: client.desiredType,
          desiredWilaya: client.desiredWilaya,
          desiredRooms: client.desiredRooms,
          interactions,
        }
      : null;

    const images = property ? (property.images as Array<{ url?: string }> ?? []) : [];
    const propertyData = property
      ? {
          id: property.id,
          name: property.name,
          type: property.type,
          price: property.price,
          surface: property.surface,
          rooms: property.rooms,
          status: property.status,
          imageUrl: images[0]?.url ?? null,
        }
      : null;

    // Load automation config to check for custom templates
    let customTemplate: string | null = null;
    if (task.pipelineStage) {
      const config = await ctx.db.automationConfig.findFirst({
        where: { pipelineStage: task.pipelineStage },
      });
      if (config) {
        const tasks = config.tasks as Array<{ title: string; messageTemplate?: string }>;
        const matchingTask = tasks.find(t => t.title === task.title || t.title.replace('{clientName}', client?.firstName ?? '') === task.title);
        if (matchingTask?.messageTemplate) {
          customTemplate = matchingTask.messageTemplate;
        }
      }
    }

    const suggestedMessage = customTemplate
      ? customTemplate
          .replace(/\{clientName\}/g, client?.firstName ?? '')
          .replace(/\{agentName\}/g, '')
          .replace(/\{propertyName\}/g, property?.name ?? '')
          .replace(/\{budget\}/g, client?.budgetMin ? `${client.budgetMin} DA` : '')
      : client
        ? buildSuggestedMessage(task.type, task.title, client.firstName, client.pipelineStage)
        : null;

    return jsonOk({
      task: taskData,
      client: clientData,
      property: propertyData,
      suggestedMessage,
    });
  },
);
