import { createTenantPrisma } from "@/lib/prisma-tenant";

export interface IDuplicatePhone {
  type: "PHONE_EXACT";
  existingClientId: string;
  existingClientName: string;
  assignedAgentName: string | null;
  pipelineStage: string;
  lastInteractionAt: Date | null;
}

export interface IDuplicateEmail {
  type: "EMAIL_EXACT";
  existingClientId: string;
  existingClientName: string;
}

export interface IDuplicateName {
  type: "NAME_SIMILAR";
  existingClientId: string;
  existingClientName: string;
  phone: string;
}

export type DuplicateMatch = IDuplicatePhone | IDuplicateEmail | IDuplicateName;

export interface IDeduplicationResult {
  canCreate: boolean;
  duplicates: DuplicateMatch[];
}

/**
 * Normalise un numéro de téléphone au format international.
 * Supprime espaces, tirets, parenthèses. Ajoute +213 si local algérien.
 */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // Numéro local algérien → format international
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "+213" + cleaned.substring(1);
  }

  // Ajouter + si manquant avec indicatif
  if (cleaned.startsWith("213") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

/**
 * Vérifie les doublons avant la création d'un client.
 *
 * Règles :
 * - Téléphone identique dans le même tenant → BLOQUANT (canCreate = false)
 * - Email identique dans le même tenant → ALERTE (canCreate = true)
 * - Nom+prénom identiques → ALERTE (canCreate = true)
 * - Le même téléphone PEUT exister dans des tenants DIFFÉRENTS (isolation multi-tenant)
 *
 * Retourne les détails du client existant : nom, agent assigné, étape pipeline,
 * dernière interaction.
 */
export async function checkDuplicates(
  tenantId: string,
  data: {
    phone: string;
    email?: string | null;
    firstName: string;
    lastName: string;
  },
): Promise<IDeduplicationResult> {
  const db = createTenantPrisma(tenantId);
  const normalizedPhone = normalizePhone(data.phone);
  const duplicates: DuplicateMatch[] = [];

  // 1. Vérification téléphone (BLOQUANT)
  const phoneMatch = await db.client.findFirst({
    where: { phone: normalizedPhone },
    include: {
      assignedAgent: {
        select: { firstName: true, lastName: true },
      },
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  if (phoneMatch) {
    const agentName = phoneMatch.assignedAgent
      ? `${phoneMatch.assignedAgent.firstName} ${phoneMatch.assignedAgent.lastName}`
      : null;

    duplicates.push({
      type: "PHONE_EXACT",
      existingClientId: phoneMatch.id,
      existingClientName: `${phoneMatch.firstName} ${phoneMatch.lastName}`,
      assignedAgentName: agentName,
      pipelineStage: phoneMatch.pipelineStage,
      lastInteractionAt: phoneMatch.interactions[0]?.createdAt ?? null,
    });
  }

  // 2. Vérification email (ALERTE, non bloquant)
  if (data.email) {
    const emailMatch = await db.client.findFirst({
      where: {
        email: data.email.toLowerCase(),
        phone: { not: normalizedPhone }, // Exclure le doublon déjà trouvé par tél
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (emailMatch) {
      duplicates.push({
        type: "EMAIL_EXACT",
        existingClientId: emailMatch.id,
        existingClientName: `${emailMatch.firstName} ${emailMatch.lastName}`,
      });
    }
  }

  // 3. Vérification nom + prénom (ALERTE, non bloquant)
  const nameMatch = await db.client.findFirst({
    where: {
      firstName: { equals: data.firstName, mode: "insensitive" },
      lastName: { equals: data.lastName, mode: "insensitive" },
      phone: { not: normalizedPhone }, // Exclure le doublon déjà trouvé par tél
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });

  if (nameMatch) {
    duplicates.push({
      type: "NAME_SIMILAR",
      existingClientId: nameMatch.id,
      existingClientName: `${nameMatch.firstName} ${nameMatch.lastName}`,
      phone: nameMatch.phone,
    });
  }

  // Téléphone = bloquant, le reste = alerte
  const hasPhoneDuplicate = duplicates.some((d) => d.type === "PHONE_EXACT");

  return {
    canCreate: !hasPhoneDuplicate,
    duplicates,
  };
}
