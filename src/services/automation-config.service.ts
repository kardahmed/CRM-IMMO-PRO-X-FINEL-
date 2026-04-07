import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { ICurrentUser } from "@/lib/auth";
import type { AutomationConfig, PipelineStage } from "@prisma/client";
import type { IAutomationTask } from "@/services/automation-engine";

// ============================================================================
// Types
// ============================================================================

export interface IUpsertAutomationConfigInput {
  pipelineStage: PipelineStage;
  isActive?: boolean;
  tasks: IAutomationTask[];
}

// ============================================================================
// GET ALL — Toutes les configs du tenant
// ============================================================================

export async function getAutomationConfigs(
  tenantId: string,
): Promise<AutomationConfig[]> {
  const db = createTenantPrisma(tenantId);
  return db.automationConfig.findMany({
    orderBy: { pipelineStage: "asc" },
  });
}

// ============================================================================
// GET BY STAGE — Config pour une étape spécifique
// ============================================================================

export async function getAutomationConfigByStage(
  tenantId: string,
  stage: PipelineStage,
): Promise<AutomationConfig | null> {
  const db = createTenantPrisma(tenantId);
  return db.automationConfig.findFirst({
    where: { pipelineStage: stage },
  });
}

// ============================================================================
// UPSERT — Créer ou mettre à jour une config
// ============================================================================

export async function upsertAutomationConfig(
  user: ICurrentUser,
  input: IUpsertAutomationConfigInput,
): Promise<AutomationConfig> {
  const db = createTenantPrisma(user.tenantId);

  // Vérifier si une config existe déjà pour cette étape
  const existing = await db.automationConfig.findFirst({
    where: { pipelineStage: input.pipelineStage },
  });

  let config: AutomationConfig;

  if (existing) {
    config = await db.automationConfig.update({
      where: { id: existing.id },
      data: {
        isActive: input.isActive ?? existing.isActive,
        tasks: input.tasks as unknown as Record<string, unknown>[],
      },
    });
  } else {
    // @ts-expect-error — Prisma $extends typing limitation on create()
    config = await db.automationConfig.create({
      data: {
        pipelineStage: input.pipelineStage,
        isActive: input.isActive ?? true,
        tasks: input.tasks as unknown as Record<string, unknown>[],
      },
    });
  }

  // Log
  await db.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: existing ? "AUTOMATION_CONFIG_UPDATED" : "AUTOMATION_CONFIG_CREATED",
      entity: "AutomationConfig",
      entityId: config.id,
      metadata: {
        stage: input.pipelineStage,
        taskCount: input.tasks.length,
        isActive: config.isActive,
      },
    },
  });

  return config;
}

// ============================================================================
// TOGGLE — Activer / désactiver une config
// ============================================================================

export async function toggleAutomationConfig(
  user: ICurrentUser,
  stage: PipelineStage,
  isActive: boolean,
): Promise<AutomationConfig> {
  const db = createTenantPrisma(user.tenantId);

  const existing = await db.automationConfig.findFirst({
    where: { pipelineStage: stage },
  });

  if (!existing) {
    throw new Error(`Aucune config trouvée pour l'étape ${stage}`);
  }

  const updated = await db.automationConfig.update({
    where: { id: existing.id },
    data: { isActive },
  });

  await db.activityLog.create({
    data: {
      tenantId: user.tenantId,
      userId: user.userId,
      action: isActive ? "AUTOMATION_CONFIG_ENABLED" : "AUTOMATION_CONFIG_DISABLED",
      entity: "AutomationConfig",
      entityId: updated.id,
      metadata: { stage, isActive },
    },
  });

  return updated;
}
