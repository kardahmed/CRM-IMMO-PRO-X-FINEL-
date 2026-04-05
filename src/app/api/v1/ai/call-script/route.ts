import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { createTenantPrisma } from "@/lib/prisma-tenant";
import type { PlanType } from "@prisma/client";

// ============================================================================
// Zod schema
// ============================================================================

const callScriptSchema = z.object({
  taskId: z.string().uuid(),
  language: z.enum(["FR", "AR_DIALECT", "AR_CLASSIC", "EN"]).default("FR"),
});

type CallScriptInput = z.infer<typeof callScriptSchema>;

// ============================================================================
// AI monthly limits (same as ai-agent.service.ts)
// ============================================================================

const AI_MONTHLY_LIMITS: Record<PlanType, number> = {
  STARTER: 0,
  PRO: 0,
  BUSINESS: 500,
  ENTERPRISE: 5000,
};

async function checkMonthlyLimit(
  tenantId: string,
  plan: PlanType,
): Promise<void> {
  const limit = AI_MONTHLY_LIMITS[plan];
  if (limit === 0) {
    throw new LimitExceededError(
      "Le module IA n'est pas disponible pour votre plan. Passez au plan BUSINESS ou ENTERPRISE.",
    );
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.aIGeneration.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (count >= limit) {
    throw new LimitExceededError(
      `Limite IA atteinte : ${count}/${limit} generations ce mois. Votre plan ${plan} autorise ${limit} generations/mois.`,
    );
  }
}

class LimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LimitExceededError";
  }
}

// ============================================================================
// Pipeline stage descriptions for prompt context
// ============================================================================

const PIPELINE_STAGE_DESCRIPTIONS: Record<string, string> = {
  NEW: "Lead entrant - Premier contact a etablir. Le client vient de montrer un interet initial.",
  CONTACTED: "Premier contact etabli - Le client a ete contacte mais pas encore qualifie.",
  QUALIFIED: "Besoin et budget valides - Le client a un projet concret avec budget defini.",
  VISIT_SCHEDULED: "Visite programmee - Une visite est planifiee, il faut confirmer et preparer.",
  VISITED: "Visite effectuee - Le client a visite le bien, il faut recueillir ses impressions.",
  NEGOTIATION: "Offre/contre-offre en cours - Phase de negociation active sur le prix ou les conditions.",
  RESERVED: "Reservation signee - Le bon de reservation est signe, il faut suivre les paiements.",
  SIGNED: "Compromis/acte signe - Pres de la finalisation, suivi administratif et notarial.",
  CLOSED: "Transaction finalisee - Vente conclue, appel de satisfaction et fidelisation.",
};

// ============================================================================
// Language instructions for the prompt
// ============================================================================

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  FR: "Redige le script entierement en francais.",
  AR_DIALECT: "Redige le script en arabe dialectal algerien (darija). Utilise des expressions courantes algeriennes. Tu peux ecrire en caracteres arabes ou en translitteration latine selon ce qui est le plus naturel.",
  AR_CLASSIC: "Redige le script en arabe classique (fusha) avec des caracteres arabes.",
  EN: "Write the script entirely in English.",
};

// ============================================================================
// Build the call script prompt
// ============================================================================

interface ICallScriptContext {
  client: {
    firstName: string;
    lastName: string;
    pipelineStage: string;
    budgetMin: number | null;
    budgetMax: number | null;
    desiredType: string | null;
    desiredWilaya: string | null;
    desiredRooms: number | null;
    desiredSurface: number | null;
  };
  taskTitle: string;
  taskNotes: string | null;
  property: {
    name: string;
    type: string;
    price: number | null;
    surface: number | null;
    rooms: number | null;
    status: string;
    floor: number | null;
    projectName: string | null;
  } | null;
  recentInteractions: Array<{
    type: string;
    direction: string;
    content: string;
    createdAt: Date;
  }>;
  language: string;
}

function buildCallScriptPrompt(ctx: ICallScriptContext): string {
  const { client, property, recentInteractions, language } = ctx;

  const stageDesc =
    PIPELINE_STAGE_DESCRIPTIONS[client.pipelineStage] ??
    "Etape inconnue";

  const langInstruction = LANGUAGE_INSTRUCTIONS[language] ?? LANGUAGE_INSTRUCTIONS.FR;

  // Format budget
  let budgetStr = "Non renseigne";
  if (client.budgetMin !== null && client.budgetMax !== null) {
    budgetStr = `${client.budgetMin.toLocaleString("fr-FR")} DA - ${client.budgetMax.toLocaleString("fr-FR")} DA`;
  } else if (client.budgetMin !== null) {
    budgetStr = `A partir de ${client.budgetMin.toLocaleString("fr-FR")} DA`;
  } else if (client.budgetMax !== null) {
    budgetStr = `Jusqu'a ${client.budgetMax.toLocaleString("fr-FR")} DA`;
  }

  // Format interactions
  let interactionsStr = "Aucune interaction enregistree.";
  if (recentInteractions.length > 0) {
    interactionsStr = recentInteractions
      .map((i) => {
        const date = new Date(i.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        return `- [${date}] ${i.type} (${i.direction}) : ${i.content || "Pas de contenu"}`;
      })
      .join("\n");
  }

  // Format property
  let propertyStr = "Aucun bien lie a cette tache.";
  if (property) {
    const priceStr = property.price
      ? `${property.price.toLocaleString("fr-FR")} DA`
      : "Non renseigne";
    const surfaceStr = property.surface ? `${property.surface} m2` : "Non renseignee";
    const roomsStr = property.rooms ? `${property.rooms} pieces` : "Non renseigne";
    const floorStr = property.floor !== null ? `Etage ${property.floor}` : "";
    const projectStr = property.projectName
      ? `Projet : ${property.projectName}`
      : "";

    propertyStr = [
      `Nom : ${property.name}`,
      `Type : ${property.type}`,
      `Prix : ${priceStr}`,
      `Surface : ${surfaceStr}`,
      `Pieces : ${roomsStr}`,
      floorStr ? `Etage : ${floorStr}` : null,
      `Statut : ${property.status}`,
      projectStr || null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  // Format task notes (agent's personal notes)
  const taskNotesStr = ctx.taskNotes
    ? `Notes de l'agent sur cette tache : ${ctx.taskNotes}`
    : "Aucune note sur cette tache.";

  return `Tu es un expert en vente immobiliere en Algerie. Tu dois generer un script d'appel telephonique detaille et professionnel pour un agent immobilier.

${langInstruction}

=== CONTEXTE DU MARCHE IMMOBILIER ALGERIEN ===
- Les prix sont en DA (Dinar Algerien)
- Villes principales : Alger, Oran, Constantine, Annaba, Setif, Blida, Tizi Ouzou, Bejaia
- Types de biens courants : F2, F3, F4, F5 (appartements), Villa, Duplex, Local commercial
- Systeme juridique : notaire obligatoire, compromis de vente, bon de reservation
- Plans de paiement (versements) courants dans les promotions immobilieres
- Systeme de wilayas pour les localisations
- Le marche algerien valorise la confiance et la relation personnelle avec le client
- Les negociations sont courantes et font partie de la culture d'achat

=== INFORMATIONS CLIENT ===
Nom : ${client.firstName} ${client.lastName}
Etape pipeline : ${client.pipelineStage} — ${stageDesc}
Budget : ${budgetStr}
Type de bien souhaite : ${client.desiredType ?? "Non renseigne"}
Wilaya souhaitee : ${client.desiredWilaya ?? "Non renseignee"}
Nombre de pieces souhaite : ${client.desiredRooms ?? "Non renseigne"}
Surface souhaitee : ${client.desiredSurface ? `${client.desiredSurface} m2` : "Non renseignee"}

=== NOTES DE L'AGENT ===
${taskNotesStr}

=== BIEN IMMOBILIER CONCERNE ===
${propertyStr}

=== HISTORIQUE DES 10 DERNIERES INTERACTIONS ===
${interactionsStr}

=== TACHE EN COURS ===
Titre : ${ctx.taskTitle}

=== INSTRUCTIONS ===
Genere un script d'appel telephonique structure avec les sections suivantes.
Le script doit etre adapte a l'etape "${client.pipelineStage}" du pipeline et au contexte specifique du client.
Utilise les informations du client, ses interactions passees et les notes de l'agent pour personnaliser le script.

Le script DOIT contenir exactement ces 6 sections :

## 1. OUVERTURE
Comment saluer le client et se presenter. Inclure une phrase d'accroche personnalisee basee sur la derniere interaction ou le contexte du client.

## 2. CONTEXTE
Resume de la situation du client base sur l'historique. Ce que l'agent sait deja et peut mentionner pour montrer qu'il suit le dossier.

## 3. OBJECTIF DE L'APPEL
Ce que l'agent doit accomplir lors de cet appel, base sur l'etape du pipeline :
${stageDesc}

## 4. POINTS CLES A ABORDER
Les sujets importants a discuter, les questions a poser, les informations a communiquer. Inclure des details specifiques sur le bien si disponible.

## 5. REPONSES AUX OBJECTIONS
Les objections les plus probables du client a cette etape et comment y repondre. Adapter au marche algerien (prix en DA, comparaisons locales, avantages du quartier/wilaya, facilites de paiement).

## 6. CONCLUSION
Comment conclure l'appel avec des prochaines etapes concretes (rendez-vous, visite, envoi de documents, etc.).

Sois concret, professionnel et adapte au contexte algerien. Evite les generalites. Chaque phrase du script doit etre directement utile a l'agent.`;
}

// ============================================================================
// Anthropic client (singleton)
// ============================================================================

let _anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (_anthropicClient) return _anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY non configuree. Contactez le Super Admin.",
    );
  }
  _anthropicClient = new Anthropic({ apiKey });
  return _anthropicClient;
}

// ============================================================================
// POST /api/v1/ai/call-script
//
// Genere un script d'appel telephonique avance pour agents immobiliers en
// Algerie. Le script est RETOURNE mais PAS applique — validation humaine
// obligatoire.
//
// Body : { taskId: string (UUID), language?: "FR"|"AR_DIALECT"|"AR_CLASSIC"|"EN" }
// Module : AI_AGENT (BUSINESS / ENTERPRISE uniquement)
// ============================================================================

export const POST = apiHandler(
  { module: "AI_AGENT", action: "CREATE", schema: callScriptSchema },
  async (ctx) => {
    const body = getBody<CallScriptInput>(ctx.req);
    const { taskId, language } = body;

    try {
      // 1. Check tenant plan
      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenantId },
        select: { plan: true },
      });
      if (!tenant) {
        return jsonError("Tenant introuvable", 404);
      }

      // 2. Check AI monthly limits
      await checkMonthlyLimit(ctx.tenantId, tenant.plan);

      // 3. Load task with client and property
      const db = createTenantPrisma(ctx.tenantId);

      const task = await db.task.findFirst({
        where: { id: taskId },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              pipelineStage: true,
              budgetMin: true,
              budgetMax: true,
              desiredType: true,
              desiredWilaya: true,
              desiredRooms: true,
              desiredSurface: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              type: true,
              price: true,
              surface: true,
              rooms: true,
              floor: true,
              status: true,
              projectId: true,
              project: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!task) {
        return jsonError("Tache introuvable", 404);
      }

      if (!task.client) {
        return jsonError(
          "La tache n'est pas liee a un client. Impossible de generer un script d'appel.",
          422,
        );
      }

      const client = task.client;

      // 4. Load last 10 interactions
      const recentInteractions = await db.interaction.findMany({
        where: { clientId: client.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          type: true,
          direction: true,
          content: true,
          createdAt: true,
        },
      });

      // 5. Build prompt context
      const promptContext: ICallScriptContext = {
        client: {
          firstName: client.firstName,
          lastName: client.lastName,
          pipelineStage: client.pipelineStage,
          budgetMin: client.budgetMin ? Number(client.budgetMin) : null,
          budgetMax: client.budgetMax ? Number(client.budgetMax) : null,
          desiredType: client.desiredType,
          desiredWilaya: client.desiredWilaya,
          desiredRooms: client.desiredRooms,
          desiredSurface: client.desiredSurface
            ? Number(client.desiredSurface)
            : null,
        },
        taskTitle: task.title,
        taskNotes: task.notes,
        property: task.property
          ? {
              name: task.property.name,
              type: task.property.type,
              price: task.property.price
                ? Number(task.property.price)
                : null,
              surface: task.property.surface
                ? Number(task.property.surface)
                : null,
              rooms: task.property.rooms,
              floor: task.property.floor,
              status: task.property.status,
              projectName: task.property.project?.name ?? null,
            }
          : null,
        recentInteractions: recentInteractions.map((i) => ({
          type: i.type,
          direction: i.direction,
          content: i.content ?? "",
          createdAt: i.createdAt,
        })),
        language,
      };

      // 6. Build prompt and call Anthropic
      const prompt = buildCallScriptPrompt(promptContext);

      const anthropic = getAnthropicClient();
      const completion = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const scriptText = completion.content
        .filter(
          (block): block is Anthropic.TextBlock => block.type === "text",
        )
        .map((block) => block.text)
        .join("\n");

      if (!scriptText) {
        return jsonError(
          "L'IA n'a pas genere de reponse. Reessayez.",
          502,
        );
      }

      // 7. Log in AIGeneration
      const generation = await prisma.aIGeneration.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.user.userId,
          clientId: client.id,
          prompt,
          response: scriptText,
          type: "CLIENT_SUMMARY",
          channel: "INTERNAL",
          wasUsed: false,
        },
      });

      // 8. Log in ActivityLog
      const clientName = `${client.firstName} ${client.lastName}`;

      await db.activityLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.user.userId,
          action: "AI_CALL_SCRIPT_GENERATED",
          entity: "AIGeneration",
          entityId: generation.id,
          metadata: {
            taskId,
            clientName,
            pipelineStage: client.pipelineStage,
          },
        },
      });

      // 9. Return result
      return jsonOk(
        {
          generationId: generation.id,
          script: scriptText,
          clientName,
          pipelineStage: client.pipelineStage,
          language,
          warning:
            "Ce script a ete genere par l'IA. Adaptez-le a votre style personnel.",
        },
        201,
      );
    } catch (err) {
      if (err instanceof LimitExceededError) {
        return jsonError(err.message, 429);
      }
      throw err;
    }
  },
);
