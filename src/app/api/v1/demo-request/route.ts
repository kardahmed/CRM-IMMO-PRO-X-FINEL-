import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

const DEMO_DURATION_DAYS = 14;

const DEMO_LIMITS = {
  maxClients: 5,
  maxProperties: 3,
  maxUsers: 1,
};

const WILAYAS = [
  "Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Setif",
  "Tlemcen", "Bejaia", "Tizi Ouzou", "Djelfa", "Biskra", "Chlef",
  "Mostaganem", "Medea", "Tiaret", "Bouira", "Bordj Bou Arreridj",
  "Boumerdes", "Skikda", "Tipaza", "Msila", "Mascara", "Ouargla",
  "Ghardaia", "Relizane", "Ain Defla", "Ain Temouchent", "El Oued",
  "Jijel", "Mila", "Souk Ahras", "Guelma", "Khenchela", "Oum El Bouaghi",
  "Saida", "Sidi Bel Abbes", "Laghouat", "Bechar", "Adrar", "Tamanghasset",
  "Tindouf", "Illizi", "Naama", "El Bayadh", "Tissemsilt", "Ain Beida",
];

const demoRequestSchema = z.object({
  companyName: z.string().min(2).max(100).trim(),
  companyType: z.enum(["PROMOTION", "AGENCY"]),
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  email: z.string().email(),
  phone: z.string().min(9).max(20),
  wilaya: z.string().optional(),
  agentCount: z.enum(["1-5", "6-20", "21-50", "50+"]).optional(),
  message: z.string().max(500).optional(),
});

/**
 * POST /api/v1/demo-request
 *
 * Public route — no auth required.
 * 1. Validate + store DemoLead
 * 2. Auto-create a DEMO tenant with 14-day expiry and feature limits
 * 3. Return tenant ID + demo access info
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limit: 3 per minute per IP
  const ip = getClientIp(req);
  const rl = await rateLimit(`demo-request:${ip}`, { limit: 3, windowSec: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Trop de demandes, réessayez dans quelques minutes" },
      { status: 429 },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Corps de requête invalide" },
        { status: 400 },
      );
    }

    const parsed = demoRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 422 },
      );
    }

    const data = parsed.data;

    // Check if email already has a demo request
    const existing = await prisma.demoLead.findFirst({
      where: { email: data.email },
      select: { id: true, tenantId: true },
    });

    if (existing?.tenantId) {
      return NextResponse.json({
        success: true,
        data: {
          message: "Un compte demo existe deja pour cet email",
          tenantId: existing.tenantId,
          alreadyExists: true,
        },
      });
    }

    // Create demo tenant + DemoLead in a transaction
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEMO_DURATION_DAYS);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DEMO tenant
      const tenant = await tx.tenant.create({
        data: {
          name: `${data.companyName} (Demo)`,
          type: data.companyType === "PROMOTION" ? "PROMOTION" : "AGENCY",
          plan: "STARTER",
          status: "DEMO",
          settings: {
            demoExpiresAt: expiresAt.toISOString(),
            demoLimits: DEMO_LIMITS,
          },
        },
      });

      // 2. Create DemoLead linked to tenant
      const demoLead = await tx.demoLead.create({
        data: {
          companyName: data.companyName,
          companyType: data.companyType,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          wilaya: data.wilaya,
          agentCount: data.agentCount,
          message: data.message,
          tenantId: tenant.id,
          status: "NEW",
        },
      });

      return { tenant, demoLead };
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Votre espace demo a ete cree avec succes",
        tenantId: result.tenant.id,
        demoLeadId: result.demoLead.id,
        expiresAt: expiresAt.toISOString(),
        limits: DEMO_LIMITS,
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Demo Request API" } });
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
