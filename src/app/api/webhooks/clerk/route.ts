import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

interface WebhookEvent {
  data: Record<string, unknown>;
  type: string;
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
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { success: false, error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  // Vérifier la signature Svix
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { success: false, error: "Missing svix headers" },
      { status: 400 },
    );
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const { type, data } = event;

  switch (type) {
    case "user.created":
    case "user.updated": {
      const clerkId = data.id as string;
      const firstName = (data.first_name as string) || "";
      const lastName = (data.last_name as string) || "";
      const email =
        (
          data.email_addresses as Array<{
            email_address: string;
            id: string;
          }>
        )?.[0]?.email_address || "";
      const phone =
        (
          data.phone_numbers as Array<{
            phone_number: string;
            id: string;
          }>
        )?.[0]?.phone_number || null;

      const publicMetadata = (data.public_metadata || {}) as {
        tenantId?: string;
        role?: string;
      };

      const tenantId = publicMetadata.tenantId;
      if (!tenantId) {
        // Utilisateur sans tenant — on skip la sync DB
        return NextResponse.json({ success: true, data: { synced: false } });
      }

      const role = parseRole(publicMetadata.role);

      await prisma.user.upsert({
        where: { clerkId },
        create: {
          clerkId,
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

    case "user.deleted": {
      const clerkId = data.id as string;
      if (clerkId) {
        await prisma.user.updateMany({
          where: { clerkId },
          data: { isActive: false },
        });
      }
      break;
    }
  }

  return NextResponse.json({ success: true, data: { type } });
}
