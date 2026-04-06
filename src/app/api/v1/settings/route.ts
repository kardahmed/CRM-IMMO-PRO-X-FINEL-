import { z } from "zod";
import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";

/**
 * GET /api/v1/settings
 *
 * Returns tenant info + settings JSON for the current workspace.
 * Restricted to CEO / ADMIN via the SETTINGS module permission.
 */
export const GET = apiHandler(
  { module: "SETTINGS", action: "READ" },
  async (ctx) => {
    const tenant = await ctx.db.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: {
        id: true,
        name: true,
        type: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!tenant) {
      return jsonError("Tenant introuvable", 404);
    }

    return jsonOk(tenant);
  },
);

/**
 * PUT /api/v1/settings
 *
 * Updates the tenant settings JSON. Merges incoming fields with existing settings.
 */
const settingsSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  settings: z
    .object({
      agencyName: z.string().max(200).optional(),
      activityType: z.string().max(200).optional(),
      address: z.string().max(500).optional(),
      rcNumber: z.string().max(100).optional(),
      contactEmail: z.string().email().max(200).optional(),
      smtp: z
        .object({
          host: z.string().max(200).optional(),
          port: z.string().max(10).optional(),
        })
        .optional(),
      facebookPageId: z.string().max(100).optional(),
      whatsappEnabled: z.boolean().optional(),
      whatsappApiToken: z.string().max(500).optional(),
      whatsappPhoneNumberId: z.string().max(100).optional(),
      facebookEnabled: z.boolean().optional(),
      facebookAppSecret: z.string().max(500).optional(),
      facebookWebhookToken: z.string().max(500).optional(),
      googleMapsEnabled: z.boolean().optional(),
      googleMapsApiKey: z.string().max(500).optional(),
    })
    .optional(),
});

type SettingsPayload = z.infer<typeof settingsSchema>;

export const PUT = apiHandler(
  { module: "SETTINGS", action: "UPDATE", schema: settingsSchema },
  async (ctx) => {
    const body = getBody<SettingsPayload>(ctx.req);

    const existing = await ctx.db.tenant.findUnique({
      where: { id: ctx.tenantId },
      select: { settings: true },
    });

    if (!existing) {
      return jsonError("Tenant introuvable", 404);
    }

    const currentSettings =
      typeof existing.settings === "object" && existing.settings !== null
        ? (existing.settings as Record<string, string | Record<string, string>>)
        : {};

    const mergedSettings = body.settings
      ? { ...currentSettings, ...body.settings } as Record<string, unknown>
      : currentSettings;

    const updated = await ctx.db.tenant.update({
      where: { id: ctx.tenantId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        settings: mergedSettings,
      },
      select: {
        id: true,
        name: true,
        type: true,
        plan: true,
        status: true,
        settings: true,
        createdAt: true,
      },
    });

    return jsonOk(updated);
  },
);
