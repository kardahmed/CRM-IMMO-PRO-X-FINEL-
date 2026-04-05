import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

/**
 * GET /api/v1/portal/[token]
 *
 * Route PUBLIQUE — pas de Clerk, pas de tenant check.
 * Le token portail est unique et sécurise l'accès.
 *
 * Retourne : bien réservé, avancement chantier, paiements, documents, contact agent.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await context.params;

  // Rate limiting: 5 req/min per IP to prevent brute-force token guessing
  const ip = getClientIp(_req);
  const rl = await rateLimit(`portal:${ip}`, RATE_LIMITS.portal);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: "Trop de tentatives, réessayez plus tard" },
      { status: 429 },
    );
  }

  if (!token || token.length < 20) {
    return NextResponse.json(
      { success: false, error: "Token invalide" },
      { status: 400 },
    );
  }

  try {
    // Trouver le client par token portail (unique, pas de tenant filter nécessaire)
    const client = await prisma.client.findUnique({
      where: { portalToken: token },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        pipelineStage: true,
        portalTokenExpiresAt: true,
        // Agent assigné (contact)
        assignedAgent: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        // Paiements
        payments: {
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: "Portail introuvable ou lien expiré" },
        { status: 404 },
      );
    }

    // Check token expiration
    if (client.portalTokenExpiresAt && new Date() > client.portalTokenExpiresAt) {
      return NextResponse.json(
        { success: false, error: "Ce lien portail a expiré. Contactez votre agent." },
        { status: 410 },
      );
    }

    // Trouver le bien associé au client (via paiement ou tâche)
    const paymentWithProperty = await prisma.payment.findFirst({
      where: { clientId: client.id, propertyId: { not: null } },
      select: { propertyId: true },
    });

    const taskWithProperty = !paymentWithProperty
      ? await prisma.task.findFirst({
          where: { clientId: client.id, propertyId: { not: null } },
          select: { propertyId: true },
        })
      : null;

    const propertyId = paymentWithProperty?.propertyId ?? taskWithProperty?.propertyId ?? null;

    // Charger le bien avec son projet
    let property = null;
    let project = null;

    if (propertyId) {
      property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          id: true,
          name: true,
          type: true,
          floor: true,
          rooms: true,
          surface: true,
          price: true,
          status: true,
          images: true,
          plans: true,
          documents: true,
          project: {
            select: {
              id: true,
              name: true,
              address: true,
              wilaya: true,
              deliveryDate: true,
              progressPercentage: true,
              status: true,
            },
          },
        },
      });

      if (property) {
        project = property.project;
      }
    }

    // Calculer la progression des paiements
    const totalAmount = client.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const paidAmount = client.payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const paymentProgress = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        client: {
          firstName: client.firstName,
          lastName: client.lastName,
          pipelineStage: client.pipelineStage,
        },
        property: property
          ? {
              name: property.name,
              type: property.type,
              floor: property.floor,
              rooms: property.rooms,
              surface: property.surface,
              price: property.price ? Number(property.price) : null,
              status: property.status,
              images: property.images,
              plans: property.plans,
              documents: property.documents,
            }
          : null,
        project: project
          ? {
              name: project.name,
              address: project.address,
              wilaya: project.wilaya,
              deliveryDate: project.deliveryDate,
              progressPercentage: project.progressPercentage,
              status: project.status,
            }
          : null,
        payments: {
          items: client.payments.map((p) => ({
            id: p.id,
            type: p.type,
            amount: Number(p.amount),
            status: p.status,
            date: p.createdAt,
          })),
          totalAmount,
          paidAmount,
          progressPercent: paymentProgress,
        },
        agent: client.assignedAgent
          ? {
              name: `${client.assignedAgent.firstName} ${client.assignedAgent.lastName}`,
              phone: client.assignedAgent.phone,
              email: client.assignedAgent.email,
            }
          : null,
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { context: "Portal API" } });
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 },
    );
  }
}
