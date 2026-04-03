import { apiHandler, getBody, jsonOk } from "@/lib/api-handler";
import {
  upsertAutomationConfigSchema,
  toggleAutomationConfigSchema,
  type UpsertAutomationConfigInput,
  type ToggleAutomationConfigInput,
} from "@/lib/validations/automations";
import {
  getAutomationConfigs,
  upsertAutomationConfig,
  toggleAutomationConfig,
} from "@/services/automation-config.service";
import type { PipelineStage } from "@prisma/client";

/**
 * GET /api/v1/automations/config — Liste toutes les configs du tenant
 * Query: ?stage=NEW pour filtrer par étape
 */
export const GET = apiHandler(
  { module: "AUTOMATIONS", action: "READ" },
  async (ctx) => {
    const url = new URL(ctx.req.url);
    const stage = url.searchParams.get("stage");

    if (stage) {
      const { getAutomationConfigByStage } = await import("@/services/automation-config.service");
      const config = await getAutomationConfigByStage(ctx.tenantId, stage as PipelineStage);
      return jsonOk(config);
    }

    const configs = await getAutomationConfigs(ctx.tenantId);
    return jsonOk(configs);
  },
);

/**
 * POST /api/v1/automations/config — Créer ou mettre à jour une config
 */
export const POST = apiHandler(
  { module: "AUTOMATIONS", action: "CREATE", schema: upsertAutomationConfigSchema },
  async (ctx) => {
    const body = getBody<UpsertAutomationConfigInput>(ctx.req);
    const config = await upsertAutomationConfig(ctx.user, body);
    return jsonOk(config, 201);
  },
);

/**
 * PATCH /api/v1/automations/config — Toggle activer/désactiver une config
 */
export const PATCH = apiHandler(
  { module: "AUTOMATIONS", action: "UPDATE", schema: toggleAutomationConfigSchema },
  async (ctx) => {
    const body = getBody<ToggleAutomationConfigInput>(ctx.req);
    const config = await toggleAutomationConfig(ctx.user, body.pipelineStage, body.isActive);
    return jsonOk(config);
  },
);
