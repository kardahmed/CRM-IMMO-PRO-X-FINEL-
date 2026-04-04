import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  facebookLeadWebhookSchema,
  facebookLeadDataSchema,
} from "@/lib/validations/facebook-leads";
import { processFacebookLead } from "@/services/facebook-leads.service";
import type { IFacebookLeadPayload } from "@/services/facebook-leads.service";
import { verifyMetaSignature } from "@/lib/webhook-signature";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/v1/webhooks/facebook-leads
 *
 * Vérification du webhook Facebook (challenge).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Vérification échouée" }, { status: 403 });
}

/**
 * POST /api/v1/webhooks/facebook-leads
 *
 * Reçoit les notifications de Lead Ads Facebook.
 * Route publique (pas d'auth Clerk).
 *
 * Flow :
 * 1. Reçoit la notification (contient leadgen_id, page_id, form_id)
 * 2. Appelle l'API Graph pour récupérer les données du lead
 * 3. Identifie le tenant par page_id (config dans Tenant.settings)
 * 4. Appelle processFacebookLead()
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = rateLimit(`webhook:facebook:${ip}`, RATE_LIMITS.webhook);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const rawBody = await req.text();

    // Verify Meta signature (HMAC-SHA256)
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (appSecret) {
      const signature = req.headers.get("x-hub-signature-256");
      if (!verifyMetaSignature(rawBody, signature, appSecret)) {
        console.warn("[Facebook Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const body = JSON.parse(rawBody);

    // Valider la structure du webhook
    const parsed = facebookLeadWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const payload = parsed.data;

    for (const entry of payload.entry) {
      const pageId = entry.id;

      // Trouver le tenant associé à cette page Facebook
      const tenant = await findTenantByPageId(pageId);
      if (!tenant) {
        console.warn(
          `[Facebook Leads Webhook] No tenant found for page_id: ${pageId}`,
        );
        continue;
      }

      for (const change of entry.changes) {
        const { leadgen_id, form_id } = change.value;

        // Récupérer les données du lead via l'API Graph
        const leadData = await fetchLeadData(
          leadgen_id,
          tenant.facebookAccessToken,
        );
        if (!leadData) {
          console.error(
            `[Facebook Leads] Failed to fetch lead data for ${leadgen_id}`,
          );
          continue;
        }

        // Extraire les champs du formulaire
        const fields = extractLeadFields(leadData.field_data);

        if (!fields.phone) {
          console.warn(
            `[Facebook Leads] Lead ${leadgen_id} has no phone number, skipping`,
          );
          continue;
        }

        const leadPayload: IFacebookLeadPayload = {
          leadId: leadgen_id,
          formId: form_id,
          formName: tenant.formNames?.[form_id],
          firstName: fields.firstName || "Inconnu",
          lastName: fields.lastName || "",
          phone: fields.phone,
          email: fields.email,
          createdTime: leadData.created_time,
        };

        await processFacebookLead(tenant.tenantId, leadPayload);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[Facebook Leads Webhook Error]", err);
    // Toujours retourner 200 pour éviter les retries de Facebook
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ============================================================================
// Helpers
// ============================================================================

interface ITenantFacebookConfig {
  tenantId: string;
  facebookAccessToken: string;
  formNames?: Record<string, string>;
}

/**
 * Trouve le tenant associé à un page_id Facebook.
 * Cherche dans Tenant.settings.facebook.pageId.
 */
async function findTenantByPageId(
  pageId: string,
): Promise<ITenantFacebookConfig | null> {
  const tenants = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, settings: true },
  });

  for (const t of tenants) {
    const settings = t.settings as Record<string, unknown>;
    const fb = settings?.facebook as Record<string, unknown> | undefined;
    if (fb?.pageId === pageId && typeof fb?.accessToken === "string") {
      return {
        tenantId: t.id,
        facebookAccessToken: fb.accessToken,
        formNames: fb.formNames as Record<string, string> | undefined,
      };
    }
  }

  return null;
}

/**
 * Récupère les données d'un lead via l'API Graph Facebook.
 */
async function fetchLeadData(
  leadgenId: string,
  accessToken: string,
): Promise<{
  field_data: Array<{ name: string; values: string[] }>;
  form_id?: string;
  ad_name?: string;
  created_time: string;
} | null> {
  try {
    const url = `https://graph.facebook.com/v21.0/${leadgenId}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error(
        `[Facebook Graph API] ${response.status}: ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();
    const parsed = facebookLeadDataSchema.safeParse(data);
    if (!parsed.success) {
      console.error("[Facebook Graph API] Invalid lead data", parsed.error);
      return null;
    }

    return parsed.data;
  } catch (err) {
    console.error("[Facebook Graph API] Network error", err);
    return null;
  }
}

/**
 * Extrait les champs standard du formulaire Facebook.
 */
function extractLeadFields(
  fieldData: Array<{ name: string; values: string[] }>,
): {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
} {
  const get = (name: string): string | undefined => {
    const field = fieldData.find(
      (f) =>
        f.name.toLowerCase() === name ||
        f.name.toLowerCase().includes(name),
    );
    return field?.values[0];
  };

  // Facebook utilise "full_name" ou "first_name" / "last_name"
  const fullName = get("full_name");
  let firstName = get("first_name");
  let lastName = get("last_name");

  if (!firstName && fullName) {
    const parts = fullName.split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  return {
    firstName,
    lastName,
    phone: get("phone_number") ?? get("phone"),
    email: get("email"),
  };
}
