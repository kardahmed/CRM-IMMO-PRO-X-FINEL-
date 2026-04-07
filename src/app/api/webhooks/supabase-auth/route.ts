import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

/**
 * POST /api/webhooks/supabase-auth
 *
 * Webhook Supabase Auth — reçoit les événements user.created, user.updated, user.deleted.
 * Configuré dans Supabase Dashboard > Auth > Hooks / Database Webhooks.
 *
 * Sécurisé par le header Authorization: Bearer <SUPABASE_WEBHOOK_SECRET>.
 */

interface SupabaseAuthEvent {
  type: string;
  table: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

const VALID_ROLES: UserRole[] = [
  "CEO",
  "SUPERVISOR",
  "AGENT",
  "ASSISTANT",
  "ADMIN",
];

function parseRole(role: unknown): UserRole {
  if (typeof role === "string" && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  return "AGENT";
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { success: false, error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Verify Bearer token
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let event: SupabaseAuthEvent;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const { type, record, old_record } = event;

  try {
    switch (type) {
      case "INSERT":
      case "UPDATE": {
        if (!record) break;

        const supabaseId = record.id as string;
        const rawMeta = (record.raw_user_meta_data || {}) as Record<string, unknown>;

        const firstName = (rawMeta.firstName as string) || "";
        const lastName = (rawMeta.lastName as string) || "";
        const email = (record.email as string) || "";
        const phone = (record.phone as string) || null;

        const tenantId = rawMeta.tenantId as string | undefined;
        if (!tenantId) {
          // User without a tenant — skip DB sync
          return NextResponse.json({ success: true, data: { synced: false } });
        }

        const role = parseRole(rawMeta.role);

        await prisma.user.upsert({
          where: { supabaseId },
          create: {
            supabaseId,
            tenantId,
            firstName,
            lastName,
            email,
            phone,
            role,
            isActive: true,
          },
          update: {
            firstName,
            lastName,
            email,
            phone,
            role,
            isActive: true,
          },
        });

        break;
      }

      case "DELETE": {
        const deletedId = (old_record?.id as string) || (record?.id as string);
        if (deletedId) {
          // Find the user before deactivating to get tenantId
          const deletedUser = await prisma.user.findFirst({
            where: { supabaseId: deletedId },
            select: { id: true, tenantId: true },
          });

          // Soft-delete the user
          await prisma.user.updateMany({
            where: { supabaseId: deletedId },
            data: { isActive: false },
          });

          // If this was the last active user in the tenant, suspend the workspace
          if (deletedUser?.tenantId) {
            const remainingActive = await prisma.user.count({
              where: { tenantId: deletedUser.tenantId, isActive: true },
            });
            if (remainingActive === 0) {
              await prisma.tenant.update({
                where: { id: deletedUser.tenantId },
                data: { status: "SUSPENDED" },
              });
              Sentry.captureMessage(
                `Tenant ${deletedUser.tenantId} suspended — no active users remain`,
                { level: "info", tags: { context: "Supabase Auth Webhook" } },
              );
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ success: true, data: { type } });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Supabase Auth Webhook" } });
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
