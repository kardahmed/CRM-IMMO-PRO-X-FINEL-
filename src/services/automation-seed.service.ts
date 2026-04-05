import { prisma } from "@/lib/prisma";
import { DEFAULT_AUTOMATION_CONFIGS } from "@/services/automation-defaults";
import type { PipelineStage } from "@prisma/client";

/**
 * Seeds the 9 default automation configs for a new tenant.
 * Uses upsert to be idempotent — safe to call multiple times.
 */
export async function seedAutomationConfigsForTenant(tenantId: string): Promise<void> {
  const stages = Object.entries(DEFAULT_AUTOMATION_CONFIGS) as [PipelineStage, unknown[]][];

  for (const [stage, tasks] of stages) {
    await prisma.automationConfig.upsert({
      where: {
        tenantId_pipelineStage: { tenantId, pipelineStage: stage },
      },
      update: {},
      create: {
        tenantId,
        pipelineStage: stage,
        isActive: true,
        tasks: JSON.parse(JSON.stringify(tasks)),
      },
    });
  }
}
