import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whatsappWebhookSchema } from "@/lib/validations/whatsapp";
import { receiveMessage } from "@/services/whatsapp.service";
import type { IIncomingWhatsApp } from "@/services/whatsapp.service";

/**
 * GET /api/v1/webhooks/whatsapp
 *
 * Vérification du webhook WhatsApp (challenge).
 * Meta envoie une requête GET avec hub.verify_token pour vérifier l'endpoint.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Vérification échouée" }, { status: 403 });
}

/**
 * POST /api/v1/webhooks/whatsapp
 *
 * Reçoit les messages WhatsApp entrants via Cloud API.
 * Route publique (pas d'auth Clerk) — vérification par structure du payload.
 *
 * Flow :
 * 1. Parse le payload WhatsApp
 * 2. Identifie le tenant via le phone_number_id (config dans Tenant.settings)
 * 3. Pour chaque message texte, appelle receiveMessage()
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Valider la structure du webhook
    const parsed = whatsappWebhookSchema.safeParse(body);
    if (!parsed.success) {
      // WhatsApp envoie parfois des status updates — les ignorer silencieusement
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const payload = parsed.data;

    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { messages, metadata } = change.value;
        if (!messages || messages.length === 0) continue;

        // Identifier le tenant par phone_number_id dans les settings
        const tenant = await findTenantByPhoneId(metadata.phone_number_id);
        if (!tenant) {
          console.warn(
            `[WhatsApp Webhook] No tenant found for phone_number_id: ${metadata.phone_number_id}`,
          );
          continue;
        }

        // Traiter chaque message texte
        for (const msg of messages) {
          if (msg.type !== "text" || !msg.text) continue;

          const incoming: IIncomingWhatsApp = {
            from: msg.from,
            body: msg.text.body,
            messageId: msg.id,
            timestamp: Number(msg.timestamp),
          };

          await receiveMessage(tenant.id, incoming);
        }
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[WhatsApp Webhook Error]", err);
    // Toujours retourner 200 pour éviter les retries de Meta
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

/**
 * Trouve le tenant associé à un phone_number_id WhatsApp.
 * Cherche dans Tenant.settings.whatsapp.whatsappPhoneId.
 */
async function findTenantByPhoneId(
  phoneNumberId: string,
): Promise<{ id: string } | null> {
  // Prisma ne supporte pas le filtrage JSON profond sur tous les DB providers,
  // on charge les tenants actifs avec settings WhatsApp configuré
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, settings: true },
  });

  for (const t of tenants) {
    const settings = t.settings as Record<string, unknown>;
    const wa = settings?.whatsapp as Record<string, unknown> | undefined;
    if (wa?.whatsappPhoneId === phoneNumberId) {
      return { id: t.id };
    }
  }

  return null;
}
