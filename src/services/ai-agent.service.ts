import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { ICurrentUser } from "@/lib/auth";
import type { PlanType } from "@prisma/client";
import {
  buildPrompt,
  type AIChannel,
  type AILanguage,
  type IPromptContext,
} from "@/lib/ai-prompts";

// ============================================================================
// Types
// ============================================================================

export interface IGenerateMessageInput {
  taskId: string;
  channel: AIChannel;
  language: AILanguage;
}

export interface IGenerateMessageResult {
  generationId: string;
  message: string;
  channel: AIChannel;
  language: AILanguage;
  clientName: string;
  pipelineStage: string;
  warning: string;
}

// ============================================================================
// Plan limits — nombre max de générations IA par mois
// ============================================================================

const AI_MONTHLY_LIMITS: Record<PlanType, number> = {
  STARTER: 0, // Pas accès au module AI_AGENT
  PRO: 0, // Pas accès au module AI_AGENT
  BUSINESS: 500,
  ENTERPRISE: 5000,
};

// ============================================================================
// Anthropic client (singleton)
// ============================================================================

let _anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (_anthropicClient) return _anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configurée. Contactez le Super Admin.",
    );
  }
  _anthropicClient = new Anthropic({ apiKey });
  return _anthropicClient;
}

// ============================================================================
// Vérification limite mensuelle
// ============================================================================

async function checkMonthlyLimit(
  tenantId: string,
  plan: PlanType,
): Promise<void> {
  const limit = AI_MONTHLY_LIMITS[plan];
  if (limit === 0) {
    throw new LimitExceededError(
      "Le module IA n'est pas disponible pour votre plan. Passez au plan BUSINESS ou ENTERPRISE.",
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.aIGeneration.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= limit) {
    throw new LimitExceededError(
      `Limite IA atteinte : ${count}/${limit} générations ce mois. Votre plan ${plan} autorise ${limit} générations/mois.`,
    );
  }
}

export class LimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitExceededError";
  }
}

// ============================================================================
// Charger le contexte complet
// ============================================================================

async function loadContext(
  tenantId: string,
  taskId: string,
  channel: AIChannel,
  language: AILanguage,
): Promise<IPromptContext> {
  const db = createTenantPrisma(tenantId);

  // 1. Charger la tâche avec client et bien
  const task = await db.task.findFirst({
    where: { id: taskId },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          pipelineStage: true,
          budgetMin: true,
          budgetMax: true,
          desiredType: true,
          desiredWilaya: true,
          desiredRooms: true,
          desiredSurface: true,
        },
      },
      property: {
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          surface: true,
          rooms: true,
          status: true,
          projectId: true,
          project: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!task) {
    throw new Error("Tâche introuvable");
  }

  if (!task.client) {
    throw new Error(
      "La tâche n'est pas liée à un client. Impossible de générer un message.",
    );
  }

  // 2. Charger les 5 dernières interactions du client
  const recentInteractions = await db.interaction.findMany({
    where: { clientId: task.client.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      type: true,
      direction: true,
      content: true,
      createdAt: true,
    },
  });

  // 3. Construire le contexte
  return {
    clientId: task.client.id,
    client: {
      firstName: task.client.firstName,
      lastName: task.client.lastName,
      pipelineStage: task.client.pipelineStage,
      budgetMin: task.client.budgetMin ? Number(task.client.budgetMin) : null,
      budgetMax: task.client.budgetMax ? Number(task.client.budgetMax) : null,
      desiredType: task.client.desiredType,
      desiredWilaya: task.client.desiredWilaya,
      desiredRooms: task.client.desiredRooms,
      desiredSurface: task.client.desiredSurface ? Number(task.client.desiredSurface) : null,
    },
    taskTitle: task.title,
    taskType: task.type,
    channel,
    language,
    property: task.property
      ? {
          name: task.property.name,
          type: task.property.type,
          price: task.property.price ? Number(task.property.price) : null,
          surface: task.property.surface ? Number(task.property.surface) : null,
          rooms: task.property.rooms,
          status: task.property.status,
          projectName: task.property.project?.name ?? null,
        }
      : null,
    recentInteractions: recentInteractions.map((i) => ({
      type: i.type,
      direction: i.direction,
      content: i.content ?? "",
      createdAt: i.createdAt,
    })),
    taskNotes: task.notes,
  };
}

// ============================================================================
// Mapper le type de tâche vers AIGenerationType
// ============================================================================

function mapTaskTypeToGenerationType(
  taskType: string,
  channel: AIChannel,
): string {
  if (channel === "EMAIL") return "EMAIL_DRAFT";
  if (channel === "SMS") return "SMS_DRAFT";
  // WhatsApp et INTERNAL → SMS_DRAFT (le plus proche)
  if (channel === "WHATSAPP") return "SMS_DRAFT";
  // Fallback par type de tâche
  if (taskType === "EMAIL") return "EMAIL_DRAFT";
  if (taskType === "CALL") return "CLIENT_SUMMARY";
  return "EMAIL_DRAFT";
}

// ============================================================================
// GENERATE MESSAGE — fonction principale
// ============================================================================

/**
 * Génère un message IA pour une tâche donnée.
 * - Charge le contexte complet (client, interactions, bien, tâche)
 * - Vérifie la limite mensuelle du plan
 * - Construit un prompt contextualisé
 * - Appelle l'API Anthropic Claude
 * - Log dans AIGeneration
 * - Retourne le message (NON envoyé — validation humaine obligatoire)
 */
export async function generateMessage(
  user: ICurrentUser,
  input: IGenerateMessageInput,
): Promise<IGenerateMessageResult> {
  // 1. Vérifier le plan du tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { plan: true },
  });
  if (!tenant) {
    throw new Error("Tenant introuvable");
  }

  // 2. Vérifier la limite mensuelle
  await checkMonthlyLimit(user.tenantId, tenant.plan);

  // 3. Charger le contexte complet
  const promptContext = await loadContext(
    user.tenantId,
    input.taskId,
    input.channel,
    input.language,
  );

  // 4. Construire le prompt
  const prompt = buildPrompt(promptContext);

  // 5. Appeler l'API Anthropic
  const anthropic = getAnthropicClient();
  const completion = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  // Extraire le texte de la réponse
  const responseText = completion.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!responseText) {
    throw new Error("L'IA n'a pas généré de réponse. Réessayez.");
  }

  // 6. Log dans AIGeneration
  const generationType = mapTaskTypeToGenerationType(
    promptContext.taskType,
    input.channel,
  );

  const generation = await prisma.aIGeneration.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      clientId: promptContext.clientId,
      prompt,
      response: responseText,
      type: generationType as "EMAIL_DRAFT" | "SMS_DRAFT" | "CLIENT_SUMMARY",
      channel: input.channel,
      wasUsed: false,
    },
  });

  // 7. Log dans ActivityLog
  const db = createTenantPrisma(user.tenantId);
  await db.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: "AI_MESSAGE_GENERATED",
      entity: "AIGeneration",
      entityId: generation.id,
      metadata: {
        taskId: input.taskId,
        channel: input.channel,
        language: input.language,
        generationType,
        clientName: `${promptContext.client.firstName} ${promptContext.client.lastName}`,
      },
    },
  });

  return {
    generationId: generation.id,
    message: responseText,
    channel: input.channel,
    language: input.language,
    clientName: `${promptContext.client.firstName} ${promptContext.client.lastName}`,
    pipelineStage: promptContext.client.pipelineStage,
    warning:
      "Ce message a été généré par l'IA. Veuillez le relire et le valider avant envoi.",
  };
}
